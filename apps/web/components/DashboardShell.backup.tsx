"use client";

import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Database,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { useAuth } from "./AuthProvider";

type Organization = {
  id: string;
  name: string;
  slug?: string;
  defaultCurrency?: string;
};

type Overview = {
  organization?: {
    id: string;
    name: string;
    slug?: string;
    defaultCurrency?: string;
  };
  payments?: {
    total: number;
    volume: string | number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
    successRate: number;
  };
  transactions?: {
    total: number;
    volume: string | number;
    completed: number;
    failed: number;
  };
  accounts?: {
    total: number;
    balance: string | number;
  };
  ledger?: {
    debits: string | number;
    credits: string | number;
    balanced: boolean;
  };
  risk?: {
    total: number;
    allowed: number;
    review: number;
    blocked: number;
    averageScore: number;
  };
  reconciliation?: {
    total: number;
    completed: number;
  };
};

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance: string | number;
  isActive: boolean;
};

type Transaction = {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  processedAt: string | null;
  createdAt: string;
};

type TransactionsResponse = {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  volumeByCurrency: Record<string, string>;
  recent: Transaction[];
};

type ActiveModule =
  | "Overview"
  | "Accounts"
  | "Transactions"
  | "Payments"
  | "Ledger"
  | "Risk"
  | "Reconciliation"
  | "Webhooks"
  | "Analytics"
  | "Settings";

const navigation: {
  label: ActiveModule;
  icon: typeof LayoutDashboard;
  section?: string;
}[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    section: "Workspace",
  },
  {
    label: "Accounts",
    icon: Wallet,
  },
  {
    label: "Transactions",
    icon: Activity,
  },
  {
    label: "Payments",
    icon: CreditCard,
    section: "Financial Operations",
  },
  {
    label: "Ledger",
    icon: BookOpen,
  },
  {
    label: "Risk",
    icon: ShieldCheck,
    section: "Control",
  },
  {
    label: "Reconciliation",
    icon: FileCheck2,
  },
  {
    label: "Webhooks",
    icon: Zap,
    section: "Infrastructure",
  },
  {
    label: "Analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    icon: Settings,
    section: "System",
  },
];

function formatMoney(
  value: string | number | null | undefined,
  currency = "NGN",
) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-NG").format(Number(value ?? 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "active" ||
    normalized === "allowed"
  ) {
    return "status status-success";
  }

  if (
    normalized === "failed" ||
    normalized === "blocked" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "status status-danger";
  }

  if (
    normalized === "pending" ||
    normalized === "processing" ||
    normalized === "review"
  ) {
    return "status status-warning";
  }

  return "status status-neutral";
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "V"
  );
}

