"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await register(
        email,
        password,
        firstName,
        lastName,
      );

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">V</div>

          <div>
            <strong>VOLTIS</strong>
            <span>Financial Infrastructure</span>
          </div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">Create workspace access</p>

          <h1>Create your account</h1>

          <p>
            Set up your secure VOLTIS infrastructure account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-name-grid">
            <label>
              <span>First name</span>

              <input
                type="text"
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                placeholder="First name"
                autoComplete="given-name"
                required
              />
            </label>

            <label>
              <span>Last name</span>

              <input
                type="text"
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                placeholder="Last name"
                autoComplete="family-name"
                required
              />
            </label>
          </div>

          <label>
            <span>Email</span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@gmail.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </label>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}>
            {submitting
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>

        <p className="auth-footer">
          VOLTIS · Payment &amp; Ledger Infrastructure
        </p>
      </section>
    </main>
  );
}