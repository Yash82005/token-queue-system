
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { Clock3, Monitor, Ticket, Users } from "lucide-react";
import "./App.css";

const API = "https://token-queue-system-8nxr.onrender.com";

type QueueToken = {
  id: number;
  token_number: string;
  status: "waiting" | "serving" | "completed";
  counter_number: number | null;
};

export default function Display() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [error, setError] = useState("");

  const refreshQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/tokens`);
      if (!response.ok) throw new Error("Unable to load queue");

      const data: QueueToken[] = await response.json();
      setTokens(data);
      setError("");
    } catch {
      setError("Unable to connect to the queue server. Retrying automatically.");
    }
  }, []);

  useEffect(() => {
    void refreshQueue();

    const socket = io(API);
    socket.on("queue-updated", () => void refreshQueue());

    // Fallback refresh if a socket event is missed.
    const interval = window.setInterval(() => void refreshQueue(), 10000);

    return () => {
      socket.disconnect();
      window.clearInterval(interval);
    };
  }, [refreshQueue]);

  const serving = tokens.filter((token) => token.status === "serving");
  const waiting = tokens.filter((token) => token.status === "waiting");

  return (
    <main className="public-display">
      <header className="display-header">
        <Link className="brand display-brand" to="/">
          <span className="brand-icon"><Ticket size={23} /></span>
          <span>Queue<span className="brand-accent">Flow</span></span>
        </Link>

        <div className="display-live">
          <span className="live-dot" />
          LIVE QUEUE
        </div>
      </header>

      <section className="display-welcome">
        <div className="display-eyebrow">
          <Monitor size={17} /> CUSTOMER SERVICE
        </div>
        <h1>Please proceed when your token is called.</h1>
        <p>Please keep an eye on the screen for your token and counter number.</p>
      </section>

      {error && <div className="display-error">{error}</div>}

      <section className="display-section">
        <div className="display-section-title">
          <div>
            <span className="section-label">YOUR TURN</span>
            <h2>Now serving</h2>
          </div>
          <span className="display-count">
            <Users size={18} /> {serving.length} active
          </span>
        </div>

        {serving.length === 0 ? (
          <div className="display-empty">
            <Clock3 size={32} />
            <h3>Waiting for the next token</h3>
            <p>Please take a seat. The next token will appear here.</p>
          </div>
        ) : (
          <div className="display-serving-grid">
            {serving.map((token) => (
              <article className="display-serving-card" key={token.id}>
                <span className="display-token-label">TOKEN NUMBER</span>
                <strong className="display-token-number">
                  {token.token_number}
                </strong>
                <div className="display-counter">
                  <Monitor size={20} />
                  <span>PLEASE GO TO</span>
                  <strong>Counter {token.counter_number ?? "—"}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="display-section display-waiting-section">
        <div className="display-section-title">
          <div>
            <span className="section-label">UP NEXT</span>
            <h2>Waiting queue</h2>
          </div>
          <span className="display-count">
            <Ticket size={18} /> {waiting.length} waiting
          </span>
        </div>

        {waiting.length === 0 ? (
          <div className="display-no-waiting">
            No visitors are waiting right now.
          </div>
        ) : (
          <div className="display-waiting-grid">
            {waiting.slice(0, 8).map((token, index) => (
              <article className="display-waiting-card" key={token.id}>
                <span className="display-waiting-position">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{token.token_number}</strong>
                {index === 0 && <span className="display-next-badge">NEXT</span>}
              </article>
            ))}
          </div>
        )}

        {waiting.length > 8 && (
          <p className="display-more">
            And {waiting.length - 8} more visitors waiting
          </p>
        )}
      </section>

      <footer className="display-footer">
        <span><span className="live-dot" /> Queue updates automatically</span>
        <Link to="/counter">Staff access</Link>
      </footer>
    </main>
  );
}

