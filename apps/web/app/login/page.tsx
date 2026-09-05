"use client";
import "../auth.css";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="brand-mark">V</div>

          <div>
            <div className="brand-name">VOLTIS</div>
            <div className="brand-subtitle">PAYMENT INFRASTRUCTURE</div>
          </div>

          <div className="auth-brand-copy">
            <span className="eyebrow">FINANCIAL CONTROL CENTER</span>
            <h1>Move money with confidence.</h1>
            <p>
              Payments, ledger infrastructure, reconciliation and risk
              operations in one controlled environment.
            </p>
          </div>

          <div className="auth-security">
            <ShieldCheck size={17} />
            <span>Secure financial operations</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to VOLTIS</h2>
            <p>Access your financial control center.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <label className="auth-field">
              <span>Email address</span>
              <div className="auth-input-wrap">
                <Mail size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link href="/signup">Create one</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
