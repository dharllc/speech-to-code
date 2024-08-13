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

export const getIntentUnderstanding = async (prompt, userInput, repository) => {
  try {
    const response = await axios.post(`${API_URL}/intent_understanding`, {
      prompt,
      user_input: userInput,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error in intent understanding:', error);
    throw error;
  }
};

export const getCodePlanning = async (prompt, intentData, repository) => {
  try {
    console.log('Sending code planning request with:', { prompt, intentData, repository });
    const response = await axios.post(`${API_URL}/code_planning`, {
      prompt,
      intent_data: intentData,
      repository
    });
    console.log('Code planning response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in code planning:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getCodeGeneration = async (prompt, planningData, repository) => {
  try {
    const response = await axios.post(`${API_URL}/code_generation`, {
      prompt,
      planning_data: planningData,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error in code generation:', error);
    throw error;
  }
};

export const getQualityAssessment = async (prompt, generatedCode, repository) => {
  try {
    const response = await axios.post(`${API_URL}/quality_assessment`, {
      prompt,
      generated_code: generatedCode,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error in quality assessment:', error);
    throw error;
  }
};

export const performFileModification = async (modificationPlan, repository) => {
  try {
    const response = await axios.post(`${API_URL}/file_modification`, {
      modification_plan: modificationPlan,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error in file modification:', error);
    throw error;
  }
};

export const manageEnvironment = async (modificationResults, repository) => {
  try {
    const response = await axios.post(`${API_URL}/environment_management`, {
      modification_results: modificationResults,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error in environment management:', error);
    throw error;
  }
};

export const performLightVerification = async (environmentResults, repository) => {
  try {
    const response = await axios.post(`${API_URL}/light_verification`, {
      environment_results: environmentResults,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error in light verification:', error);
    throw error;
  }
};