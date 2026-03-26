
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../constants';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-slate-600/50 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-slate-300 hover:text-white transition"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      {isOpen && (
        <div className="mt-4 text-slate-400 prose prose-invert prose-sm max-w-none">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
