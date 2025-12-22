import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Users } from 'lucide-react';

export default function AudioChat() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  

  const startRecording = async (): Promise<void> => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      
      streamRef.current = stream;

      // Check if opus codec is supported
      let mimeType: string = 'audio/webm;codecs=opus';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        console.warn('Opus codec not supported, falling back to default webm codec');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      mediaRecorder.onerror = (err: Event): void => {
        console.error('MediaRecorder error:', err);
        setError('Recording error occurred');
        stopRecording();
      };

      mediaRecorder.start(1000); // Send chunks every 1 second for better compatibility
      setIsRecording(true);
      setError('');
      console.log('Started recording with:', mimeType);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    
    setIsRecording(false);
  };

  const toggleRecording = (): void => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Audio Chat</h1>
          <p className="text-white/70">Real-time voice communication</p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-white font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Users className="w-4 h-4" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Recording Button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={toggleRecording}
            disabled={!isConnected}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-2xl shadow-red-500/50'
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-xl'
            } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            {isRecording ? (
              <MicOff className="w-16 h-16 text-white" />
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}
          </button>

          <div className="text-center">
            <p className="text-white font-semibold text-lg">
              {isRecording ? 'Recording...' : 'Click to speak'}
            </p>
            <p className="text-white/60 text-sm mt-1">
              {isRecording 
                ? 'Others can hear you now' 
                : isConnected 
                  ? 'Click to talk with others'
                  : 'Waiting for connection...'}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold mb-2">How to use:</h3>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• Click the microphone to start recording</li>
            <li>• Your voice will be broadcast to all connected users</li>
            <li>• You'll hear others when they speak</li>
            <li>• Click again to stop broadcasting</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-xs">
            Make sure your Go server is running on localhost:8080
          </p>
        </div>
      </div>
    </div>
  );
}