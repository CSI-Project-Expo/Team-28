import { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");

  const checkBackend = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/health");
      setMessage(response.data.message || "Backend is working!");
    } catch (error) {
      setMessage("Backend not connected ❌");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Site Surgeon</h1>
      <button onClick={checkBackend}>Check Backend</button>
      <p>{message}</p>
    </div>
  );
}

export default App;