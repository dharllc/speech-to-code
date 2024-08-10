import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ClipboardIcon, CheckIcon } from 'lucide-react';

const PromptComposer = ({ selectedRepository }) => {
  const [prompt, setPrompt] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTreeAdded, setIsTreeAdded] = useState(false);
  const mediaRecorderRef = useRef(null);

  const captureScreenshot = async () => {
    try {
      const response = await axios.get('http://localhost:8000/screenshot');
      setScreenshot(response.data.screenshot);
      setPrompt(prevPrompt => `${prevPrompt}\n[Screenshot added]\n`);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPrompt(prevPrompt => prevPrompt.replace('\n[Screenshot added]\n', ''));
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

  const addTreeStructure = async () => {
    if (!selectedRepository) {
      alert('Please select a repository first');
      return;
    }
    try {
      const repoName = selectedRepository.split('/').pop();
      const response = await axios.get(`http://localhost:8000/tree?repository=${repoName}`);
      const treeData = JSON.parse(response.data.tree);
      const formattedTree = formatTreeStructure(treeData);
      const treeStructureText = `[Repository Structure]\n${formattedTree}`;
      
      if (!isTreeAdded) {
        setPrompt(prevPrompt => `${prevPrompt}\n${treeStructureText}`);
        setIsTreeAdded(true);
      } else {
        setPrompt(prevPrompt => {
          const parts = prevPrompt.split('[Repository Structure]');
          return `${parts[0]}${treeStructureText}`;
        });
      }
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);

        const audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          setTranscription("Speech transcription placeholder");
          setPrompt(prevPrompt => `${prevPrompt}\n[Voice note added: Speech transcription placeholder]\n`);
        });
      });
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    });
  };

  useEffect(() => {
    setIsTreeAdded(false);
  }, [selectedRepository]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Prompt Composer</h2>
      <p className="mb-2">Selected Repository: {selectedRepository || 'None'}</p>
      <div className="relative">
        <textarea
          className="w-full h-64 p-2 border rounded"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Compose your prompt here..."
        />
        <button
          className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full"
          onClick={copyToClipboard}
        >
          {isCopied ? <CheckIcon size={20} /> : <ClipboardIcon size={20} />}
        </button>
      </div>
      <div className="mt-4 space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={captureScreenshot}
        >
          Capture Screenshot
        </button>
        {screenshot && (
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={removeScreenshot}
          >
            Remove Screenshot
          </button>
        )}
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={addTreeStructure}
        >
          Add Tree Structure
        </button>
        <button
          className={`px-4 py-2 ${isRecording ? 'bg-red-500' : 'bg-purple-500'} text-white rounded`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      {screenshot && (
        <div className="mt-4">
          <img src={`data:image/png;base64,${screenshot}`} alt="Captured screenshot" className="max-w-full h-auto" />
        </div>
      )}
    </div>
  );
};

export default PromptComposer;