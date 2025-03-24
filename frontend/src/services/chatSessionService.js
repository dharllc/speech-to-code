import axios from 'axios';
import config from '../config/config.json';

const API_URL = `http://localhost:${config.backend.port}`;

export const listChatSessions = async () => {
  try {
    const response = await axios.get(`${API_URL}/chat-sessions`);
    // Filter out soft-deleted sessions
    return response.data.filter(session => !session.deleted_at);
  } catch (error) {
    console.error('Error listing chat sessions:', error);
    throw error;
  }
};

export const createChatSession = async (title = 'New Chat') => {
  try {
    const response = await axios.post(`${API_URL}/chat-sessions`, null, {
      params: { title }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

export const getChatSession = async (sessionId) => {
  try {
    const response = await axios.get(`${API_URL}/chat-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting chat session:', error);
    throw error;
  }
};

export const updateChatSession = async (sessionId, sessionData) => {
  try {
    const response = await axios.put(`${API_URL}/chat-sessions/${sessionId}`, sessionData);
    return response.data;
  } catch (error) {
    console.error('Error updating chat session:', error);
    throw error;
  }
};

export const deleteChatSession = async (sessionId) => {
  try {
    // Soft delete by setting deleted_at timestamp
    const response = await axios.put(`${API_URL}/chat-sessions/${sessionId}`, {
      deleted_at: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
}; 