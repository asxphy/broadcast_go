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

  const followChannel = ()=>{
    axios.post('/channel/follow',{channel_id:room}).then((response) => {
        console.log(response.data);
    }).catch((err)=>{
        console.log(err)
    })
  }

  return (
    <div>
      <h2>Room Audio SFU</h2>

      <p>
        <b>Room:</b> {room}
      </p>

      <button onClick={toggleMute}>
        {muted ? "Unmute" : "Mute"}
      </button>

      <h3>Remote Audio</h3>
      {/* <div>
        {remoteStreams.map((stream) => (
          <audio
            key={stream.id}
            autoPlay
            controls
            ref={(el) => {
              if (el) el.srcObject = stream;
            }}
          />
        ))}
      </div> */}
      <button onClick={followChannel}>Follow Channel</button>
      {/* <h3>Logs</h3>
      <pre style={{ maxHeight: 300, overflow: "auto" }}>
        {logs.join("\n")}
      </pre> */}
    </div>
  );
};

export default ChannelStream