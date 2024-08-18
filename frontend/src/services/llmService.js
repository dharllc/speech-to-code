import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const sendLLMRequest = async (systemPrompt, userPrompt, maxTokens, temperature, model) => {
  try {
    const response = await axios.post(`${API_URL}/llm_interaction`, {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
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