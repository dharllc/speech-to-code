// Filename: frontend/src/components/LanguageModelSelector.js
import React from 'react';

const LanguageModelSelector = ({ availableModels, onModelSelect, loading }) => (
  <div className="mb-6">
    {Object.entries(availableModels).map(([provider, models]) => (
      <div key={provider} className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </h3>
        <div className="flex flex-wrap gap-2">
          {models.map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => onModelSelect(model)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium 
              bg-gradient-to-r from-blue-600 to-blue-800 
              hover:from-blue-700 hover:to-blue-900 
              transition-colors duration-200"
              disabled={loading}
            >
              {loading ? 'Processing...' : `${model}`}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default LanguageModelSelector;
// End of file: frontend/src/components/LanguageModelSelector.js