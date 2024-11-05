import React, { useMemo } from 'react';
import { FiFolder, FiFileText } from 'react-icons/fi';

const FileChip = ({ fileName, tokenCount, onRemove }) => {
  const { isFolder, displayName, fileCount } = useMemo(() => {
    if (fileName.includes('/*')) {
      const folderName = fileName.replace('/*', '');
      return {
        isFolder: true,
        displayName: folderName,
        fileCount: tokenCount.fileCount
      };
    }
    return {
      isFolder: false,
      displayName: fileName.split('/').pop(),
      fileCount: null
    };
  }, [fileName, tokenCount]);

  return (
    <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-200 mr-2 mb-2">
      {isFolder ? (
        <>
          <FiFolder className="mr-1" size={12} />
          <span>{displayName}/*</span>
          <span className="ml-1 text-xs">({fileCount} files, {tokenCount.total} tokens)</span>
        </>
      ) : (
        <>
          <FiFileText className="mr-1" size={12} />
          <span>{displayName}</span>
          <span className="ml-1 text-xs">({tokenCount} tokens)</span>
        </>
      )}
      <button 
        onClick={onRemove} 
        className="ml-2 text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100 transition-colors duration-150"
        aria-label={`Remove ${displayName}`}
      >
        ×
      </button>
    </div>
  );
};

export default FileChip;