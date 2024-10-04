import React, { useState, useRef } from "react";

const signalingServerURL = process.env.REACT_APP_SIGNALING_SERVER_URL;
const callMatchingURL = process.env.REACT_APP_CALL_MATCHING_URL;

function ClientB() {
  const [sessionIdB, setSessionIdB] = useState(null);
  const [peerConnectionB, setPeerConnectionB] = useState(null);
  const [wsB, setWsB] = useState(null);
  const videoRefB = useRef(null);

  const connectToWebSocket = () => {
    const ws = new WebSocket(signalingServerURL);

    ws.onopen = () => {
      console.log("WebSocket Client B connected");
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "sessionId") {
        setSessionIdB(message.sessionId);
        console.log("Session ID B: ", message.sessionId);
      }

      if (message.type === "offer") {
        await handleOffer(message.sdp, peerConnectionB, "B", ws);
      } else if (message.type === "answer") {
        await peerConnectionB.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: message.sdp })
        );
      } else if (message.type === "candidate") {
        await peerConnectionB.addIceCandidate(new RTCIceCandidate({ candidate: message.candidate }));
      }
    };

    setWsB(ws);
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
      body: JSON.stringify({ username: "user_b", sessionId: sessionIdB }),
    });
  };

  // Initialize the WebRTC connection
  const startCall = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        wsB.send(JSON.stringify({ type: "candidate", callID: "call_id_generated", candidate: event.candidate.candidate }));
      }
    };

    peerConnection.ontrack = (event) => {
      videoRefB.current.srcObject = event.streams[0];
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
      videoRefB.current.srcObject = stream;
    });

    setPeerConnectionB(peerConnection);
  };

  return (
    <div>
      <video ref={videoRefB} autoPlay playsInline style={{ width: "300px", height: "200px" }} />
      <br />
      <button onClick={connectToWebSocket}>Connect WebSocket (Client B)</button>
      <br />
      <button onClick={joinPool}>Join Call Pool (Client B)</button>
      <br />
      <button onClick={startCall}>Start Call (Client B)</button>
    </div>
  );
}

export default ClientB;
