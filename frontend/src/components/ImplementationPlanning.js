import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const ImplementationPlanning = ({ isActive, onComplete, assessmentData, repository, prompt }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [fullPrompt, setFullPrompt] = useState('');

  useEffect(() => {
    if (isActive && assessmentData) {
      preparePrompt();
    }
  }, [isActive, assessmentData]);

  const preparePrompt = () => {
    const promptContent = `${prompt?.prompts[0]?.content}\n\nRepository: ${repository}\n\nCode Assessment:\n${assessmentData}\n\nCreate an implementation plan:`;
    setFullPrompt(promptContent);
  };

  const handleImplementationPlanning = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await llmService.getCompletion(fullPrompt, '');
      setResponse(result.completion);
    } catch (error) {
      setError('An error occurred while creating the implementation plan.');
      console.error('Error in implementation planning:', error);
    }
    setIsLoading(false);
  };

  const handleComplete = () => {
    onComplete(response);
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Implementation Planning</h3>
      <button
        onClick={handleImplementationPlanning}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Planning...' : 'Create Implementation Plan'}
      </button>
      <button
        onClick={() => setShowFullPrompt(!showFullPrompt)}
        className="mt-2 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        {showFullPrompt ? 'Hide Prompt' : 'Show Prompt'}
      </button>
      {showFullPrompt && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Full Prompt:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {fullPrompt}
          </pre>
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {response && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Implementation Plan:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {response}
          </pre>
          <button
            onClick={handleComplete}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
};

export default ImplementationPlanning;