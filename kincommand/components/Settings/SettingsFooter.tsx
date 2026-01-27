import React from 'react';
import { GitBranch } from 'lucide-react';

const SettingsFooter: React.FC = () => {
  return (
    <div className="text-center text-slate-400 text-xs mt-8 pb-4 flex flex-col items-center dark:text-slate-500">
      <div className="flex items-center space-x-1">
        <GitBranch size={10} />
        <span>KinCommand v0.1.0-alpha</span>
      </div>
      <p className="mt-1">Build: {new Date().toISOString().split('T')[0]}</p>
    </div>
  );
};

export default SettingsFooter;
