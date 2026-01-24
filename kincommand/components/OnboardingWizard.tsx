import React, { useState } from 'react';
import { FamilySettings } from '../types';
import { ArrowRight, Heart, DollarSign, ShieldCheck, CheckCircle2, User } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (settings: FamilySettings) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<FamilySettings>({
    patientName: '',
    hourlyRate: 25,
    privacyMode: false,
    autoLockEnabled: true,
    hasCompletedOnboarding: true
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const finish = () => {
    onComplete(settings);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
           <div 
             className="h-full bg-blue-600 transition-all duration-500 ease-out" 
             style={{ width: `${(step / 4) * 100}%` }}
           />
        </div>

        <div className="p-8 md:p-12">
          
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="animate-fade-in text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-6">
                <Heart size={40} fill="currentColor" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome to KinCommand</h1>
              <p className="text-slate-500 text-lg leading-relaxed">
                Caregiving is hard work. We help you track expenses, recognize effort, and keep your family organized and fair.
              </p>
              <div className="pt-6">
                 <button 
                   onClick={nextStep}
                   className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center"
                 >
                   Let's Get Started <ArrowRight className="ml-2" />
                 </button>
              </div>
            </div>
          )}

          {/* STEP 2: PATIENT INFO */}
          {step === 2 && (
            <div className="animate-slide-up space-y-6">
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Who are we caring for?</h2>
                  <p className="text-slate-500">This helps us personalize your reports and AI insights.</p>
               </div>

               <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Care Recipient Name</label>
                  <div className="relative">
                     <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                     <input 
                        type="text" 
                        autoFocus
                        placeholder="e.g. Mom, Dad, Aunt Marie"
                        value={settings.patientName}
                        onChange={(e) => setSettings({...settings, patientName: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-lg transition-colors"
                     />
                  </div>
               </div>

               <div className="pt-8 flex space-x-4">
                  <button onClick={prevStep} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl">Back</button>
                  <button 
                     onClick={nextStep}
                     disabled={!settings.patientName.trim()}
                     className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                     Continue
                  </button>
               </div>
            </div>
          )}

          {/* STEP 3: FINANCIAL AGREEMENT */}
          {step === 3 && (
            <div className="animate-slide-up space-y-6">
               <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Value Your Time</h2>
                  <p className="text-slate-500">
                    "Sweat Equity" is time spent caregiving. Setting a rate ensures sibling fairness, even if no money changes hands.
                  </p>
               </div>

               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Hourly Rate ($)</label>
                  <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setSettings({...settings, hourlyRate: Math.max(0, settings.hourlyRate - 5)})}
                        className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-blue-500"
                      >
                          -
                      </button>
                      <div className="flex-1 text-center">
                          <span className="text-3xl font-bold text-slate-900">${settings.hourlyRate}</span>
                          <span className="text-slate-500">/hr</span>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, hourlyRate: settings.hourlyRate + 5})}
                        className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-blue-500"
                      >
                          +
                      </button>
                  </div>
               </div>

               <div className="pt-8 flex space-x-4">
                  <button onClick={prevStep} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl">Back</button>
                  <button onClick={nextStep} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                     Looks Good
                  </button>
               </div>
            </div>
          )}

           {/* STEP 4: SECURITY */}
           {step === 4 && (
            <div className="animate-slide-up space-y-6">
               <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Stay Secure</h2>
                  <p className="text-slate-500">
                    We recommend enabling Auto-Lock for HIPAA compliance.
                  </p>
               </div>

               <div className="space-y-4">
                   <div 
                     onClick={() => setSettings({...settings, autoLockEnabled: !settings.autoLockEnabled})}
                     className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                       settings.autoLockEnabled ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                     }`}
                   >
                       <div>
                           <h3 className="font-bold text-slate-900">Enable Auto-Lock</h3>
                           <p className="text-xs text-slate-500">Locks app after 60s of inactivity</p>
                       </div>
                       {settings.autoLockEnabled && <CheckCircle2 className="text-blue-600" size={24} />}
                   </div>

                   <div 
                     onClick={() => setSettings({...settings, privacyMode: !settings.privacyMode})}
                     className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                       settings.privacyMode ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300'
                     }`}
                   >
                       <div>
                           <h3 className="font-bold text-slate-900">AI Privacy Mode</h3>
                           <p className="text-xs text-slate-500">Anonymize names before AI processing</p>
                       </div>
                       {settings.privacyMode && <CheckCircle2 className="text-green-600" size={24} />}
                   </div>
               </div>

               <div className="pt-8 flex space-x-4">
                  <button onClick={prevStep} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl">Back</button>
                  <button onClick={finish} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-blue-900/20">
                     Finish Setup
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;