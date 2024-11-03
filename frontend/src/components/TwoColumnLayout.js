// File: frontend/src/components/TwoColumnLayout.js

import React, { useState } from 'react';
import PromptComposer from './PromptComposer';
import RepositoryFileViewer from './RepositoryFileViewer';

const TwoColumnLayout = ({ selectedRepository, setUserPrompt, onClearAllFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected) {
        // Add file if not already present
        if (!prev.some(f => f.path === file.path)) {
          return [...prev, file];
        }
      } else {
        // Remove file if present
        return prev.filter(f => f.path !== file.path);
      }
      return prev;
    });
  };

  const handleFileRemove = (filePath) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== filePath));
    // No additional actions needed here unless required
  };

  return (
    <div className="flex flex-row w-full mt-2">
      <div className="w-1/2 pr-2 overflow-auto">
        <PromptComposer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileRemove={handleFileRemove}
          onFileSelectionChange={handleFileSelect}
          setUserPrompt={setUserPrompt}
        />
      </div>
      <div className="w-1/2 pl-2 border-l border-gray-300 dark:border-gray-700">
        <RepositoryFileViewer
          selectedRepository={selectedRepository}
          onFileSelect={handleFileSelect}
          selectedFiles={selectedFiles}
        />
      </div>
    </div>
  );
};

export default TwoColumnLayout;