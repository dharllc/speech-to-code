import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees, Trash2, Mic, Square, Copy, Check, ArrowRight, Files } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { FiCopy, FiTrash2, FiFolder } from 'react-icons/fi';

const PromptActions = ({ addTreeStructure, clearPrompt, clearFiles, setTranscription, enhanceTranscription, setStatus, prompt, setUserPrompt, handleCopyToClipboard }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const keyHandlerBusyRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (keyHandlerBusyRef.current) return;
      if (e.ctrlKey && !e.metaKey) {
        keyHandlerBusyRef.current = true;
        try {
          switch(e.key.toLowerCase()) {
            case 't':
              e.preventDefault();
              await addTreeStructure();
              break;
            case 'z':
              e.preventDefault();
              clearPrompt();
              break;
            case 'r':
              e.preventDefault();
              isRecording ? handleStopRecording() : handleStartRecording();
              break;
            case 'c':
              e.preventDefault();
              if (!e.target.closest('input, textarea')) await copyToClipboard();
              break;
          }
        } finally {
          keyHandlerBusyRef.current = false;
        }
      } else if (e.metaKey && e.key === 'Enter') {
        e.preventDefault();
        prompt.trim() && handleGoToLLM();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, prompt, addTreeStructure, clearPrompt]);

  const handleStartRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Record in 100ms chunks
      setIsRecording(true);
      setStatus('Recording...');
      timerRef.current = setInterval(() => setCurrentDuration(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setStatus('Error accessing microphone');
    }
  };

  const handleStopRecording = () => {
    const duration = currentDuration;
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      setCurrentDuration(0);

      // Change 1.75 to another value to set a minimum audio file length to process a transcription
      if (duration < 1.75) {
        setStatus('Recording must be at least 2 seconds');
        setTimeout(() => setStatus(''), 3000);
        chunksRef.current = [];
        return;
      }

      setTimeout(() => processRecording(), 100); // Give time for final chunks
    }
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) return;
    
    setStatus('Transcribing...');
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Changed to webm
    chunksRef.current = [];
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` },
        body: formData
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTranscription(data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setStatus('Error transcribing audio');
    }
  };

  const copyToClipboard = async () => {
    if (!prompt) {
      setStatus('Nothing to copy');
      return;
    }

    try {
      if (handleCopyToClipboard) {
        await handleCopyToClipboard();
      } else {
        await navigator.clipboard.writeText(prompt);
        setStatus('Copied to clipboard!');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      setStatus('Failed to copy to clipboard');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const handleGoToLLM = () => {
    if (prompt.trim()) {
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

  return (
    <div className="mb-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <button className={`${buttonStyle.base} ${buttonStyle.green} min-w-0`} onClick={addTreeStructure} title="Add Tree Structure (^T)">
          <Trees className="mr-2" size={20} /><span className="truncate">Tree</span>
        </button>
        <button className={`${buttonStyle.base} ${buttonStyle.red} min-w-0`} onClick={clearFiles} title="Clear Files">
          <Files className="mr-2" size={20} /><span className="truncate">Files</span>
        </button>
        <button className={`${buttonStyle.base} ${buttonStyle.red} min-w-0`} onClick={clearPrompt} title="Clear All (^Z)">
          <Trash2 className="mr-2" size={20} /><span className="truncate">All</span>
        </button>
        <button className={`${buttonStyle.base} ${isRecording ? buttonStyle.red : buttonStyle.blue} min-w-0`} onClick={isRecording ? handleStopRecording : handleStartRecording} title={`${isRecording ? 'Stop' : 'Start'} Recording (^R)`}>
          {isRecording ? <Square className="mr-2" size={20} /> : <Mic className="mr-2" size={20} />}<span className="truncate">{isRecording ? 'Stop' : 'Record'}</span>
        </button>
        <button className={`${buttonStyle.base} ${buttonStyle.purple} min-w-0`} onClick={copyToClipboard} title="Copy to Clipboard (^C)">
          {copied ? <Check className="mr-2" size={20} /> : <Copy className="mr-2" size={20} />}<span className="truncate">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        <button className={`${buttonStyle.base} ${!prompt.trim() ? buttonStyle.disabled : buttonStyle.orange} min-w-0 sm:col-span-2 md:col-span-1`} onClick={handleGoToLLM} disabled={!prompt.trim()} title="Go to LLM (⌘↵)">
          <ArrowRight className="mr-2" size={20} /><span className="truncate">Go</span>
        </button>
      </div>
      {isRecording && (
        <div className="mt-2">
          <AudioVisualizer isRecording={isRecording} />
          <div className="text-center">{Math.floor(currentDuration / 60)}:{(currentDuration % 60).toString().padStart(2, '0')}</div>
        </div>
      )}
    </div>
  );
};

export default PromptActions;