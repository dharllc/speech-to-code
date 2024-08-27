// Filename: frontend/src/components/UserPromptInput.js
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Copy, Check } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import axios from 'axios';

const UserPromptInput = ({ value, onChange, tokenCount }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (value) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [value]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setCurrentDuration(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    setCurrentDuration(0);
  };

  const handleStopRecording = async () => {
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
    chunksRef.current = [];

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const transcribedText = response.data.text;
      onChange(prevValue => (prevValue ? prevValue + ' ' : '') + transcribedText);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  const clearInput = () => {
    onChange('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const buttonStyle = {
    base: "px-3 py-2 text-white rounded flex items-center justify-center shadow-md transition-all duration-300 hover:shadow-lg",
    red: "bg-gradient-to-r from-red-400 to-red-600",
    blue: "bg-gradient-to-r from-blue-400 to-blue-600",
    gray: "bg-gradient-to-r from-gray-400 to-gray-600",
    purple: "bg-gradient-to-r from-purple-400 to-purple-600"
  };

  return (
    <div className="mb-4">
      <div className="flex mb-2 space-x-2">
        <button
          className={`${buttonStyle.base} ${isRecording ? buttonStyle.red : buttonStyle.blue}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <Square className="mr-2" size={20} /> : <Mic className="mr-2" size={20} />}
          <span>{isRecording ? 'Stop' : 'Record'}</span>
        </button>
        <button
          className={`${buttonStyle.base} ${buttonStyle.gray}`}
          onClick={clearInput}
        >
          <Trash2 className="mr-2" size={20} />
          <span>Clear</span>
        </button>
        <button 
          className={`${buttonStyle.base} ${buttonStyle.purple}`}
          onClick={copyToClipboard}
        >
          {copied ? <Check className="mr-2" size={20} /> : <Copy className="mr-2" size={20} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      {isRecording && (
        <div className="mb-2">
          <AudioVisualizer isRecording={isRecording} />
          <div className="text-center text-white">
            {Math.floor(currentDuration / 60)}:{(currentDuration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}
      <textarea
        className="w-full h-32 p-2 bg-gray-800 text-white rounded-lg resize-none"
        value={value}
        onChange={handleInputChange}
        placeholder="Enter your prompt here..."
      />
      <div className="text-right mt-1 text-sm text-gray-400">
        Tokens: {tokenCount}
      </div>
    </div>
  );
};

export default UserPromptInput;