import { useEffect, useRef } from 'react'

function Channel() {
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<ArrayBuffer[]>([]);

  useEffect(() => {
    if (!audioRef.current) return;

    const ws = new WebSocket('ws://localhost:8080/ws');
    wsRef.current = ws;
    wsRef.current.binaryType = "arraybuffer";

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    audioRef.current.src = URL.createObjectURL(mediaSource);
    audioRef.current.autoplay = true;

    mediaSource.addEventListener('sourceopen', () => {
      console.log('MediaSource opened');
      try {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener('updateend', () => {
          if (queueRef.current.length > 0 && !sourceBuffer.updating) {
            const nextBuffer = queueRef.current.shift();
            if (nextBuffer) {
              sourceBuffer.appendBuffer(nextBuffer);
            }
          }
        });
      } catch (e) {
        console.error('Error adding source buffer:', e);
      }
    });

    ws.onopen = (): void => {
      console.log('Connected to server');
    };

    ws.onclose = (): void => {
      console.log('Disconnected from server');
    };

    ws.onerror = (err: Event): void => {
      console.error('WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      console.log("received data from server")
      const data = event.data as ArrayBuffer;
      
      if (sourceBufferRef.current && mediaSourceRef.current?.readyState === 'open') {
        try {
          if (sourceBufferRef.current.updating) {
            queueRef.current.push(data);
          } else {
            sourceBufferRef.current.appendBuffer(data);
          }
        } catch (e) {
          console.error('Error appending buffer:', e);
        }
      }
    };

    return () => {
      ws.close();
    wsRef.current = null;
    };
  }, []);

  function sendData() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus"
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer();
          wsRef.current.send(buffer);
        }
      };

      mediaRecorder.start(100);
    });
  }

  return (
    <div className="p-8">
      <button 
        onClick={sendData}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Send Audio
      </button>
      <audio ref={audioRef} controls className="mt-4 w-full"></audio>
    </div>
  );
}

export default Channel