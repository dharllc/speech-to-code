// Filename: TwoColumnLayout.js
import React, { useState } from 'react';
import PromptComposer from './PromptComposer';
import RepositoryFileViewer from './RepositoryFileViewer';

const TwoColumnLayout = ({ selectedRepository, setUserPrompt, onFileSelectionChange, onClearAllFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (file) => {
    setSelectedFiles(prev => {
      const isAlreadySelected = prev.some(f => f.path === file.path);
      if (isAlreadySelected) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
    onFileSelectionChange(file, !selectedFiles.some(f => f.path === file.path));
  };

  const handleFileRemove = (filePath) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== filePath));
    onFileSelectionChange({ path: filePath }, false);
  };

  return (
    <div className="flex flex-row w-full mt-2">
      <div className="w-1/2 pr-2 overflow-auto">
        <PromptComposer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileRemove={handleFileRemove}
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