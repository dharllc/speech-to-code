// Filename: frontend/src/components/LLMInteraction.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { sendLLMRequest, getAvailableModels } from '../services/llmService';
import { API_URL } from '../config/api';

import SystemPromptSelector from './SystemPromptSelector';
import SystemPromptDisplay from './SystemPromptDisplay';
import UserPromptInput from './UserPromptInput';
import LanguageModelSelector from './LanguageModelSelector';
import ConversationDisplay from './ConversationDisplay';
import CostDisplay from './CostDisplay';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const LLMInteraction = ({ initialPrompt }) => {
  // 1) System Prompt-Related State
  const [prompts, setPrompts] = useState([]);               // fetched from /system_prompts
  const [activePromptId, setActivePromptId] = useState(null); // which prompt is in use?

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

  // =====================
  //    INITIAL LOAD
  // =====================
  useEffect(() => {
    fetchPrompts();
    fetchAvailableModels();
  }, []);

  // =====================
  //    FETCH PROMPTS
  // =====================
  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API_URL}/system_prompts`);
      // Instead of sorting by step, just store them as-is:
      setPrompts(response.data);
    } catch (error) {
      console.error('Failed to fetch system prompts:', error);
    }
  };

  // =====================
  //    FETCH MODELS
  // =====================
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
  // TOKEN COUNT (System Prompt & User Prompt)
  // =====================
  useEffect(() => {
    // If there is an active prompt, count tokens for it
    const activePrompt = prompts.find((p) => p.id === activePromptId);
    if (activePrompt?.content) {
      countTokens(activePrompt.content, setSystemPromptTokens);
    } else {
      setSystemPromptTokens(0);
    }
  }, [prompts, activePromptId]);

  useEffect(() => {
    // Count tokens for user prompt
    if (userPrompt) {
      countTokens(userPrompt, setUserPromptTokens);
    } else {
      setUserPromptTokens(0);
    }
  }, [userPrompt]);

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
  // UTILITY: Count Tokens
  // =====================
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
  //   TEMPERATURE UI
  // =====================
  const getTemperatureColor = (temp) => {
    if (temp <= 1) return '#34D399';   // green
    if (temp <= 1.5) return '#FBBF24'; // yellow
    return '#EF4444';                 // red
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
  //  RENDER
  // =====================
  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6">LLM Interaction</h2>

      {/* COST DISPLAY */}
      <CostDisplay totalCost={totalCost} totalTokens={totalTokens} />

      {/* 1) System Prompt Selector */}
      <SystemPromptSelector
        prompts={prompts}
        activePromptId={activePromptId}
        onSelect={(id) => setActivePromptId(id)}
      />

      {/* 2) Show the Active System Prompt */}
      {/** pass in the content from whichever prompt is active **/}
      {(() => {
        const activePrompt = prompts.find((p) => p.id === activePromptId);
        const promptContent = activePrompt?.content || '';
        return (
          <SystemPromptDisplay
            content={promptContent}
            tokenCount={systemPromptTokens}
          />
        );
      })()}

      {/* (Optional) Feasibility Score & Questions (if your logic requires) */}
      {feasibilityScore !== null && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Feasibility Score:</h3>
          <p className={`text-2xl font-bold ${getFeasibilityScoreColor(feasibilityScore)}`}>
            {feasibilityScore}
          </p>
        </div>
      )}
      {questions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Questions:</h3>
          <ul className="list-disc pl-5 text-gray-800 dark:text-gray-200">
            {questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3) The User Prompt Input */}
      <UserPromptInput
        value={userPrompt}
        onChange={handleUserPromptChange}
        tokenCount={userPromptTokens}
      />

      {/* 4) Temperature Slider */}
      <div className="mb-4 w-full max-w-sm">
        <label
          htmlFor="temperature"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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

      {/* 5) Model Selector + Send Button(s) */}
      <div className="mb-4">
        <LanguageModelSelector
          availableModels={availableModels}
          onModelSelect={handleSubmit}
          loading={loading}
        />
      </div>

      {/* 6) Loading Indicator (optional) */}
      {loading && (
        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-lg">
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-200">
            Request in progress...
          </p>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-100">
            {elapsedTime.toFixed(1)} seconds
          </p>
        </div>
      )}

      {/* 7) Conversation History */}
      <ConversationDisplay conversationHistory={conversationHistory} />
    </div>
  );
};

export default LLMInteraction;