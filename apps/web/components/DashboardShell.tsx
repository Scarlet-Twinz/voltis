"use client";

import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
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
  Trash2,
  Wallet,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "../lib/api";
import { useAuth } from "./AuthProvider";

type Organization = {
  id: string;
  name: string;
  slug?: string;
  defaultCurrency?: string;
  ownerId?: string;
  isActive?: boolean;
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

type GenericRecord = Record<string, unknown>;

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

function formatDate(value: unknown) {
  if (!value || typeof value !== "string") {
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
    normalized === "allowed" ||
    normalized === "healthy" ||
    normalized === "delivered"
  ) {
    return "status status-success";
  }

  if (
    normalized === "failed" ||
    normalized === "blocked" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "inactive" ||
    normalized === "error"
  ) {
    return "status status-danger";
  }

  if (
    normalized === "pending" ||
    normalized === "processing" ||
    normalized === "review" ||
    normalized === "retrying"
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

function readString(
  value: unknown,
  fallback = "—",
): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return fallback;
}

function readNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function asRecords(value: unknown): GenericRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is GenericRecord =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item),
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getRecordId(record: GenericRecord) {
  return readString(
    record.id ??
      record._id ??
      record.paymentId ??
      record.transactionId ??
      record.endpointId,
    Math.random().toString(36),
  );
}

export default function DashboardShell() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [organizations, setOrganizations] = useState<
    Organization[]
  >([]);
  const [organization, setOrganization] =
    useState<Organization | null>(null);
  const [organizationId, setOrganizationId] =
    useState<string>("");

  const [active, setActive] =
    useState<ActiveModule>("Overview");

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [theme, setTheme] =
    useState<"dark" | "light">("dark");

  const [overview, setOverview] =
    useState<Overview | null>(null);

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [transactionAnalytics, setTransactionAnalytics] =
    useState<TransactionsResponse | null>(null);

  const [payments, setPayments] =
    useState<GenericRecord[]>([]);

  const [ledgerEntries, setLedgerEntries] =
    useState<GenericRecord[]>([]);

  const [riskItems, setRiskItems] =
    useState<GenericRecord[]>([]);

  const [reconciliationRuns, setReconciliationRuns] =
    useState<GenericRecord[]>([]);

  const [webhookEndpoints, setWebhookEndpoints] =
    useState<GenericRecord[]>([]);

  const [webhookDeliveries, setWebhookDeliveries] =
    useState<GenericRecord[]>([]);

  const [analyticsPayments, setAnalyticsPayments] =
    useState<unknown>(null);

  const [analyticsRisk, setAnalyticsRisk] =
    useState<unknown>(null);

  const [analyticsAccounts, setAnalyticsAccounts] =
    useState<unknown>(null);

  const [loading, setLoading] = useState(true);
  const [moduleLoading, setModuleLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState<GenericRecord | null>(null);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [actionOpen, setActionOpen] =
    useState(false);

  const [actionType, setActionType] = useState<
    "account" | "transaction" | "payment" | "webhook"
  >("account");

  const [actionJson, setActionJson] =
    useState("{}");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [reconciliationLoading, setReconciliationLoading] =
    useState(false);

  const [settingsSaving, setSettingsSaving] =
    useState(false);

  const [settingsCurrency, setSettingsCurrency] =
    useState("NGN");

  /*
   * ------------------------------------------------------------
   * THEME
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem("voltis_theme");

    if (
      savedTheme === "light" ||
      savedTheme === "dark"
    ) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(
      "voltis_theme",
      theme,
    );
  }, [theme]);

  useEffect(() => {
    if (organization?.defaultCurrency) {
      setSettingsCurrency(organization.defaultCurrency);
    }
  }, [organization?.defaultCurrency]);

  /*
   * ------------------------------------------------------------
   * ORGANIZATION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      try {
        setLoading(true);
        setError("");

        const data =
          await api.organizations.list();

        if (cancelled) {
          return;
        }

        const list = Array.isArray(data)
          ? data
          : [];

        setOrganizations(list);

        const firstOrganization =
          list[0] ?? null;

        setOrganization(firstOrganization);

        /*
         * IMPORTANT:
         * Empty string, not null.
         */
        setOrganizationId(
          firstOrganization?.id ?? "",
        );
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
   * MODULE LOADERS
   * ------------------------------------------------------------
   */

  async function loadOverview() {
    if (!organizationId) {
      return;
    }

    const data =
      await api.analytics.overview(
        organizationId,
      );

    setOverview(data as Overview);
  }

  async function loadAccounts() {
    if (!organizationId) {
      return;
    }

    const data =
      await api.accounts.list(
        organizationId,
      );

    setAccounts(
      Array.isArray(data) ? data : [],
    );
  }

  async function loadTransactions() {
    if (!organizationId) {
      return;
    }

    const [transactionList, analytics] =
      await Promise.all([
        api.transactions.list(
          organizationId,
        ),
        api.transactions.analytics(
          organizationId,
        ),
      ]);

    setTransactions(
      Array.isArray(transactionList)
        ? transactionList
        : [],
    );

    setTransactionAnalytics(
      analytics,
    );
  }

  async function loadPayments() {
    if (!organizationId) {
      return;
    }

    const data =
      await api.payments.list(
        organizationId,
      );

    setPayments(asRecords(data));
  }

  async function loadLedger() {
    /*
     * The ledger endpoint is transaction-scoped.
     * If transactions exist, load entries for the
     * most recent transaction.
     */
    if (!organizationId) {
      return;
    }

    if (transactions.length === 0) {
      setLedgerEntries([]);
      return;
    }

    const transaction =
      transactions[0];

    const data =
      await api.ledger.entries(
        transaction.id,
      );

    setLedgerEntries(
      asRecords(data),
    );
  }

  async function loadRisk() {
    if (!organizationId) {
      return;
    }

    const data =
      await api.risk.list(
        organizationId,
      );

    setRiskItems(
      asRecords(data),
    );
  }

  async function loadReconciliation() {
    if (!organizationId) {
      return;
    }

    const data =
      await api.reconciliation.list(
        organizationId,
      );

    setReconciliationRuns(
      asRecords(data),
    );
  }

  async function loadWebhooks() {
    if (!organizationId) {
      return;
    }

    const [endpoints, deliveries] =
      await Promise.all([
        api.webhooks.endpoints(
          organizationId,
        ),
        api.webhooks.deliveries(
          organizationId,
        ),
      ]);

    setWebhookEndpoints(
      asRecords(endpoints),
    );

    setWebhookDeliveries(
      asRecords(deliveries),
    );
  }

  async function loadAnalytics() {
    if (!organizationId) {
      return;
    }

    const [
      paymentsData,
      riskData,
      accountsData,
    ] = await Promise.all([
      api.analytics.payments(
        organizationId,
      ),
      api.analytics.risk(
        organizationId,
      ),
      api.analytics.accounts(
        organizationId,
      ),
    ]);

    setAnalyticsPayments(
      paymentsData,
    );

    setAnalyticsRisk(
      riskData,
    );

    setAnalyticsAccounts(
      accountsData,
    );
  }

  useEffect(() => {
    if (
      !organizationId ||
      active === "Settings"
    ) {
      return;
    }

    let cancelled = false;

    async function loadActiveModule() {
      try {
        setModuleLoading(true);
        setError("");

        if (active === "Overview") {
          await loadOverview();
        }

        if (active === "Accounts") {
          await loadAccounts();
        }

        if (active === "Transactions") {
          await loadTransactions();
        }

        if (active === "Payments") {
          await loadPayments();
        }

        if (active === "Ledger") {
          await loadTransactions();
          await loadLedger();
        }

        if (active === "Risk") {
          await loadRisk();
        }

        if (active === "Reconciliation") {
          await loadReconciliation();
        }

        if (active === "Webhooks") {
          await loadWebhooks();
        }

        if (active === "Analytics") {
          await Promise.all([
            loadOverview(),
            loadAnalytics(),
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : `Unable to load ${active.toLowerCase()}.`,
          );
        }
      } finally {
        if (!cancelled) {
          setModuleLoading(false);
        }
      }
    }

    loadActiveModule();

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

    try {
      setModuleLoading(true);
      setError("");

      if (active === "Overview") {
        await loadOverview();
      }

      if (active === "Accounts") {
        await loadAccounts();
      }

      if (active === "Transactions") {
        await loadTransactions();
      }

      if (active === "Payments") {
        await loadPayments();
      }

      if (active === "Ledger") {
        await loadTransactions();
        await loadLedger();
      }

      if (active === "Risk") {
        await loadRisk();
      }

      if (active === "Reconciliation") {
        await loadReconciliation();
      }

      if (active === "Webhooks") {
        await loadWebhooks();
      }

      if (active === "Analytics") {
        await Promise.all([
          loadOverview(),
          loadAnalytics(),
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh this module.",
      );
    } finally {
      setModuleLoading(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------------
   */

  function openAction(
    type:
      | "account"
      | "transaction"
      | "payment"
      | "webhook",
  ) {
    setActionType(type);
    setActionJson("{}");
    setActionOpen(true);
  }

  async function submitAction() {
    if (!organizationId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const parsed =
        JSON.parse(actionJson) as GenericRecord;

      if (actionType === "account") {
        /*
         * Account creation payload is deliberately
         * supplied as JSON because the exact backend
         * DTO may vary with the account engine.
         */
        await api.accounts.create({
          organizationId,
          ...parsed,
        });
      }

      if (actionType === "transaction") {
        await api.transactions.create({
          organizationId,
          ...parsed,
        });
      }

      if (actionType === "payment") {
        await api.payments.create(parsed);
      }

      if (actionType === "webhook") {
        await api.webhooks.createEndpoint(
          organizationId,
          parsed,
        );
      }

      setActionOpen(false);

      if (active === "Payments") {
        await loadPayments();
      }

      if (active === "Webhooks") {
        await loadWebhooks();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the action.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function saveSettings() {
    if (!organizationId) {
      return;
    }

    try {
      setSettingsSaving(true);
      setError("");

      const updated = await api.organizations.update(
        organizationId,
        { defaultCurrency: settingsCurrency },
      );

      setOrganization(updated);
      setSettingsCurrency(updated.defaultCurrency);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save organization settings.",
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function runReconciliation() {
    if (!organizationId) {
      return;
    }

    try {
      setReconciliationLoading(true);
      setError("");

      await api.reconciliation.run(
        organizationId,
      );

      await Promise.all([
        loadReconciliation(),
        loadOverview(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start reconciliation.",
      );
    } finally {
      setReconciliationLoading(false);
    }
  }

  async function deleteWebhook(id: string) {
    try {
      setError("");

      await api.webhooks.deleteEndpoint(id);

      await loadWebhooks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete webhook endpoint.",
      );
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

  const filteredTransactions =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return transactions;
      }

      return transactions.filter(
        (transaction) =>
          transaction.reference
            .toLowerCase()
            .includes(query) ||
          transaction.type
            .toLowerCase()
            .includes(query) ||
          transaction.status
            .toLowerCase()
            .includes(query) ||
          transaction.currency
            .toLowerCase()
            .includes(query) ||
          (
            transaction.description ?? ""
          )
            .toLowerCase()
            .includes(query),
      );
    }, [transactions, searchQuery]);

  const filteredPayments =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return payments;
      }

      return payments.filter((payment) =>
        Object.values(payment).some(
          (value) =>
            displayValue(value)
              .toLowerCase()
              .includes(query),
        ),
      );
    }, [payments, searchQuery]);

  const totalAccounts =
    overview?.accounts?.total ??
    accounts.length;

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

  function selectModule(
    module: ActiveModule,
  ) {
    setActive(module);
    setMobileSidebarOpen(false);
    setSearchQuery("");
    setError("");
    setSelectedRecord(null);
    setSelectedTransaction(null);
  }

  async function handleLogout() {
    logout();
    router.replace("/login");
  }

  /*
   * ------------------------------------------------------------
   * LOADING
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
          <span>
            Initializing financial infrastructure…
          </span>
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
        sidebarCollapsed
          ? "sidebar-is-collapsed"
          : ""
      }`}
    >
      {mobileSidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() =>
            setMobileSidebarOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          mobileSidebarOpen
            ? "sidebar-mobile-open"
            : ""
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
                <span>
                  Financial Infrastructure
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={() =>
              setSidebarCollapsed(
                (current) => !current,
              )
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
              <strong>
                {organizationName}
              </strong>
            </div>
          )}

          {!sidebarCollapsed &&
            organizations.length > 0 && (
              <ChevronDown
                size={15}
                className="organization-chevron"
              />
            )}
        </div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label}>
                {item.section && (
                  <div className="navigation-section">
                    {!sidebarCollapsed &&
                      item.section}
                  </div>
                )}

                <button
                  type="button"
                  className={`nav-item ${
                    active === item.label
                      ? "nav-item-active"
                      : ""
                  }`}
                  onClick={() =>
                    selectModule(item.label)
                  }
                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />

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
                <strong>
                  System online
                </strong>
                <span>
                  API connected
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title={
              sidebarCollapsed
                ? "Sign out"
                : undefined
            }
          >
            <LogOut size={17} />

            {!sidebarCollapsed && (
              <span>Sign out</span>
            )}
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">
              <span>VOLTIS</span>
              <span className="breadcrumb-divider">
                /
              </span>
              <strong>{active}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              onClick={refreshCurrentModule}
              disabled={
                moduleLoading ||
                !organizationId
              }
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={
                  moduleLoading
                    ? "spin-animation"
                    : ""
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
                  current === "dark"
                    ? "light"
                    : "dark",
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
                <strong>
                  {displayName}
                </strong>
                <span>
                  {user?.email ??
                    "Operator"}
                </span>
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
                <strong>
                  Unable to complete operation
                </strong>
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

          {/* ================================================== */}
          {/* OVERVIEW */}
          {/* ================================================== */}

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
                    {formatMoney(
                      paymentVolume,
                      currency,
                    )}
                  </div>

                  <div className="metric-footer">
                    <span>
                      {formatNumber(
                        totalPayments,
                      )}{" "}
                      payments
                    </span>

                    <span className="metric-positive">
                      {successRate.toFixed(
                        1,
                      )}
                      % success
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
                    {formatNumber(
                      totalTransactions,
                    )}
                  </div>

                  <div className="metric-footer">
                    <span>
                      {formatNumber(
                        overview?.transactions
                          ?.completed ?? 0,
                      )}{" "}
                      completed
                    </span>

                    <span>
                      {formatNumber(
                        overview?.transactions
                          ?.failed ?? 0,
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
                    {formatNumber(
                      totalAccounts,
                    )}
                  </div>

                  <div className="metric-footer">
                    <span>
                      Active financial accounts
                    </span>

                    <span>
                      {formatMoney(
                        accountBalance,
                        currency,
                      )}
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
                      overview?.risk?.total ??
                        0,
                    )}
                  </div>

                  <div className="metric-footer">
                    <span>
                      Risk evaluations
                    </span>

                    <span>
                      Avg.{" "}
                      {(
                        overview?.risk
                          ?.averageScore ?? 0
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
                      <h2>
                        Payment performance
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="panel-action"
                      onClick={() =>
                        selectModule(
                          "Payments",
                        )
                      }
                    >
                      View payments
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="performance-layout">
                    <div className="performance-main">
                      <span>
                        Success rate
                      </span>

                      <strong>
                        {successRate.toFixed(
                          1,
                        )}
                        %
                      </strong>

                      <div className="progress-track">
                        <div
                          className="progress-value"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                successRate,
                                0,
                              ),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="performance-stats">
                      <div>
                        <span>
                          Completed
                        </span>

                        <strong>
                          {formatNumber(
                            overview?.payments
                              ?.completed ??
                              0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pending
                        </span>

                        <strong>
                          {formatNumber(
                            overview?.payments
                              ?.pending ??
                              0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Failed
                        </span>

                        <strong>
                          {formatNumber(
                            overview?.payments
                              ?.failed ??
                              0,
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
                      <h2>
                        Ledger integrity
                      </h2>
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
                      <span>
                        Debits
                      </span>

                      <strong>
                        {formatMoney(
                          overview?.ledger
                            ?.debits ?? 0,
                          currency,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Credits
                      </span>

                      <strong>
                        {formatMoney(
                          overview?.ledger
                            ?.credits ?? 0,
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
                      <h2>
                        Risk posture
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="panel-icon-action"
                      onClick={() =>
                        selectModule("Risk")
                      }
                      title="Open risk"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>

                  <div className="risk-summary">
                    <div className="risk-score">
                      <strong>
                        {(
                          overview?.risk
                            ?.averageScore ??
                          0
                        ).toFixed(0)}
                      </strong>

                      <span>
                        Average score
                      </span>
                    </div>

                    <div className="risk-breakdown">
                      <div>
                        <span className="risk-dot risk-allowed" />
                        <span>
                          Allowed
                        </span>

                        <strong>
                          {formatNumber(
                            overview?.risk
                              ?.allowed ?? 0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span className="risk-dot risk-review" />
                        <span>
                          Review
                        </span>

                        <strong>
                          {formatNumber(
                            overview?.risk
                              ?.review ?? 0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span className="risk-dot risk-blocked" />
                        <span>
                          Blocked
                        </span>

                        <strong>
                          {formatNumber(
                            overview?.risk
                              ?.blocked ?? 0,
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

                      <h2>
                        Control runs
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="panel-icon-action"
                      onClick={() =>
                        selectModule(
                          "Reconciliation",
                        )
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
                          overview?.reconciliation
                            ?.completed ?? 0,
                        )}
                      </strong>

                      <span>
                        of{" "}
                        {formatNumber(
                          overview?.reconciliation
                            ?.total ?? 0,
                        )}{" "}
                        runs completed
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-value"
                        style={{
                          width: `${
                            (
                              overview
                                ?.reconciliation
                                ?.total ?? 0
                            ) > 0
                              ? Math.min(
                                  ((
                                    overview
                                      ?.reconciliation
                                      ?.completed ??
                                    0
                                  ) /
                                    (
                                      overview
                                        ?.reconciliation
                                        ?.total ??
                                      1
                                    )) *
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
                  <strong>
                    VOLTIS infrastructure
                    operational
                  </strong>

                  <span>
                    API and financial services
                    are connected. Organization
                    data is being served live.
                  </span>
                </div>

                <div className="system-strip-state">
                  <span className="status-dot status-dot-live" />
                  SYSTEM ONLINE
                </div>
              </div>
            </section>
          )}

          {/* ================================================== */}
          {/* ACCOUNTS */}
          {/* ================================================== */}

          {active === "Accounts" && (
            <section className="module-content">
              <div className="module-toolbar">
                <span className="module-count">
                  {formatNumber(
                    accounts.length,
                  )}{" "}
                  accounts
                </span>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    openAction("account")
                  }
                >
                  <Wallet size={16} />
                  Account action
                </button>
              </div>

              {moduleLoading ? (
                <ModuleLoading />
              ) : accounts.length === 0 ? (
                <EmptyState
                  icon={<Wallet size={23} />}
                  title="No accounts yet"
                  description="Financial accounts created for this organization will appear here."
                />
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            Account
                          </th>
                          <th>
                            Type
                          </th>
                          <th>
                            Currency
                          </th>
                          <th>
                            Balance
                          </th>
                          <th>
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {accounts.map(
                          (account) => (
                            <tr
                              key={
                                account.id
                              }
                              onClick={() =>
                                setSelectedRecord(
                                  account as unknown as GenericRecord,
                                )
                              }
                            >
                              <td>
                                <div className="table-primary">
                                  <strong>
                                    {
                                      account.name
                                    }
                                  </strong>

                                  <span>
                                    {
                                      account.code
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                {account.type}
                              </td>

                              <td>
                                {
                                  account.currency
                                }
                              </td>

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
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================================================== */}
          {/* TRANSACTIONS */}
          {/* ================================================== */}

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
                        setSearchQuery(
                          event.target.value,
                        )
                      }
                      placeholder="Search transactions…"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    openAction(
                      "transaction",
                    )
                  }
                >
                  <Activity size={16} />
                  Transaction action
                </button>
              </div>

              {moduleLoading ? (
                <ModuleLoading />
              ) : filteredTransactions.length ===
                0 ? (
                <EmptyState
                  icon={<Activity size={23} />}
                  title="No transactions found"
                  description="Transaction activity for this organization will appear here."
                />
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            Reference
                          </th>
                          <th>
                            Type
                          </th>
                          <th>
                            Amount
                          </th>
                          <th>
                            Status
                          </th>
                          <th>
                            Created
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTransactions.map(
                          (
                            transaction,
                          ) => (
                            <tr
                              key={
                                transaction.id
                              }
                              onClick={() =>
                                setSelectedTransaction(
                                  transaction,
                                )
                              }
                            >
                              <td>
                                <div className="table-primary">
                                  <strong>
                                    {
                                      transaction.reference
                                    }
                                  </strong>

                                  <span>
                                    {transaction.description ||
                                      "Financial transaction"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                {
                                  transaction.type
                                }
                              </td>

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
                                  {
                                    transaction.status
                                  }
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

          {/* ================================================== */}
          {/* PAYMENTS */}
          {/* ================================================== */}

          {active === "Payments" && (
            <section className="module-content">
              <div className="module-toolbar">
                <div className="module-toolbar-left">
                  <span className="module-count">
                    {formatNumber(
                      payments.length,
                    )}{" "}
                    payments
                  </span>

                  <div className="search-field">
                    <Search size={16} />

                    <input
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(
                          event.target.value,
                        )
                      }
                      placeholder="Search payments…"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    openAction(
                      "payment",
                    )
                  }
                >
                  <CreditCard size={16} />
                  New payment
                </button>
              </div>

              {moduleLoading ? (
                <ModuleLoading />
              ) : filteredPayments.length ===
                0 ? (
                <EmptyState
                  icon={<CreditCard size={23} />}
                  title="No payments found"
                  description="Payment activity for this organization will appear here."
                />
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            Payment
                          </th>
                          <th>
                            Amount
                          </th>
                          <th>
                            Status
                          </th>
                          <th>
                            Created
                          </th>
                          <th>
                            Reference
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredPayments.map(
                          (payment) => {
                            const id =
                              getRecordId(
                                payment,
                              );

                            return (
                              <tr
                                key={id}
                                onClick={() =>
                                  setSelectedRecord(
                                    payment,
                                  )
                                }
                              >
                                <td>
                                  <div className="table-primary">
                                    <strong>
                                      {readString(
                                        payment.reference ??
                                          payment.id,
                                        "Payment",
                                      )}
                                    </strong>

                                    <span>
                                      {readString(
                                        payment.type ??
                                          payment.method,
                                        "Payment operation",
                                      )}
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <strong>
                                    {formatMoney(
                                      readNumber(
                                        payment.amount,
                                      ),
                                      readString(
                                        payment.currency,
                                        currency,
                                      ),
                                    )}
                                  </strong>
                                </td>

                                <td>
                                  <span
                                    className={statusClass(
                                      readString(
                                        payment.status,
                                      ),
                                    )}
                                  >
                                    {readString(
                                      payment.status,
                                    )}
                                  </span>
                                </td>

                                <td>
                                  {formatDate(
                                    payment.createdAt ??
                                      payment.created_at,
                                  )}
                                </td>

                                <td>
                                  {readString(
                                    payment.reference,
                                  )}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================================================== */}
          {/* LEDGER */}
          {/* ================================================== */}

          {active === "Ledger" && (
            <section className="module-content">
              <div className="module-toolbar">
                <div>
                  <span className="module-count">
                    Double-entry ledger
                  </span>
                </div>

                <div className="live-indicator">
                  <span className="status-dot status-dot-live" />
                  Integrity monitored
                </div>
              </div>

              <div className="dashboard-grid">
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        CONTROL
                      </span>
                      <h2>
                        Ledger status
                      </h2>
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
                      <ShieldCheck size={22} />
                    </div>

                    <div>
                      <strong>
                        {ledgerBalanced
                          ? "Balanced"
                          : "Review required"}
                      </strong>

                      <span>
                        Debit and credit
                        integrity status
                      </span>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        VOLUME
                      </span>
                      <h2>
                        Ledger movement
                      </h2>
                    </div>
                  </div>

                  <div className="ledger-values">
                    <div>
                      <span>
                        Debits
                      </span>
                      <strong>
                        {formatMoney(
                          overview?.ledger
                            ?.debits ?? 0,
                          currency,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Credits
                      </span>
                      <strong>
                        {formatMoney(
                          overview?.ledger
                            ?.credits ?? 0,
                          currency,
                        )}
                      </strong>
                    </div>
                  </div>
                </article>
              </div>

              <div className="data-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">
                      RECENT TRANSACTION
                    </span>

                    <h2>
                      Ledger entries
                    </h2>
                  </div>
                </div>

                {ledgerEntries.length ===
                0 ? (
                  <EmptyState
                    icon={<BookOpen size={23} />}
                    title="No ledger entries available"
                    description="Entries will appear after financial transactions are posted."
                  />
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            Account
                          </th>
                          <th>
                            Direction
                          </th>
                          <th>
                            Amount
                          </th>
                          <th>
                            Currency
                          </th>
                          <th>
                            Entry
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {ledgerEntries.map(
                          (entry) => (
                            <tr
                              key={getRecordId(
                                entry,
                              )}
                              onClick={() =>
                                setSelectedRecord(
                                  entry,
                                )
                              }
                            >
                              <td>
                                {readString(
                                  entry.accountName ??
                                    entry.accountId,
                                )}
                              </td>

                              <td>
                                <span
                                  className={statusClass(
                                    readString(
                                      entry.direction ??
                                        entry.type,
                                    ),
                                  )}
                                >
                                  {readString(
                                    entry.direction ??
                                      entry.type,
                                  )}
                                </span>
                              </td>

                              <td>
                                <strong>
                                  {formatMoney(
                                    readNumber(
                                      entry.amount,
                                    ),
                                    readString(
                                      entry.currency,
                                      currency,
                                    ),
                                  )}
                                </strong>
                              </td>

                              <td>
                                {readString(
                                  entry.currency,
                                  currency,
                                )}
                              </td>

                              <td>
                                {readString(
                                  entry.description ??
                                    entry.id,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================== */}
          {/* RISK */}
          {/* ================================================== */}

          {active === "Risk" && (
            <section className="module-content">
              <div className="metric-grid">
                <MetricSmall
                  label="EVALUATIONS"
                  value={formatNumber(
                    overview?.risk?.total ??
                      riskItems.length,
                  )}
                />

                <MetricSmall
                  label="ALLOWED"
                  value={formatNumber(
                    overview?.risk?.allowed ??
                      0,
                  )}
                />

                <MetricSmall
                  label="REVIEW"
                  value={formatNumber(
                    overview?.risk?.review ??
                      0,
                  )}
                />

                <MetricSmall
                  label="BLOCKED"
                  value={formatNumber(
                    overview?.risk?.blocked ??
                      0,
                  )}
                />
              </div>

              <div className="module-toolbar">
                <span className="module-count">
                  Risk evaluations
                </span>

                <div className="live-indicator">
                  <span className="status-dot status-dot-live" />
                  Risk engine active
                </div>
              </div>

              {moduleLoading ? (
                <ModuleLoading />
              ) : riskItems.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck size={23} />}
                  title="No risk evaluations"
                  description="Risk evaluations will appear here as payments and financial events are assessed."
                />
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            Evaluation
                          </th>
                          <th>
                            Score
                          </th>
                          <th>
                            Decision
                          </th>
                          <th>
                            Payment
                          </th>
                          <th>
                            Created
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {riskItems.map(
                          (risk) => (
                            <tr
                              key={getRecordId(
                                risk,
                              )}
                              onClick={() =>
                                setSelectedRecord(
                                  risk,
                                )
                              }
                            >
                              <td>
                                {readString(
                                  risk.id,
                                  "Risk evaluation",
                                )}
                              </td>

                              <td>
                                <strong>
                                  {readNumber(
                                    risk.score ??
                                      risk.riskScore,
                                  ).toFixed(0)}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={statusClass(
                                    readString(
                                      risk.decision ??
                                        risk.status,
                                    ),
                                  )}
                                >
                                  {readString(
                                    risk.decision ??
                                      risk.status,
                                  )}
                                </span>
                              </td>

                              <td>
                                {readString(
                                  risk.paymentId,
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  risk.createdAt ??
                                    risk.created_at,
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

          {/* ================================================== */}
          {/* RECONCILIATION */}
          {/* ================================================== */}

          {active === "Reconciliation" && (
            <section className="module-content">
              <div className="module-toolbar">
                <div>
                  <span className="module-count">
                    {formatNumber(
                      reconciliationRuns.length,
                    )}{" "}
                    control runs
                  </span>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    runReconciliation
                  }
                  disabled={
                    reconciliationLoading
                  }
                >
                  <RefreshCw
                    size={16}
                    className={
                      reconciliationLoading
                        ? "spin-animation"
                        : ""
                    }
                  />
                  Run reconciliation
                </button>
              </div>

              <div className="dashboard-grid">
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        CONTROL ENGINE
                      </span>
                      <h2>
                        Reconciliation posture
                      </h2>
                    </div>
                  </div>

                  <div className="ledger-state ledger-balanced">
                    <div className="ledger-state-icon">
                      <CheckCircle2 size={22} />
                    </div>

                    <div>
                      <strong>
                        Control layer active
                      </strong>

                      <span>
                        Reconciliation can be
                        triggered against the
                        organization.
                      </span>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        COMPLETION
                      </span>
                      <h2>
                        Run completion
                      </h2>
                    </div>
                  </div>

                  <div className="reconciliation-summary">
                    <div className="reconciliation-number">
                      <strong>
                        {formatNumber(
                          overview?.reconciliation
                            ?.completed ??
                            0,
                        )}
                      </strong>

                      <span>
                        completed of{" "}
                        {formatNumber(
                          overview?.reconciliation
                            ?.total ??
                            0,
                        )}
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-value"
                        style={{
                          width: `${
                            (
                              overview
                                ?.reconciliation
                                ?.total ?? 0
                            ) > 0
                              ? Math.min(
                                  (
                                    (
                                      overview
                                        ?.reconciliation
                                        ?.completed ??
                                      0
                                    ) /
                                      (
                                        overview
                                          ?.reconciliation
                                          ?.total ??
                                        1
                                      )
                                  ) *
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

              {moduleLoading ? (
                <ModuleLoading />
              ) : reconciliationRuns.length ===
                0 ? (
                <EmptyState
                  icon={<FileCheck2 size={23} />}
                  title="No reconciliation runs"
                  description="Control runs will appear here after reconciliation is executed."
                />
              ) : (
                <div className="data-panel">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            Run
                          </th>
                          <th>
                            Status
                          </th>
                          <th>
                            Matched
                          </th>
                          <th>
                            Discrepancies
                          </th>
                          <th>
                            Created
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {reconciliationRuns.map(
                          (run) => (
                            <tr
                              key={getRecordId(
                                run,
                              )}
                              onClick={() =>
                                setSelectedRecord(
                                  run,
                                )
                              }
                            >
                              <td>
                                {readString(
                                  run.id,
                                )}
                              </td>

                              <td>
                                <span
                                  className={statusClass(
                                    readString(
                                      run.status,
                                    ),
                                  )}
                                >
                                  {readString(
                                    run.status,
                                  )}
                                </span>
                              </td>

                              <td>
                                {readString(
                                  run.matched ??
                                    run.matchedCount,
                                  "0",
                                )}
                              </td>

                              <td>
                                {readString(
                                  run.discrepancies ??
                                    run.discrepancyCount,
                                  "0",
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  run.createdAt ??
                                    run.created_at,
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

          {/* ================================================== */}
          {/* WEBHOOKS */}
          {/* ================================================== */}

          {active === "Webhooks" && (
            <section className="module-content">
              <div className="module-toolbar">
                <div>
                  <span className="module-count">
                    {formatNumber(
                      webhookEndpoints.length,
                    )}{" "}
                    endpoints
                  </span>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    openAction(
                      "webhook",
                    )
                  }
                >
                  <Webhook size={16} />
                  Add endpoint
                </button>
              </div>

              <div className="dashboard-grid">
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        ENDPOINTS
                      </span>

                      <h2>
                        Webhook infrastructure
                      </h2>
                    </div>
                  </div>

                  <div className="ledger-state ledger-balanced">
                    <div className="ledger-state-icon">
                      <Zap size={22} />
                    </div>

                    <div>
                      <strong>
                        Event delivery ready
                      </strong>

                      <span>
                        Manage endpoints and
                        inspect delivery activity.
                      </span>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        DELIVERIES
                      </span>

                      <h2>
                        Delivery activity
                      </h2>
                    </div>
                  </div>

                  <div className="metric-value">
                    {formatNumber(
                      webhookDeliveries.length,
                    )}
                  </div>

                  <div className="metric-footer">
                    <span>
                      Recorded deliveries
                    </span>
                  </div>
                </article>
              </div>

              {moduleLoading ? (
                <ModuleLoading />
              ) : (
                <>
                  <div className="data-panel">
                    <div className="panel-header">
                      <div>
                        <span className="panel-kicker">
                          CONFIGURATION
                        </span>

                        <h2>
                          Endpoints
                        </h2>
                      </div>
                    </div>

                    {webhookEndpoints.length ===
                    0 ? (
                      <EmptyState
                        icon={<Webhook size={23} />}
                        title="No webhook endpoints"
                        description="Create an endpoint to receive VOLTIS events."
                      />
                    ) : (
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                Endpoint
                              </th>
                              <th>
                                URL
                              </th>
                              <th>
                                Status
                              </th>
                              <th>
                                Created
                              </th>
                              <th />
                            </tr>
                          </thead>

                          <tbody>
                            {webhookEndpoints.map(
                              (
                                endpoint,
                              ) => {
                                const id =
                                  getRecordId(
                                    endpoint,
                                  );

                                return (
                                  <tr
                                    key={id}
                                  >
                                    <td>
                                      <strong>
                                        {readString(
                                          endpoint.name ??
                                            endpoint.id,
                                        )}
                                      </strong>
                                    </td>

                                    <td>
                                      {readString(
                                        endpoint.url,
                                      )}
                                    </td>

                                    <td>
                                      <span
                                        className={statusClass(
                                          readString(
                                            endpoint.status ??
                                              (
                                                endpoint.isActive
                                                  ? "active"
                                                  : "inactive"
                                              ),
                                          ),
                                        )}
                                      >
                                        {readString(
                                          endpoint.status ??
                                            (
                                              endpoint.isActive
                                                ? "active"
                                                : "inactive"
                                            ),
                                        )}
                                      </span>
                                    </td>

                                    <td>
                                      {formatDate(
                                        endpoint.createdAt ??
                                          endpoint.created_at,
                                      )}
                                    </td>

                                    <td>
                                      <button
                                        type="button"
                                        className="panel-icon-action"
                                        title="Delete endpoint"
                                        onClick={() =>
                                          deleteWebhook(
                                            id,
                                          )
                                        }
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="data-panel">
                    <div className="panel-header">
                      <div>
                        <span className="panel-kicker">
                          DELIVERY HISTORY
                        </span>

                        <h2>
                          Recent deliveries
                        </h2>
                      </div>
                    </div>

                    {webhookDeliveries.length ===
                    0 ? (
                      <EmptyState
                        icon={<Zap size={23} />}
                        title="No deliveries recorded"
                        description="Webhook delivery attempts will appear here."
                      />
                    ) : (
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>
                                Delivery
                              </th>
                              <th>
                                Event
                              </th>
                              <th>
                                Status
                              </th>
                              <th>
                                Attempt
                              </th>
                              <th>
                                Created
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {webhookDeliveries.map(
                              (
                                delivery,
                              ) => (
                                <tr
                                  key={getRecordId(
                                    delivery,
                                  )}
                                  onClick={() =>
                                    setSelectedRecord(
                                      delivery,
                                    )
                                  }
                                >
                                  <td>
                                    {readString(
                                      delivery.id,
                                    )}
                                  </td>

                                  <td>
                                    {readString(
                                      delivery.event ??
                                        delivery.eventType,
                                    )}
                                  </td>

                                  <td>
                                    <span
                                      className={statusClass(
                                        readString(
                                          delivery.status,
                                        ),
                                      )}
                                    >
                                      {readString(
                                        delivery.status,
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    {readString(
                                      delivery.attempt ??
                                        delivery.attempts,
                                      "0",
                                    )}
                                  </td>

                                  <td>
                                    {formatDate(
                                      delivery.createdAt ??
                                        delivery.created_at,
                                    )}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ================================================== */}
          {/* ANALYTICS */}
          {/* ================================================== */}

          {active === "Analytics" && (
            <section className="module-content">
              <div className="metric-grid">
                <MetricSmall
                  label="PAYMENT VOLUME"
                  value={formatMoney(
                    overview?.payments?.volume ??
                      0,
                    currency,
                  )}
                />

                <MetricSmall
                  label="PAYMENT SUCCESS"
                  value={`${(
                    overview?.payments
                      ?.successRate ?? 0
                  ).toFixed(1)}%`}
                />

                <MetricSmall
                  label="TRANSACTION VOLUME"
                  value={formatMoney(
                    overview?.transactions
                      ?.volume ?? 0,
                    currency,
                  )}
                />

                <MetricSmall
                  label="ACCOUNT BALANCE"
                  value={formatMoney(
                    overview?.accounts
                      ?.balance ?? 0,
                    currency,
                  )}
                />
              </div>

              <div className="dashboard-grid">
                <AnalyticsPanel
                  title="Payments analytics"
                  data={
                    analyticsPayments
                  }
                />

                <AnalyticsPanel
                  title="Risk analytics"
                  data={
                    analyticsRisk
                  }
                />

                <AnalyticsPanel
                  title="Accounts analytics"
                  data={
                    analyticsAccounts
                  }
                />

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        TRANSACTIONS
                      </span>

                      <h2>
                        Transaction mix
                      </h2>
                    </div>
                  </div>

                  <div className="analytics-list">
                    {Object.entries(
                      transactionAnalytics
                        ?.byStatus ?? {},
                    ).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="analytics-row"
                        >
                          <span>
                            {status}
                          </span>

                          <strong>
                            {formatNumber(
                              count,
                            )}
                          </strong>
                        </div>
                      ),
                    )}

                    {Object.keys(
                      transactionAnalytics
                        ?.byStatus ?? {},
                    ).length === 0 && (
                      <span className="muted-copy">
                        No transaction
                        analytics available.
                      </span>
                    )}
                  </div>
                </article>
              </div>

              <div className="data-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">
                      TRANSACTION ANALYTICS
                    </span>

                    <h2>
                      Transaction type distribution
                    </h2>
                  </div>
                </div>

                <div className="analytics-list analytics-list-wide">
                  {Object.entries(
                    transactionAnalytics
                      ?.byType ?? {},
                  ).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="analytics-row"
                      >
                        <span>
                          {type}
                        </span>

                        <strong>
                          {formatNumber(
                            count,
                          )}
                        </strong>
                      </div>
                    ),
                  )}

                  {Object.keys(
                    transactionAnalytics
                      ?.byType ?? {},
                  ).length === 0 && (
                    <span className="muted-copy">
                      No transaction type
                      analytics available.
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================== */}
          {/* SETTINGS */}
          {/* ================================================== */}

          {active === "Settings" && (
            <section className="module-content">
              <div className="dashboard-grid">
                <article className="panel panel-large">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        ORGANIZATION
                      </span>

                      <h2>
                        Organization settings
                      </h2>
                    </div>
                  </div>

                  <div className="settings-list">
                    <SettingRow
                      label="Organization name"
                      value={
                        organizationName
                      }
                    />

                    <SettingRow
                      label="Organization slug"
                      value={
                        organization?.slug ??
                        overview?.organization
                          ?.slug ??
                        "—"
                      }
                    />

                    <div className="setting-row setting-row-control">
                      <span>Default currency</span>
                      <select
                        className="settings-select"
                        value={settingsCurrency}
                        onChange={(event) =>
                          setSettingsCurrency(event.target.value)
                        }
                        aria-label="Default currency"
                      >
                        {['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR'].map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <SettingRow
                      label="Organization ID"
                      value={
                        organizationId ||
                        "—"
                      }
                    />

                    <SettingRow
                      label="Status"
                      value={
                        organization
                          ?.isActive ===
                        false
                          ? "Inactive"
                          : "Active"
                      }
                    />
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        OPERATOR
                      </span>

                      <h2>
                        Your profile
                      </h2>
                    </div>
                  </div>

                  <div className="settings-list">
                    <SettingRow
                      label="Name"
                      value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
                    />

                    <SettingRow
                      label="Email"
                      value={
                        user?.email ??
                        "—"
                      }
                    />

                    <SettingRow
                      label="Account status"
                      value={
                        user?.isActive
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        PREFERENCES
                      </span>

                      <h2>
                        Appearance
                      </h2>
                    </div>
                  </div>

                  <div className="theme-setting">
                    <button
                      type="button"
                      className={
                        theme === "dark"
                          ? "theme-option theme-option-active"
                          : "theme-option"
                      }
                      onClick={() =>
                        setTheme("dark")
                      }
                    >
                      <Moon size={17} />
                      <span>
                        Dark
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        theme === "light"
                          ? "theme-option theme-option-active"
                          : "theme-option"
                      }
                      onClick={() =>
                        setTheme("light")
                      }
                    >
                      <Sun size={17} />
                      <span>
                        Light
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={settingsSaving}
                    onClick={saveSettings}
                  >
                    <CheckCircle2 size={16} />
                    {settingsSaving
                      ? "Saved"
                      : "Save preferences"}
                  </button>
                </article>

                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        SESSION
                      </span>

                      <h2>
                        Access
                      </h2>
                    </div>
                  </div>

                  <p className="muted-copy">
                    Your authenticated VOLTIS
                    session is currently active.
                  </p>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={
                      handleLogout
                    }
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </article>
              </div>
            </section>
          )}

          <footer className="app-footer">
            <span>
              VOLTIS Financial Infrastructure
            </span>

            <span className="footer-separator">
              •
            </span>

            <span>
              Organization:{" "}
              {organizationName}
            </span>

            <span className="footer-separator">
              •
            </span>

            <span>
              Currency: {currency}
            </span>

            <span className="footer-version">
              Production architecture
            </span>
          </footer>
        </div>
      </main>

      {/* ====================================================== */}
      {/* RECORD DETAIL */}
      {/* ====================================================== */}

      {(selectedRecord ||
        selectedTransaction) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setSelectedRecord(null);
            setSelectedTransaction(
              null,
            );
          }}
        >
          <div
            className="detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-modal-header">
              <div>
                <span className="panel-kicker">
                  RECORD DETAIL
                </span>

                <h2>
                  {selectedTransaction
                    ? "Transaction"
                    : "Financial record"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setSelectedRecord(
                    null,
                  );
                  setSelectedTransaction(
                    null,
                  );
                }}
              >
                <X size={17} />
              </button>
            </div>

            <div className="detail-list">
              {selectedTransaction ? (
                <>
                  <SettingRow
                    label="Reference"
                    value={
                      selectedTransaction.reference
                    }
                  />

                  <SettingRow
                    label="Type"
                    value={
                      selectedTransaction.type
                    }
                  />

                  <SettingRow
                    label="Amount"
                    value={formatMoney(
                      selectedTransaction.amount,
                      selectedTransaction.currency,
                    )}
                  />

                  <SettingRow
                    label="Status"
                    value={
                      selectedTransaction.status
                    }
                  />

                  <SettingRow
                    label="Created"
                    value={formatDate(
                      selectedTransaction.createdAt,
                    )}
                  />

                  <SettingRow
                    label="Processed"
                    value={formatDate(
                      selectedTransaction.processedAt,
                    )}
                  />

                  <SettingRow
                    label="Description"
                    value={
                      selectedTransaction.description ??
                      "—"
                    }
                  />
                </>
              ) : (
                Object.entries(
                  selectedRecord ?? {},
                ).map(
                  ([key, value]) => (
                    <SettingRow
                      key={key}
                      label={key}
                      value={displayValue(
                        value,
                      )}
                    />
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* ACTION MODAL */}
      {/* ====================================================== */}

      {actionOpen && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setActionOpen(false)
          }
        >
          <div
            className="detail-modal action-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-modal-header">
              <div>
                <span className="panel-kicker">
                  VOLTIS ACTION
                </span>

                <h2>
                  {actionType ===
                    "account" &&
                    "Account action"}

                  {actionType ===
                    "transaction" &&
                    "Transaction action"}

                  {actionType ===
                    "payment" &&
                    "Create payment"}

                  {actionType ===
                    "webhook" &&
                    "Create webhook endpoint"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setActionOpen(false)
                }
              >
                <X size={17} />
              </button>
            </div>

            <p className="muted-copy">
              Submit the backend payload for
              this operation. VOLTIS will send
              it directly to the corresponding
              financial infrastructure endpoint.
            </p>

            <textarea
              className="json-editor"
              value={actionJson}
              onChange={(event) =>
                setActionJson(
                  event.target.value,
                )
              }
              spellCheck={false}
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setActionOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={actionLoading}
                onClick={
                  submitAction
                }
              >
                {actionLoading ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin-animation"
                    />
                    Processing…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Execute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * ------------------------------------------------------------
 * SMALL COMPONENTS
 * ------------------------------------------------------------
 */

function ModuleLoading() {
  return (
    <div className="module-loading">
      <RefreshCw
        size={20}
        className="spin-animation"
      />
      Loading module…
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

function MetricSmall({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">
          {label}
        </span>

        <ArrowUpRight
          size={16}
          className="metric-trend"
        />
      </div>

      <div className="metric-value">
        {value}
      </div>
    </article>
  );
}

function AnalyticsPanel({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  const records = asRecords(data);

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            ANALYTICS
          </span>

          <h2>{title}</h2>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="analytics-list">
          {typeof data === "object" &&
          data !== null &&
          !Array.isArray(data) ? (
            Object.entries(
              data as GenericRecord,
            )
              .slice(0, 8)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="analytics-row"
                >
                  <span>{key}</span>
                  <strong>
                    {displayValue(
                      value,
                    )}
                  </strong>
                </div>
              ))
          ) : (
            <span className="muted-copy">
              No analytics data available.
            </span>
          )}
        </div>
      ) : (
        <div className="analytics-list">
          {records
            .slice(0, 8)
            .map((record) => (
              <div
                key={getRecordId(
                  record,
                )}
                className="analytics-row"
              >
                <span>
                  {readString(
                    record.name ??
                      record.label ??
                      record.status ??
                      record.id,
                  )}
                </span>

                <strong>
                  {readString(
                    record.value ??
                      record.count ??
                      record.total,
                    "0",
                  )}
                </strong>
              </div>
            ))}
        </div>
      )}
    </article>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}