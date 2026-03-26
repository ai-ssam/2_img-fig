
import React from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange, description }) => {
  return (
    <div>
        <label className="flex items-center space-x-3 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
            />
            <div className={`w-5 h-5 rounded-sm flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-sky-500 border-sky-500' : 'bg-white'}`}>
                {checked && <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <span className="text-slate-200 font-medium group-hover:text-white transition-colors">{label}</span>
        </label>
        {description && <p className="text-sm text-slate-400 mt-1 ml-8">{description}</p>}
    </div>
  );
};

export default Checkbox;
