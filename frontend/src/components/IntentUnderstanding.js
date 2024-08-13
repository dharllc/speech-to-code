import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const IntentUnderstanding = ({ isActive, onComplete, repository, prompt, feedbackLoop, onFeedback, previousData, moveToNextStage }) => {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (previousData && previousData.additionalInfo) {
      setUserInput(previousData.additionalInfo);
    }
  }, [previousData]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const fullPrompt = `${prompt?.prompts[0]?.content}\n\nRepository: ${repository}\n\nUser Input: ${userInput}`;
      const result = await llmService.getCompletion(fullPrompt, userInput);
      setResponse(result.completion);
      const needsMoreInfo = result.completion.toLowerCase().includes("further clarification is needed");
      onComplete({ response: result.completion, needsMoreInfo });
      setIsCompleted(true);
    } catch (error) {
      setError('An error occurred while processing your request.');
      console.error('Error in intent understanding:', error);
    }
    setIsLoading(false);
  };

  const handleFeedbackSubmit = () => {
    onFeedback(userInput);
  };

  const handleContinue = () => {
    moveToNextStage();
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Intent Understanding</h3>
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">System Prompt:</h4>
        <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm text-blue-600 dark:text-blue-400">
          {prompt?.prompts[0]?.content}
        </pre>
      </div>
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        rows="4"
        placeholder={feedbackLoop ? "Provide additional information" : "Describe your coding intention"}
      />
      <button
        onClick={feedbackLoop ? handleFeedbackSubmit : handleSubmit}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : (feedbackLoop ? 'Submit Additional Info' : 'Submit')}
      </button>
      <button
        onClick={() => setShowFullPrompt(!showFullPrompt)}
        className="mt-2 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        {showFullPrompt ? 'Hide Full Prompt' : 'Show Full Prompt'}
      </button>
      {showFullPrompt && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Full Prompt:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm text-blue-600 dark:text-blue-400">
            {`${prompt?.prompts[0]?.content}\n\nRepository: ${repository}\n\nUser Input: ${userInput}`}
          </pre>
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {response && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Response:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {response}
          </pre>
        </div>
      )}
      {isCompleted && (
        <button
          onClick={handleContinue}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Continue to Next Stage
        </button>
      )}
    </div>
  );
};

export default IntentUnderstanding;