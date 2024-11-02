// New component: frontend/src/components/PromptAnalysisControls.js
import React from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi';

const PromptAnalysisControls = ({ 
  promptLength, 
  minLength = 50,
  isAnalyzing, 
  isAutoAnalyzeEnabled, 
  onToggleAutoAnalyze,
  onManualAnalyze,
  disabled
}) => {
  return (
    <div className="flex items-center justify-between py-2 px-1 text-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoAnalyzeEnabled}
              onChange={onToggleAutoAnalyze}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Auto-analyze</span>
          </label>
        </div>
        <button
          onClick={onManualAnalyze}
          disabled={disabled || isAnalyzing || promptLength < minLength}
          className={`flex items-center px-3 py-1 rounded ${
            disabled || promptLength < minLength
              ? 'bg-gray-300 cursor-not-allowed'
              : isAnalyzing
              ? 'bg-blue-400 cursor-wait'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
        >
          {isAnalyzing ? (
            <FiLoader className="animate-spin mr-2" size={16} />
          ) : (
            <FiSearch className="mr-2" size={16} />
          )}
          Analyze
        </button>
      </div>
      <div className={`text-sm ${
        promptLength < minLength ? 'text-red-500' : 'text-gray-500'
      }`}>
        {promptLength < minLength ? (
          `${minLength - promptLength} more characters needed for analysis`
        ) : (
          `${promptLength} characters`
        )}
      </div>
    </div>
  );
};

export default PromptAnalysisControls;