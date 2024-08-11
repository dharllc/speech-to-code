import React, { useState } from 'react';
import RepositorySelector from './components/RepositorySelector';
import TwoColumnLayout from './components/TwoColumnLayout';

function App() {
  const [selectedRepository, setSelectedRepository] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleRepositorySelect = (repo) => {
    console.log("Selected repository:", repo);
    setSelectedRepository(repo);
    setSelectedFiles([]); // Clear selected files when a new repository is selected
  };

  const handleFileSelectionChange = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected) {
        // Add the file if it's not already in the array
        return prev.some(f => f.path === file.path) ? prev : [...prev, file];
      } else {
        // Remove the file if it's in the array
        return prev.filter(f => f.path !== file.path);
      }
    });
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Code</h1>
      <RepositorySelector onSelect={handleRepositorySelect} />
      {selectedRepository && (
        <TwoColumnLayout
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileSelectionChange={handleFileSelectionChange}
          onClearAllFiles={handleClearAllFiles}
        />
      )}
    </div>
  );
}

export default App;