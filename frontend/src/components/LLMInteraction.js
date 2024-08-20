import React, { useState, useEffect } from 'react';
import { sendLLMRequest, getAvailableModels } from '../services/llmService';
import axios from 'axios';
import SystemPromptDisplay from './SystemPromptDisplay';
import UserPromptInput from './UserPromptInput';
import ModelParameters from './ModelParameters';
import LanguageModelSelector from './LanguageModelSelector';
import ConversationDisplay from './ConversationDisplay';
import CostDisplay from './CostDisplay';

const LLMInteraction = () => {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userPrompt, setUserPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(2000);
  const [temperature, setTemperature] = useState(0.7);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState({});
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    fetchSteps();
    fetchAvailableModels();
  }, []);

  const fetchSteps = async () => {
    try {
      const response = await axios.get('http://localhost:8000/system_prompts');
      setSteps(
        response.data.sort(
          (a, b) =>
            parseInt(a.step.split(' ')[1]) - parseInt(b.step.split(' ')[1])
        )
      );
    } catch (error) {
      console.error('Failed to fetch steps:', error);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const models = await getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
    }
  };

  const handleSubmit = async (model) => {
    setLoading(true);
    try {
      const currentSystemPrompt = steps[currentStepIndex].content;
      const messages = [
        { role: 'system', content: currentSystemPrompt },
        ...conversationHistory,
        { role: 'user', content: userPrompt },
      ];

      const result = await sendLLMRequest(messages, maxTokens, temperature, model);

      const newConversationHistory = [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: result.response },
        ...conversationHistory,
      ];
      setConversationHistory(newConversationHistory);

      setTotalCost((prevCost) => prevCost + result.cost);

      setUserPrompt('');

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (error) {
      console.error('Error in LLM request:', error);
      setConversationHistory([
        { role: 'assistant', content: 'An error occurred while processing your request.' },
        { role: 'user', content: userPrompt },
        ...conversationHistory,
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6">LLM Interaction - Step {currentStepIndex + 1}</h2>
      <CostDisplay totalCost={totalCost} />
      <SystemPromptDisplay content={steps[currentStepIndex]?.content || ''} />
      <UserPromptInput value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} />
      <ModelParameters
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        temperature={temperature}
        setTemperature={setTemperature}
      />
      <LanguageModelSelector
        availableModels={availableModels}
        onModelSelect={handleSubmit}
        loading={loading}
      />
      <ConversationDisplay conversationHistory={conversationHistory} />
    </div>
  );
};

export default LLMInteraction;