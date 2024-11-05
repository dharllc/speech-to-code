// ModelParameters.js
import React from 'react';

const ModelParameters = ({ maxTokens, setMaxTokens, temperature, setTemperature }) => (
  <div className="mb-6 flex space-x-4">
    <div className="flex-1">
      <label className="block mb-2 font-semibold text-gray-900 dark:text-white">Max Tokens:</label>
      <input
        type="number"
        value={maxTokens}
        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
        min="1"
        max="8000"
      />
    </div>
    <div className="flex-1">
      <label className="block mb-2 font-semibold text-gray-900 dark:text-white">Temperature:</label>
      <input
        type="number"
        value={temperature}
        onChange={(e) => setTemperature(parseFloat(e.target.value))}
        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
        min="0"
        max="1"
        step="0.1"
      />
    </div>
  </div>
);

export default ModelParameters;