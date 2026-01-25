import React, { useState, useRef, useEffect } from 'react';
import { EntryType, User, FamilySettings, LedgerEntry } from '../types';
import { suggestCategory, parseReceiptImage, parseVoiceEntry } from '../services/geminiService';
import { Camera, Clock, DollarSign, Calendar, Loader2, UploadCloud, X, Mic, StopCircle } from 'lucide-react';

interface EntryFormProps {
  currentUser: User;
  settings: FamilySettings;
  initialType?: EntryType;
  onAddEntry: (entry: LedgerEntry) => void;
  onCancel: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ currentUser, settings, initialType, onAddEntry, onCancel }) => {
  const [type, setType] = useState<EntryType>(initialType ?? EntryType.EXPENSE);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(''); // in hours
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
  }, [initialType]);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-categorize when description loses focus
  const handleBlur = async () => {
    if (description && !category && !isAnalyzing) {
      setIsAnalyzing(true);
      const result = await suggestCategory(description, type, settings);
      setCategory(result.category);
      setIsAnalyzing(false);
    }
  };

  // --- Voice Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required for voice entry.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  };

  const processAudio = async (blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await parseVoiceEntry(base64Audio);

        // Populate Form
        if (result.type) setType(result.type as EntryType);
        if (result.date) setDate(result.date);
        if (result.description) setDescription(result.description);
        if (result.category) setCategory(result.category);

        if (result.type === 'TIME' && result.durationHours) {
          setDuration(result.durationHours.toString());
        } else if (result.type === 'EXPENSE' && result.amount) {
          setAmount(result.amount.toString());
        }

      } catch (e) {
        console.error("Voice processing failed", e);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(blob);
  };

  // --- Image Logic ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setReceiptPreview(base64String);

      // Trigger AI Analysis
      setIsAnalyzing(true);
      try {
        const result = await parseReceiptImage(base64String);
        if (result.amount) setAmount(result.amount.toString());
        if (result.date) setDate(result.date);
        if (result.description) setDescription(result.description);
        if (result.category) setCategory(result.category);
      } catch (err) {
        console.error("Failed to parse receipt", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearReceipt = () => {
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!description || description.trim().length < 3) {
      alert('Please enter a description (at least 3 characters)');
      return;
    }

    let finalAmount = 0;
    let timeMinutes = 0;

    if (type === EntryType.EXPENSE) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid positive amount');
        return;
      }
      finalAmount = parsedAmount;
    } else {
      const hours = parseFloat(duration);
      if (isNaN(hours) || hours <= 0) {
        alert('Please enter a valid positive duration');
        return;
      }
      timeMinutes = hours * 60;
      finalAmount = hours * settings.hourlyRate;
    }

    if (!category || category.trim().length < 2) {
      alert('Please enter a category');
      return;
    }

    const newEntry: LedgerEntry = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      type,
      date,
      description: description.trim(),
      amount: finalAmount,
      timeDurationMinutes: type === EntryType.TIME ? timeMinutes : undefined,
      category: category.trim(),
      isMedicaidFlagged: false // Default false, updated by audit later
    };

    onAddEntry(newEntry);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-slide-up">
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Add Contribution</h2>
          <p className="text-slate-500 text-sm mt-1">Record money spent or time dedicated.</p>
        </div>

        {/* Voice Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
            ${isRecording
              ? 'bg-red-100 text-red-600 ring-4 ring-red-50'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}
          `}
          title="Voice Entry Mode"
        >
          {isRecording ? (
            <>
              <StopCircle size={24} className="animate-pulse" />
              <span className="absolute -bottom-6 text-[10px] font-bold text-red-500 uppercase tracking-widest">Rec</span>
            </>
          ) : (
            <Mic size={24} />
          )}
        </button>
      </div>

      <div className="p-6">

        {isAnalyzing && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center space-x-3 animate-pulse">
            <Loader2 size={20} className="animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">
              {isRecording ? 'Listening...' : 'AI is processing your voice input...'}
            </span>
          </div>
        )}

        {/* Type Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
          <button
            type="button"
            onClick={() => setType(EntryType.EXPENSE)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md text-sm font-medium transition-all ${type === EntryType.EXPENSE
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <DollarSign size={18} />
            <span>Expense</span>
          </button>
          <button
            type="button"
            onClick={() => setType(EntryType.TIME)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-md text-sm font-medium transition-all ${type === EntryType.TIME
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Clock size={18} />
            <span>Care Hours</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* AI Receipt Uploader (Only for Expense) */}
          {type === EntryType.EXPENSE && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Receipt / Invoice</label>

              {!receiptPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer bg-slate-50
                    ${isAnalyzing ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:text-blue-500 text-slate-400'}
                  `}
                >
                  {isAnalyzing && !isRecording ? (
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
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 h-48 bg-slate-100 flex items-center justify-center">
                  <img src={receiptPreview} alt="Receipt" className="h-full object-contain" />
                  <button
                    type="button"
                    onClick={clearReceipt}
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white text-slate-900 placeholder:text-slate-400 w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {type === EntryType.EXPENSE ? 'Amount ($)' : 'Duration (Hours)'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder={type === EntryType.EXPENSE ? "0.00" : "1.5"}
                value={type === EntryType.EXPENSE ? amount : duration}
                onChange={(e) => type === EntryType.EXPENSE ? setAmount(e.target.value) : setDuration(e.target.value)}
                className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              {type === EntryType.TIME && duration && (
                <p className="text-xs text-green-600 font-medium text-right">
                  = ${(parseFloat(duration) * settings.hourlyRate).toFixed(2)} value
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <input
              type="text"
              required
              placeholder={type === EntryType.EXPENSE ? "e.g. Prescriptions at CVS" : "e.g. Driving Mom to Cardiologist"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleBlur}
              className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-700">Category</label>
              {isAnalyzing && !isRecording && <span className="text-xs text-blue-500 flex items-center"><Loader2 size={12} className="animate-spin mr-1" /> AI Suggesting...</span>}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Medical, Groceries"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white text-slate-900 placeholder:text-slate-400 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex items-center space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAnalyzing || isRecording}
              className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Processing...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryForm;
