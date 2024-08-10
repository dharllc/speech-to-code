import React from 'react';
import CopyButton from './CopyButton';

const TranscriptionDisplay = ({ transcription, enhancedTranscription, addToPrompt }) => {
  const TranscriptionSection = ({ title, text }) => (
    text && (
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        <div className="flex items-center">
          <p className="flex-grow">{text}</p>
          <CopyButton textToCopy={text} />
          <button
            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
            onClick={() => addToPrompt(text)}
          >
            Add to Prompt
          </button>
        </div>
      </div>
    )
  );

  return (
    <>
      <TranscriptionSection title="Raw Transcription" text={transcription} />
      <TranscriptionSection title="Enhanced Transcription" text={enhancedTranscription} />
    </>
  );
};

export default TranscriptionDisplay;