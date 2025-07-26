import axios, { AxiosError } from 'axios';
import config from '../config/config';
import type { 
  LLMMessage, 
  LLMResponse, 
  AnalyzePromptResponse,
  APIError 
} from '../types/api';
import type { AvailableModels } from '../types/llm';

const API_URL = `http://localhost:${config.backend.port}`;

export const sendLLMRequest = async (
  messages: LLMMessage[], 
  temperature: number, 
  model: string
): Promise<LLMResponse> => {
  try {
    const response = await axios.post<LLMResponse>(`${API_URL}/llm_interaction`, {
      messages,
      temperature,
      model
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error in LLM request:', axiosError);
    throw axiosError;
  }
};

export const getAvailableModels = async (): Promise<AvailableModels> => {
  try {
    const response = await axios.get<AvailableModels>(`${API_URL}/available_models`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error fetching available models:', axiosError);
    throw axiosError;
  }
};

export const analyzePromptForFiles = async (
  repository: string, 
  prompt: string
): Promise<AnalyzePromptResponse> => {
  try {
    const response = await axios.post<AnalyzePromptResponse>(`${API_URL}/analyze-prompt`, {
      repository,
      prompt
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<APIError>;
    console.error('Error analyzing prompt:', axiosError);
    throw axiosError;
  }
};