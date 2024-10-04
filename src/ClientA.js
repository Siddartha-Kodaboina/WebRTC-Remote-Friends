import React, { useState, useRef } from "react";

const signalingServerURL = process.env.REACT_APP_SIGNALING_SERVER_URL;
const callMatchingURL = process.env.REACT_APP_CALL_MATCHING_URL;

function ClientA() {
  const [sessionIdA, setSessionIdA] = useState(null);
  const [peerConnectionA, setPeerConnectionA] = useState(null);
  const [wsA, setWsA] = useState(null);
  const videoRefA = useRef(null);

  // Create WebSocket connection for Client A
  const connectToWebSocket = () => {
    console.log("Connecting to WebSocket", signalingServerURL);
    const ws = new WebSocket(signalingServerURL);

    ws.onopen = () => {
      console.log("WebSocket Client A connected");
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "sessionId") {
        setSessionIdA(message.sessionId);
        console.log("Session ID A: ", message.sessionId);
      }

      if (message.type === "offer") {
        await handleOffer(message.sdp, peerConnectionA, "A", ws);
      } else if (message.type === "answer") {
        await peerConnectionA.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: message.sdp })
        );
      } else if (message.type === "candidate") {
        await peerConnectionA.addIceCandidate(new RTCIceCandidate({ candidate: message.candidate }));
      }
    };

    setWsA(ws);
  };

  const handleOffer = async (sdp, peerConnection, client, ws) => {
    const desc = new RTCSessionDescription({ type: "offer", sdp: sdp });
    await peerConnection.setRemoteDescription(desc);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    ws.send(JSON.stringify({ type: "answer", callID: "call_id_generated", sdp: answer.sdp }));
  };

  // Join the call pool
  const joinPool = async () => {
    await fetch(callMatchingURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user_a", sessionId: sessionIdA }),
    });
  };

  // Initialize the WebRTC connection
  const startCall = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        wsA.send(JSON.stringify({ type: "candidate", callID: "call_id_generated", candidate: event.candidate.candidate }));
      }
    };

    peerConnection.ontrack = (event) => {
      videoRefA.current.srcObject = event.streams[0];
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
      videoRefA.current.srcObject = stream;
    });

    setPeerConnectionA(peerConnection);
  };

  return (
    <div>
      <video ref={videoRefA} autoPlay playsInline style={{ width: "300px", height: "200px" }} />
      <br />
      <button onClick={connectToWebSocket}>Connect WebSocket (Client A)</button>
      <br />
      <button onClick={joinPool}>Join Call Pool (Client A)</button>
      <br />
      <button onClick={startCall}>Start Call (Client A)</button>
    </div>
  );
}

export default ClientA;
