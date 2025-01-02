import React, { useState } from 'react';

const formatTokenCount = count => count >= 1000 ? `${Math.round(count/1000)}k` : count.toString();
const formatCost = cost => Number(cost).toFixed(2);

const LanguageModelSelector = ({ availableModels, onModelSelect, loading }) => {
  const [clickedModel, setClickedModel] = useState(null);

  const handleModelClick = (model) => {
    setClickedModel(model);
    onModelSelect(model);
  };

  return (
    <div className="space-y-2">
      {Object.entries(availableModels).map(([provider, models]) => (
        <div key={provider}>
          <h3 className="font-semibold text-sm text-gray-400 mb-1">
            {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(models).map(([model, details]) => (
              <button
                key={model}
                onClick={() => handleModelClick(model)}
                disabled={loading && clickedModel !== model}
                className={`
                  text-xs px-2 py-1.5 rounded
                  bg-gray-800 hover:bg-gray-700
                  border border-gray-700
                  flex flex-col items-start
                  ${clickedModel === model && loading ? 'ring-1 ring-yellow-400' : ''}
                  ${loading && clickedModel !== model ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center w-full justify-between">
                  <span className="font-medium truncate">{model}</span>
                  {loading && clickedModel === model && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse"/>
                  )}
                </div>
                <div className="text-[10px] text-gray-400">
                  {formatTokenCount(details.input_tokens)}i/${formatCost(details.input)} • 
                  {formatTokenCount(details.output_tokens)}o/${formatCost(details.output)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LanguageModelSelector;