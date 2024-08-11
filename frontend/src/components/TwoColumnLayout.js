import React, { useState } from 'react';
import PromptComposer from './PromptComposer';
import RepositoryFileViewer from './RepositoryFileViewer';

const TwoColumnLayout = ({ selectedRepository }) => {
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
  };

  return (
    <div className="flex flex-row w-full mt-4">
      <div className="w-1/2 p-4 overflow-auto">
        <PromptComposer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
        />
      </div>
      <div className="w-1/2 p-4 border-l">
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