import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { DashboardWidgetConfig, WidgetSize, DashboardLayout } from '../types';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  density: 'compact' | 'comfortable';
  onUpdateWidgets: (widgets: DashboardWidgetConfig[]) => void;
  onUpdateDensity: (density: 'compact' | 'comfortable') => void;
  onSavePersonalLayout: () => Promise<void>;
  onSetGlobalDefaultLayout: () => Promise<void>;
  onResetLayout: () => Promise<void>;
  isSuperAdmin: boolean;
  isSaving: boolean;
  isCustomized: boolean;
}

export const PRESET_LAYOUTS: {
  name: string;
  description: string;
  icon: string;
  widgets: { id: string; visible: boolean; size: WidgetSize; order: number }[];
}[] = [
  {
    name: 'Executive & Overview (Default)',
    description: 'Balanced executive layout showing all vital operational metrics, sales KPIs, and activity',
    icon: 'LayoutDashboard',
    widgets: [
      { id: 'quick_actions', visible: true, size: 'large', order: 0 },
      { id: 'performance', visible: true, size: 'large', order: 1 },
      { id: 'pending_actions', visible: true, size: 'medium', order: 2 },
      { id: 'leads', visible: true, size: 'medium', order: 3 },
      { id: 'projects', visible: true, size: 'medium', order: 4 },
      { id: 'proposals', visible: true, size: 'medium', order: 5 },
      { id: 'contracts', visible: true, size: 'small', order: 6 },
      { id: 'messages', visible: true, size: 'small', order: 7 },
      { id: 'recent_activity', visible: true, size: 'medium', order: 8 },
    ]
  },
  {
    name: 'Sales & CRM Pipeline',
    description: 'Prioritizes incoming leads, proposal turnaround, and contract e-signatures',
    icon: 'TrendingUp',
    widgets: [
      { id: 'quick_actions', visible: true, size: 'medium', order: 0 },
      { id: 'pending_actions', visible: true, size: 'medium', order: 1 },
      { id: 'leads', visible: true, size: 'large', order: 2 },
      { id: 'proposals', visible: true, size: 'large', order: 3 },
      { id: 'contracts', visible: true, size: 'medium', order: 4 },
      { id: 'performance', visible: true, size: 'medium', order: 5 },
      { id: 'messages', visible: true, size: 'small', order: 6 },
      { id: 'projects', visible: false, size: 'small', order: 7 },
      { id: 'recent_activity', visible: true, size: 'small', order: 8 },
    ]
  },
  {
    name: 'Project Operations & Delivery',
    description: 'Focused on active project milestones, client communication, and team activity',
    icon: 'Kanban',
    widgets: [
      { id: 'quick_actions', visible: true, size: 'medium', order: 0 },
      { id: 'pending_actions', visible: true, size: 'medium', order: 1 },
      { id: 'projects', visible: true, size: 'large', order: 2 },
      { id: 'messages', visible: true, size: 'medium', order: 3 },
      { id: 'recent_activity', visible: true, size: 'medium', order: 4 },
      { id: 'contracts', visible: true, size: 'small', order: 5 },
      { id: 'proposals', visible: false, size: 'small', order: 6 },
      { id: 'leads', visible: false, size: 'small', order: 7 },
      { id: 'performance', visible: true, size: 'small', order: 8 },
    ]
  },
  {
    name: 'Minimal & Compact',
    description: 'Clean single-view display with essential quick actions and pending items',
    icon: 'Minimize2',
    widgets: [
      { id: 'quick_actions', visible: true, size: 'large', order: 0 },
      { id: 'pending_actions', visible: true, size: 'large', order: 1 },
      { id: 'leads', visible: true, size: 'medium', order: 2 },
      { id: 'projects', visible: true, size: 'medium', order: 3 },
      { id: 'performance', visible: false, size: 'medium', order: 4 },
      { id: 'proposals', visible: false, size: 'medium', order: 5 },
      { id: 'contracts', visible: false, size: 'small', order: 6 },
      { id: 'messages', visible: false, size: 'small', order: 7 },
      { id: 'recent_activity', visible: false, size: 'medium', order: 8 },
    ]
  }
];

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  density,
  onUpdateWidgets,
  onUpdateDensity,
  onSavePersonalLayout,
  onSetGlobalDefaultLayout,
  onResetLayout,
  isSuperAdmin,
  isSaving,
  isCustomized
}) => {
  const [activeTab, setActiveTab] = useState<'widgets' | 'presets' | 'settings'>('widgets');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);

  if (!isOpen) return null;

  // Reorder helper
  const moveWidget = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= widgets.length) return;
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const item = sorted.splice(fromIndex, 1)[0];
    sorted.splice(toIndex, 0, item);
    const updated = sorted.map((w, idx) => ({ ...w, order: idx }));
    onUpdateWidgets(updated);
  };

  // Toggle Visibility
  const toggleVisibility = (id: string) => {
    const updated = widgets.map(w => (w.id === id ? { ...w, visible: !w.visible } : w));
    onUpdateWidgets(updated);
  };

  // Set Size
  const changeSize = (id: string, size: WidgetSize) => {
    const updated = widgets.map(w => (w.id === id ? { ...w, size } : w));
    onUpdateWidgets(updated);
  };

  // Apply Preset
  const applyPreset = (preset: typeof PRESET_LAYOUTS[0]) => {
    const updated = widgets.map(w => {
      const p = preset.widgets.find(pw => pw.id === w.id);
      if (p) {
        return { ...w, visible: p.visible, size: p.size, order: p.order };
      }
      return w;
    });
    updated.sort((a, b) => a.order - b.order);
    onUpdateWidgets(updated.map((w, idx) => ({ ...w, order: idx })));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveWidget(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const visibleCount = widgets.filter(w => w.visible).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/40 border border-indigo-400/30 rounded-2xl">
              <Icons.LayoutGrid className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Dashboard Customization</h3>
                {isCustomized ? (
                  <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-400/30">
                    Custom Layout Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-full">
                    Default Layout
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rearrange widgets, change sizing, show/hide blocks, and save personal or agency-wide layouts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('widgets')}
              className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'widgets'
                  ? 'bg-white text-indigo-600 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icons.Move className="w-3.5 h-3.5" />
              <span>Widgets & Sizing ({visibleCount}/{widgets.length} Visible)</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-indigo-600 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icons.Sparkles className="w-3.5 h-3.5" />
              <span>Layout Presets</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white text-indigo-600 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icons.SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Display & Density</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-semibold hidden md:block">
            Drag items using handle or use ▲ ▼ arrows
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {activeTab === 'widgets' && (
            <div className="space-y-3">
              <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-indigo-900 font-semibold">
                  <Icons.Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Toggle widget visibility on/off, adjust width from <strong>Small (1 Col)</strong> to <strong>Large (Full Width)</strong>, or drag cards to reorder.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const allVisible = widgets.map(w => ({ ...w, visible: true }));
                    onUpdateWidgets(allVisible);
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer shrink-0"
                >
                  Show All ({widgets.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {sortedWidgets.map((widget, index) => {
                  const isDragging = draggedIndex === index;
                  const isOver = dragOverIndex === index;

                  return (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`p-4 bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDragging ? 'opacity-40 scale-[0.99] border-dashed border-indigo-400' : ''
                      } ${isOver ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 shadow-xs'} ${
                        !widget.visible ? 'bg-slate-50/80 opacity-75' : ''
                      }`}
                    >
                      {/* Left: Drag Handle + Icon + Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Drag to reorder"
                        >
                          <Icons.GripVertical className="w-4 h-4" />
                        </div>

                        <div className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                          #{index + 1}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleVisibility(widget.id)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            widget.visible
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                              : 'bg-slate-100 border-slate-200 text-slate-400'
                          }`}
                          title={widget.visible ? 'Hide Widget' : 'Show Widget'}
                        >
                          {widget.visible ? <Icons.Eye className="w-4 h-4" /> : <Icons.EyeOff className="w-4 h-4" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {widget.title}
                            </span>
                            {!widget.visible && (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full">
                                Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                            {widget.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Sizing Pills + Reorder Buttons */}
                      <div className="flex items-center gap-3 justify-between md:justify-end shrink-0">
                        {/* Size Selector */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => changeSize(widget.id, 'small')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              widget.size === 'small'
                                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Small width (1/3 column on desktop)"
                          >
                            Small (1x)
                          </button>
                          <button
                            type="button"
                            onClick={() => changeSize(widget.id, 'medium')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              widget.size === 'medium'
                                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Medium width (2/3 column on desktop)"
                          >
                            Medium (2x)
                          </button>
                          <button
                            type="button"
                            onClick={() => changeSize(widget.id, 'large')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              widget.size === 'large'
                                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Large width (Full row span on desktop)"
                          >
                            Large (Full)
                          </button>
                        </div>

                        {/* Order Controls */}
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveWidget(index, index - 1)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                            title="Move Up"
                          >
                            <Icons.ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === sortedWidgets.length - 1}
                            onClick={() => moveWidget(index, index + 1)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                            title="Move Down"
                          >
                            <Icons.ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl">
                <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider mb-1">
                  Ready-to-Use Layout Blueprints
                </h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Select a workflow preset tailored for your daily tasks. You can still modify any widget size and position after applying.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_LAYOUTS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{preset.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {preset.widgets.filter(w => w.visible).length} Active Widgets
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{preset.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {preset.widgets.filter(w => w.visible).slice(0, 4).map(pw => (
                          <span key={pw.id} className="text-[9px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {pw.id}
                          </span>
                        ))}
                        {preset.widgets.filter(w => w.visible).length > 4 && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            +{preset.widgets.filter(w => w.visible).length - 4} more
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => applyPreset(preset)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Apply Preset
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Density setting */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Layout Density & Card Spacing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateDensity('comfortable')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      density === 'comfortable'
                        ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm mb-1">Comfortable (Spacious)</div>
                    <div className="text-xs text-slate-500">Standard executive spacing with generous padding and large visual metric counters.</div>
                  </button>

                  <button
                    onClick={() => onUpdateDensity('compact')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      density === 'compact'
                        ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm mb-1">Compact (High Density)</div>
                    <div className="text-xs text-slate-500">Tight groupings and compressed paddings to fit maximum information on a single monitor.</div>
                  </button>
                </div>
              </div>

              {/* Super Admin Global Defaults Section */}
              {isSuperAdmin && (
                <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl border border-indigo-700 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.ShieldCheck className="w-5 h-5 text-indigo-300" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200">
                        Super Admin Default Configuration
                      </h4>
                    </div>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-400/30">
                      Agency Master Rule
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    As Super Admin, you can establish the current widget arrangement as the <strong>Agency Global Default</strong>. All newly onboarded staff and team members who reset their layout will automatically receive this configuration.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowGlobalConfirm(true)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      <Icons.Save className="w-3.5 h-3.5" />
                      Set Current Layout as Agency Global Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Confirmation Modal */}
        {showGlobalConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                  <Icons.AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Set Agency Global Default?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This will become the baseline dashboard layout for all agency staff members.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowGlobalConfirm(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowGlobalConfirm(false);
                    await onSetGlobalDefaultLayout();
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Check className="w-3.5 h-3.5" />
                  Confirm & Apply Master Default
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onResetLayout}
              disabled={isSaving}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Revert to agency default layout"
            >
              <Icons.RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Default</span>
            </button>

            {isCustomized && (
              <span className="text-[11px] text-indigo-600 font-semibold hidden md:inline">
                Personalized layout active on this account
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={async () => {
                await onSavePersonalLayout();
                onClose();
              }}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icons.Check className="w-4 h-4" />
              )}
              <span>Save My Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
