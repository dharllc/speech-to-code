import React, { useState, useEffect } from 'react';
import * as promptService from '../services/promptService';
import * as llmService from '../services/llmService';

const LLMInteraction = () => {
  const [stage, setStage] = useState('intent_understanding');
  const [userInput, setUserInput] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [prompts, setPrompts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const fetchedPrompts = await promptService.getPrompts();
      setPrompts(fetchedPrompts);
    } catch (error) {
      setError('Failed to load prompts. Please try again.');
      console.error('Failed to load prompts:', error);
    }
  };

  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setTokenInfo(null);

    if (!prompts[stage] || !prompts[stage].prompts.length) {
      setError(`No prompts available for stage: ${stage}`);
      setIsLoading(false);
      return;
    }

    const currentPrompt = prompts[stage].prompts.find(p => p.id === prompts[stage].default) || prompts[stage].prompts[0];
    
    if (!currentPrompt) {
      setError(`No prompt found for stage: ${stage}`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await llmService.getCompletion(currentPrompt.content, userInput);
      setLlmResponse(response.completion);
      setTokenInfo({
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost
      });

      if (stage === 'intent_understanding') {
        setStage('code_generation');
      } else if (stage === 'code_generation') {
        setStage('assessment');
      } else if (stage === 'assessment') {
        setStage('implementation_planning');
      } else {
        setStage('intent_understanding');
      }
    } catch (error) {
      setError('An error occurred while processing your request. Please try again.');
      console.error('Error getting LLM completion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">LLM Interaction</h2>
      <div className="mb-4">
        <textarea
          value={userInput}
          onChange={handleUserInput}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          rows="4"
          placeholder="Enter your request or response"
        ></textarea>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">LLM Response</h3>
        <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded">
          {llmResponse}
        </pre>
      </div>
      {tokenInfo && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Input Tokens: {tokenInfo.inputTokens}</p>
          <p>Output Tokens: {tokenInfo.outputTokens}</p>
          <p>Estimated Cost: ${tokenInfo.cost.toFixed(6)}</p>
        </div>
      )}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Current Stage: {stage}</h3>
      </div>
    </div>
  );
};

export default LLMInteraction;