
import React from 'react';
import { CopyIcon } from '../constants';

interface CodeOutputProps {
  code: string;
  language: string;
  onCopy: (text: string) => void;
}

const CodeOutput: React.FC<CodeOutputProps> = ({ code, language, onCopy }) => {
  return (
    <div>
      <h4 className="text-md font-semibold text-slate-200 mb-2">JavaScript (Node.js) Example</h4>
      <div className="relative bg-slate-800 rounded-lg border border-slate-600">
        <div className="absolute top-2 right-2">
            <button 
                onClick={() => onCopy(code)} 
                title="코드 복사" 
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <CopyIcon />
            </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm">
          <code className={`language-${language} font-mono text-sky-300`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeOutput;
