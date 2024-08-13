import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const getTree = async (repository) => {
  try {
    const response = await axios.get(`${API_URL}/tree?repository=${repository}`);
    return JSON.parse(response.data.tree);
  } catch (error) {
    console.error('Error fetching repository tree:', error);
    throw error;
  }
};

export const getFileContent = async (repository, path) => {
  try {
    const response = await axios.get(`${API_URL}/file_content`, {
      params: { repository, path }
    });
    return response.data.content;
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
};