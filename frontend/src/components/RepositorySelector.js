import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepositorySelector = ({ onSelect, selectedRepository }) => {
  const [directories, setDirectories] = useState([]);

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
    onSelect(selected);
  };

  return (
    <div className="mb-4">
      <label htmlFor="repository" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Repository
      </label>
      <select
        id="repository"
        name="repository"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        onChange={handleChange}
        value={selectedRepository || ""}
      >
        <option value="" className="bg-white dark:bg-gray-800">Select a repository</option>
        {directories.map((dir) => (
          <option key={dir} value={dir} className="bg-white dark:bg-gray-800">
            {dir}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RepositorySelector;