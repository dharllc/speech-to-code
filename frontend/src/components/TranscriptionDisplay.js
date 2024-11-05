import React, { useState } from 'react';
import { Check, ToggleLeft, ToggleRight } from 'lucide-react';
import CopyButton from './CopyButton';

const TranscriptionDisplay = ({ 
  transcriptionHistory, 
  addToPrompt,
  autoAddEnabled,
  setAutoAddEnabled,
  preferEnhanced,
  setPreferEnhanced
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

  const Toggle = ({ enabled, onToggle, label }) => (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        transition-all duration-300 ease-in-out
        ${enabled 
          ? 'bg-blue-500 hover:bg-blue-600' 
          : 'bg-gray-400 hover:bg-gray-500'
        }
      `}
    >
      {enabled ? (
        <ToggleRight className="w-5 h-5 text-white transition-transform duration-300 transform" />
      ) : (
        <ToggleLeft className="w-5 h-5 text-white transition-transform duration-300 transform" />
      )}
      <span className="text-white text-sm font-medium">{label}</span>
    </button>
  );

  const TranscriptionSection = ({ title, text, index, isEnhanced, timestamp }) => (
    text && (
      <div className={`mb-4 p-4 rounded-lg shadow-lg ${isEnhanced ? 'bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'} transform transition-all duration-300 hover:scale-[1.01]`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimestamp(timestamp)}</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton textToCopy={text} />
            {!autoAddEnabled && (
              <button onClick={() => handleAddToPrompt(text, index)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform ${addedToPrompt[index] ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                {addedToPrompt[index] ? (<><Check className="w-4 h-4" /><span>Added</span></>) : (<span>Add</span>)}
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{text}</p>
      </div>
    )
  );

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Transcription History</h3>
        <div className="flex gap-3">
          <Toggle
            enabled={autoAddEnabled}
            onToggle={() => setAutoAddEnabled(!autoAddEnabled)}
            label="Auto-add"
          />
          {autoAddEnabled && (
            <Toggle
              enabled={preferEnhanced}
              onToggle={() => setPreferEnhanced(!preferEnhanced)}
              label={preferEnhanced ? "Enhanced" : "Raw"}
            />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {transcriptionHistory.map((item, index) => {
          const displayIndex = transcriptionHistory.length - index;
          return (
            <div key={`${item.timestamp}-${index}`}>
              <TranscriptionSection 
                title={`Raw Transcription ${displayIndex}`}
                text={item.raw}
                index={`raw-${index}`}
                isEnhanced={false}
                timestamp={item.timestamp}
              />
              {item.enhanced && (
                <TranscriptionSection 
                  title={`Enhanced Transcription ${displayIndex}`}
                  text={item.enhanced}
                  index={`enhanced-${index}`}
                  isEnhanced={true}
                  timestamp={item.timestamp}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TranscriptionDisplay;