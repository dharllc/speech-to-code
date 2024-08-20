import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const sendLLMRequest = async (messages, maxTokens, temperature, model) => {
  try {
    const response = await axios.post(`${API_URL}/llm_interaction`, {
      messages,
      max_tokens: maxTokens,
      temperature: temperature,
      model: model
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