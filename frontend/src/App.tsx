
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Hash,
  LoaderCircle,
  Monitor,
  RefreshCw,
  Ticket,
  Users,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5000";

type ServiceType = "Deposits" | "Loans" | "Enquiry";

type QueueToken = {
  id: number;
  token_number: string;
  status: "waiting" | "serving" | "completed" | "skipped";
  counter_number: number | null;
  created_at: string;
  called_at?: string | null;
  completed_at?: string | null;
  service_type: ServiceType;
};

function App() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [myToken, setMyToken] = useState<QueueToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] =
  useState<ServiceType>("Enquiry");

  const refreshQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/tokens`);
      if (!response.ok) throw new Error("Could not load the queue");

      const data: QueueToken[] = await response.json();
      setTokens(data);
      setError("");

      // Refresh this visitor's token status as well.
      setMyToken((current) =>
        current
          ? data.find((token) => token.id === current.id) ?? current
          : null
      );
    } catch {
      setError("Cannot connect to the server. Check that your backend is running.");
    }
  }, []);

  useEffect(() => {
    void refreshQueue();

    const socket = io(API);

    socket.on("queue-updated", () => {
      void refreshQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshQueue]);

  async function generateToken() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
    service_type: selectedService,
      }),
    });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate token");
      }

      setMyToken(data.token);
      await refreshQueue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  const waitingTokens = tokens.filter(
    (token) => token.status === "waiting"
  );

  const servingTokens = tokens.filter(
    (token) => token.status === "serving"
  );

  const myServiceWaitingTokens = tokens.filter(
  (token) =>
    token.status === "waiting" &&
    token.service_type === myToken?.service_type
);

const myPosition =
  myToken?.status === "waiting"
    ? myServiceWaitingTokens.findIndex(
        (token) => token.id === myToken.id
      ) + 1
    : 0;

const completedDurations = tokens
  .filter(
    (token) =>
      token.status === "completed" &&
      token.service_type === myToken?.service_type &&
      token.called_at &&
      token.completed_at
  )
  .map(
    (token) =>
      (new Date(token.completed_at!).getTime() -
        new Date(token.called_at!).getTime()) /
      60000
  )
  .filter((duration) => duration > 0);

const averageServiceMinutes =
  completedDurations.length > 0
    ? completedDurations.reduce((total, duration) => total + duration, 0) /
      completedDurations.length
    : 5;

const estimatedWaitMinutes =
  myToken?.status === "waiting"
    ? Math.max(0, myPosition - 1) * averageServiceMinutes
    : 0;

  const statusLabel = (status: QueueToken["status"]) => {
    if (status === "serving") return "Now serving";
    if (status === "completed") return "Completed";
    return "Waiting";
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon"><Ticket size={23} /></span>
          <span>Queue<span className="brand-accent">Flow</span></span>
        </a>

        <div className="header-status">
          <span className="live-dot" />
          Live queue
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            SMART QUEUE MANAGEMENT
          </div>

          <h1>
            Your time matters.
            <br />
            <span>Skip the waiting room.</span>
          </h1>

          <p className="hero-description">
            Get your token in seconds, track your position, and know
            exactly when it’s your turn.
          </p>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => void refreshQueue()}>Retry</button>
          </div>
        )}

        <section className="dashboard-grid">
          <div className="panel token-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">YOUR VISIT</span>
                <h2>Get a token</h2>
              </div>
              <span className="heading-icon"><Hash size={22} /></span>
            </div>

            {!myToken ? (
              <div className="token-empty">
                <div className="ticket-illustration">
                  <Ticket size={36} strokeWidth={1.5} />
                </div>
                <h3>Ready when you are</h3>
                <p>Generate your token and join the queue.</p>
                <label htmlFor="service-type" className="section-label">
  
                SELECT YOUR SERVICE
                </label>

                <select
                  id="service-type"
                  value={selectedService}
                  onChange={(event) =>
                    setSelectedService(event.target.value as ServiceType)
                  }
                  disabled={loading}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    margin: "12px 0 20px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: "#111827",
                  }}
                >
                  <option value="Deposits">Deposits</option>
                  <option value="Loans">Loans</option>
                  <option value="Enquiry">Enquiry</option>
               </select>

                <button
                  className="primary-button"
                  onClick={() => void generateToken()}
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle className="spin" size={19} />
                  ) : (
                    <Ticket size={19} />
                  )}
                  {loading ? "Generating..." : "Generate my token"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </div>
            ) : (
              <div className="token-result">
                <span className="token-caption">YOUR TOKEN NUMBER</span>
                <div className="token-number">{myToken.token_number}</div>

                <span className={`status-pill status-${myToken.status}`}>
                  <span className="status-dot" />
                  {statusLabel(myToken.status)}
                </span>

                <div className="token-details">
                  {myToken.status === "waiting" ? (
                    <>
                      <div className="detail-icon"><Users size={19} /></div>
                      <div>
                        <strong>
                          {myPosition === 1
                            ? "You're next!"
                            : `${myPosition} in line`}
                        </strong>
                        <p>People ahead of you: {Math.max(0, myPosition - 1)}</p>
                        <p>
                          Estimated wait:{" "}
                          {estimatedWaitMinutes < 1
                            ? "Less than 1 minute"
                            : `About ${Math.ceil(estimatedWaitMinutes)} minutes`}
                        </p> 
                      </div>
                    </>
                  ) : myToken.status === "serving" ? (
                    <>
                      <div className="detail-icon"><Monitor size={19} /></div>
                      <div>
                        <strong>Proceed to your counter</strong>
                        <p>Counter {myToken.counter_number}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="detail-icon"><CheckCircle2 size={19} /></div>
                      <div>
                        <strong>Visit completed</strong>
                        <p>Thank you for visiting us.</p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="secondary-button"
                  onClick={() => void refreshQueue()}
                >
                  <RefreshCw size={16} />
                  Refresh status
                </button>
              </div>
            )}
          </div>

          <div className="panel queue-panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">RIGHT NOW</span>
                <h2>Queue overview</h2>
              </div>
              <span className="live-badge">
                <span className="live-dot" /> LIVE
              </span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon purple"><Users size={19} /></span>
                <span className="stat-label">Waiting</span>
                <strong>{waitingTokens.length}</strong>
                <span className="stat-foot">In the queue</span>
              </div>

              <div className="stat-card">
                <span className="stat-icon green"><Monitor size={19} /></span>
                <span className="stat-label">Being served</span>
                <strong>{servingTokens.length}</strong>
                <span className="stat-foot">At the counters</span>
              </div>
            </div>

            <div className="serving-section">
              <div className="subsection-heading">
                <span>Currently serving</span>
                <span className="muted-text">{servingTokens.length} active</span>
              </div>

              {servingTokens.length === 0 ? (
                <div className="empty-queue">
                  <Clock3 size={21} />
                  <span>No token is being served right now.</span>
                </div>
              ) : (
                servingTokens.map((token) => (
                  <div className="serving-row" key={token.id}>
                    <div>
                      <span className="serving-token">{token.token_number}</span>
                      <span className="counter-label">
                        Counter {token.counter_number}
                      </span>
                    </div>
                    <span className="serving-indicator">Serving</span>
                  </div>
                ))
              )}
            </div>

            <div className="queue-footer">
              <span><span className="live-dot" /> Updates automatically</span>
              <button onClick={() => void refreshQueue()} aria-label="Refresh queue">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="help-banner">
          <div className="help-icon"><Clock3 size={23} /></div>
          <div>
            <strong>Relax. We’ll keep you updated.</strong>
            <p>Your queue position changes automatically as tokens are called.</p>
          </div>
        </section>

        <footer className="footer">
          <span>QueueFlow © 2026</span>
          <span>Simple queues. Better experiences.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
