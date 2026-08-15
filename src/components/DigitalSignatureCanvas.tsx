import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface DigitalSignatureCanvasProps {
  clientName: string;
  businessName: string;
  onSign: (signatureData: string, signeeName: string, signeeTitle: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const DigitalSignatureCanvas: React.FC<DigitalSignatureCanvasProps> = ({
  clientName,
  businessName,
  onSign,
  isSubmitting = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(clientName || '');
  const [typedFont, setTypedFont] = useState<'cursive' | 'serif' | 'sans'>('cursive');
  const [signeeName, setSigneeName] = useState(clientName || '');
  const [signeeTitle, setSigneeTitle] = useState('Authorized Signatory');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 500,
    height: 180,
  });

  // Redraw all strokes on canvas with high DPI scaling
  const renderCanvas = useCallback(
    (strokeList: Stroke[], activeStroke: Stroke | null, width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Background
      ctx.clearRect(0, 0, width, height);

      // Signature baseline guideline
      ctx.save();
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(24, height - 38);
      ctx.lineTo(width - 24, height - 38);
      ctx.stroke();

      // "X" baseline marker
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('✕ Sign above this line', 24, height - 18);
      ctx.restore();

      // Render saved and active strokes
      const allStrokes = activeStroke ? [...strokeList, activeStroke] : strokeList;

      for (const stroke of allStrokes) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i - 1].x + stroke.points[i].x) / 2;
          const yc = (stroke.points[i - 1].y + stroke.points[i].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }

        const lastPoint = stroke.points[stroke.points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();
        ctx.restore();
      }
    },
    []
  );

  // ResizeObserver to handle responsive screen resizing cleanly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(260, Math.floor(rect.width));
      const newHeight = Math.min(220, Math.max(160, Math.floor(newWidth * 0.38)));

      setCanvasDimensions({ width: newWidth, height: newHeight });
      renderCanvas(strokes, currentStroke, newWidth, newHeight);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [renderCanvas, strokes, currentStroke]);

  // Handle pointer coordinate extraction
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isSubmitting) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    const point = getCoordinates(e);
    if (!point) return;

    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [point],
      color: '#38bdf8', // cyan-400 vivid digital pen ink
      width: 3,
    };
    setCurrentStroke(newStroke);
    renderCanvas(strokes, newStroke, canvasDimensions.width, canvasDimensions.height);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || isSubmitting) return;
    e.preventDefault();

    const point = getCoordinates(e);
    if (!point) return;

    const updatedStroke: Stroke = {
      ...currentStroke,
      points: [...currentStroke.points, point],
    };
    setCurrentStroke(updatedStroke);
    renderCanvas(strokes, updatedStroke, canvasDimensions.width, canvasDimensions.height);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isSubmitting) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length > 0) {
      const nextStrokes = [...strokes, currentStroke];
      setStrokes(nextStrokes);
      setCurrentStroke(null);
      renderCanvas(nextStrokes, null, canvasDimensions.width, canvasDimensions.height);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    renderCanvas([], null, canvasDimensions.width, canvasDimensions.height);
  };

  // Convert typed name or drawn canvas into final high-res signature image data
  const generateSignatureDataUrl = (): string => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return '';

      // Create a clean export canvas with transparent background & ink
      const exportCanvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      exportCanvas.width = canvasDimensions.width * dpr;
      exportCanvas.height = canvasDimensions.height * dpr;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return canvas.toDataURL('image/png');

      ctx.scale(dpr, dpr);
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i - 1].x + stroke.points[i].x) / 2;
          const yc = (stroke.points[i - 1].y + stroke.points[i].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
        ctx.restore();
      }

      return exportCanvas.toDataURL('image/png');
    } else {
      // Render typed text onto temporary canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 600;
      exportCanvas.height = 180;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, 600, 180);

      ctx.fillStyle = '#38bdf8';
      let fontFamily = 'cursive, "Brush Script MT", "Caveat", "Dancing Script", Georgia, sans-serif';
      if (typedFont === 'serif') fontFamily = 'serif, "Playfair Display", Georgia';
      if (typedFont === 'sans') fontFamily = 'sans-serif, "Inter", system-ui';

      ctx.font = `italic bold 42px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName || clientName || 'Authorized Signatory', 300, 90);

      return exportCanvas.toDataURL('image/png');
    }
  };

  const hasValidSignature =
    mode === 'draw' ? strokes.length > 0 : typedName.trim().length >= 2;

  const handleExecuteSign = async () => {
    if (!hasValidSignature || !agreedToTerms || isSubmitting) return;
    const sigData = generateSignatureDataUrl();
    await onSign(sigData, signeeName.trim() || clientName, signeeTitle.trim() || 'Authorized Signatory');
  };

  return (
    <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 sm:p-6 space-y-6 max-w-full overflow-hidden" id="digital-signature-card">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Icons.PenTool className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-white">Digital E-Signature Execution</h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Draw or type your official digital signature to execute this master service agreement legally.
          </p>
        </div>

        {/* Draw vs Type Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'draw'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icons.Pencil className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'type'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icons.Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>
        </div>
      </div>

      {/* Signature Canvas Area (Fully Responsive with Zero Horizontal Scroll) */}
      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Icons.Touchpad className="w-3.5 h-3.5 text-cyan-400" />
              Draw with finger, stylus, or mouse
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0 || isSubmitting}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <Icons.RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Signature</span>
            </button>
          </div>

          <div
            ref={containerRef}
            className="w-full relative bg-slate-900/90 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 transition-all overflow-hidden touch-none select-none"
            style={{ minHeight: '160px' }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: `${canvasDimensions.height}px`,
                display: 'block',
                touchAction: 'none',
              }}
              className="cursor-crosshair active:cursor-crosshair max-w-full"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            {strokes.length === 0 && !isDrawing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                <Icons.PenTool className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-400">Sign your digital signature here</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Type Authorized Signatory Full Name</label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Style Preview */}
          <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 text-center space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Signature Preview</span>
            <div
              className={`text-2xl sm:text-3xl text-cyan-400 font-bold py-3 border-b border-dashed border-slate-700 select-none ${
                typedFont === 'cursive'
                  ? 'italic font-serif'
                  : typedFont === 'serif'
                  ? 'font-serif'
                  : 'font-sans'
              }`}
            >
              {typedName.trim() || clientName || 'Authorized Signatory'}
            </div>

            {/* Font switcher */}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              {(['cursive', 'serif', 'sans'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTypedFont(f)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize text-xs cursor-pointer ${
                    typedFont === f ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-slate-950 hover:text-white'
                  }`}
                >
                  Style {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signee Identity Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Full Name of Signee</label>
          <input
            type="text"
            value={signeeName}
            onChange={(e) => setSigneeName(e.target.value)}
            placeholder="Official legal name"
            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Designation / Title</label>
          <input
            type="text"
            value={signeeTitle}
            onChange={(e) => setSigneeTitle(e.target.value)}
            placeholder="e.g. Managing Director, Founder, CEO"
            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Legal Acceptance Checkbox */}
      <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
          />
          <span className="text-[11px] text-slate-300 leading-relaxed font-medium">
            I confirm that I am an authorized representative of{' '}
            <strong className="text-white">{businessName}</strong>, and by signing above, I legally approve this master service contract, milestone deliverables, revision limits, and agreed payment terms.
          </span>
        </label>
      </div>

      {/* Submit Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Icons.ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>256-bit encrypted e-sign verification log generated upon submit.</span>
        </div>

        <button
          type="button"
          onClick={handleExecuteSign}
          disabled={!hasValidSignature || !agreedToTerms || isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Icons.Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying & Executing...</span>
            </>
          ) : (
            <>
              <Icons.CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Sign & Execute Agreement</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DigitalSignatureCanvas;
