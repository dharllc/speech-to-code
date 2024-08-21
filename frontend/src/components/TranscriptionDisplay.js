// Filename: frontend/src/components/TranscriptionDisplay.js
import React, { useState } from 'react';
import CopyButton from './CopyButton';

const TranscriptionDisplay = ({ transcription, enhancedTranscription, addToPrompt }) => {
  // Separate state variables for raw and enhanced transcription buttons
  const [rawAdded, setRawAdded] = useState(false);
  const [enhancedAdded, setEnhancedAdded] = useState(false);

  const handleAddToPrompt = (text, isEnhanced) => {
    addToPrompt(text);

    // Update the corresponding state variable
    if (isEnhanced) {
      setEnhancedAdded(true);
    } else {
      setRawAdded(true);
    }

    // Reset the state after a short delay (e.g., 2 seconds)
    setTimeout(() => {
      if (isEnhanced) {
        setEnhancedAdded(false);
      } else {
        setRawAdded(false);
      }
    }, 2000);
  };

  const TranscriptionSection = ({ title, text, isEnhanced }) => (
    text && (
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        <div className="flex items-center">
          <p className="flex-grow">{text}</p>
          <CopyButton textToCopy={text} />
          <button
            className={`ml-2 px-2 py-1 text-white rounded text-sm ${
              isEnhanced ? (enhancedAdded ? 'bg-green-500' : 'bg-blue-500') : 
                           (rawAdded ? 'bg-green-500' : 'bg-blue-500')
            }`}
            onClick={() => handleAddToPrompt(text, isEnhanced)}
          >
            {isEnhanced ? (enhancedAdded ? 'Added!' : 'Add to Prompt') : 
                         (rawAdded ? 'Added!' : 'Add to Prompt')}
          </button>
        </div>
      </div>
    )
  );

  return (
    <>
      <TranscriptionSection title="Raw Transcription" text={transcription} isEnhanced={false} />
      <TranscriptionSection title="Enhanced Transcription" text={enhancedTranscription} isEnhanced={true} />
    </>
  );
};

export default TranscriptionDisplay;
// End of file: frontend/src/components/TranscriptionDisplay.js