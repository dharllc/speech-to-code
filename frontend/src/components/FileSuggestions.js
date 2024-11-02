// Filename: frontend/src/components/FileSuggestions.js
import React from 'react';
import { FiCheckCircle, FiHelpCircle, FiAlertCircle } from 'react-icons/fi';

const FileSuggestions = ({ suggestions, onFileSelect, selectedFiles }) => {
  if (!suggestions) return null;

  const SuggestionSection = ({ title, files, icon: Icon, bgClass }) => (
    files.length > 0 && (
      <div className={`mb-4 p-2 rounded ${bgClass}`}>
        <div className="flex items-center mb-2">
          <Icon className="mr-2" size={16} />
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        <div className="space-y-1">
          {files.map(({ file, reason }) => (
            <div key={file} className="flex items-center text-sm">
              <button
                onClick={() => onFileSelect(file)}
                className={`flex-grow text-left hover:bg-black/5 rounded px-1 py-0.5 ${
                  selectedFiles.includes(file) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="font-mono">{file}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 block ml-4">
                  {reason}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="mb-4 border rounded p-2 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Suggested Files</h3>
      <SuggestionSection
        title="High Confidence"
        files={suggestions.high_confidence}
        icon={FiCheckCircle}
        bgClass="bg-green-50/50 dark:bg-green-900/20"
      />
      <SuggestionSection
        title="Medium Confidence"
        files={suggestions.medium_confidence}
        icon={FiHelpCircle}
        bgClass="bg-yellow-50/50 dark:bg-yellow-900/20"
      />
      <SuggestionSection
        title="Low Confidence"
        files={suggestions.low_confidence}
        icon={FiAlertCircle}
        bgClass="bg-gray-50/50 dark:bg-gray-900/20"
      />
    </div>
  );
};

export default FileSuggestions;