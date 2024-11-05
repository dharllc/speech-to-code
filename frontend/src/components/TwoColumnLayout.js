// TwoColumnLayout.js
import React, { useState } from 'react';
import PromptComposer from './PromptComposer';
import RepositoryFileViewer from './RepositoryFileViewer';

const TwoColumnLayout = ({ selectedRepository, setUserPrompt, onClearAllFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected && !prev.some(f => f.path === file.path)) {
        return [...prev, file];
      }
      return prev.filter(f => f.path !== file.path);
    });
  };

  const handleFileRemove = (filePath) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== filePath));
  };

  return (
    <div className="flex flex-col lg:flex-row w-full gap-4">
      <div className="w-full lg:w-1/2 min-w-0">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg">
          <PromptComposer
            selectedRepository={selectedRepository}
            selectedFiles={selectedFiles}
            onFileRemove={handleFileRemove}
            onFileSelectionChange={handleFileSelect}
            setUserPrompt={setUserPrompt}
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 min-w-0">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg">
          <RepositoryFileViewer
            selectedRepository={selectedRepository}
            onFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
          />
        </div>
      </div>
    </div>
  );
};

export default TwoColumnLayout;