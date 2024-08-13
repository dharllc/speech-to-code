import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const LightVerification = ({ isActive, onComplete, environmentResults, repository }) => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && environmentResults) {
      performLightVerification();
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
      {loading && <p className="text-gray-600 dark:text-gray-400">Performing verification...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {verificationResult && (
        <div>
          <h4 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Verification Result:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
            {JSON.stringify(verificationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default LightVerification;