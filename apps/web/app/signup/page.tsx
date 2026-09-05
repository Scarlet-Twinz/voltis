"use client";
import "../auth.css";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await register(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
      );

      router.replace("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
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
            <span className="eyebrow">BUILD YOUR CONTROL CENTER</span>
            <h1>Financial infrastructure, built for control.</h1>
            <p>
              Create your VOLTIS workspace and operate payments, transactions,
              ledger, risk and reconciliation from one platform.
            </p>
          </div>

          <div className="auth-security">
            <span className="auth-status-dot" />
            <span>Infrastructure ready</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <span className="eyebrow">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Set up your VOLTIS access in a few seconds.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-row">
              <label className="auth-field">
                <span>First name</span>
                <div className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>Last name</span>
                <div className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </label>
            </div>

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
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link href="/login">Sign in</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
