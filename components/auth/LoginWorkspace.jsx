"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, RotateCcw, Loader2 } from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

const RESEND_COOLDOWN_SECONDS = 60;

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

// Maps this app's real backend error strings (lib/auth/otp.js, the
// send-otp/verify-otp routes) to calmer copy — matched by keyword so it
// still degrades gracefully if the underlying message text changes.
// "not configured" is checked first and passed through verbatim rather than
// folded into the generic "email" bucket: it's a real operator/setup issue
// (e.g. missing RESEND_API_KEY), not something the user did wrong with
// their address, and burying it behind "check your email" would send
// someone chasing a typo that isn't there.
function friendlyError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("not configured")) return message;
  if (m.includes("administrator") || m.includes("deactivated")) return message;
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait.";
  if (m.includes("incorrect") || m.includes("expired") || m.includes("invalid")) {
    return "Incorrect or expired code. Try again or request a new one.";
  }
  if (m.includes("email")) return "Could not send code — check your email address.";
  return message || "Something went wrong. Please try again.";
}

export default function LoginWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState("email");
  const [direction, setDirection] = useState("forward");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "otp") codeInputRef.current?.focus();
  }, [step]);

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/send-otp", { email });
      setDirection("forward");
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(friendlyError(err.message));
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
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/verify-otp", { email, code });
      router.push(redirectTo);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setDirection("back");
    setStep("email");
    setCode("");
    setError("");
  }

  return (
    <div className="otp-login-page">
      <div className="otp-noise" aria-hidden="true" />
      <div className="otp-glow-blob" aria-hidden="true" />

      <div className="otp-login-content">
        <Link href="/" className="otp-brand">
          <img src={LOGO_URL} alt="LEXIFYI" />
          <span>LEXIFYI</span>
        </Link>

        <div className="otp-card">
          <div className="otp-card-grid" aria-hidden="true" />
          <span className="otp-beam otp-beam-top" aria-hidden="true" />
          <span className="otp-beam otp-beam-right" aria-hidden="true" />
          <span className="otp-beam otp-beam-bottom" aria-hidden="true" />
          <span className="otp-beam otp-beam-left" aria-hidden="true" />

          {step === "email" ? (
            <div className="otp-step" key="email" data-direction={direction}>
              <div className="otp-icon-box">
                <Mail size={20} strokeWidth={2} aria-hidden="true" />
              </div>
              <h1 className="otp-heading">Sign in</h1>
              <p className="otp-subtext">Enter your email — we&apos;ll send a verification code</p>

              <form className="otp-form" onSubmit={handleEmailSubmit}>
                <label className="otp-field">
                  Email address
                  <input
                    className="otp-input"
                    type="email"
                    autoFocus
                    placeholder="you@lawfirm.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                {error && <div className="otp-error">{error}</div>}
                <button type="submit" className="otp-submit-btn" disabled={loading}>
                  {loading && <Loader2 size={16} strokeWidth={2.5} className="otp-spin" aria-hidden="true" />}
                  {loading ? "Sending…" : "Send code"}
                </button>
              </form>

              <p className="otp-footnote">Don&apos;t have access yet? Ask your firm administrator to add you.</p>
            </div>
          ) : (
            <div className="otp-step" key="otp" data-direction={direction}>
              <div className="otp-icon-box">
                <KeyRound size={20} strokeWidth={2} aria-hidden="true" />
              </div>
              <h1 className="otp-heading">Enter verification code</h1>
              <p className="otp-subtext">
                We sent a code to <strong>{email}</strong>
              </p>

              <form className="otp-form" onSubmit={handleOtpSubmit}>
                <label className="otp-field">
                  6-digit code
                  <input
                    ref={codeInputRef}
                    className="otp-input otp-code-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="······"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </label>
                {error && <div className="otp-error">{error}</div>}
                <button type="submit" className="otp-submit-btn" disabled={loading || !code}>
                  {loading && <Loader2 size={16} strokeWidth={2.5} className="otp-spin" aria-hidden="true" />}
                  {loading ? "Verifying…" : "Verify & Sign in"}
                </button>
              </form>

              <div className="otp-footer-row">
                <button type="button" className="otp-text-btn" disabled={cooldown > 0 || loading} onClick={sendCode}>
                  {cooldown > 0 ? (
                    `Resend code in ${cooldown}s`
                  ) : (
                    <>
                      <RotateCcw size={13} strokeWidth={2.5} aria-hidden="true" />
                      Resend code
                    </>
                  )}
                </button>
                <button type="button" className="otp-text-btn" onClick={handleBack}>
                  ← Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
