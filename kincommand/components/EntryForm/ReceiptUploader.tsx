import React from 'react';
import { Camera, Loader2, UploadCloud, X } from 'lucide-react';

interface ReceiptUploaderProps {
  receiptPreview: string | null;
  isAnalyzing: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  receiptPreview,
  isAnalyzing,
  onFileChange,
  onClear,
  fileInputRef
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">Receipt / Invoice</label>

      {!receiptPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer bg-slate-50
            ${isAnalyzing ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:text-blue-500 text-slate-400'}
          `}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
              <span className="text-sm text-blue-600 font-medium">Processing...</span>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <Camera size={24} />
                <UploadCloud size={24} />
              </div>
              <span className="text-sm text-center">Tap to scan receipt</span>
              <span className="text-xs text-slate-400 mt-1">AI will auto-fill details</span>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 h-48 bg-slate-100 flex items-center justify-center">
          <img src={receiptPreview} alt="Receipt" className="h-full object-contain" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <X size={16} />
          </button>
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center flex-col">
              <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
              <span className="text-sm font-medium text-slate-800">Extracting Data...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;
