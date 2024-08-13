import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const QualityAssessment = ({ isActive, onComplete, generatedCode, repository, prompt, moveToNextStage }) => {
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [fullPrompt, setFullPrompt] = useState('');

  useEffect(() => {
    if (isActive && generatedCode) {
      preparePrompt();
    }
  }, [isActive, generatedCode]);

  const preparePrompt = () => {
    const promptContent = `${prompt?.prompts[0]?.content}\n\nRepository: ${repository}\n\nGenerated Code:\n${JSON.stringify(generatedCode, null, 2)}\n\nAssess the quality of the generated code:`;
    setFullPrompt(promptContent);
  };

  const handleQualityAssessment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await llmService.getCompletion(fullPrompt, '');
      setAssessment(result.completion);
    } catch (error) {
      setError('An error occurred while assessing code quality.');
      console.error('Error in quality assessment:', error);
    }
    setIsLoading(false);
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Quality Assessment</h3>
      <button
        onClick={handleQualityAssessment}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Assessing...' : 'Assess Code Quality'}
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
      {assessment && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Quality Assessment:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {assessment}
          </pre>
          <button
            onClick={() => {
              onComplete({ assessment });
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

export default QualityAssessment;