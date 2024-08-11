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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Code</h1>
      <RepositorySelector onSelect={handleRepositorySelect} />
      {selectedRepository && (
        <TwoColumnLayout
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
        />
      )}
    </div>
  );
}

export default App;