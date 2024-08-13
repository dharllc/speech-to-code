import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const CodePlanning = ({ isActive, onComplete, intentData, repository, prompt }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && intentData) {
      generateCodePlan();
    }
  }, [isActive, intentData]);

  const generateCodePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await llmService.getCodePlanning(prompt, intentData, repository);
      setPlan(result.plan);
      onComplete(result.plan);
    } catch (err) {
      setError('Failed to generate code plan. Please try again.');
      console.error('Code planning error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Code Planning</h3>
      {loading && <p className="text-gray-600 dark:text-gray-400">Generating code plan...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {plan && (
        <div>
          <h4 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Generated Plan:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
            {plan}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodePlanning;