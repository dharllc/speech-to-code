import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { shouldWarnAboutFile } from '../utils/fileWarnings';

const FileChip = ({ fileName, tokenCount, onRemove, isRepositoryTree }) => {
  const { warn, reason, tokenWarning } = shouldWarnAboutFile(fileName, tokenCount);

  const getChipStyle = () => {
    if (warn && !tokenWarning) {
      return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
    if (tokenCount > 100000) {
      return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
    if (tokenCount > 50000) {
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    }
    if (isRepositoryTree) {
      return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    }
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
  };

  const getTokenStyle = () => {
    if (tokenCount > 100000) {
      return 'text-red-500 dark:text-red-400 font-semibold';
    }
    if (tokenCount > 50000) {
      return 'text-yellow-600 dark:text-yellow-400 font-semibold';
    }
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className={`
      inline-flex items-center m-1 px-2 py-1 rounded-full text-sm
      ${getChipStyle()}
    `}>
      <span className="truncate max-w-xs">{fileName}</span>
      {warn && (
        <FiAlertTriangle 
          className={`ml-1 ${tokenWarning ? getTokenStyle() : 'text-red-500 dark:text-red-400'}`}
          size={14}
          title={reason}
        />
      )}
      <span className={`mx-1 ${getTokenStyle()}`}>
        ({tokenCount.toLocaleString()})
      </span>
      <button
        onClick={onRemove}
        className={`
          ml-1 p-0.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800
          ${warn ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
        `}
        aria-label="Remove file"
      >
        <FiX size={14} />
      </button>
    </div>
  );
};

export default FileChip;