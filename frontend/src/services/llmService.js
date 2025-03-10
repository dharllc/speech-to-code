import axios from 'axios';
import config from '../config/config.json';

const API_URL = `http://localhost:${config.backend.port}`;

export const sendLLMRequest = async (messages, temperature, model) => {
  try {
    const response = await axios.post(`${API_URL}/llm_interaction`, {
      messages,
      temperature,
      model
    });
    return response.data;
  } catch (error) {
    console.error('Error in LLM request:', error);
    throw error;
  }
};

export const getAvailableModels = async () => {
  try {
    const response = await axios.get(`${API_URL}/available_models`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
};

export const analyzePromptForFiles = async (repository, prompt) => {
  try {
    const response = await axios.post(`${API_URL}/analyze-prompt`, {
      repository,
      prompt
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    throw error;
  }
};