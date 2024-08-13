import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const FileModification = ({ isActive, onComplete, modificationPlan, repository, prompt, moveToNextStage }) => {
  const [modifications, setModifications] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [fullPrompt, setFullPrompt] = useState('');

  useEffect(() => {
    if (isActive && modificationPlan) {
      preparePrompt();
    }
  }, [isActive, modificationPlan]);

  const preparePrompt = () => {
    const promptContent = `${prompt?.prompts[0]?.content}\n\nRepository: ${repository}\n\nModification Plan:\n${JSON.stringify(modificationPlan, null, 2)}\n\nGenerate file modifications:`;
    setFullPrompt(promptContent);
  };

  const handleFileModification = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await llmService.getCompletion(fullPrompt, '');
      setModifications(result.completion);
    } catch (error) {
      setError('An error occurred while generating file modifications.');
      console.error('Error in file modification:', error);
    }
    setIsLoading(false);
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">File Modification</h3>
      <button
        onClick={handleFileModification}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Modifying...' : 'Generate File Modifications'}
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
      {modifications && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">File Modifications:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {modifications}
          </pre>
          <button
            onClick={() => {
              onComplete({ modifications });
              moveToNextStage();
            }}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Continue to Next Stage
          </button>
        </div>
      )}
    </div>
  );
};

export default FileModification;