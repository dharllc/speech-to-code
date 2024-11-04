// Filename: frontend/src/components/PromptActions.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees, Trash2, Mic, Square, Copy, Check, ArrowRight } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

const PromptActions = ({ addTreeStructure, clearPrompt, setTranscription, enhanceTranscription, setStatus, prompt, setUserPrompt }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case ',':
            e.preventDefault();
            addTreeStructure();
            break;
          case '.':
            e.preventDefault();
            clearPrompt();
            break;
          case '/':
            e.preventDefault();
            if (isRecording) {
              handleStopRecording();
            } else {
              handleStartRecording();
            }
            break;
          case ';':
            if (!e.target.closest('input, textarea')) {
              e.preventDefault();
              copyToClipboard();
            }
            break;
          case 'enter':
            e.preventDefault();
            if (!isPromptEmpty) handleGoToLLM();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, prompt]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording...');
      timerRef.current = setInterval(() => setCurrentDuration(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setStatus('Error accessing microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    setCurrentDuration(0);
    processRecording();
  };

  const processRecording = async () => {
    setStatus('Transcribing...');
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
    chunksRef.current = [];

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: formData
      });

      const data = await response.json();
      setTranscription(data.text);
      enhanceTranscription(data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setStatus('Error transcribing audio');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGoToLLM = () => {
    if (prompt.trim().length > 0) {
      setUserPrompt(prompt.trim());
      navigate('/llm-interaction');
    }
  };

  const buttonStyle = {
    base: "px-2 py-2 text-white rounded flex items-center justify-center shadow-md transition-all duration-300 hover:shadow-lg flex-1",
    green: "bg-gradient-to-r from-green-400 to-green-600",
    red: "bg-gradient-to-r from-red-400 to-red-600",
    blue: "bg-gradient-to-r from-blue-400 to-blue-600",
    purple: "bg-gradient-to-r from-purple-400 to-purple-600",
    orange: "bg-gradient-to-r from-orange-400 to-orange-600",
    disabled: "bg-gray-400 cursor-not-allowed"
  };

  const isPromptEmpty = prompt.trim().length === 0;

  return (
    <div className="mb-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        <button 
          className={`${buttonStyle.base} ${buttonStyle.green} min-w-0`} 
          onClick={addTreeStructure}
          title="Add Tree Structure (⌘,)"
        >
          <Trees className="mr-2" size={20} />
          <span className="truncate">Tree</span>
        </button>
        <button 
          className={`${buttonStyle.base} ${buttonStyle.red} min-w-0`} 
          onClick={clearPrompt}
          title="Clear Prompt (⌘.)"
        >
          <Trash2 className="mr-2" size={20} />
          <span className="truncate">Clear</span>
        </button>
        <button
          className={`${buttonStyle.base} ${isRecording ? buttonStyle.red : buttonStyle.blue} min-w-0`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          title={`${isRecording ? 'Stop' : 'Start'} Recording (⌘/)`}
        >
          {isRecording ? <Square className="mr-2" size={20} /> : <Mic className="mr-2" size={20} />}
          <span className="truncate">{isRecording ? 'Stop' : 'Record'}</span>
        </button>
        <button 
          className={`${buttonStyle.base} ${buttonStyle.purple} min-w-0`}
          onClick={copyToClipboard}
          title="Copy to Clipboard (⌘;)"
        >
          {copied ? <Check className="mr-2" size={20} /> : <Copy className="mr-2" size={20} />}
          <span className="truncate">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        <button 
          className={`${buttonStyle.base} ${isPromptEmpty ? buttonStyle.disabled : buttonStyle.orange} min-w-0 sm:col-span-2 md:col-span-1`}
          onClick={handleGoToLLM}
          disabled={isPromptEmpty}
          title="Go to LLM (⌘↵)"
        >
          <ArrowRight className="mr-2" size={20} />
          <span className="truncate">Go</span>
        </button>
      </div>
      {isRecording && (
        <div className="mt-2">
          <AudioVisualizer isRecording={isRecording} />
          <div className="text-center">
            {Math.floor(currentDuration / 60)}:{(currentDuration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptActions;

