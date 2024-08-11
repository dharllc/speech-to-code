import React, { useState } from 'react';
import RepositorySelector from '../components/RepositorySelector';
import TwoColumnLayout from '../components/TwoColumnLayout';

const Home = () => {
  const [selectedRepository, setSelectedRepository] = useState('');

  const handleRepositorySelect = (repo) => {
    console.log("Selected repository in Home:", repo);
    setSelectedRepository(repo);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Code</h1>
      <RepositorySelector onSelect={handleRepositorySelect} />
      {selectedRepository && (
        <>
          {console.log("Rendering TwoColumnLayout with repo:", selectedRepository)}
          <TwoColumnLayout selectedRepository={selectedRepository} />
        </>
      )}
    </div>
  );
};

export default Home;