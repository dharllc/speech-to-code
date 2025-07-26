import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording) {
      startVisualization();
    } else {
      stopVisualization();
    }

    return () => stopVisualization();
  }, [isRecording]);

  const startVisualization = async (): Promise<void> => {
    if (audioContextRef.current) return; // Don't create a new context if one already exists

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const draw = (): void => {
        if (!analyserRef.current || !dataArrayRef.current || !canvas || !ctx) return;
        
        rafIdRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDarkMode ? 'rgb(20, 20, 20)' : 'rgb(229, 231, 235)'; // Dark mode: dark gray, Light mode: light gray
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bufferLength * 2.5;
        let x = canvas.width;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArrayRef.current?.[i] ?? 0) / 255 * canvas.height;
          ctx.fillStyle = 'rgb(0, 119, 255)';
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x -= barWidth + 1;
          if (x < 0) break;
        }
      };

      draw();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopVisualization = (): void => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        analyserRef.current = null;
      }).catch(err => {
        console.error("Error closing audio context:", err);
      });
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <div className="w-full h-12 bg-gray-200 dark:bg-gray-900 rounded-md overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualizer;