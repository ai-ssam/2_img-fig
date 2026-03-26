
import React from 'react';

interface RadioInputProps<T extends string> {
  name: string;
  value: T;
  label: string;
  checked: boolean;
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const RadioInput = <T extends string,>({ name, value, label, checked, onChange, icon, disabled = false }: RadioInputProps<T>) => {
  return (
    <label className={`flex items-center space-x-3 transition-colors group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer text-slate-300 hover:text-white'}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="hidden"
        disabled={disabled}
      />
      <span className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 bg-white">
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>}
      </span>
      {icon}
      <span className={`transition-colors ${checked ? 'text-sky-400' : 'text-slate-300 group-hover:text-white'}`}>{label}</span>
    </label>
  );
};

export default RadioInput;
