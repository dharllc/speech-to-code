// LanguageModelSelector.js
import React from 'react';

const LanguageModelSelector = ({ availableModels, onModelSelect, loading }) => (
  <div className="mb-6">
    {Object.entries(availableModels).map(([provider, models]) => (
      <div key={provider} className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(models).map(([model, details]) => (
            <button
              key={model}
              type="button"
              onClick={() => onModelSelect(model)}
              className="p-2 rounded-lg text-white text-sm font-medium 
              bg-gradient-to-r from-blue-600 to-blue-800 
              hover:from-blue-700 hover:to-blue-900 
              transition-colors duration-200 flex flex-col items-start"
              disabled={loading}
            >
              <span className="font-bold mb-1">{model}</span>
              <span className="text-xs">
                Input: {details.input_tokens.toLocaleString()} tokens (${details.input}/1Mt)
              </span>
              <span className="text-xs">
                Output: {details.output_tokens.toLocaleString()} tokens (${details.output}/1Mt)
              </span>
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default LanguageModelSelector;