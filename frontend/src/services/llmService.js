// src/services/llmService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const getCompletion = async (promptContent, userInput, model = 'gpt-4o-mini') => {
  try {
    const response = await axios.post(`${API_URL}/llm_completion`, {
      prompt: promptContent,
      user_input: userInput,
      model: model
    });
    return response.data.completion;
  } catch (error) {
    console.error('Error in LLM completion:', error);
    throw error;
  }
};