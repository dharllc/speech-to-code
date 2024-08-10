import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Trees, Trash2, Mic, Square } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer'; // Assume this is imported from your multi-utility-site
import CopyButton from './CopyButton'; // Assume this is imported from your multi-utility-site

console.log("API Key:", process.env.REACT_APP_OPENAI_API_KEY ? "Set" : "Not set");


const PromptComposer = ({ selectedRepository }) => {
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [treeStructure, setTreeStructure] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [enhancedTranscription, setEnhancedTranscription] = useState('');
  const [currentDuration, setCurrentDuration] = useState(0);
  const [status, setStatus] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
      setPrompt('');
      setTokenCount(0);
    }
  }, [selectedRepository]);

  const fetchTreeStructure = async (repo) => {
    try {
      const response = await axios.get(`http://localhost:8000/tree?repository=${repo}`);
      const formattedTree = formatTreeStructure(JSON.parse(response.data.tree));
      setTreeStructure(formattedTree);
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  };

  const formatTreeStructure = (node, depth = 0) => {
    let result = '  '.repeat(depth) + node.name + '\n';
    if (node.children) {
      for (let child of node.children) {
        result += formatTreeStructure(child, depth + 1);
      }
    }
    return result;
  };

  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    updateTokenCount(newPrompt);
  };

  const updateTokenCount = (text) => {
    const tokens = text.trim().split(/\s+/);
    setTokenCount(tokens.length);
  };

  const addTreeStructure = () => {
    if (!prompt.includes('[Repository Structure]')) {
      const updatedPrompt = `${prompt}\n[Repository Structure for ${selectedRepository}]\n${treeStructure}`.trim();
      setPrompt(updatedPrompt);
      updateTokenCount(updatedPrompt);
    }
  };

  const clearPrompt = () => {
    setPrompt('');
    setTokenCount(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording...');
      timerRef.current = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
      }, 1000);
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

      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setTranscription(response.data.text);
      enhanceTranscription(response.data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setStatus('Error transcribing audio');
    }
  };

  const enhanceTranscription = async (text) => {
    setStatus('Enhancing transcription...');
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a precise and efficient text improvement assistant. Your task is to enhance the readability of speech-generated text while preserving all original meaning and intent. Follow these guidelines strictly:1. Remove filler words and unnecessary repetitions.2. Correct grammar and punctuation.3. Maintain the original tone and style of the speaker. Do not add any new information or expand on the original content.5. If the input contains specific data like numbers or lists, preserve them exactly as provided.6. Do not ask questions or seek clarification; work with the given input as is.7. Provide only the improved text in your response, without any explanations or comments.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      setEnhancedTranscription(response.data.choices[0].message.content);
      setStatus('Transcription ready');
    } catch (error) {
      console.error('Error enhancing transcription:', error);
      setStatus('Error enhancing transcription');
    }
  };

  const addTranscriptionToPrompt = (text) => {
    const updatedPrompt = `${prompt}\n${text}`.trim();
    setPrompt(updatedPrompt);
    updateTokenCount(updatedPrompt);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Prompt Composer</h2>
      <div className="mb-2 flex">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center mr-2"
          onClick={addTreeStructure}
        >
          <Trees className="mr-2" />
          Add Tree Structure
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded flex items-center mr-2"
          onClick={clearPrompt}
        >
          <Trash2 className="mr-2" />
          Clear
        </button>
        <button
          className={`px-4 py-2 ${isRecording ? 'bg-red-500' : 'bg-blue-500'} text-white rounded flex items-center`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <Square className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      {isRecording && (
        <div className="mb-2">
          <AudioVisualizer isRecording={isRecording} />
          <div className="text-center">{Math.floor(currentDuration / 60)}:{(currentDuration % 60).toString().padStart(2, '0')}</div>
        </div>
      )}
      <div className="relative mb-4">
        <textarea
          className="w-full h-64 p-2 border rounded"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Compose your prompt here..."
        />
        <div className="absolute bottom-2 right-2 text-sm text-gray-500">
          Tokens: {tokenCount}
        </div>
      </div>
      {status && <div className="mb-2 text-sm text-gray-600">{status}</div>}
      {transcription && (
        <div className="mb-4">
          <h3 className="font-bold">Raw Transcription</h3>
          <div className="flex items-center">
            <p className="flex-grow">{transcription}</p>
            <CopyButton textToCopy={transcription} />
            <button
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
              onClick={() => addTranscriptionToPrompt(transcription)}
            >
              Add to Prompt
            </button>
          </div>
        </div>
      )}
      {enhancedTranscription && (
        <div className="mb-4">
          <h3 className="font-bold">Enhanced Transcription</h3>
          <div className="flex items-center">
            <p className="flex-grow">{enhancedTranscription}</p>
            <CopyButton textToCopy={enhancedTranscription} />
            <button
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
              onClick={() => addTranscriptionToPrompt(enhancedTranscription)}
            >
              Add to Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptComposer;