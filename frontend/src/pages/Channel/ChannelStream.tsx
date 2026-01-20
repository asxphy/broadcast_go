import React, { useEffect, useRef, useState } from "react";
import axios from "../../api/axios";

type SignalMessage =
  | { event: "offer"; data: string }
  | { event: "answer"; data: string }
  | { event: "candidate"; data: string };

const ChannelStream: React.FC = () => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [room, setRoom] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomID = params.get("room");

    if (!roomID) {
      alert("Please join with ?room=ROOM_NAME");
      throw new Error("Room not provided");
    }

    setRoom(roomID);
  }, []);


  useEffect(() => {
    if (!room) return;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (event.track.kind !== "audio") return;

      log("Received remote audio track");

      const stream = event.streams[0];
      setRemoteStreams((prev) => {
        if (prev.find((s) => s.id === stream.id)) return prev;
        return [...prev, stream];
      });

      stream.onremovetrack = () => {
        setRemoteStreams((prev) =>
          prev.filter((s) => s.id !== stream.id)
        );
      };
    };

    pc.onicecandidate = (evt) => {
      if (!evt.candidate || !wsRef.current) return;

      wsRef.current.send(
        JSON.stringify({
          event: "candidate",
          data: JSON.stringify(evt.candidate),
        })
      );
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStreamRef.current = stream;

        stream.getTracks().forEach((track) => {
          log(`Adding local track: ${track.kind} ${track.id}`);
          pc.addTrack(track, stream);
        });

        log("Microphone access granted");
      })
      .catch((err) => {
        alert("Mic access denied");
        throw err;
      });

    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${
      "localhost:8080" 
    }/ws?room=${room}`;
    console.log(wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => log("WebSocket connected");

    ws.onmessage = async (evt) => {
      const msg: SignalMessage = JSON.parse(evt.data);

      switch (msg.event) {
        case "offer": {
          if (pc.signalingState !== "stable") {
            console.warn(
              "Skipping offer, signalingState =",
              pc.signalingState
            );
            return;
          }

          const offer = JSON.parse(msg.data);
          await pc.setRemoteDescription(offer);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          ws.send(
            JSON.stringify({
              event: "answer",
              data: JSON.stringify(answer),
            })
          );
          break;
        }

        case "candidate": {
          const candidate = JSON.parse(msg.data);
          await pc.addIceCandidate(candidate);
          break;
        }
      }
    };

    ws.onclose = () => log("WebSocket closed");
    ws.onerror = () => log("WebSocket error");

  
    return () => {
      ws.close();
      pc.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const newMuted = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    setMuted(newMuted);

    log(newMuted ? "Muted mic" : "Unmuted mic");
  };


 return (
  <div className="min-h-screen bg-gray-50 px-4 py-8">
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Room Audio SFU
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          <b>Room:</b>{" "}
          <span className="font-mono">{room}</span>
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <button
          onClick={toggleMute}
          className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {muted ? "Unmute Mic" : "Mute Mic"}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Remote Audio
        </h3>

        {remoteStreams.length === 0 ? (
          <p className="text-sm text-gray-500">
            No remote audio streams yet.
          </p>
        ) : (
          <div className="space-y-3">
            {remoteStreams.map((stream, index) => (
              <div
                key={stream.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <span className="text-sm text-gray-700">
                  Speaker {index + 1}
                </span>
                <audio
                  autoPlay
                  controls
                  ref={(el) => {
                    if (el) el.srcObject = stream;
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Logs
        </h3>
        <pre className="max-h-72 overflow-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-700">
          {logs.join("\n")}
        </pre>
      </div>
    </div>
  </div>
);

};

export default ChannelStream 