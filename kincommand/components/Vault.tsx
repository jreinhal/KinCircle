import React, { useState, useRef } from 'react';
import { FileText, Download, Shield, Siren, X, Trash2, Upload } from 'lucide-react';
import { VaultDocument, FamilySettings, User } from '../types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminUser = users.find(u => u.role === 'ADMIN') || users[0];

  const handleEmergencyClick = () => {
    setIsEmergencyMode(true);
    onLogSecurityEvent('Emergency Responder Mode Activated', 'CRITICAL');
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
          <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <FileText size={24} />
              </div>
              <button 
                onClick={() => onDeleteDocument(doc.id)}
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
                <button className="text-slate-400 hover:text-blue-600">
                    <Download size={16} />
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