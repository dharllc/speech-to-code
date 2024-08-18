import React, { useState, useEffect } from 'react';
import { sendLLMRequest, getAvailableModels } from '../services/llmService';
import CopyButton from './CopyButton';

const LLMInteraction = () => {
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(2000);
  const [temperature, setTemperature] = useState(0.7);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState({});

  useEffect(() => {
    fetchSteps();
    fetchAvailableModels();
  }, []);

  const fetchSteps = async () => {
    try {
      const response = await fetch('http://localhost:8000/system_prompts');
      const data = await response.json();
      setSteps(data);
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

  const handleStepChange = (e) => {
    const selectedPrompt = steps.find(step => step.id === e.target.value);
    setSelectedStep(e.target.value);
    setSystemPrompt(selectedPrompt ? selectedPrompt.content : '');
  };

  const handleSubmit = async (model) => {
    setLoading(true);
    try {
      const result = await sendLLMRequest(systemPrompt, userPrompt, maxTokens, temperature, model);
      setResponses(prev => [{ ...result, model, timestamp: new Date() }, ...prev]);
    } catch (error) {
      console.error('Error in LLM request:', error);
      setResponses(prev => [{ 
        response: 'An error occurred while processing your request.',
        model,
        timestamp: new Date(),
        error: true
      }, ...prev]);
    }
    setLoading(false);
  };

  const getAllResponses = () => {
    return responses.map(r => `Model: ${r.model}\nTimestamp: ${r.timestamp.toLocaleString()}\n\nResponse:\n${r.response}\n\n${r.error ? '' : `Input Tokens: ${r.tokenCounts.input}, Output Tokens: ${r.tokenCounts.output}, Estimated Cost: $${r.cost.toFixed(6)}, Queries per dollar: ${Math.round(1 / r.cost)}\n`}---\n\n`).join('');
  };

  return (
    <div className="container mx-auto p-4 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">LLM Interaction</h2>
      <form className="mb-4">
        <div className="mb-4">
          <label className="block mb-2">Step:</label>
          <select
            value={selectedStep}
            onChange={handleStepChange}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            required
          >
            <option value="">Select a step</option>
            {steps.map(step => (
              <option key={step.id} value={step.id}>{step.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2">System Prompt:</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            rows="4"
            readOnly
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block mb-2">User Prompt:</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            rows="4"
            required
          ></textarea>
        </div>
        <div className="mb-4 flex space-x-4">
          <div className="flex-1">
            <label className="block mb-2">Max Tokens:</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full p-2 border rounded bg-gray-700 text-white"
              min="1"
              max="8000"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-2">Temperature:</label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full p-2 border rounded bg-gray-700 text-white"
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(availableModels).map(([provider, models]) => (
            <div key={provider}>
              <h3 className="text-lg font-semibold mb-2">{provider.charAt(0).toUpperCase() + provider.slice(1)}</h3>
              {models.map(model => (
                <button
                  key={model}
                  type="button"
                  onClick={() => handleSubmit(model)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2 mb-2"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `${model}`}
                </button>
              ))}
            </div>
          ))}
        </div>
      </form>
      {responses.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <h3 className="text-xl font-bold">Responses:</h3>
            <CopyButton textToCopy={getAllResponses()} />
          </div>
          {responses.map((response, index) => (
            <div key={index} className="mb-6 border-b border-gray-700 pb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm">Timestamp: {response.timestamp.toLocaleString()}</p>
                <CopyButton textToCopy={`${response.response}\n\nModel: ${response.model}\nTimestamp: ${response.timestamp.toLocaleString()}\n${response.error ? '' : `Input Tokens: ${response.tokenCounts.input}, Output Tokens: ${response.tokenCounts.output}, Estimated Cost: $${response.cost.toFixed(6)}, Queries per dollar: ${Math.round(1 / response.cost)}`}`} />
              </div>
              <pre className="bg-gray-800 p-4 rounded whitespace-pre-wrap mb-2">{response.response}</pre>
              {!response.error && (
                <div className="text-sm">
                  Model: {response.model}, Input Tokens: {response.tokenCounts.input}, Output Tokens: {response.tokenCounts.output}, Estimated Cost: ${response.cost.toFixed(6)}, Queries per dollar: {Math.round(1 / response.cost)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LLMInteraction;