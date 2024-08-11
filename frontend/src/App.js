import React, { useState } from 'react';
import RepositorySelector from './components/RepositorySelector';
import TwoColumnLayout from './components/TwoColumnLayout';
import DarkModeToggle from './components/DarkModeToggle';

function App() {
  const [selectedRepository, setSelectedRepository] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleRepositorySelect = (repo) => {
    console.log("Selected repository:", repo);
    setSelectedRepository(repo);
    setSelectedFiles([]);
  };

  const handleFileSelectionChange = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected) {
        return prev.some(f => f.path === file.path) ? prev : [...prev, file];
      } else {
        return prev.filter(f => f.path !== file.path);
      }
    });
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Speech-to-Code</h1>
        <DarkModeToggle />
      </div>
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