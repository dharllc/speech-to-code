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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
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