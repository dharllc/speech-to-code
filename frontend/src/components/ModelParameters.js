import React from 'react';

const ModelParameters = ({ maxTokens, setMaxTokens, temperature, setTemperature }) => (
  <div className="mb-6 flex space-x-4">
    <div className="flex-1">
      <label className="block mb-2 font-semibold">Max Tokens:</label>
      <input
        type="number"
        value={maxTokens}
        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
        className="w-full p-3 border rounded-lg bg-gray-800 text-white"
        min="1"
        max="8000"
      />
    </div>
    <div className="flex-1">
      <label className="block mb-2 font-semibold">Temperature:</label>
      <input
        type="number"
        value={temperature}
        onChange={(e) => setTemperature(parseFloat(e.target.value))}
        className="w-full p-3 border rounded-lg bg-gray-800 text-white"
        min="0"
        max="1"
        step="0.1"
      />
    </div>
  </div>
);

export default ModelParameters;