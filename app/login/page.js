"use client";

import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Contraseña incorrecta");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch (e) {
      setError("No se pudo conectar. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600&display=swap');`}</style>
      <form onSubmit={submit} style={styles.card}>
        <div style={styles.iconWrap}>
          <Lock size={20} color="#A6472A" />
        </div>
        <h1 style={styles.title}>Costeo</h1>
        <p style={styles.subtitle}>Arepas y Burguer</p>
        <input
          type="password"
          autoFocus
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading || !password} style={{ ...styles.button, opacity: loading || !password ? 0.6 : 1 }}>
          {loading ? "Entrando…" : "Entrar"} <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FAF3E6",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    background: "#FFFFFF",
    border: "1px solid #EAE0CC",
    borderRadius: 20,
    padding: "32px 26px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#FBEAE7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    color: "#2B2018",
  },
  subtitle: {
    fontSize: 12.5,
    color: "#8A7B68",
    margin: "2px 0 22px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    border: "1px solid #D8C9A8",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    marginBottom: 8,
    fontFamily: "'Inter', sans-serif",
  },
  error: {
    color: "#B23A2E",
    fontSize: 12.5,
    margin: "4px 0 8px",
  },
  button: {
    width: "100%",
    marginTop: 10,
    padding: "12px",
    borderRadius: 10,
    border: "none",
    background: "#A6472A",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "'Inter', sans-serif",
  },
};
