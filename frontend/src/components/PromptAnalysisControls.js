// Filename: frontend/src/components/PromptAnalysisControls.js
import React from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi';

const PromptAnalysisControls = ({ 
  promptLength, 
  minLength = 25,
  isAnalyzing, 
  isAutoAnalyzeEnabled, 
  onToggleAutoAnalyze,
  onManualAnalyze,
  disabled
}) => {
  const progress = Math.min((promptLength / minLength) * 100, 100);
  const showProgress = promptLength < minLength;

  return (
    <div className="relative h-12 px-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-sm">
      {/* Progress bar with gradient */}
      {showProgress && (
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500/80 to-blue-600/80 dark:from-blue-600/80 dark:to-blue-700/80 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0)_50%)]" />
          </div>
        </div>
      )}
      
      {/* Controls container */}
      <div className="relative h-full grid grid-cols-[auto,1fr] gap-3 items-center">
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={isAutoAnalyzeEnabled}
              onChange={onToggleAutoAnalyze}
              className="form-checkbox h-4 w-4 text-blue-600 border-2 border-gray-300 dark:border-gray-600 rounded transition-colors focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              Auto-analyze
            </span>
          </label>

          <button
            onClick={onManualAnalyze}
            disabled={disabled || isAnalyzing || promptLength < minLength}
            className={`
              flex items-center px-4 py-1.5 rounded-full text-sm font-medium
              transition-all duration-150 transform-gpu
              shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-1
              ${disabled || promptLength < minLength
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : isAnalyzing
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 cursor-wait'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 text-white active:scale-[0.98]'
              }
            `}
            aria-label={isAnalyzing ? "Analyzing prompt..." : "Analyze prompt"}
          >
            {isAnalyzing ? (
              <FiLoader className="animate-spin mr-1.5" size={14} />
            ) : (
              <FiSearch className="mr-1.5" size={14} />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Character count */}
        {showProgress && (
          <div className="justify-self-end text-xs font-medium text-gray-500 dark:text-gray-400">
            {minLength - promptLength} characters needed
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptAnalysisControls;