import React, { useState } from 'react';
import { Check } from 'lucide-react';
import CopyButton from './CopyButton';

const TranscriptionDisplay = ({ 
  transcriptionHistory, 
  addToPrompt,
  isAutoAddEnabled,
  preferEnhanced,
  enhancementDisabled = false,
}) => {
  const [addedToPrompt, setAddedToPrompt] = useState({});

  const handleAddToPrompt = (text, index) => {
    if (!text) return;
    addToPrompt(text);
    setAddedToPrompt(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setAddedToPrompt(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4 relative" style={{ zIndex: 1 }}>
      {transcriptionHistory.map(({ timestamp, raw, enhanced }, index) => {
        const displayIndex = transcriptionHistory.length - index;
        return (
          <div key={timestamp} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm relative">
            {/* Raw Transcription */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Raw Transcription {displayIndex}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimestamp(timestamp)}</p>
                </div>
                <div className="flex items-center gap-2" style={{ zIndex: 0 }}>
                  <CopyButton textToCopy={raw} />
                  {!isAutoAddEnabled && (
                    <button 
                      onClick={() => handleAddToPrompt(raw, `raw-${index}`)} 
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform ${
                        addedToPrompt[`raw-${index}`] ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {addedToPrompt[`raw-${index}`] ? (<><Check className="w-4 h-4" /><span>Added</span></>) : (<span>Add</span>)}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{raw}</div>
            </div>

            {/* Enhanced Transcription */}
            {enhanced && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Enhanced Transcription {displayIndex}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimestamp(timestamp)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton textToCopy={enhanced} />
                    {!isAutoAddEnabled && (
                      <button 
                        onClick={() => handleAddToPrompt(enhanced, `enhanced-${index}`)} 
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform ${
                          addedToPrompt[`enhanced-${index}`] ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {addedToPrompt[`enhanced-${index}`] ? (<><Check className="w-4 h-4" /><span>Added</span></>) : (<span>Add</span>)}
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{enhanced}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TranscriptionDisplay;