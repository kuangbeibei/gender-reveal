"use client";

import { useState } from "react";

export default function Remote() {
  const [status, setStatus] = useState("ready");

  const trigger = async () => {
    if (status !== "ready") return;
    setStatus("sending");
    try {
      await fetch("/api/reveal-trigger", { method: "POST" });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #1A1740 0%, #2A1F58 50%, #3A2A6E 100%)",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 40, letterSpacing: "0.1em" }}>
        GENDER REVEAL · REMOTE
      </div>

      <button
        onClick={trigger}
        disabled={status !== "ready"}
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: "none",
          cursor: status === "ready" ? "pointer" : "default",
          background: status === "sent"
            ? "radial-gradient(circle, #4CAF50, #2e7d32)"
            : "radial-gradient(circle, #FFD0BC, #F4937D, #D86B5A)",
          boxShadow: status === "ready"
            ? "0 0 60px rgba(255, 160, 120, 0.5), 0 8px 32px rgba(0,0,0,0.4)"
            : "none",
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.05em",
          transition: "all 0.3s ease",
          transform: status === "sending" ? "scale(0.95)" : "scale(1)",
        }}
      >
        {status === "ready" && "🐾 REVEAL"}
        {status === "sending" && "..."}
        {status === "sent" && "✓ SENT"}
        {status === "error" && "✗ ERROR"}
      </button>

      {status === "sent" && (
        <div style={{ color: "rgba(255,255,255,0.6)", marginTop: 32, fontSize: 14 }}>
          Signal sent to the screen
        </div>
      )}
    </div>
  );
}
