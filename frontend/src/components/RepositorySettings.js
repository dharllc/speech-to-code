import React from 'react';
import RepositorySelector from './RepositorySelector';

const RepositorySettings = ({ selectedRepository, onRepositorySelect }) => {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Repository Settings</h2>
      <div className="max-w-md">
        <RepositorySelector onSelect={onRepositorySelect} selectedRepository={selectedRepository} />
      </div>
      {selectedRepository && (
        <p className="mt-4">Current repository: {selectedRepository}</p>
      )}
    </div>
  );
};

export default RepositorySettings;