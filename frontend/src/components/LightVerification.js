import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const LightVerification = ({ isActive, onComplete, environmentResults, repository, moveToNextStage }) => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullResults, setShowFullResults] = useState(false);

  useEffect(() => {
    if (isActive && environmentResults) {
      console.log('Light Verification activated with results:', environmentResults);
    }
  }, [isActive, environmentResults]);

  const performLightVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await llmService.performLightVerification(environmentResults, repository);
      setVerificationResult(result);
      onComplete(result);
    } catch (err) {
      setError('Failed to perform verification. Please try again.');
      console.error('Light verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Light Verification</h3>
      <button
        onClick={performLightVerification}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Perform Light Verification'}
      </button>
      <button
        onClick={() => setShowFullResults(!showFullResults)}
        className="mt-2 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        {showFullResults ? 'Hide Environment Results' : 'Show Environment Results'}
      </button>
      {showFullResults && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Environment Results:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {JSON.stringify(environmentResults, null, 2)}
          </pre>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {verificationResult && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Verification Result:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
            {JSON.stringify(verificationResult, null, 2)}
          </pre>
          <button
            onClick={moveToNextStage}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
};

export default LightVerification;