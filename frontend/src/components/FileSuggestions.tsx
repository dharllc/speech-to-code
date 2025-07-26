import React from 'react';
import { FiCheckCircle, FiHelpCircle, FiAlertCircle, FiPlus, FiMinus } from 'react-icons/fi';
import type { FileSuggestion } from '../types/prompt';
import type { IconType } from 'react-icons';

interface FileSuggestionsProps {
  suggestions: {
    high_confidence: FileSuggestion[];
    medium_confidence: FileSuggestion[];
    low_confidence: FileSuggestion[];
  } | null;
  onBatchAdd: (batchKey: 'high_confidence' | 'medium_confidence' | 'low_confidence') => void;
  onBatchRemove: (batchKey: 'high_confidence' | 'medium_confidence' | 'low_confidence') => void;
  addedBatches: string[];
}

interface SuggestionSectionProps {
  title: string;
  files: FileSuggestion[] | undefined;
  icon: IconType;
  bgClass: string;
  batchKey: 'high_confidence' | 'medium_confidence' | 'low_confidence';
  isBatchAdded: boolean;
  onBatchAdd: (batchKey: 'high_confidence' | 'medium_confidence' | 'low_confidence') => void;
  onBatchRemove: (batchKey: 'high_confidence' | 'medium_confidence' | 'low_confidence') => void;
}

const SuggestionSection: React.FC<SuggestionSectionProps> = ({ 
  title, 
  files, 
  icon: Icon, 
  bgClass, 
  batchKey,
  isBatchAdded,
  onBatchAdd,
  onBatchRemove
}) => {
  if (!files || files.length === 0) return null;

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
      <div className="space-y-2">
        {files.map(({ file, reason }) => (
          <div key={file} className="flex flex-col">
            <span className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all whitespace-pre-wrap">
              {file}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4 truncate">
              {reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FileSuggestions: React.FC<FileSuggestionsProps> = ({ 
  suggestions, 
  onBatchAdd, 
  onBatchRemove, 
  addedBatches 
}) => {
  if (!suggestions) return null;

  return (
    <div className="mb-4 border rounded p-2 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Suggested Files</h3>
      <SuggestionSection
        title="High"
        files={suggestions.high_confidence}
        icon={FiCheckCircle}
        bgClass="bg-green-50/50 dark:bg-green-900/20"
        batchKey="high_confidence"
        isBatchAdded={addedBatches.includes('high_confidence')}
        onBatchAdd={onBatchAdd}
        onBatchRemove={onBatchRemove}
      />
      <SuggestionSection
        title="Medium"
        files={suggestions.medium_confidence}
        icon={FiHelpCircle}
        bgClass="bg-yellow-50/50 dark:bg-yellow-900/20"
        batchKey="medium_confidence"
        isBatchAdded={addedBatches.includes('medium_confidence')}
        onBatchAdd={onBatchAdd}
        onBatchRemove={onBatchRemove}
      />
      <SuggestionSection
        title="Low"
        files={suggestions.low_confidence}
        icon={FiAlertCircle}
        bgClass="bg-gray-50/50 dark:bg-gray-900/20"
        batchKey="low_confidence"
        isBatchAdded={addedBatches.includes('low_confidence')}
        onBatchAdd={onBatchAdd}
        onBatchRemove={onBatchRemove}
      />
    </div>
  );
};

export default FileSuggestions;