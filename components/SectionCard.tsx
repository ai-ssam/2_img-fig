
import React from 'react';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-slate-700/50 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-sky-400">{icon}</div>
        <h2 className="text-xl font-bold text-slate-200">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
