import React, { useState } from 'react';
import RepositorySelector from '../components/RepositorySelector';
import PromptComposer from '../components/PromptComposer';

const Home = () => {
  const [selectedRepository, setSelectedRepository] = useState('');

  const handleRepositorySelect = (repo) => {
    setSelectedRepository(repo);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Code</h1>
      <RepositorySelector onSelect={handleRepositorySelect} />
      {selectedRepository && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Prompt Composer</h2>
          <PromptComposer selectedRepository={selectedRepository} />
        </div>
      )}
    </div>
  );
};

export default Home;