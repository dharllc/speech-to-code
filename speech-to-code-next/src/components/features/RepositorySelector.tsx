import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/config/api';

interface RepositorySelectorProps {
  onSelect: (repository: string) => void;
  selectedRepository: string | null;
}

interface GitInfo {
  branch?: string;
  commit_hash?: string;
  error?: string;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({ onSelect, selectedRepository }) => {
  const [directories, setDirectories] = useState<string[]>([]);
  const [contextMapStatus, setContextMapStatus] = useState<'exists' | 'missing' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [gitLoading, setGitLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const response = await axios.get<{ directories: string[] }>(`${API_URL}/directories`);
        const sortedDirs = [...response.data.directories].sort((a, b) => 
          a.toLowerCase().localeCompare(b.toLowerCase())
        );
        setDirectories(sortedDirs);
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
        const response = await axios.get<{ lastUpdated: string }>(`${API_URL}/repository-context/${selectedRepository}`);
        setContextMapStatus('exists');
        setLastUpdated(response.data.lastUpdated);
      } catch {
        setContextMapStatus('missing');
        setLastUpdated(null);
      }
    };
    checkContextMap();
  }, [selectedRepository]);

  const fetchGitInfo = async (repository: string | null) => {
    if (!repository) {
      setGitInfo(null);
      return;
    }
    
    setGitLoading(true);
    try {
      const response = await axios.get<GitInfo>(`${API_URL}/git-info/${repository}`);
      setGitInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch git info:', error);
      setGitInfo({ error: 'Failed to load git information' });
    } finally {
      setGitLoading(false);
    }
  };

  useEffect(() => {
    fetchGitInfo(selectedRepository);
  }, [selectedRepository]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => onSelect(e.target.value);

  const handleContextMap = async (action: 'initialize' | 'refresh') => {
    if (!selectedRepository) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/repository-context/${selectedRepository}/${action}`);
      const response = await axios.get<{ lastUpdated: string }>(`${API_URL}/repository-context/${selectedRepository}`);
      setContextMapStatus('exists');
      setLastUpdated(response.data.lastUpdated);
    } catch (error) {
      console.error(`Failed to ${action} context map:`, error);
    }
    setIsLoading(false);
  };

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="mb-4">
      <label htmlFor="repository" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Repository</label>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <select id="repository" name="repository" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" onChange={handleChange} value={selectedRepository || ""}>
            <option value="" className="bg-white dark:bg-gray-800">Select a repository</option>
            {directories.map((dir) => (
              <option key={dir} value={dir} className="bg-white dark:bg-gray-800">{dir}</option>
            ))}
          </select>
          
          {/* Git Branch Display */}
          {selectedRepository && (
            <div className="mt-2 flex items-center gap-2">
              {gitLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Loading git info...</span>
                </div>
              ) : gitInfo?.branch ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Branch:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V9.5A2.5 2.5 0 016 7h4a1 1 0 001-1V4.372A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
                    </svg>
                    {gitInfo.branch}
                  </span>
                  {gitInfo.commit_hash && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      @ {gitInfo.commit_hash}
                    </span>
                  )}
                </div>
              ) : gitInfo?.error ? (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  {gitInfo.error}
                </div>
              ) : null}
            </div>
          )}

          {selectedRepository && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isLoading ? 'Updating context map...' : lastUpdated ? `Last updated: ${formatDate(lastUpdated)}` : 'Context map not initialized'}
          </div>}
        </div>
        {selectedRepository && contextMapStatus && (
          <button onClick={() => handleContextMap(contextMapStatus === 'exists' ? 'refresh' : 'initialize')} disabled={isLoading} className={`mt-1 px-4 py-2 text-sm font-medium rounded-md ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isLoading ? 'Processing...' : contextMapStatus === 'exists' ? 'Refresh Context' : 'Initialize Context'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RepositorySelector;