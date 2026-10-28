
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Monitor,
  PhoneCall,
  RefreshCw,
  Ticket,
  Users,
} from "lucide-react";
import "./App.css";

const API = "https://token-queue-system-8nxr.onrender.com";

type ServiceType = "Deposits" | "Loans" | "Enquiry";

type QueueToken = {
  id: number;
  token_number: string;
  status: "waiting" | "serving" | "completed" | "Skipped";
  counter_number: number | null;
  created_at: string;
  service_type: ServiceType;
};

export default function Counter() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [counter, setCounter] = useState(1);
  const [selectedService, setSelectedService] = 
  useState<ServiceType>("Enquiry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refreshQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/tokens`);
      if (!response.ok) throw new Error("Unable to load queue");

      const data: QueueToken[] = await response.json();
      setTokens(data);
      setError("");
    } catch {
      setError("Cannot connect to the backend. Check that it is running.");
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

const serviceTokens = tokens.filter(
  (token) => token.service_type === selectedService
);

const waitingTokens = serviceTokens.filter(
  (token) => token.status === "waiting"
);

  const activeToken =
  serviceTokens.find(
    (token) =>
      token.status === "serving" &&
      token.counter_number === counter
  ) ?? null;

  async function callNextToken() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/api/tokens/next`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterNumber: counter, service_type: selectedService,}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not call next token");
      }

      setMessage(`Now serving ${data.token.token_number}`);
      await refreshQueue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function completeService() {
    if (!activeToken) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/tokens/${activeToken.id}/complete`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not complete service");
      }

      setMessage(`${activeToken.token_number} completed successfully`);
      await refreshQueue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }
  
  async function skipToken() {
    if (!activeToken) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/tokens/${activeToken.id}/skip`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not skip token");
      }

      setMessage(`${activeToken.token_number} skipped successfully`);
      await refreshQueue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Ticket size={23} />
          </span>
          <span>
            Queue<span className="brand-accent">Flow</span>
          </span>
        </Link>

        <Link className="secondary-button" to="/">
          <ArrowLeft size={16} />
          Visitor page
        </Link>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            STAFF WORKSPACE
          </div>

          <h1>
            Manage your queue.
            <br />
            <span>One visitor at a time.</span>
          </h1>

          <p className="hero-description">
            Call the next visitor, manage active service, and keep the
            queue moving smoothly.
          </p>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => void refreshQueue()}>Retry</button>
          </div>
        )}

        {message && (
          <div className="success-banner" role="status">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        <section className="counter-layout">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">WORKSTATION</span>
                <h2>Select your counter</h2>
                <label className="field-label" htmlFor="service-select">              
                Service
                </label>

              <select
               id="service-select"
               className="counter-select"
               value={selectedService}
               onChange={(event) => {
                 setSelectedService(event.target.value as ServiceType);
                 setMessage("");
                 setError("");
               }}
              >
                <option value="Deposits">Deposits</option>
                <option value="Loans">Loans</option>
                <option value="Enquiry">Enquiry</option>
              </select>
              </div>
              <span className="heading-icon">
                <Monitor size={22} />
              </span>
            </div>

            <label className="field-label" htmlFor="counter-select">
              Counter number
            </label>

            <select
              id="counter-select"
              className="counter-select"
              value={counter}
              onChange={(event) => {
                setCounter(Number(event.target.value));
                setMessage("");
                setError("");
              }}
            >
              <option value={1}>Counter 1</option>
              <option value={2}>Counter 2</option>
              <option value={3}>Counter 3</option>
            </select>

            <div className="active-token-card">
              <span className="section-label">CURRENTLY SERVING</span>

              {activeToken ? (
                <>
                  <div className="active-token-number">
                    {activeToken.token_number}
                  </div>
                  <span className="status-pill status-serving">
                    <span className="status-dot" />
                    In service
                  </span>
                  <p className="active-token-description">
                    This visitor is assigned to Counter {counter}.
                  </p>

                  <button
                    className="complete-button"
                    onClick={() => void completeService()}
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircle className="spin" size={19} />
                    ) : (
                      <CheckCircle2 size={19} />
                    )}
                    Complete service
                  </button>  
                 <button
                className="secondary-button"
                onClick={() => void skipToken()}
                disabled={loading}
                >
              Skip token
              </button>
                </>
              ) : (
                <>
                  <div className="no-active-icon">
                    <Clock3 size={32} />
                  </div>
                  <h3>No active visitor</h3>
                  <p className="active-token-description">
                    Call the next waiting visitor to begin service.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => void callNextToken()}
                    disabled={loading || waitingTokens.length === 0}
                  >
                    {loading ? (
                      <LoaderCircle className="spin" size={19} />
                    ) : (
                      <PhoneCall size={19} />
                    )}
                    {loading ? "Please wait..." : "Call next token"}
                  </button>

                  {waitingTokens.length === 0 && (
                    <p className="no-waiting-note">
                      There are no waiting visitors.
                    </p>
                  )}
                </>
              )}
            </div>

            {activeToken && (
              <button
                className="primary-button next-button"
                onClick={() => void callNextToken()}
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle className="spin" size={19} />
                ) : (
                  <PhoneCall size={19} />
                )}
                Call next visitor
              </button>
            )}
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="section-label">LIVE QUEUE</span>
                <h2>Waiting visitors</h2>
              </div>
              <span className="heading-icon">
                <Users size={22} />
              </span>
            </div>

            <div className="counter-stats">
              <div className="stat-card">
                <span className="stat-label">Waiting</span>
                <strong>{waitingTokens.length}</strong>
                <span className="stat-foot">Visitors in line</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Completed today</span>
                <strong>
                  {tokens.filter((token) => token.status === "completed").length}
                </strong>
                <span className="stat-foot">Completed records</span>
              </div>
            </div>

            <div className="subsection-heading queue-list-heading">
              <span>Token list</span>
              <button
                className="icon-button"
                onClick={() => void refreshQueue()}
                aria-label="Refresh waiting list"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="empty-queue">
                <Clock3 size={21} />
                <span>No visitors are waiting right now.</span>
              </div>
            ) : (
              <div className="waiting-list">
                {waitingTokens.map((token, index) => (
                  <div className="waiting-row" key={token.id}>
                    <span className="waiting-position">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="waiting-person">
                      <strong>{token.token_number}</strong>
                      <span>
                        {index === 0 ? "Next in line" : "Waiting"}
                      </span>
                    </div>
                    {index === 0 && (
                      <span className="next-badge">NEXT</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="queue-footer">
              <span>
                <span className="live-dot" />
                Updates automatically
              </span>
              <span>{tokens.length} total tokens</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

