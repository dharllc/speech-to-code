import React, { useState, useEffect } from 'react';
import * as promptService from '../services/promptService';
import * as llmService from '../services/llmService';

const LLMInteraction = () => {
  const [stage, setStage] = useState('intent');
  const [userInput, setUserInput] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [prompts, setPrompts] = useState({
    intent: { prompts: [], default: null },
    code_generation: { prompts: [], default: null },
    assessment: { prompts: [], default: null },
    implementation: { prompts: [], default: null }
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const fetchedPrompts = await promptService.getPrompts();
      console.log('Fetched prompts:', fetchedPrompts);
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    console.log('Submitting user input:', userInput);
    console.log('Current stage:', stage);
    console.log('Current prompts:', prompts);

    if (!prompts[stage] || !prompts[stage].prompts.length) {
      console.error(`No prompts available for stage: ${stage}`);
      return;
    }

    const currentPrompt = prompts[stage].prompts.find(p => p.id === prompts[stage].default) || prompts[stage].prompts[0];
    
    if (!currentPrompt) {
      console.error(`No prompt found for stage: ${stage}`);
      return;
    }

    console.log('Using prompt:', currentPrompt);

    try {
      const response = await llmService.getCompletion(currentPrompt.content, userInput);
      console.log('LLM response:', response);
      setLlmResponse(response);

      if (stage === 'intent' && !response.toLowerCase().includes('clarification needed')) {
        setStage('code_generation');
      } else if (stage === 'code_generation') {
        setStage('assessment');
      } else if (stage === 'assessment' && response.toLowerCase().includes('proceed to implementation')) {
        setStage('implementation');
      }
    } catch (error) {
      console.error('Error getting LLM completion:', error);
      setLlmResponse('An error occurred while processing your request.');
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
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">LLM Response</h3>
        <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded">
          {llmResponse}
        </pre>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Current Stage: {stage}</h3>
      </div>
    </div>
  );
};

export default LLMInteraction;