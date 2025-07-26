import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { shouldWarnAboutFile } from '@/lib/utils/fileWarnings';

interface FileChipProps {
  fileName: string;
  tokenCount: number;
  onRemove: () => void;
  isRepositoryTree: boolean;
  isBinary: boolean;
}

const FileChip: React.FC<FileChipProps> = ({ fileName, tokenCount, onRemove, isRepositoryTree, isBinary }) => {
  const { warn, reason, tokenWarning } = shouldWarnAboutFile(fileName, tokenCount);

  const getChipStyle = (): string => {
    if (isBinary) {
      return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
    if (warn && !tokenWarning) {
      return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
    if ((tokenCount || 0) > 100000) {
      return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
    if ((tokenCount || 0) > 50000) {
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    }
    if (isRepositoryTree) {
      return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    }
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
  };

  const getTokenStyle = (): string => {
    if (isBinary) {
      return 'text-gray-500 dark:text-gray-400';
    }
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
      {warn && !isBinary && (
        <FiAlertTriangle 
          className={`ml-1 ${tokenWarning ? getTokenStyle() : 'text-red-500 dark:text-red-400'}`}
          size={14}
          title={reason || ''}
        />
      )}
      <span className={`mx-1 ${getTokenStyle()}`}>
        {isBinary ? '(binary)' : `(${(tokenCount || 0).toLocaleString()})`}
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