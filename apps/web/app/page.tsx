"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "../components/DashboardShellV2";
import { api } from "../lib/api";
import { useAuth } from "../components/AuthProvider";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [checkingWorkspace, setCheckingWorkspace] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ensureOrganization() {
      if (authLoading) return;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const organizations = await api.organizations.list();
        if (cancelled) return;
        if (!Array.isArray(organizations) || organizations.length === 0) {
          router.replace("/onboarding");
          return;
        }
        setCheckingWorkspace(false);
      } catch {
        if (!cancelled) router.replace("/onboarding");
      }
    }

    ensureOrganization();
    return () => { cancelled = true; };
  }, [authLoading, user, router]);

  if (authLoading || checkingWorkspace) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", opacity: .5 }}>VOLTIS</div>
          <div style={{ marginTop: 10, fontSize: 13, opacity: .65 }}>Preparing your financial workspace…</div>
        </div>
      </main>
    );
  }

  return <DashboardShell />;
}