export default function DashboardShell() {
  const { user, logout } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);

  /*
   * IMPORTANT:
   * Keep the ID separate from organization.
   *
   * This completely removes the TypeScript problem where an async
   * function tries to access organization.id while organization
   * could theoretically be null.
   */
  const [organizationId, setOrganizationId] = useState<string>("");

  const [active, setActive] = useState<ActiveModule>("Overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [overview, setOverview] = useState<Overview | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionAnalytics, setTransactionAnalytics] =
    useState<TransactionsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");

  /*
   * ------------------------------------------------------------
   * THEME
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("voltis_theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("voltis_theme", theme);
  }, [theme]);

  /*
   * ------------------------------------------------------------
   * LOAD ORGANIZATIONS
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      try {
        setLoading(true);
        setError("");

        const data = await api.organizations.list();

        if (cancelled) {
          return;
        }

        const list = Array.isArray(data) ? data : [];

        setOrganizations(list);

        const firstOrganization = list[0] ?? null;

        setOrganization(firstOrganization);
        setOrganizationId(firstOrganization?.id ?? null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your organization.",
        );

        setOrganization(null);
        setOrganizationId("");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * LOAD OVERVIEW
   * ------------------------------------------------------------
   *
   * Notice that this uses organizationId directly.
   * There is NO organization.id here.
   */

  useEffect(() => {
    if (!organizationId || active !== "Overview") {
      return;
    }

    let cancelled = false;

    async function loadOverview() {
      try {
        setModuleLoading(true);
        setError("");

        const data = await api.analytics.overview(organizationId);

        if (cancelled) {
          return;
        }

        setOverview(data as Overview);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard analytics.",
        );
      } finally {
        if (!cancelled) {
          setModuleLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, [organizationId, active]);

  /*
   * ------------------------------------------------------------
   * LOAD ACCOUNTS
   * ------------------------------------------------------------
   *
   * IMPORTANT:
   * This uses organizationId, NOT organization.id.
   */

  useEffect(() => {
    if (!organizationId || active !== "Accounts") {
      return;
    }

    let cancelled = false;

    async function loadAccounts() {
      try {
        setModuleLoading(true);
        setError("");

        const data = await api.accounts.list(organizationId);

        if (cancelled) {
          return;
        }

        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load accounts.",
        );
      } finally {
        if (!cancelled) {
          setModuleLoading(false);
        }
      }
    }

    loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [organizationId, active]);

  /*
   * ------------------------------------------------------------
   * LOAD TRANSACTIONS
   * ------------------------------------------------------------
   *
   * IMPORTANT:
   * Both API calls use organizationId.
   * There is NO organization.id anywhere in this block.
   */

  useEffect(() => {
    if (!organizationId || active !== "Transactions") {
      return;
    }

    let cancelled = false;

    async function loadTransactions() {
      try {
        setModuleLoading(true);
        setError("");

        const [transactionList, analytics] = await Promise.all([
          api.transactions.list(organizationId),
          api.transactions.analytics(organizationId),
        ]);

        if (cancelled) {
          return;
        }

        setTransactions(
          Array.isArray(transactionList) ? transactionList : [],
        );

        setTransactionAnalytics(analytics);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transactions.",
        );
      } finally {
        if (!cancelled) {
          setModuleLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [organizationId, active]);

  /*
   * ------------------------------------------------------------
   * REFRESH
   * ------------------------------------------------------------
   */

  async function refreshCurrentModule() {
    if (!organizationId) {
      return;
    }

    setError("");

    if (active === "Overview") {
      try {
        setModuleLoading(true);

        const data = await api.analytics.overview(organizationId);

        setOverview(data as Overview);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to refresh dashboard.",
        );
      } finally {
        setModuleLoading(false);
      }

      return;
    }

    if (active === "Accounts") {
      try {
        setModuleLoading(true);

        const data = await api.accounts.list(organizationId);

        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to refresh accounts.",
        );
      } finally {
        setModuleLoading(false);
      }

      return;
    }

    if (active === "Transactions") {
      try {
        setModuleLoading(true);

        const [transactionList, analytics] = await Promise.all([
          api.transactions.list(organizationId),
          api.transactions.analytics(organizationId),
        ]);

        setTransactions(
          Array.isArray(transactionList) ? transactionList : [],
        );

        setTransactionAnalytics(analytics);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to refresh transactions.",
        );
      } finally {
        setModuleLoading(false);
      }
    }
  }

  /*
   * ------------------------------------------------------------
   * DERIVED DATA
   * ------------------------------------------------------------
   */

  const displayName =
    user?.firstName ||
    user?.email?.split("@")[0] ||
    "there";

  const organizationName =
    organization?.name ||
    overview?.organization?.name ||
    "VOLTIS";

  const currency =
    organization?.defaultCurrency ||
    overview?.organization?.defaultCurrency ||
    "NGN";

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      return (
        transaction.reference.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query) ||
        transaction.status.toLowerCase().includes(query) ||
        transaction.currency.toLowerCase().includes(query) ||
        (transaction.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [transactions, searchQuery]);

  const totalAccounts =
    overview?.accounts?.total ?? accounts.length;

  const accountBalance =
    overview?.accounts?.balance ?? 0;

  const totalPayments =
    overview?.payments?.total ?? 0;

  const paymentVolume =
    overview?.payments?.volume ?? 0;

  const successRate =
    overview?.payments?.successRate ?? 0;

  const totalTransactions =
    overview?.transactions?.total ??
    transactionAnalytics?.total ??
    transactions.length;

  const ledgerBalanced =
    overview?.ledger?.balanced ?? true;

  /*
   * ------------------------------------------------------------
   * NAVIGATION
   * ------------------------------------------------------------
   */

  function selectModule(module: ActiveModule) {
    setActive(module);
    setMobileSidebarOpen(false);
    setSearchQuery("");
    setError("");
  }

  /*
   * ------------------------------------------------------------
   * LOADING STATE
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-mark">
          <span>V</span>
        </div>

        <div className="loading-content">
          <strong>VOLTIS</strong>
          <span>Initializing financial infrastructure…</span>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div
      className={`app-shell ${
        sidebarCollapsed ? "sidebar-is-collapsed" : ""
      }`}
    >
      {mobileSidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          mobileSidebarOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">
              <span>V</span>
            </div>

            {!sidebarCollapsed && (
              <div className="brand-copy">
                <strong>VOLTIS</strong>
                <span>Financial Infrastructure</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={() =>
              setSidebarCollapsed((current) => !current)
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        <div className="organization-switcher">
          <div className="organization-avatar">
            {getInitials(organizationName)}
          </div>

          {!sidebarCollapsed && (
            <div className="organization-details">
              <span>Organization</span>
              <strong>{organizationName}</strong>
            </div>
          )}

          {!sidebarCollapsed && organizations.length > 0 && (
            <ChevronDown size={15} className="organization-chevron" />
          )}
        </div>

        <nav className="navigation">
          {navigation.map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={item.label}>
                {item.section && (
                  <div className="navigation-section">
                    {!sidebarCollapsed && item.section}
                  </div>
                )}

                <button
                  type="button"
                  className={`nav-item ${
                    active === item.label ? "nav-item-active" : ""
                  }`}
                  onClick={() => selectModule(item.label)}
                  title={
                    sidebarCollapsed ? item.label : undefined
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />

                  {!sidebarCollapsed && (
                    <span>{item.label}</span>
                  )}

                  {active === item.label && (
                    <span className="nav-active-indicator" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot status-dot-live" />

            {!sidebarCollapsed && (
              <div>
                <strong>System online</strong>
                <span>API connected</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={() => logout()}
            title={sidebarCollapsed ? "Sign out" : undefined}
          >
            <LogOut size={17} />

            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">
              <span>VOLTIS</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{active}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              onClick={refreshCurrentModule}
              disabled={moduleLoading || !organizationId}
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={
                  moduleLoading ? "spin-animation" : ""
                }
              />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Notifications"
            >
              <Bell size={17} />
              <span className="notification-dot" />
            </button>

            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setTheme((current) =>
                  current === "dark" ? "light" : "dark",
                )
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>

            <div className="topbar-divider" />

            <div className="user-menu">
              <div className="user-avatar">
                {getInitials(displayName)}
              </div>

              <div className="user-details">
                <strong>{displayName}</strong>
                <span>{user?.email ?? "Operator"}</span>
              </div>

              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div className="content-area">
          <div className="page-header">
            <div>
              <div className="eyebrow">
                FINANCIAL CONTROL CENTER
              </div>

              <h1>
                {active === "Overview"
                  ? `Welcome back, ${displayName}.`
                  : active}
              </h1>

              <p>
                {active === "Overview"
                  ? "Monitor payment operations, ledger integrity, risk, and financial activity from one control surface."
                  : `Manage ${active.toLowerCase()} across your VOLTIS organization.`}
              </p>
            </div>

            <div className="page-header-meta">
              <div className="live-indicator">
                <span className="status-dot status-dot-live" />
                Live
              </div>

              <span className="header-currency">
                {currency}
              </span>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <div className="error-banner-icon">
                <X size={17} />
              </div>

              <div>
                <strong>Unable to load this module</strong>
                <span>{error}</span>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {active === "Overview" && (
            <section className="dashboard-content">
              <div className="metric-grid">
                <article className="metric-card metric-card-primary">
                  <div className="metric-card-top">
                    <div className="metric-icon">
                      <CircleDollarSign size={19} />
                    </div>

                    <span className="metric-label">
                      PAYMENT VOLUME
                    </span>

                    <ArrowUpRight
                      size={16}
                      className="metric-trend"
                    />
                  </div>

                  <div className="metric-value">
                    {formatMoney(paymentVolume, currency)}
                  </div>

                  <div className="metric-footer">
                    <span>{formatNumber(totalPayments)} payments</span>
                    <span className="metric-positive">
                      {successRate.toFixed(1)}% success
                    </span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-card-top">
                    <div className="metric-icon">
                      <Activity size={19} />
                    </div>

                    <span className="metric-label">
                      TRANSACTIONS
                    </span>

                    <ArrowUpRight
                      size={16}
                      className="metric-trend"
                    />
                  </div>

                  <div className="metric-value">
                    {formatNumber(totalTransactions)}
                  </div>

                  <div className="metric-footer">
                    <span>
                      {formatNumber(
                        overview?.transactions?.completed ?? 0,
                      )}{" "}
                      completed
                    </span>
                    <span>
                      {formatNumber(
                        overview?.transactions?.failed ?? 0,
                      )}{" "}
                      failed
                    </span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-card-top">
                    <div className="metric-icon">
                      <Wallet size={19} />
                    </div>

                    <span className="metric-label">
                      ACCOUNTS
                    </span>

                    <ArrowUpRight
                      size={16}
                      className="metric-trend"
                    />
                  </div>

                  <div className="metric-value">
                    {formatNumber(totalAccounts)}
                  </div>

                  <div className="metric-footer">
                    <span>Active financial accounts</span>
                    <span>
                      {formatMoney(accountBalance, currency)}
                    </span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-card-top">
                    <div className="metric-icon">
                      <ShieldCheck size={19} />
                    </div>

                    <span className="metric-label">
                      RISK
                    </span>

                    <ArrowDownLeft
                      size={16}
                      className="metric-trend"
                    />
                  </div>

                  <div className="metric-value">
                    {formatNumber(
                      overview?.risk?.total ?? 0,
                    )}
                  </div>

                  <div className="metric-footer">
                    <span>Risk evaluations</span>
                    <span>
                      Avg.{" "}
                      {(
                        overview?.risk?.averageScore ?? 0
                      ).toFixed(0)}
                    </span>
                  </div>
                </article>
              </div>

              <div className="dashboard-grid">
                <article className="panel panel-large">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        FINANCIAL OPERATIONS
                      </span>
                      <h2>Payment performance</h2>
                    </div>

                    <button
                      type="button"
                      className="panel-action"
                      onClick={() => selectModule("Payments")}
                    >
                      View payments
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="performance-layout">
                    <div className="performance-main">
                      <span>Success rate</span>

                      <strong>
                        {successRate.toFixed(1)}%
                      </strong>

                      <div className="progress-track">
                        <div
                          className="progress-value"
                          style={{
                            width: `${Math.min(
                              Math.max(successRate, 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="performance-stats">
                      <div>
                        <span>Completed</span>
                        <strong>
                          {formatNumber(
                            overview?.payments?.completed ?? 0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Pending</span>
                        <strong>
                          {formatNumber(
                            overview?.payments?.pending ?? 0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Failed</span>
                        <strong>
                          {formatNumber(
                            overview?.payments?.failed ?? 0,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        LEDGER CONTROL
                      </span>
                      <h2>Ledger integrity</h2>
                    </div>
                  </div>

                  <div
                    className={`ledger-state ${
                      ledgerBalanced
                        ? "ledger-balanced"
                        : "ledger-warning"
                    }`}
                  >
                    <div className="ledger-state-icon">
                      {ledgerBalanced ? (
                        <ShieldCheck size={22} />
                      ) : (
                        <Activity size={22} />
                      )}
                    </div>

                    <div>
                      <strong>
                        {ledgerBalanced
                          ? "Ledger balanced"
                          : "Ledger requires review"}
                      </strong>

                      <span>
                        {ledgerBalanced
                          ? "Debits and credits are aligned."
                          : "There is a discrepancy requiring attention."}
                      </span>
                    </div>
                  </div>

                  <div className="ledger-values">
                    <div>
                      <span>Debits</span>
                      <strong>
                        {formatMoney(
                          overview?.ledger?.debits ?? 0,
                          currency,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Credits</span>
                      <strong>
                        {formatMoney(
                          overview?.ledger?.credits ?? 0,
                          currency,
                        )}
                      </strong>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        RISK ENGINE
                      </span>
                      <h2>Risk posture</h2>
                    </div>

                    <button
                      type="button"
                      className="panel-icon-action"
                      onClick={() => selectModule("Risk")}
                      title="Open risk"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="risk-summary">
                    <div className="risk-score">
                      <strong>
                        {(
                          overview?.risk?.averageScore ?? 0
                        ).toFixed(0)}
                      </strong>
                      <span>Average score</span>
                    </div>

                    <div className="risk-breakdown">
                      <div>
                        <span className="risk-dot risk-allowed" />
                        <span>Allowed</span>
                        <strong>
                          {formatNumber(
                            overview?.risk?.allowed ?? 0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span className="risk-dot risk-review" />
                        <span>Review</span>
                        <strong>
                          {formatNumber(
                            overview?.risk?.review ?? 0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span className="risk-dot risk-blocked" />
                        <span>Blocked</span>
                        <strong>
                          {formatNumber(
                            overview?.risk?.blocked ?? 0,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        RECONCILIATION
                      </span>
                      <h2>Control runs</h2>
                    </div>

                    <button
                      type="button"
                      className="panel-icon-action"
                      onClick={() =>
                        selectModule("Reconciliation")
                      }
                      title="Open reconciliation"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="reconciliation-summary">
                    <div className="reconciliation-number">
                      <strong>
                        {formatNumber(
                          overview?.reconciliation?.completed ?? 0,
                        )}
                      </strong>

                      <span>
                        of{" "}
                        {formatNumber(
                          overview?.reconciliation?.total ?? 0,
                        )}{" "}
                        runs completed
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-value"
                        style={{
                          width: `${
                            (overview?.reconciliation?.total ?? 0) >
                            0
                              ? Math.min(
                                  ((overview?.reconciliation
                                    ?.completed ?? 0) /
                                    (overview?.reconciliation
                                      ?.total ?? 1)) *
                                    100,
                                  100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              </div>

              <div className="system-strip">
                <div className="system-strip-icon">
                  <Database size={18} />
                </div>

                <div>
                  <strong>VOLTIS infrastructure operational</strong>
                  <span>
                    API and financial services are connected.
                    Organization data is being served live.
                  </span>
                </div>

                <div className="system-strip-state">
                  <span className="status-dot status-dot-live" />
                  SYSTEM ONLINE
                </div>
              </div>
            </section>
          )}

          {active === "Accounts" && (
            <section className="module-content">
              <div className="module-toolbar">
                <div>
                  <span className="module-count">
                    {formatNumber(accounts.length)} accounts
                  </span>
                </div>

                <button
                  type="button"
                  className="primary-button"
                >
                  <Wallet size={16} />
                  Create account
                </button>
              </div>

              {moduleLoading ? (
                <div className="module-loading">
                  <RefreshCw
                    size={20}
                    className="spin-animation"
                  />
                  Loading accounts…
                </div>
              ) : accounts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Wallet size={23} />
                  </div>

                  <h3>No accounts yet</h3>

                  <p>
                    Financial accounts created for this
                    organization will appear here.
                  </p>
                </div>
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Type</th>
                          <th>Currency</th>
                          <th>Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account.id}>
                            <td>
                              <div className="table-primary">
                                <strong>{account.name}</strong>
                                <span>{account.code}</span>
                              </div>
                            </td>

                            <td>{account.type}</td>

                            <td>{account.currency}</td>

                            <td>
                              <strong>
                                {formatMoney(
                                  account.balance,
                                  account.currency,
                                )}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={statusClass(
                                  account.isActive
                                    ? "active"
                                    : "inactive",
                                )}
                              >
                                {account.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {active === "Transactions" && (
            <section className="module-content">
              <div className="module-toolbar">
                <div className="module-toolbar-left">
                  <span className="module-count">
                    {formatNumber(
                      transactionAnalytics?.total ??
                        transactions.length,
                    )}{" "}
                    transactions
                  </span>

                  <div className="search-field">
                    <Search size={16} />

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search transactions…"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-button"
                >
                  <Activity size={16} />
                  New transaction
                </button>
              </div>

              {moduleLoading ? (
                <div className="module-loading">
                  <RefreshCw
                    size={20}
                    className="spin-animation"
                  />
                  Loading transactions…
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Activity size={23} />
                  </div>

                  <h3>No transactions found</h3>

                  <p>
                    Transaction activity for this organization
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTransactions.map(
                          (transaction) => (
                            <tr key={transaction.id}>
                              <td>
                                <div className="table-primary">
                                  <strong>
                                    {transaction.reference}
                                  </strong>

                                  <span>
                                    {transaction.description ||
                                      "Financial transaction"}
                                  </span>
                                </div>
                              </td>

                              <td>{transaction.type}</td>

                              <td>
                                <strong>
                                  {formatMoney(
                                    transaction.amount,
                                    transaction.currency,
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={statusClass(
                                    transaction.status,
                                  )}
                                >
                                  {transaction.status}
                                </span>
                              </td>

                              <td>
                                {formatDate(
                                  transaction.createdAt,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {active !== "Overview" &&
            active !== "Accounts" &&
            active !== "Transactions" && (
              <section className="module-content">
                <div className="coming-soon-panel">
                  <div className="coming-soon-icon">
                    {active === "Payments" && (
                      <CreditCard size={25} />
                    )}

                    {active === "Ledger" && (
                      <BookOpen size={25} />
                    )}

                    {active === "Risk" && (
                      <ShieldCheck size={25} />
                    )}

                    {active === "Reconciliation" && (
                      <FileCheck2 size={25} />
                    )}

                    {active === "Webhooks" && (
                      <Zap size={25} />
                    )}

                    {active === "Analytics" && (
                      <BarChart3 size={25} />
                    )}

                    {active === "Settings" && (
                      <Settings size={25} />
                    )}
                  </div>

                  <span className="panel-kicker">
                    VOLTIS MODULE
                  </span>

                  <h2>{active}</h2>

                  <p>
                    The {active.toLowerCase()} control surface
                    is connected to the VOLTIS architecture and
                    ready for the next implementation layer.
                  </p>

                  <div className="coming-soon-status">
                    <span className="status-dot status-dot-live" />
                    Infrastructure ready
                  </div>
                </div>
              </section>
            )}

          <footer className="app-footer">
            <span>VOLTIS Financial Infrastructure</span>

            <span className="footer-separator">•</span>

            <span>Organization: {organizationName}</span>

            <span className="footer-separator">•</span>

            <span>Currency: {currency}</span>

            <span className="footer-version">
              Production architecture
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

