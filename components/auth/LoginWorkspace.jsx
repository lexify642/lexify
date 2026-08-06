"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOGO_URL } from "@/lib/brand";

const RESEND_COOLDOWN_SECONDS = 30;

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong. Please try again.");
  }
  return payload.data;
}

export default function LoginWorkspace() {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/send-otp", { email });
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEmailSubmit(event) {
    event.preventDefault();
    if (!email) {
      setError("Enter your email address.");
      return;
    }
    sendCode();
  }

  async function handleOtpSubmit(event) {
    event.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/verify-otp", { email, code });
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img className="brand-logo" src={LOGO_URL} alt="LEXIFY" />
          <span>LEXIFY</span>
        </div>

        {step === "email" ? (
          <>
            <h1 className="auth-title">Sign in to your workspace</h1>
            <p className="auth-subtitle">Enter your email and we'll send you a one-time code.</p>
            <form className="auth-form" onSubmit={handleEmailSubmit}>
              <label className="auth-field">
                Email address
                <input
                  type="email"
                  autoFocus
                  placeholder="you@lawfirm.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn btn-block" disabled={loading}>
                {loading ? "Sending code…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">Enter your code</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>
            <form className="auth-form" onSubmit={handleOtpSubmit}>
              <label className="auth-field">
                6-digit code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  className="auth-otp-input"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn btn-block" disabled={loading}>
                {loading ? "Verifying…" : "Verify & sign in"}
              </button>
            </form>
            <div className="auth-footer-row">
              <button
                type="button"
                className="link"
                disabled={cooldown > 0 || loading}
                onClick={sendCode}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
