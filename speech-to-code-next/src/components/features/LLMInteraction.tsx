// Filename: frontend/src/components/LLMInteraction.tsx

import React, { useState, useEffect, useRef } from 'react';
import axios, { AxiosResponse } from 'axios';
import { sendLLMRequest, getAvailableModels } from '../../lib/services/llmService';
import { API_URL } from '../../lib/config/api';
import * as chatSessionService from '../../lib/services/chatSessionService';

// Type imports
import type { 
  LLMInteractionProps, 
  StageData, 
  AvailableModels,
  FileRequest
} from '../../types/llm';
import type { 
  LLMMessage 
} from '../../types/api';
import type { 
  ChatSession, 
  StageHistoryEntry, 
  SystemPrompt,
  ConversationEntry
} from '../../types/chat';

// Child Components
import SystemPromptSelector from './SystemPromptSelector';
import SystemPromptDisplay from './SystemPromptDisplay';
import UserPromptInput from './UserPromptInput';
import LanguageModelSelector from './LanguageModelSelector';
import ConversationDisplay from './ConversationDisplay';
import CostDisplay from './CostDisplay';
import CopyButton from './CopyButton';
import StageDisplay from './StageDisplay';
import StageProgress from './StageProgress';
import ChatSessions from './ChatSessions';

// Icons
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// Import shadcn components (removed unused imports)

interface TokenCountResponse {
  count: number;
}

const LLMInteraction: React.FC<LLMInteractionProps> = ({ initialPrompt }) => {
  // 1) System Prompt-Related State
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  // 2) Model + LLM-Related State
  const [availableModels, setAvailableModels] = useState<AvailableModels>({});
  const [temperature, setTemperature] = useState<number>(0.7);

  // 3) Conversation State
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [userPrompt, setUserPrompt] = useState<string>(initialPrompt || '');
  const [loading, setLoading] = useState<boolean>(false);

  // 4) Token + Cost Tracking
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<{ input: number; output: number }>({ input: 0, output: 0 });
  const [systemPromptTokens, setSystemPromptTokens] = useState<number>(0);
  const [userPromptTokens, setUserPromptTokens] = useState<number>(0);

  // 5) Misc
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [feasibilityScore] = useState<number | null>(null);
  const [questions] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 6) Collapsible UI states
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(true);
  const [showUserPrompt, setShowUserPrompt] = useState<boolean>(true);

  // Add new state for stage data
  const [stageData, setStageData] = useState<StageData | null>(null);

  // Add new state for tracking included files
  const [includedFiles, setIncludedFiles] = useState<Set<string>>(new Set());
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);

  // Add new state for active session
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  // =====================
  //    INITIAL LOAD
  // =====================
  useEffect(() => {
    fetchPrompts();
    fetchAvailableModels();
  }, []);

  // Load active session from URL or localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const sessionId = new URLSearchParams(window.location.search).get('session');
      if (sessionId) {
        try {
          const session = await chatSessionService.getChatSession(sessionId);
          setActiveSession(session);
          setConversationHistory(session.conversation_history || []);
          setStageHistory(session.stage_history || []);
          setIncludedFiles(new Set(session.included_files || []));
        } catch (error) {
          console.error('Failed to load session:', error);
        }
      }
    };
    loadSession();
  }, []);

  // Update URL when active session changes
  useEffect(() => {
    if (activeSession) {
      const url = new URL(window.location.href);
      url.searchParams.set('session', activeSession.id);
      window.history.pushState({}, '', url.toString());
    }
  }, [activeSession?.id]);

  // Save session state after each change
  useEffect(() => {
    const saveSession = async () => {
      if (activeSession) {
        try {
          await chatSessionService.updateChatSession(activeSession.id, {
            ...activeSession,
            conversation_history: conversationHistory,
            stage_history: stageHistory,
            included_files: Array.from(includedFiles)
          });
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      }
    };
    saveSession();
  }, [conversationHistory, stageHistory, includedFiles]);

  const fetchPrompts = async (): Promise<void> => {
    try {
      const response: AxiosResponse<SystemPrompt[]> = await axios.get(`${API_URL}/system_prompts`);
      setPrompts(response.data);
    } catch (error) {
      console.error('Failed to fetch system prompts:', error);
    }
  };

  const fetchAvailableModels = async (): Promise<void> => {
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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

  const countTokens = async (text: string, setTokens: React.Dispatch<React.SetStateAction<number>>): Promise<void> => {
    try {
      const response: AxiosResponse<TokenCountResponse> = await axios.post(`${API_URL}/count_tokens`, {
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
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
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
  const handleSubmit = async (model: string): Promise<void> => {
    setLoading(true);
    setElapsedTime(0);

    try {
      // Create a new chat session if one doesn't exist
      if (!activeSession) {
        // Remove HTML tags and get first three words for the title
        const textWithoutTags = userPrompt.replace(/<[^>]*>/g, '');
        const words = textWithoutTags.trim().split(/\s+/);
        const title = words.slice(0, 3).join(' ') || 'New Chat';
        
        const newSession = await chatSessionService.createChatSession(title);
        setActiveSession(newSession);
      }

      const activePrompt = prompts.find((p) => p.id === activePromptId);
      const currentSystemPrompt = activePrompt?.content || '';

      // Add file context to the system prompt
      let systemPromptWithContext = currentSystemPrompt;
      if (includedFiles.size > 0) {
        systemPromptWithContext += "\n\nContext: The following files have already been provided:\n" + 
          Array.from(includedFiles).map(file => `- ${file}`).join('\n');
      }

      // Only include system message if a prompt is selected
      const messages: LLMMessage[] = [
        ...(activePromptId ? [{ role: 'system' as const, content: systemPromptWithContext }] : []),
        ...conversationHistory.map(entry => ({
          role: entry.role,
          content: entry.content
        })),
        { role: 'user' as const, content: userPrompt }
      ];

      const result = await sendLLMRequest(messages, temperature, model);

      // Look for JSON output snippet in the response
      const jsonOutput = result.response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonOutput && jsonOutput[1]) {
        try {
          const parsedOutput = JSON.parse(jsonOutput[1]);
          
          // Handle stage-specific data
          if (activePromptId === 'stage1-understand-validate') {
            const stageData: StageData = {
              clarityScore: parsedOutput.clarityScore,
              fileRequests: parsedOutput.fileRequests?.filter(
                (req: FileRequest) => !includedFiles.has(req.file)
              ) || [],
              questions: parsedOutput.questions,
              summary: parsedOutput.summary
            };
            setStageData(stageData);
            
            // Update stage history
            setStageHistory(prev => [...prev, {
              stage: 'stage1-understand-validate' as const,
              timestamp: new Date().toISOString(),
              clarityScore: parsedOutput.clarityScore,
              summary: parsedOutput.summary
            }]);

            // Track newly included files
            if (parsedOutput.fileRequests) {
              const newFiles = new Set<string>(parsedOutput.fileRequests.map((req: FileRequest) => req.file));
              setIncludedFiles(prev => {
                const newSet = new Set<string>(prev);
                newFiles.forEach(file => newSet.add(file));
                return newSet;
              });
            }
          } else if (activePromptId === 'stage2-plan-validate') {
            const stageData: StageData = {
              feasibilityScore: parsedOutput.feasibilityScore,
              additionalFileRequests: parsedOutput.additionalFileRequests?.filter(
                (req: FileRequest) => !includedFiles.has(req.file)
              ) || [],
              technicalQuestions: parsedOutput.technicalQuestions,
              implementationPlan: parsedOutput.implementationPlan
            };
            setStageData(stageData);
            
            // Update stage history
            setStageHistory(prev => [...prev, {
              stage: 'stage2-plan-validate' as const,
              timestamp: new Date().toISOString(),
              feasibilityScore: parsedOutput.feasibilityScore,
              implementationPlan: parsedOutput.implementationPlan
            }]);

            // Track newly included files
            if (parsedOutput.additionalFileRequests) {
              const newFiles = new Set<string>(parsedOutput.additionalFileRequests.map((req: FileRequest) => req.file));
              setIncludedFiles(prev => {
                const newSet = new Set<string>(prev);
                newFiles.forEach(file => newSet.add(file));
                return newSet;
              });
            }
          } else if (activePromptId === 'stage3-agent-instructions') {
            const stageData: StageData = {
              instructionQuality: parsedOutput.instructionQuality,
              instructions: parsedOutput.instructions,
              safetyChecks: parsedOutput.safetyChecks,
              refinementSuggestions: parsedOutput.refinementSuggestions
            };
            setStageData(stageData);
            
            // Update stage history
            setStageHistory(prev => [...prev, {
              stage: 'stage3-agent-instructions' as const,
              timestamp: new Date().toISOString(),
              instructionQuality: parsedOutput.instructionQuality,
              instructions: parsedOutput.instructions
            }]);
          } else {
            setStageData(null);
          }
        } catch (parseErr) {
          console.warn('Failed to parse JSON snippet:', parseErr);
          setStageData(null);
        }
      } else {
        setStageData(null);
      }

      // Update conversation with timestamp
      const newMessage: ConversationEntry = {
        role: 'user',
        content: userPrompt,
        timestamp: new Date().toISOString()
      };
      const assistantMessage: ConversationEntry = {
        role: 'assistant',
        content: result.response,
        model: model,
        ...(result.tokenCounts?.output !== undefined && { tokenCount: result.tokenCounts.output }),
        timestamp: new Date().toISOString()
      };
      const newConversationHistory = [...conversationHistory, newMessage, assistantMessage];
      setConversationHistory(newConversationHistory);

      // Update cost & tokens
      if (result.cost !== undefined) {
        setTotalCost((prevCost) => prevCost + result.cost!);
      }
      if (result.tokenCounts) {
        setTotalTokens((prevTokens) => ({
          input: prevTokens.input + result.tokenCounts!.input,
          output: prevTokens.output + result.tokenCounts!.output
        }));
      }

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
          model: model,
          timestamp: new Date().toISOString()
        }
      ]);
    }

    setLoading(false);
  };

  // =====================
  //   FEASIBILITY COLOR
  // =====================
  const getFeasibilityScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500 dark:text-green-400';
    if (score >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  // =====================
  //  PROMPT CHANGE
  // =====================
  const handleUserPromptChange = (newPrompt: string): void => {
    setUserPrompt(newPrompt);
    setHasUnsavedChanges(true);
  };

  // =====================
  // TEMPERATURE SLIDER UTILS
  // =====================
  const getTemperatureColor = (temp: number): string => {
    if (temp <= 1) return '#34D399';   // green
    if (temp <= 1.5) return '#FBBF24'; // yellow
    return '#EF4444';                 // red
  };

  const handleSessionSelect = async (session: ChatSession | null): Promise<void> => {
    if (session) {
      setActiveSession(session);
      setConversationHistory(session.conversation_history || []);
      setStageHistory(session.stage_history || []);
      setIncludedFiles(new Set(session.included_files || []));
    } else {
      setActiveSession(null);
      setConversationHistory([]);
      setStageHistory([]);
      setIncludedFiles(new Set());
    }
  };

  // =====================
  //  RENDER
  // =====================
  const activePrompt = prompts.find((p) => p.id === activePromptId);
  const promptContent = activePrompt?.content || '';

  return (
    <div className="h-full flex flex-col">
      <div className="flex h-full gap-4">
        {/* Chat Sessions Sidebar */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <ChatSessions
            onSessionSelect={handleSessionSelect}
            activeSessionId={activeSession?.id || null}
          />
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col min-w-0 p-4">
          {/* Main heading + inline loading indicator */}
          <div className="flex items-center mb-4">
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
                onSelect={(id: string | number | null) => setActivePromptId(String(id))}
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

              {/* Add StageProgress before the Temperature Slider */}
              {stageHistory.length > 0 && (
                <div className="mb-4">
                  <StageProgress stageHistory={stageHistory} />
                </div>
              )}

              {/* Add StageDisplay after StageProgress */}
              {stageData && activePromptId && (
                <div className="mb-4">
                  <StageDisplay 
                    stageData={stageData as any} 
                    stage={activePromptId as 'stage1-understand-validate' | 'stage2-plan-validate' | 'stage3-agent-instructions'} 
                  />
                </div>
              )}

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
                availableModels={availableModels as any}
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

          {/* Conversation Area */}
          <div className="flex-grow overflow-auto">
            <ConversationDisplay conversationHistory={conversationHistory
              .filter(entry => entry.role !== 'system')
              .map(entry => ({
                role: entry.role as 'user' | 'assistant',
                content: entry.content,
                ...(entry.timestamp && { timestamp: entry.timestamp }),
                ...(entry.model && { model: entry.model }),
                ...(entry.tokenCount !== undefined && { tokens: entry.tokenCount })
              }))} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMInteraction;