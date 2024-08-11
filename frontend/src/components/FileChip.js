import React from 'react';

const FileChip = ({ fileName, tokenCount, onRemove }) => {
  return (
    <div className="inline-flex items-center bg-blue-100 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2 mb-2">
      <span>{fileName}</span>
      <span className="ml-2 text-xs">({tokenCount} tokens)</span>
      <button onClick={onRemove} className="ml-2 text-blue-500 hover:text-blue-700">
        &times;
      </button>
    </div>
  );
};

export default FileChip;