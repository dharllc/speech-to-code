// File: frontend/src/components/TranscriptionDisplay.js
import React, { useState } from 'react';
import CopyButton from './CopyButton';

const TranscriptionDisplay = ({ transcriptionHistory, addToPrompt }) => {
  const [addedToPrompt, setAddedToPrompt] = useState({});

  const handleAddToPrompt = (text, index) => {
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

  const TranscriptionSection = ({ title, text, index, isEnhanced, timestamp }) => (
    text && (
      <div className={`mb-4 p-2 rounded ${isEnhanced ? 'bg-green-50 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formatTimestamp(timestamp)}</p>
        <div className="flex items-start">
          <p className="flex-grow mr-2">{text}</p>
          <div className="flex-shrink-0 flex flex-col items-end">
            <CopyButton textToCopy={text} />
            <button
              className={`mt-2 px-3 py-1 text-white rounded text-sm whitespace-nowrap ${
                addedToPrompt[index] ? 'bg-green-500' : 'bg-blue-500'
              }`}
              onClick={() => handleAddToPrompt(text, index)}
            >
              {addedToPrompt[index] ? 'Added!' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="mt-4">
      <h3 className="font-bold mb-2">Transcription History</h3>
      {transcriptionHistory.map((item, index) => {
        const transcriptionNumber = Math.floor(transcriptionHistory.length / 2) - Math.floor(index / 2);
        return (
          <div key={index}>
            {index % 2 === 0 && (
              <TranscriptionSection 
                title={`Raw Transcription ${transcriptionNumber}`} 
                text={item.raw} 
                index={`raw-${index}`} 
                isEnhanced={false} 
                timestamp={item.timestamp}
              />
            )}
            {item.enhanced && (
              <TranscriptionSection 
                title={`Enhanced Transcription ${transcriptionNumber}`} 
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
  );
};

export default TranscriptionDisplay;