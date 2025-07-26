import axios, { AxiosError } from 'axios';
import config from '../config/config';
import type { ChatSession } from '../types/chat';
import type { APIError } from '../types/api';

const API_URL = `http://localhost:${config.backend.port}`;

export interface ChatSessionData {
  title?: string;
  conversation_history?: ChatSession['conversation_history'];
  stage_history?: ChatSession['stage_history'];
  included_files?: string[];
  updated_at?: string;
  deleted_at?: string | null;
  metadata?: Record<string, unknown>;
}

export const listChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await axios.get<ChatSession[]>(`${API_URL}/chat-sessions`);
    // Filter out soft-deleted sessions
    return response.data.filter(session => !session.deleted_at);
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error listing chat sessions:', axiosError);
    throw axiosError;
  }
};

export const createChatSession = async (title: string = 'New Chat'): Promise<ChatSession> => {
  try {
    const response = await axios.post<ChatSession>(`${API_URL}/chat-sessions`, null, {
      params: { title }
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error creating chat session:', axiosError);
    throw axiosError;
  }
};

export const getChatSession = async (sessionId: string): Promise<ChatSession> => {
  try {
    const response = await axios.get<ChatSession>(`${API_URL}/chat-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error getting chat session:', axiosError);
    throw axiosError;
  }
};

export const updateChatSession = async (
  sessionId: string, 
  sessionData: ChatSessionData
): Promise<ChatSession> => {
  try {
    const response = await axios.put<ChatSession>(`${API_URL}/chat-sessions/${sessionId}`, sessionData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error updating chat session:', axiosError);
    throw axiosError;
  }
};

export const deleteChatSession = async (sessionId: string): Promise<ChatSession> => {
  try {
    // First get the current session data
    const currentSession = await getChatSession(sessionId);
    
    // Update the session with deleted_at timestamp
    const updatedSession: ChatSessionData = {
      ...currentSession,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await axios.put<ChatSession>(`${API_URL}/chat-sessions/${sessionId}`, updatedSession);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error deleting chat session:', axiosError);
    throw axiosError;
  }
};