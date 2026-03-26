
import React from 'react';

interface RadioCardProps<T extends string> {
  name: string;
  value: T;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: T) => void;
  disabled?: boolean;
}

const RadioCard = <T extends string,>({ name, value, label, description, checked, onChange, disabled = false }: RadioCardProps<T>) => {
  return (
    <label className={`
      flex items-start p-4 rounded-lg border-2 transition-all duration-200
      ${disabled ? 'cursor-not-allowed opacity-60 bg-slate-700 border-transparent' : 'cursor-pointer bg-slate-700 hover:border-sky-500'}
      ${checked ? 'border-sky-500' : 'border-slate-600'}
    `}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
        disabled={disabled}
      />
      <div className="flex-shrink-0 mr-4 mt-1">
          <span className={`w-5 h-5 rounded-full block transition-colors duration-200 ${checked ? 'bg-white' : 'bg-slate-500'}`}></span>
      </div>
      <div>
        <h3 className="font-semibold text-slate-100">{label}</h3>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>
    </label>
  );
};

export default RadioCard;
