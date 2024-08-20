import React, { useState, useEffect, useRef } from 'react';
import { sendLLMRequest, getAvailableModels } from '../services/llmService';
import CopyButton from './CopyButton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

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
  const conversationRef = useRef(null);

  useEffect(() => {
    fetchSteps();
    fetchAvailableModels();
  }, []);

  useEffect(() => {
    // Only scroll to bottom on initial message
    if (conversationRef.current && conversationHistory.length === 1) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversationHistory]);

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

  const renderCodeBlock = (code, language) => (
    <div className="relative my-2 rounded-md overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton
          textToCopy={code}
          className="bg-gray-700 text-white p-1 rounded text-xs hover:bg-gray-600 transition-colors duration-200"
        />
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        className="p-4 pt-8 text-sm rounded-md"
        customStyle={{
          margin: 0,
          background: '#1E1E1E',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );

  const renderMessage = (message) => {
    const codeBlockRegex = /(\w+)?\n([\s\S]+?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(message.content.slice(lastIndex, match.index));
      }
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      parts.push(renderCodeBlock(code, language));
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < message.content.length) {
      parts.push(message.content.slice(lastIndex));
    }
    return parts.map((part, index) =>
      typeof part === 'string' ? <p key={index} className="my-1">{part}</p> : part
    );
  };

  const renderConversation = () => {
    return conversationHistory.map((message, index) => (
      <div
        key={index}
        className={`mb-4 p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-800' : 'bg-green-800'}`}
      >
        <strong className="text-sm font-semibold">
          {message.role === 'user' ? 'User:' : 'Assistant:'}
        </strong>
        <div className="text-sm mt-2">{renderMessage(message)}</div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6">LLM Interaction - Step {currentStepIndex + 1}</h2>
      <div className="mb-6 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Total Cost: ${totalCost.toFixed(6)}</h3>
      </div>
      <div className="mb-6">
        <label className="block mb-2 font-semibold">System Prompt:</label>
        <textarea
          value={steps[currentStepIndex]?.content || ''}
          className="w-full p-3 border rounded-lg bg-gray-800 text-white text-sm resize-none"
          rows="4"
          readOnly
        ></textarea>
      </div>
      <div className="mb-6">
        <label className="block mb-2 font-semibold">User Prompt:</label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="w-full p-3 border rounded-lg bg-gray-800 text-white text-sm resize-none"
          rows="4"
          required
        ></textarea>
      </div>
      <div className="mb-6 flex space-x-4">
        <div className="flex-1">
          <label className="block mb-2 font-semibold">Max Tokens:</label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="w-full p-3 border rounded-lg bg-gray-800 text-white"
            min="1"
            max="8000"
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2 font-semibold">Temperature:</label>
          <input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full p-3 border rounded-lg bg-gray-800 text-white"
            min="0"
            max="1"
            step="0.1"
          />
        </div>
      </div>
      <div className="mb-6">
        {Object.entries(availableModels).map(([provider, models]) => (
          <div key={provider} className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {models.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => handleSubmit(model)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `${model}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="text-2xl font-bold mb-4">Conversation:</h3>
        <div
          ref={conversationRef}
          className="bg-gray-800 p-6 rounded-lg h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          {renderConversation()}
        </div>
      </div>
    </div>
  );
};

export default LLMInteraction;