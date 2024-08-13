import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const EnvironmentManagement = ({ isActive, onComplete, modificationResults, repository, moveToNextStage }) => {
  const [environmentResult, setEnvironmentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullResults, setShowFullResults] = useState(false);

  useEffect(() => {
    if (isActive && modificationResults) {
      console.log('Environment Management activated with results:', modificationResults);
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
      <button
        onClick={manageEnvironment}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Managing...' : 'Manage Environment'}
      </button>
      <button
        onClick={() => setShowFullResults(!showFullResults)}
        className="mt-2 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        {showFullResults ? 'Hide Modification Results' : 'Show Modification Results'}
      </button>
      {showFullResults && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Modification Results:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {JSON.stringify(modificationResults, null, 2)}
          </pre>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {environmentResult && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Environment Update Result:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
            {JSON.stringify(environmentResult, null, 2)}
          </pre>
          <button
            onClick={moveToNextStage}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Continue to Next Stage
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManagement;