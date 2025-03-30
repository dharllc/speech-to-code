// Filename: frontend/src/components/LanguageModelSelector.js
import React, { useState } from 'react';

const formatTokenCount = (count) => 
  count >= 1000 ? `${Math.round(count / 1000)}k` : count.toString();

const formatCost = (cost) => Number(cost).toFixed(2);

const LanguageModelSelector = ({ availableModels, onModelSelect, loading }) => {
  const [clickedModel, setClickedModel] = useState(null);

  const handleModelClick = (model) => {
    setClickedModel(model);
    onModelSelect(model);
  };

  return (
    <div className="space-y-3">
      {Object.entries(availableModels).map(([provider, models]) => {
        const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
        return (
          <div 
            key={provider} 
            className="bg-gray-800/50 border border-gray-700 rounded-md p-3"
          >
            {/* Provider heading */}
            <h3 className="font-semibold text-xs text-gray-300 uppercase tracking-wide mb-2">
              {providerName}
            </h3>

            {/* Model buttons grid */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(models).map(([model, details]) => {
                const isClickedLoading = loading && clickedModel === model;
                const isDisabled = loading && clickedModel !== model;

                return (
                  <button
                    key={model}
                    onClick={() => handleModelClick(model)}
                    disabled={isDisabled}
                    className={`
                      relative text-left text-xs px-2 py-2 rounded-md 
                      bg-gradient-to-br from-gray-700 to-gray-800
                      hover:from-gray-600 hover:to-gray-700
                      border border-gray-600 
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        isClickedLoading 
                          ? 'ring-1 ring-yellow-400' 
                          : 'shadow-sm hover:shadow-md'
                      }
                      ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                      min-w-0 w-full
                    `}
                  >
                    {/* Top row: model name + loading pulse if selected */}
                    <div className="flex items-center w-full justify-between mb-1 gap-1">
                      <span className="font-medium text-gray-100 truncate max-w-[85%]">
                        {model}
                      </span>
                      {isClickedLoading && (
                        <span className="ml-auto flex-shrink-0 h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Bottom row: token/cost details */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 leading-tight gap-1">
                      <div className="truncate">
                        {formatTokenCount(details.input_tokens)}i / ${formatCost(details.input)}
                      </div>
                      <span className="mx-0.5 text-gray-500 flex-shrink-0">•</span>
                      <div className="truncate">
                        {formatTokenCount(details.output_tokens)}o / ${formatCost(details.output)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LanguageModelSelector;