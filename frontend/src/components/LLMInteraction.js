// Filename: frontend/src/components/LLMInteraction.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { sendLLMRequest, getAvailableModels } from '../services/llmService';
import { API_URL } from '../config/api';

// Child Components
import SystemPromptSelector from './SystemPromptSelector';
import SystemPromptDisplay from './SystemPromptDisplay';
import UserPromptInput from './UserPromptInput';
import LanguageModelSelector from './LanguageModelSelector';
import ConversationDisplay from './ConversationDisplay';
import CostDisplay from './CostDisplay';

// Icons (optional)
import { ChevronDown, ChevronUp } from 'lucide-react';

const LLMInteraction = ({ initialPrompt }) => {
  // 1) System Prompt-Related State
  const [prompts, setPrompts] = useState([]);                  // fetched from /system_prompts
  const [activePromptId, setActivePromptId] = useState(null);  // which prompt is in use?

  // 2) Model + LLM-Related State
  const [availableModels, setAvailableModels] = useState({});
  const [temperature, setTemperature] = useState(0.7);

  // 3) Conversation State
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userPrompt, setUserPrompt] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);

  // 4) Token + Cost Tracking
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });
  const [systemPromptTokens, setSystemPromptTokens] = useState(0);
  const [userPromptTokens, setUserPromptTokens] = useState(0);

  // 5) Misc
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feasibilityScore, setFeasibilityScore] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timerRef = useRef(null);

  // 6) Collapsible UI states
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showUserPrompt, setShowUserPrompt] = useState(false);

  // =====================
  //    INITIAL LOAD
  // =====================
  useEffect(() => {
    fetchPrompts();
    fetchAvailableModels();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API_URL}/system_prompts`);
      setPrompts(response.data);
    } catch (error) {
      console.error('Failed to fetch system prompts:', error);
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

  // =====================
  //   TIME TRACKING
  // =====================
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

  // =====================
  // TOKEN COUNT (System & User)
  // =====================
  useEffect(() => {
    const activePrompt = prompts.find((p) => p.id === activePromptId);
    if (activePrompt?.content) {
      countTokens(activePrompt.content, setSystemPromptTokens);
    } else {
      setSystemPromptTokens(0);
    }
  }, [prompts, activePromptId]);

  useEffect(() => {
    if (userPrompt) {
      countTokens(userPrompt, setUserPromptTokens);
    } else {
      setUserPromptTokens(0);
    }
  }, [userPrompt]);

  const countTokens = async (text, setTokens) => {
    try {
      const response = await axios.post(`${API_URL}/count_tokens`, {
        text,
        model: 'gpt-3.5-turbo'
      });
      setTokens(response.data.count);
    } catch (error) {
      console.error('Error counting tokens:', error);
      setTokens(0);
    }
  };

  // =====================
  // PREVENT UNINTENDED UNLOAD
  // =====================
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // =====================
  //   HANDLE SUBMIT
  // =====================
  const handleSubmit = async (model) => {
    if (!activePromptId) {
      console.warn('No system prompt selected!');
      return;
    }

    setLoading(true);
    setElapsedTime(0);

    try {
      const activePrompt = prompts.find((p) => p.id === activePromptId);
      const currentSystemPrompt = activePrompt?.content || '';

      const messages = [
        { role: 'system', content: currentSystemPrompt },
        ...conversationHistory,
        { role: 'user', content: userPrompt }
      ];

      const result = await sendLLMRequest(messages, temperature, model);

      // Look for JSON output snippet in the response
      const jsonOutput = result.response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonOutput && jsonOutput[1]) {
        try {
          const parsedOutput = JSON.parse(jsonOutput[1]);
          setFeasibilityScore(parsedOutput.feasibilityScore);
          setQuestions(parsedOutput.questions);
        } catch (parseErr) {
          console.warn('Failed to parse JSON snippet:', parseErr);
        }
      }

      // Update conversation
      const newConversationHistory = [
        ...conversationHistory,
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: result.response }
      ];
      setConversationHistory(newConversationHistory);

      // Update cost & tokens
      setTotalCost((prevCost) => prevCost + result.cost);
      setTotalTokens((prevTokens) => ({
        input: prevTokens.input + result.tokenCounts.input,
        output: prevTokens.output + result.tokenCounts.output
      }));

      // Clear user prompt
      setUserPrompt('');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error in LLM request:', error);
      setConversationHistory([
        ...conversationHistory,
        { role: 'assistant', content: 'An error occurred while processing your request.' }
      ]);
    }

    setLoading(false);
  };

  // =====================
  //   FEASIBILITY COLOR
  // =====================
  const getFeasibilityScoreColor = (score) => {
    if (score >= 90) return 'text-green-500 dark:text-green-400';
    if (score >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  // =====================
  //  PROMPT CHANGE
  // =====================
  const handleUserPromptChange = (newPrompt) => {
    setUserPrompt(newPrompt);
    setHasUnsavedChanges(true);
  };

  // =====================
  // TEMPERATURE SLIDER UTILS
  // =====================
  const getTemperatureColor = (temp) => {
    if (temp <= 1) return '#34D399';   // green
    if (temp <= 1.5) return '#FBBF24'; // yellow
    return '#EF4444';                 // red
  };

  // =====================
  //  RENDER
  // =====================
  const activePrompt = prompts.find((p) => p.id === activePromptId);
  const promptContent = activePrompt?.content || '';

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">LLM Interaction</h2>

      {/* Top section: quick summary + model selection */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
        {/* Left column: System Prompt + User Prompt in collapsible sections */}
        <div className="flex-1 space-y-2">
          {/* Cost Display */}
          <CostDisplay totalCost={totalCost} totalTokens={totalTokens} />

          {/* System Prompt Selector (always visible) */}
          <SystemPromptSelector
            prompts={prompts}
            activePromptId={activePromptId}
            onSelect={(id) => setActivePromptId(id)}
          />

          {/* Toggleable System Prompt Display */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-semibold">System Prompt</span>
              {showSystemPrompt ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showSystemPrompt && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800">
                <SystemPromptDisplay
                  content={promptContent}
                  tokenCount={systemPromptTokens}
                />
              </div>
            )}
          </div>

          {/* Toggleable User Prompt Input */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowUserPrompt(!showUserPrompt)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-semibold">User Prompt</span>
              {showUserPrompt ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showUserPrompt && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800">
                <UserPromptInput
                  value={userPrompt}
                  onChange={handleUserPromptChange}
                  tokenCount={userPromptTokens}
                />
              </div>
            )}
          </div>

          {/* Temperature Slider */}
          <div className="mb-2 w-full max-w-sm">
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Temperature: {temperature}
            </label>
            <div className="relative h-8 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full overflow-hidden">
              <input
                type="range"
                id="temperature"
                name="temperature"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => {
                  setTemperature(parseFloat(e.target.value));
                  setHasUnsavedChanges(true);
                }}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-in-out"
                style={{
                  width: `${(temperature / 2) * 100}%`,
                  backgroundColor: getTemperatureColor(temperature),
                  boxShadow: `0 0 10px ${getTemperatureColor(temperature)}`
                }}
              ></div>
            </div>
          </div>

          {/* Feasibility Score & Questions (optional) */}
          {feasibilityScore !== null && (
            <div className="mb-2">
              <h3 className="text-sm font-semibold">Feasibility Score:</h3>
              <p className={`text-md font-bold ${getFeasibilityScoreColor(feasibilityScore)}`}>
                {feasibilityScore}
              </p>
            </div>
          )}
          {questions.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm font-semibold">Questions:</h3>
              <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-200">
                {questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column: Model Selector (so the user can quickly click to run the request) */}
        <div className="md:w-1/3 flex-shrink-0">
          <h3 className="text-lg font-semibold mb-1">Models</h3>
          <LanguageModelSelector
            availableModels={availableModels}
            onModelSelect={handleSubmit}
            loading={loading}
          />

          {/* Optional: If you want, you can display the loading indicator right below the models */}
          {loading && (
  <div className="fixed bottom-4 right-4 bg-blue-900 text-blue-100 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
    <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"/>
    <span className="text-sm font-medium">{elapsedTime.toFixed(1)}s</span>
  </div>
)}
        </div>
      </div>

      {/* Conversation History */}
      <ConversationDisplay conversationHistory={conversationHistory} />
    </div>
  );
};

export default LLMInteraction;