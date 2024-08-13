import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const EnvironmentManagement = ({ isActive, onComplete, modificationResults, repository }) => {
  const [environmentResult, setEnvironmentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && modificationResults) {
      manageEnvironment();
    }
  }, [isActive, modificationResults]);

  const manageEnvironment = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await llmService.manageEnvironment(modificationResults, repository);
      setEnvironmentResult(result);
      onComplete(result);
    } catch (err) {
      setError('Failed to manage environment. Please try again.');
      console.error('Environment management error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Environment Management</h3>
      {loading && <p className="text-gray-600 dark:text-gray-400">Managing environment...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {environmentResult && (
        <div>
          <h4 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Environment Update Result:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
            {JSON.stringify(environmentResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManagement;