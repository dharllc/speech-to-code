// Filename: frontend/src/components/FileSuggestions.js
import React from 'react';
import { FiCheckCircle, FiHelpCircle, FiAlertCircle, FiPlus, FiMinus } from 'react-icons/fi';
import PropTypes from 'prop-types';

const FileSuggestions = ({ suggestions, onBatchAdd, onBatchRemove, addedBatches }) => {
  if (!suggestions) return null;

  const SuggestionSection = ({ title, files, icon: Icon, bgClass, batchKey }) => {
    if (!files || files.length === 0) return null;
    
    const isBatchAdded = addedBatches.includes(batchKey);

    const handleButtonClick = () => {
      if (isBatchAdded) {
        onBatchRemove(batchKey);
      } else {
        onBatchAdd(batchKey);
      }
    };

    return (
      <div className={`mb-4 p-2 rounded ${bgClass}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Icon className="mr-2" size={16} />
            <h3 className="text-sm font-bold">{title} Confidence</h3>
          </div>
          <button
            onClick={handleButtonClick}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${
              isBatchAdded
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            aria-label={isBatchAdded ? `Remove all ${title.toLowerCase()} confidence files` : `Add all ${title.toLowerCase()} confidence files`}
            title={isBatchAdded ? 'Remove all files' : 'Add all files'}
          >
            {isBatchAdded ? <FiMinus size={16} /> : <FiPlus size={16} />}
          </button>
        </div>
        <div className="space-y-1">
          {files.map(({ file, reason }) => (
            <div key={file} className="flex items-center text-sm">
              <span className="font-mono text-gray-900 dark:text-gray-100 truncate">{file}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 block ml-4 truncate">
                {reason}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-4 border rounded p-2 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Suggested Files</h3>
      <SuggestionSection
        title="High"
        files={suggestions.high_confidence}
        icon={FiCheckCircle}
        bgClass="bg-green-50/50 dark:bg-green-900/20"
        batchKey="high_confidence"
      />
      <SuggestionSection
        title="Medium"
        files={suggestions.medium_confidence}
        icon={FiHelpCircle}
        bgClass="bg-yellow-50/50 dark:bg-yellow-900/20"
        batchKey="medium_confidence"
      />
      <SuggestionSection
        title="Low"
        files={suggestions.low_confidence}
        icon={FiAlertCircle}
        bgClass="bg-gray-50/50 dark:bg-gray-900/20"
        batchKey="low_confidence"
      />
    </div>
  );
};

FileSuggestions.propTypes = {
  suggestions: PropTypes.shape({
    high_confidence: PropTypes.arrayOf(
      PropTypes.shape({
        file: PropTypes.string.isRequired,
        reason: PropTypes.string.isRequired
      })
    ),
    medium_confidence: PropTypes.arrayOf(
      PropTypes.shape({
        file: PropTypes.string.isRequired,
        reason: PropTypes.string.isRequired
      })
    ),
    low_confidence: PropTypes.arrayOf(
      PropTypes.shape({
        file: PropTypes.string.isRequired,
        reason: PropTypes.string.isRequired
      })
    )
  }),
  onBatchAdd: PropTypes.func.isRequired,
  onBatchRemove: PropTypes.func.isRequired,
  addedBatches: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default FileSuggestions;