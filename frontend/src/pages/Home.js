import React, { useState } from 'react';
import PromptComposer from '../components/PromptComposer';
import RepositorySelector from '../components/RepositorySelector';

const Home = () => {
  const [repository, setRepository] = useState('');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Code</h1>
      <RepositorySelector onSelect={setRepository} />
      {repository && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Prompt Composer</h2>
          <PromptComposer repository={repository} />
        </div>
      )}
    </div>
  );
};

export default Home;
