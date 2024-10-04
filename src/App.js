import React, { useState } from "react";
import ClientA from "./ClientA";
import ClientB from "./ClientB";

function App() {
  return (
    <div>
      <h1>WebRTC Video Call - Client A and Client B</h1>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div>
          <h2>Client A</h2>
          <ClientA />
        </div>
        <div>
          <h2>Client B</h2>
          <ClientB />
        </div>
      </div>
    </div>
  );
}

export default App;
