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

  const handleChange = (e) => {
    const selected = e.target.value;
    setSelectedDir(selected);
    onSelect(selected);
  };

  return (
    <select
      value={selectedDir}
      onChange={handleChange}
      className="px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
    >
      <option value="" className="bg-white dark:bg-gray-800">Select a repository</option>
      {directories.map((dir) => (
        <option key={dir} value={dir} className="bg-white dark:bg-gray-800">
          {dir}
        </option>
      ))}
    </select>
  );
};

export default RepositorySelector;