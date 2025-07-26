import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiX } from 'react-icons/fi';
import type { FileCombination, FileItem } from '../../types/file';

interface FileCombinationsProps {
  combinations: FileCombination[];
  onRestoreCombination: (combination: FileCombination) => void;
  onRemoveCombination: (combinationId: number) => void;
  currentSelection?: FileItem[];
}

const FileCombinations: React.FC<FileCombinationsProps> = ({ 
  combinations, 
  onRestoreCombination, 
  onRemoveCombination,
  currentSelection = []
}) => {
  if (!combinations || combinations.length === 0) return null;

  const isMatchingCombination = (combination: FileCombination): boolean => {
    if (currentSelection.length !== combination.files.length) return false;
    return combination.files.every(file => 
      currentSelection.some(current => current.path === file.path)
    );
  };

  return (
    <div className="mt-2 mb-1">
      <div className="flex flex-wrap gap-1.5">
        {combinations.map((combination) => {
          const isMatching = isMatchingCombination(combination);
          const fileCount = combination.files.length;
          const timeAgo = formatDistanceToNow(new Date(combination.timestamp), { addSuffix: true });
          
          return (
            <div
              key={combination.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors
                ${isMatching 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              onClick={() => onRestoreCombination(combination)}
              title={`Last used ${timeAgo}`}
            >
              <span className="flex items-center gap-1">
                <span>{`${fileCount} file${fileCount !== 1 ? 's' : ''}`}</span>
                <span className="opacity-75">{`(${combination.totalTokens})`}</span>
              </span>
              
              <button
                className="ml-1 p-0.5 hover:text-red-600 dark:hover:text-red-400"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onRemoveCombination(combination.id);
                }}
                title="Remove from history"
              >
                <FiX size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileCombinations;