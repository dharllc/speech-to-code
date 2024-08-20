// Filename: PromptActions.js
import React, { useState, useRef } from 'react';
import { Trees, Trash2, Mic, Square, Copy, Check } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

const PromptActions = ({ addTreeStructure, clearPrompt, setTranscription, enhanceTranscription, setStatus, prompt }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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
      setStatus('Recording...');
      timerRef.current = setInterval(() => setCurrentDuration(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setStatus('Error accessing microphone');
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

  const buttonStyle = {
    base: "px-4 py-2 text-white rounded flex items-center justify-center shadow-md transition-all duration-300 hover:shadow-lg",
    green: "bg-gradient-to-r from-green-400 to-green-600",
    red: "bg-gradient-to-r from-red-400 to-red-600",
    blue: "bg-gradient-to-r from-blue-400 to-blue-600",
    purple: "bg-gradient-to-r from-purple-400 to-purple-600"
  };

  return (
    <div className="mb-2">
      <div className="flex mb-2 space-x-2">
        <button className={`${buttonStyle.base} ${buttonStyle.green}`} onClick={addTreeStructure}>
          <Trees className="mr-2" size={20} />
          <span>Add Tree</span>
        </button>
        <button className={`${buttonStyle.base} ${buttonStyle.red}`} onClick={clearPrompt}>
          <Trash2 className="mr-2" size={20} />
          <span>Clear</span>
        </button>
        <button
          className={`${buttonStyle.base} ${isRecording ? buttonStyle.red : buttonStyle.blue}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <Square className="mr-2" size={20} /> : <Mic className="mr-2" size={20} />}
          <span>{isRecording ? 'Stop' : 'Record'}</span>
        </button>
        <button 
          className={`${buttonStyle.base} ${buttonStyle.purple}`}
          onClick={copyToClipboard}
        >
          {copied ? <Check className="mr-2" size={20} /> : <Copy className="mr-2" size={20} />}
          <span>Copy</span>
        </button>
      </div>
      {isRecording && (
        <div className="mb-2">
          <AudioVisualizer isRecording={isRecording} />
          <div className="text-center">{Math.floor(currentDuration / 60)}:{(currentDuration % 60).toString().padStart(2, '0')}</div>
        </div>
      )}
    </div>
  );
};

export default PromptActions;
// End of file: PromptActions.js