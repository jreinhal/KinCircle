import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = (): ConfirmContextValue => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ options, resolve });
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  const handleClose = (result: boolean) => {
    if (dialog) {
      dialog.resolve(result);
      setDialog(null);
    }
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                {dialog.options.title || 'Please Confirm'}
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {dialog.options.message}
              </p>
            </div>
            <div className="p-5 pt-0 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {dialog.options.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-4 py-2 rounded-lg text-white ${dialog.options.destructive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {dialog.options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
