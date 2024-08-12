import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const getCompletion = async (promptContent, userInput, model = 'gpt-4o-mini') => {
  try {
    const response = await axios.post(`${API_URL}/llm_completion`, {
      prompt: promptContent,
      user_input: userInput,
      model: model
    });
    
    if (response.data && response.data.completion) {
      return {
        completion: response.data.completion,
        inputTokens: response.data.input_tokens,
        outputTokens: response.data.output_tokens,
        cost: response.data.cost
      };
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Error in LLM completion:', error);
    throw error;
  }
};