const API_URL = 'http://localhost:8000';

export const getPrompts = async () => {
  const response = await fetch(`${API_URL}/prompts`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
};

export const createPrompt = async (category, content) => {
  const response = await fetch(`${API_URL}/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category, content }),
  });
  if (!response.ok) {
    throw new Error('Failed to create prompt');
  }
  return response.json();
};

export const updatePrompt = async (category, promptId, content) => {
  const response = await fetch(`${API_URL}/prompts/${category}/${promptId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category, content }),
  });
  if (!response.ok) {
    throw new Error('Failed to update prompt');
  }
  return response.json();
};

export const deletePrompt = async (category, promptId) => {
  const response = await fetch(`${API_URL}/prompts/${category}/${promptId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete prompt');
  }
  return response.json();
};

export const setDefaultPrompt = async (category, promptId) => {
  const response = await fetch(`${API_URL}/prompts/${category}/${promptId}/set_default`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to set default prompt');
  }
  return response.json();
};