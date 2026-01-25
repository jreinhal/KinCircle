import React, { useState, useRef, useCallback } from 'react';
import { FileText, Download, Shield, Siren, X, Trash2, Upload, Eye, Calendar, HardDrive, Lock, AlertTriangle } from 'lucide-react';
import { VaultDocument, FamilySettings, User } from '../types';
import { verifyPin, hashPinLegacy } from '../utils/crypto';

interface VaultProps {
    documents: VaultDocument[];
    settings: FamilySettings;
    users: User[];
    onAddDocument: (doc: VaultDocument) => void;
    onDeleteDocument: (id: string) => void;
    onLogSecurityEvent: (details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') => void;
}

const Vault: React.FC<VaultProps> = ({ documents, settings, users, onAddDocument, onDeleteDocument, onLogSecurityEvent }) => {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showEmergencyPinModal, setShowEmergencyPinModal] = useState(false);
  const [emergencyPin, setEmergencyPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<VaultDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminUser = users.find(u => u.role === 'ADMIN') || users[0];

  const verifyEmergencyPin = useCallback(async () => {
    if (emergencyPin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    setIsVerifying(true);
    try {
      const defaultHash = hashPinLegacy('1234');
      const expectedHash = settings.customPinHash || defaultHash;

      let isValid = false;
      if (settings.isSecurePinHash && settings.customPinHash) {
        isValid = await verifyPin(emergencyPin, expectedHash);
      } else {
        const enteredHash = hashPinLegacy(emergencyPin);
        isValid = enteredHash === expectedHash;
      }

      if (isValid) {
        setIsEmergencyMode(true);
        setShowEmergencyPinModal(false);
        setEmergencyPin('');
        setPinError('');
        onLogSecurityEvent('Emergency Responder Mode Activated (PIN verified)', 'CRITICAL');
      } else {
        setPinError('Invalid PIN');
        onLogSecurityEvent('Failed emergency access attempt - Invalid PIN', 'WARNING');
      }
    } finally {
      setIsVerifying(false);
    }
  }, [emergencyPin, settings, onLogSecurityEvent]);

  const handleEmergencyClick = () => {
    setShowEmergencyPinModal(true);
    setEmergencyPin('');
    setPinError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const newDoc: VaultDocument = {
              id: crypto.randomUUID(),
              name: file.name,
              date: new Date().toISOString().split('T')[0],
              type: 'Uploaded',
              size: (file.size / 1024 / 1024).toFixed(1) + ' MB'
          };
          onAddDocument(newDoc);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Vault</h1>
          <p className="text-slate-500">Secure storage for critical legal and medical documents.</p>
        </div>
        <button 
            onClick={handleEmergencyClick}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 animate-pulse"
        >
            <Siren size={18} />
            <span className="font-bold">Emergency Access</span>
        </button>
      </header>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start space-x-3">
        <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
            <h3 className="text-sm font-semibold text-blue-900">Security Note</h3>
            <p className="text-sm text-blue-800 mt-1">
                Documents stored here are encrypted. "Emergency Access" creates a read-only view for First Responders.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all group relative cursor-pointer"
            onClick={() => setViewingDoc(doc)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <FileText size={24} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Delete Document"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <h3 className="font-semibold text-slate-800 truncate" title={doc.name}>{doc.name}</h3>
            <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
              <span>{doc.date}</span>
              <span>{doc.size}</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase">{doc.type}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); }}
                  className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-xs"
                >
                    <Eye size={14} />
                    <span>View</span>
                </button>
            </div>
          </div>
        ))}
        
        {/* Upload Placeholder */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer min-h-[180px]"
        >
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Upload size={24} />
            </div>
            <span className="font-medium">Upload Document</span>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
            />
        </div>
      </div>

      {/* Document View Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Document Details</h3>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{viewingDoc.name}</h4>
                  <p className="text-sm text-slate-500">{viewingDoc.type}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-slate-600">Added: {viewingDoc.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <HardDrive size={16} className="text-slate-400" />
                  <span className="text-slate-600">Size: {viewingDoc.size}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Demo Mode:</strong> In a production app, clicking "Open Document" would display or download the actual file.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onLogSecurityEvent(`Document accessed: ${viewingDoc.name}`, 'INFO');
                    alert(`Opening "${viewingDoc.name}"...\n\nIn production, this would open or download the actual document.`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Eye size={18} />
                  Open Document
                </button>
                <button
                  onClick={() => {
                    onLogSecurityEvent(`Document downloaded: ${viewingDoc.name}`, 'INFO');
                    alert(`Downloading "${viewingDoc.name}"...\n\nIn production, this would download the actual file.`);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency PIN Modal */}
      {showEmergencyPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <h3 className="font-bold text-red-900">Emergency Access</h3>
              </div>
              <button
                onClick={() => setShowEmergencyPinModal(false)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Enter your PIN to activate Emergency Responder Mode. This action will be logged.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Lock size={14} className="inline mr-1" />
                  Security PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={emergencyPin}
                  onChange={(e) => {
                    setEmergencyPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && verifyEmergencyPin()}
                  placeholder="••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  autoFocus
                />
                {pinError && (
                  <p className="text-red-600 text-sm mt-2">{pinError}</p>
                )}
              </div>

              <button
                onClick={verifyEmergencyPin}
                disabled={emergencyPin.length !== 4 || isVerifying}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Siren size={18} />
                    Activate Emergency Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY MODE OVERLAY */}
      {isEmergencyMode && (
          <div className="fixed inset-0 z-50 bg-red-600 text-white flex flex-col animate-fade-in">
              <div className="p-4 flex justify-between items-center border-b border-red-500 bg-red-700">
                  <div className="flex items-center space-x-2">
                      <Siren size={32} className="animate-pulse" />
                      <h1 className="text-2xl font-black uppercase tracking-wider">Emergency Responder View</h1>
                  </div>
                  <button 
                    onClick={() => setIsEmergencyMode(false)}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                  >
                      <X size={24} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Critical Info */}
                      <div className="space-y-6">
                          <div className="bg-white text-slate-900 p-6 rounded-xl shadow-lg">
                              <h2 className="text-xl font-bold mb-4 border-b border-slate-200 pb-2">Patient Information</h2>
                              <div className="space-y-3">
                                  <div>
                                      <p className="text-xs text-slate-500 uppercase font-bold">Name</p>
                                      <p className="text-lg font-medium">{settings.patientName}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs text-slate-500 uppercase font-bold">Primary Contact</p>
                                      <p className="text-lg font-medium">{adminUser.name}</p>
                                      <p className="text-slate-600">555-0123 (Tap to Call)</p>
                                  </div>
                                  <div className="pt-2">
                                      <p className="text-xs text-slate-500 uppercase font-bold">Medical Alerts</p>
                                      <div className="flex gap-2 mt-1">
                                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold border border-red-200">DNR on File</span>
                                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200">Diabetic</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Documents List for Emergency */}
                      <div className="space-y-6">
                           <div className="bg-white text-slate-900 p-6 rounded-xl shadow-lg">
                               <h2 className="text-xl font-bold mb-4 border-b border-slate-200 pb-2">Accessible Documents</h2>
                               <div className="space-y-2">
                                   {documents.map((doc) => (
                                       <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <FileText size={20} className="text-slate-400 flex-shrink-0" />
                                                <span className="font-medium truncate">{doc.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded">VIEW</span>
                                       </div>
                                   ))}
                                   {documents.length === 0 && (
                                       <p className="text-slate-400 italic">No documents available.</p>
                                   )}
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Vault;