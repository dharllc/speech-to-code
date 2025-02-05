// File: frontend/src/components/TwoColumnLayout.js
import React, { useState } from 'react';
import PromptComposer from './PromptComposer';
import RepositoryFileViewer from './RepositoryFileViewer';

const TwoColumnLayout = ({ 
  selectedRepository, 
  selectedFiles, 
  onFileSelectionChange,
  onBatchFileSelection,
  onClearAllFiles,
  setUserPrompt 
}) => {
  const [selectedFilesState, setSelectedFiles] = useState([]);

  const handleFileSelect = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected && !prev.some(f => f.path === file.path)) {
        return [...prev, file];
      }
      // Deselect scenario
      return prev.filter(f => f.path !== file.path);
    });
  };

  const handleFileRemove = (filePath) => {
    const fileToRemove = selectedFiles.find(f => f.path === filePath);
    if (fileToRemove && fileToRemove.type === 'directory') {
      fileToRemove.files.forEach(file => {
        onFileSelectionChange(file, false);
      });
    } else {
      onFileSelectionChange({ path: filePath }, false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column: PromptComposer */}
      <div className="h-[calc(100vh-8rem)] overflow-auto">
        <PromptComposer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileRemove={handleFileRemove}
          onFileSelectionChange={onFileSelectionChange}
          onBatchFileSelection={onBatchFileSelection}
          setUserPrompt={setUserPrompt}
        />
      </div>

      {/* Right Column: Repository Browser */}
      <div className="h-[calc(100vh-8rem)] overflow-auto">
        <RepositoryFileViewer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileSelect={(file, isSelected) => onFileSelectionChange(file, isSelected)}
        />
      </div>
    </div>
  );
};

export default TwoColumnLayout;