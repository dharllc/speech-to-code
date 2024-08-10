import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepositorySelector = ({ onSelect }) => {
  const [directories, setDirectories] = useState([]);
  const [selectedDir, setSelectedDir] = useState('');

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const response = await axios.get('http://localhost:8000/directories');
        setDirectories(response.data.directories);
      } catch (error) {
        console.error('Failed to fetch directories:', error);
      }
    };
    fetchDirectories();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDir) {
      onSelect(`/Users/sachindhar/Documents/GitHub/${selectedDir}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-center">
      <select
        value={selectedDir}
        onChange={(e) => setSelectedDir(e.target.value)}
        className="px-2 py-1 border rounded"
      >
        <option value="">Select a repository</option>
        {directories.map((dir) => (
          <option key={dir} value={dir}>
            {dir}
          </option>
        ))}
      </select>
      <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
        Set Repository
      </button>
    </form>
  );
};

export default RepositorySelector;