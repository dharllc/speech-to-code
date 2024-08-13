import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const CodePlanning = ({ isActive, onComplete, intentData, repository, prompt, moveToNextStage }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [fullPrompt, setFullPrompt] = useState('');

  useEffect(() => {
    if (isActive && intentData) {
      console.log('CodePlanning activated with intentData:', intentData);
      preparePrompt();
    }
  }, [isActive, intentData]);

  const preparePrompt = () => {
    const promptContent = prompt?.prompts?.find(p => p.id === prompt?.default)?.content;
    if (!promptContent) {
      setError('No valid prompt content found');
      return;
    }
    const fullPromptContent = `${promptContent}\n\nRepository: ${repository}\n\nIntent Understanding: ${intentData.response}`;
    setFullPrompt(fullPromptContent);
  };

  const generateCodePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Generating code plan with prompt:', fullPrompt);
      console.log('Repository:', repository);
      console.log('Intent Data:', intentData);

      const result = await llmService.getCodePlanning(fullPrompt, intentData, repository);
      console.log('Code planning result:', result);
      setPlan(result.plan);
      onComplete({plan: result.plan});
    } catch (err) {
      console.error('Code planning error:', err);
      setError(`Failed to generate code plan. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Code Planning</h3>
      <button
        onClick={generateCodePlan}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Code Plan'}
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
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm text-blue-600 dark:text-blue-400">
            {fullPrompt}
          </pre>
        </div>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {plan && (
        <div>
          <h4 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Generated Plan:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
            {plan}
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

export default CodePlanning;