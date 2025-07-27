import React, { useState } from 'react';
import { Check } from 'lucide-react';
import CopyButton from './CopyButton';

interface TranscriptionItem {
  raw: string;
  enhanced?: string;
  timestamp: string;
}

interface TranscriptionDisplayProps {
  transcriptionHistory: TranscriptionItem[];
  addToPrompt: (text: string) => void;
  autoAddEnabled: boolean;
  enhancementDisabled?: boolean;
}

interface AddedToPromptState {
  [key: string]: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  transcriptionHistory, 
  addToPrompt,
  autoAddEnabled,
  enhancementDisabled = false,
}) => {
  const [addedToPrompt, setAddedToPrompt] = useState<AddedToPromptState>({});

  const handleAddToPrompt = (text: string, index: string): void => {
    if (!text) return;
    addToPrompt(text);
    setAddedToPrompt(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setAddedToPrompt(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  interface TranscriptionSectionProps {
    title: string;
    text: string;
    index: string;
    isEnhanced: boolean;
    timestamp: string;
  }

  const TranscriptionSection: React.FC<TranscriptionSectionProps> = ({ title, text, index, isEnhanced, timestamp }) => (
    text ? (
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
        <div className="relative">
          <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap py-1">{text}</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-800/50 dark:to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Transcription History</h3>
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
              {!enhancementDisabled && item.enhanced && (
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