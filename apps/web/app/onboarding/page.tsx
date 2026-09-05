"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";

import { api, type Organization } from "../../lib/api";
import { useAuth } from "../../components/AuthProvider";

const currencies = ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR"];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [slugTouched, setSlugTouched] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const suggestedSlug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!slugTouched) setSlug(suggestedSlug);
  }, [suggestedSlug, slugTouched]);

  useEffect(() => {
    let cancelled = false;

    async function checkWorkspace() {
      if (authLoading) return;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const organizations = await api.organizations.list();
        if (cancelled) return;
        if (organizations.length > 0) {
          router.replace("/");
          return;
        }
      } catch {
        // The create request below will surface the actionable API error.
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkWorkspace();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanSlug = slugify(slug);

    if (cleanName.length < 2) {
      setError("Enter an organization name with at least 2 characters.");
      return;
    }
    if (cleanSlug.length < 3) {
      setError("Choose a workspace slug with at least 3 characters.");
      return;
    }

    try {
      setSaving(true);
      const organization: Organization = await api.organizations.create({
        name: cleanName,
        slug: cleanSlug,
        defaultCurrency: currency,
      });

      window.localStorage.setItem("voltis_organization_id", organization.id);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the organization.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || checking) {
    return (
      <main className="workspace-onboarding">
        <div className="workspace-loading">Preparing your VOLTIS workspace…</div>
      </main>
    );
  }

  return (
    <main className="workspace-onboarding">
      <div className="workspace-card">
        <section className="workspace-intro">
          <div className="workspace-brand"><span>V</span><strong>VOLTIS</strong></div>
          <span className="eyebrow">WORKSPACE SETUP</span>
          <h1>Create your organization.</h1>
          <p>Your organization is the financial boundary for accounts, transactions, payments, ledger, risk, reconciliation and webhooks.</p>

          <div className="workspace-points">
            <div><CheckCircle2 size={17} /><span>Secure tenant boundary</span></div>
            <div><CheckCircle2 size={17} /><span>Accounts and ledger stay organized</span></div>
            <div><CheckCircle2 size={17} /><span>Ready for financial operations</span></div>
          </div>
        </section>

        <section className="workspace-form-panel">
          <div className="workspace-form-header">
            <div className="workspace-icon"><Building2 size={20} /></div>
            <div><h2>Set up your workspace</h2><p>This only takes a moment.</p></div>
          </div>

          <form className="workspace-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <label className="auth-field">
              <span>Organization name</span>
              <div className="auth-input-wrap"><Building2 size={17} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Acme Financial" disabled={saving} autoFocus /></div>
            </label>

            <label className="auth-field">
              <span>Workspace slug</span>
              <div className="auth-input-wrap"><span className="workspace-slug-prefix">voltis/</span><input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} placeholder="acme-financial" disabled={saving} /></div>
            </label>

            <label className="auth-field">
              <span>Default currency</span>
              <select className="workspace-select" value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={saving}>
                {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Creating workspace..." : "Create organization"}{!saving && <ArrowRight size={17} />}</button>
          </form>

          <div className="workspace-note">You can change the organization name and default currency later in Settings.</div>
        </section>
      </div>
    </main>
  );
}
