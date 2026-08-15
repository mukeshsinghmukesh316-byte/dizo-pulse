import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';

// --- TOAST TYPES & GLOBAL EVENT EMITTER ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;
const toastListeners = new Set<ToastListener>();

export const showToast = (title: string, message?: string, type: ToastType = 'success', duration = 4000) => {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: ToastMessage = { id, title, message, type, duration };
  toastListeners.forEach(listener => listener(toast));
};

// --- TOAST CONTAINER COMPONENT ---
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleAddToast = (toast: ToastMessage) => {
      setToasts(prev => [...prev.slice(-4), toast]); // Max 5 toasts visible

      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastListeners.add(handleAddToast);
    return () => {
      toastListeners.delete(handleAddToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-medium ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
                : t.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-200'
                : 'bg-slate-900/95 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {t.type === 'error' && <Icons.AlertCircle className="w-4 h-4 text-rose-400" />}
              {t.type === 'warning' && <Icons.AlertTriangle className="w-4 h-4 text-amber-400" />}
              {t.type === 'info' && <Icons.Info className="w-4 h-4 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="font-extrabold text-white text-xs leading-snug">{t.title}</div>
              {t.message && <div className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{t.message}</div>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- SKELETON LOADERS ---
export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-800 rounded-lg" />
            <div className="w-8 h-8 bg-slate-800 rounded-xl" />
          </div>
          <div className="h-7 w-20 bg-slate-800 rounded-lg" />
          <div className="h-3 w-36 bg-slate-800/60 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="h-5 w-40 bg-slate-800 rounded-lg" />
        <div className="h-8 w-24 bg-slate-800 rounded-xl" />
      </div>
      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-1/3 bg-slate-800 rounded-md" />
                <div className="h-3 w-1/2 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-800 rounded-full" />
            <div className="h-4 w-16 bg-slate-800 rounded-md hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- EMPTY STATE COMPONENT ---
export interface EmptyStateProps {
  iconName?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'Inbox',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) => {
  const IconComponent = (Icons as any)[iconName] || Icons.Inbox;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/5">
        <IconComponent className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-white tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              <span>{secondaryLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// --- REUSABLE ASYNC ACTION BUTTON WITH PREVENT DUPLICATE SUBMIT ---
export interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  icon?: string;
  children: React.ReactNode;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  loading = false,
  variant = 'primary',
  icon,
  disabled,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const IconComponent = icon ? (Icons as any)[icon] || null : null;

  const baseStyles =
    'px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/20 focus:ring-indigo-500',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 focus:ring-slate-500',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/60 focus:ring-slate-500',
    outline:
      'bg-transparent hover:bg-slate-800/80 text-slate-300 border border-slate-700/80 focus:ring-indigo-500',
  };

  return (
    <button
      disabled={loading || disabled}
      onClick={e => {
        if (loading || disabled) return;
        onClick?.(e);
      }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Icons.Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

// --- REUSABLE CONFIRMATION DIALOG MODAL ---
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDestructive
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {isDestructive ? (
                  <Icons.AlertTriangle className="w-5 h-5" />
                ) : (
                  <Icons.HelpCircle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-extrabold text-white leading-snug">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-slate-700/80"
              >
                {cancelText}
              </button>

              <AsyncButton
                variant={isDestructive ? 'danger' : 'primary'}
                loading={isLoading}
                onClick={onConfirm}
              >
                {confirmText}
              </AsyncButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- ERROR BANNER COMPONENT ---
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to Load Data', message, onRetry }) => {
  return (
    <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-5 text-rose-200 flex items-start gap-3.5 my-4">
      <Icons.AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="font-extrabold text-xs text-rose-100">{title}</h4>
        <p className="text-[11px] text-rose-300 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-700/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Icons.RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
