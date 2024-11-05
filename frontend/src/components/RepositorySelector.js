import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const RepositorySelector = ({ onSelect, selectedRepository }) => {
  const [directories, setDirectories] = useState([]);
  const [contextMapStatus, setContextMapStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const response = await axios.get(`${API_URL}/directories`);
        setDirectories(response.data.directories);
      } catch (error) {
        console.error('Failed to fetch directories:', error);
      }
    };
    fetchDirectories();
  }, []);

  useEffect(() => {
    const checkContextMap = async () => {
      if (!selectedRepository) return;
      try {
        const response = await axios.get(`${API_URL}/repository-context/${selectedRepository}`);
        setContextMapStatus('exists');
        setLastUpdated(response.data.lastUpdated);
      } catch {
        setContextMapStatus('missing');
        setLastUpdated(null);
      }
    };
    checkContextMap();
  }, [selectedRepository]);

  const handleChange = (e) => {
    const selected = e.target.value;
    onSelect(selected);
  };

  const handleContextMap = async (action) => {
    if (!selectedRepository) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/repository-context/${selectedRepository}/${action}`);
      const response = await axios.get(`${API_URL}/repository-context/${selectedRepository}`);
      setContextMapStatus('exists');
      setLastUpdated(response.data.lastUpdated);
    } catch (error) {
      console.error(`Failed to ${action} context map:`, error);
    }
    setIsLoading(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="mb-4">
      <label htmlFor="repository" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Repository
      </label>
      <div className="flex items-start gap-2">
        <div className="flex-1">
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
          {selectedRepository && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isLoading 
              ? 'Updating context map...'
              : lastUpdated 
                ? `Last updated: ${formatDate(lastUpdated)}`
                : 'Context map not initialized'}
          </div>}
        </div>
        {selectedRepository && contextMapStatus && (
          <button
            onClick={() => handleContextMap(contextMapStatus === 'exists' ? 'refresh' : 'initialize')}
            disabled={isLoading}
            className={`mt-1 px-4 py-2 text-sm font-medium rounded-md ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : contextMapStatus === 'exists' ? 'Refresh Context' : 'Initialize Context'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RepositorySelector;