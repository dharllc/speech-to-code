import React, { useState } from 'react';
import RepositorySelector from './components/RepositorySelector';
import PromptComposer from './components/PromptComposer';

function App() {
  const [selectedRepository, setSelectedRepository] = useState('');

  const handleRepositorySelect = (repo) => {
    setSelectedRepository(repo);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Code</h1>
      <RepositorySelector onSelect={handleRepositorySelect} />
      <PromptComposer selectedRepository={selectedRepository} />
    </div>
  );
}

export default App;