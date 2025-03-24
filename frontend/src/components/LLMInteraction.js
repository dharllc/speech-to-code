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
import CopyButton from './CopyButton'; // ← Added import for CopyButton

// Icons (optional)
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const LLMInteraction = ({ initialPrompt }) => {
  // 1) System Prompt-Related State
  const [prompts, setPrompts] = useState([]);
  const [activePromptId, setActivePromptId] = useState(null);

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
  const [showSystemPrompt, setShowSystemPrompt] = useState(true);
  const [showUserPrompt, setShowUserPrompt] = useState(true);

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
    setLoading(true);
    setElapsedTime(0);

    try {
      const activePrompt = prompts.find((p) => p.id === activePromptId);
      const currentSystemPrompt = activePrompt?.content || '';

      // Only include system message if a prompt is selected
      const messages = [
        ...(activePromptId ? [{ role: 'system', content: currentSystemPrompt }] : []),
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
        { 
          role: 'assistant', 
          content: result.response,
          model: model,
          tokenCount: result.tokenCounts.output
        }
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
        {
          role: 'assistant',
          content: 'An error occurred while processing your request.',
          model: model
        }
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
      {/* Main heading + inline loading indicator */}
      <div className="flex items-center mb-2">
        <h2 className="text-xl font-bold">LLM Interaction</h2>
        {loading && (
          <div className="flex items-center ml-4 text-sm text-blue-600 dark:text-blue-300">
            <Loader2 className="mr-1 animate-spin" size={18} />
            <span>Request in progress...</span>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-3">
          {/* 1) Slimmer Cost Display */}
          <CostDisplay totalCost={totalCost} totalTokens={totalTokens} />

          {/* 2) System Prompt Selector */}
          <SystemPromptSelector
            prompts={prompts}
            activePromptId={activePromptId}
            onSelect={(id) => setActivePromptId(id)}
          />

          {/* 3) System Prompt Collapsible */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-semibold">System Prompt</span>
              {showSystemPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showSystemPrompt && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800">
                <SystemPromptDisplay
                  content={promptContent}
                  tokenCount={systemPromptTokens}
                />
              </div>
            )}
          </div>

          {/* 4) User Prompt Collapsible (with Copy All button) */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header row: toggle + copy button */}
            <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => setShowUserPrompt(!showUserPrompt)}
                className="flex items-center space-x-1 focus:outline-none"
              >
                <span className="font-semibold">User Prompt</span>
                {showUserPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {/* "Copy All" button: copies system + user prompts */}
              <CopyButton
                textToCopy={`${promptContent}\n\n${userPrompt}`}
                className="ml-2"
              />
            </div>
            {showUserPrompt && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800">
                <UserPromptInput
                  value={userPrompt}
                  onChange={handleUserPromptChange}
                  tokenCount={userPromptTokens}
                />
              </div>
            )}
          </div>

          {/* 5) Temperature Slider */}
          <div className="mb-1 w-full max-w-sm">
            <label
              htmlFor="temperature"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
            >
              Temperature: {temperature.toFixed(2)}
            </label>
            <div className="relative h-5 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full overflow-hidden">
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
                  boxShadow: `0 0 5px ${getTemperatureColor(temperature)}`
                }}
              ></div>
            </div>
          </div>

          {/* 6) Feasibility & Questions */}
          {feasibilityScore !== null && (
            <div className="text-xs">
              <span className="font-semibold">Feasibility Score:</span>{' '}
              <span className={`font-bold ${getFeasibilityScoreColor(feasibilityScore)}`}>
                {feasibilityScore}
              </span>
            </div>
          )}
          {questions.length > 0 && (
            <div className="text-xs">
              <span className="font-semibold">Questions:</span>
              <ul className="list-disc pl-5 mt-1">
                {questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:w-1/3 flex-shrink-0">
          <h3 className="text-sm font-semibold mb-1">Models</h3>
          <LanguageModelSelector
            availableModels={availableModels}
            onModelSelect={handleSubmit}
            loading={loading}
          />

          {/* Loading details (elapsed time) */}
          {loading && (
            <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-900 rounded-md px-2 py-1 text-blue-700 dark:text-blue-200">
              Elapsed: {elapsedTime.toFixed(1)}s
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