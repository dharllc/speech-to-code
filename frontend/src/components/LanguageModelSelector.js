// Filename: frontend/src/components/LanguageModelSelector.js
import React, { useState } from 'react';

const formatTokenCount = (count) => {
  if (count >= 1000) {
    return `${Math.round(count / 1000)}k`;
  }
  return count.toString();
};

const formatCost = (cost) => {
  return Number(cost).toFixed(2);
};

const LanguageModelSelector = ({ availableModels, onModelSelect, loading }) => {
  const [clickedModel, setClickedModel] = useState(null);

  const handleModelClick = (model) => {
    setClickedModel(model);
    onModelSelect(model);
  };

  return (
    <div className="mb-6">
      {Object.entries(availableModels).map(([provider, models]) => (
        <div key={provider} className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(models).map(([model, details]) => (
              <button
                key={model}
                type="button"
                onClick={() => handleModelClick(model)}
                className={`p-2 rounded-lg text-white text-xs font-medium 
                bg-gradient-to-r from-blue-600 to-blue-800 
                hover:from-blue-700 hover:to-blue-900 
                transition-all duration-200 flex flex-col items-start
                ${clickedModel === model && loading ? 'ring-2 ring-yellow-400' : ''}
                ${loading && clickedModel !== model ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={loading}
              >
                <span className="font-bold mb-1 text-sm">{model}</span>
                <span className="text-xxs">
                  Input: {formatTokenCount(details.input_tokens)} (${formatCost(details.input)}/1Mt)
                </span>
                <span className="text-xxs">
                  Output: {formatTokenCount(details.output_tokens)} (${formatCost(details.output)}/1Mt)
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LanguageModelSelector;