import React, { useState, useEffect, useRef } from 'react';
import { sendLLMRequest, getAvailableModels } from '../services/llmService';
import axios from 'axios';
import SystemPromptDisplay from './SystemPromptDisplay';
import UserPromptInput from './UserPromptInput';
import LanguageModelSelector from './LanguageModelSelector';
import ConversationDisplay from './ConversationDisplay';
import CostDisplay from './CostDisplay';

const LLMInteraction = ({ initialPrompt }) => {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userPrompt, setUserPrompt] = useState(initialPrompt || '');
  const [temperature, setTemperature] = useState(0.7);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState({});
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [systemPromptTokens, setSystemPromptTokens] = useState(0);
  const [userPromptTokens, setUserPromptTokens] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchSteps();
    fetchAvailableModels();
  }, []);

  useEffect(() => {
    if (loading) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 0.1);
      }, 100);
    } else {
      clearInterval(timerRef.current);
      setElapsedTime(0);
    }

    return () => clearInterval(timerRef.current);
  }, [loading]);

  useEffect(() => {
    if (steps[currentStepIndex]) {
      countTokens(steps[currentStepIndex].content, setSystemPromptTokens);
    }
  }, [steps, currentStepIndex]);

  useEffect(() => {
    countTokens(userPrompt, setUserPromptTokens);
  }, [userPrompt]);

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

  const countTokens = async (text, setTokens) => {
    try {
      const response = await axios.post('http://localhost:8000/count_tokens', {
        text: text,
        model: 'gpt-3.5-turbo'
      });
      setTokens(response.data.count);
    } catch (error) {
      console.error('Error counting tokens:', error);
      setTokens(0);
    }
  };

  const handleSubmit = async (model) => {
    setLoading(true);
    setElapsedTime(0);
    try {
      const currentSystemPrompt = steps[currentStepIndex].content;
      const messages = [
        { role: 'system', content: currentSystemPrompt },
        ...conversationHistory,
        { role: 'user', content: userPrompt },
      ];

      const result = await sendLLMRequest(messages, temperature, model);

      const newConversationHistory = [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: result.response },
        ...conversationHistory,
      ];
      setConversationHistory(newConversationHistory);

      setTotalCost((prevCost) => prevCost + result.cost);
      setTotalTokens((prevTokens) => ({
        input: prevTokens.input + result.tokenCounts.input,
        output: prevTokens.output + result.tokenCounts.output
      }));

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

  const getTemperatureColor = (temp) => {
    if (temp <= 1) return '#34D399';
    if (temp <= 1.5) return '#FBBF24';
    return '#EF4444';
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6">LLM Interaction - Step {currentStepIndex + 1}</h2>
      <CostDisplay totalCost={totalCost} totalTokens={totalTokens} />
      <SystemPromptDisplay content={steps[currentStepIndex]?.content || ''} tokenCount={systemPromptTokens} />
      <UserPromptInput value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} tokenCount={userPromptTokens} />
      <div className="mb-4">
        <label htmlFor="temperature" className="block text-sm font-medium text-gray-300 mb-2">
          Temperature: {temperature}
        </label>
        <div className="relative w-1/4 h-8 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full overflow-hidden">
          <input
            type="range"
            id="temperature"
            name="temperature"
            min="0"
            max="2"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-in-out"
            style={{ 
              width: `${(temperature / 2) * 100}%`,
              backgroundColor: getTemperatureColor(temperature),
              boxShadow: `0 0 10px ${getTemperatureColor(temperature)}`,
            }}
          ></div>
        </div>
      </div>
      <LanguageModelSelector
        availableModels={availableModels}
        onModelSelect={handleSubmit}
        loading={loading}
      />
      {loading && (
        <div className="mt-4 p-4 bg-blue-900 rounded-lg shadow-lg">
          <p className="text-lg font-semibold">Request in progress...</p>
          <p className="text-xl font-bold">{elapsedTime.toFixed(1)} seconds</p>
        </div>
      )}
      <ConversationDisplay conversationHistory={conversationHistory} />
    </div>
  );
};

export default LLMInteraction;