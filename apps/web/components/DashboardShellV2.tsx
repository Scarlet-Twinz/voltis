"use client";

import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
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
import { api, type Account, type Organization, type OverviewData, type Transaction, type TransactionsResponse } from "../lib/api";
import { useAuth } from "./AuthProvider";

type Module = "Overview" | "Accounts" | "Transactions" | "Payments" | "Ledger" | "Risk" | "Reconciliation" | "Webhooks" | "Analytics" | "Settings";
type RecordValue = Record<string, unknown>;
type PaymentMethod = "card" | "bank_transfer" | "wallet" | "cash";

const nav: { label: Module; icon: typeof LayoutDashboard; section?: string }[] = [
  { label: "Overview", icon: LayoutDashboard, section: "Workspace" },
  { label: "Accounts", icon: Wallet },
  { label: "Transactions", icon: Activity },
  { label: "Payments", icon: CreditCard, section: "Financial operations" },
  { label: "Ledger", icon: BookOpen },
  { label: "Risk", icon: ShieldCheck, section: "Control" },
  { label: "Reconciliation", icon: FileCheck2 },
  { label: "Webhooks", icon: Webhook, section: "Infrastructure" },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings, section: "System" },
];

function money(value: unknown, currency = "NGN") {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return `${currency} 0.00`;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function number(value: unknown) { return new Intl.NumberFormat("en-NG").format(Number(value ?? 0)); }
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
function text(value: unknown, fallback = "—") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}
function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter((x): x is RecordValue => !!x && typeof x === "object" && !Array.isArray(x)) : [];
}
function statusClass(value: unknown) {
  const s = text(value).toLowerCase();
  if (["completed", "success", "successful", "active", "allowed", "healthy", "delivered"].includes(s)) return "status success";
  if (["failed", "blocked", "cancelled", "canceled", "inactive", "error"].includes(s)) return "status danger";
  if (["pending", "processing", "review", "retrying"].includes(s)) return "status warning";
  return "status neutral";
}
function initials(value: string) { return value.trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join("") || "V"; }

export default function DashboardShellV2() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [active, setActive] = useState<Module>("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionAnalytics, setTransactionAnalytics] = useState<TransactionsResponse | null>(null);
  const [payments, setPayments] = useState<RecordValue[]>([]);
  const [risk, setRisk] = useState<RecordValue[]>([]);
  const [reconciliation, setReconciliation] = useState<RecordValue[]>([]);
  const [endpoints, setEndpoints] = useState<RecordValue[]>([]);
  const [deliveries, setDeliveries] = useState<RecordValue[]>([]);
  const [analyticsPayments, setAnalyticsPayments] = useState<unknown>(null);
  const [analyticsRisk, setAnalyticsRisk] = useState<unknown>(null);
  const [analyticsAccounts, setAnalyticsAccounts] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RecordValue | Transaction | null>(null);
  const [modal, setModal] = useState<"payment" | "webhook" | "account" | "transaction" | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingsCurrency, setSettingsCurrency] = useState("NGN");
  const [paymentForm, setPaymentForm] = useState({ debitAccountId: "", creditAccountId: "", method: "card" as PaymentMethod, amount: "", currency: "NGN", idempotencyKey: "", description: "" });
  const [webhookForm, setWebhookForm] = useState({ url: "", secret: "" });
  const organizationId = organization?.id ?? "";

  useEffect(() => {
    const saved = window.localStorage.getItem("voltis_theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("voltis_theme", theme); }, [theme]);
  useEffect(() => { if (organization?.defaultCurrency) { setSettingsCurrency(organization.defaultCurrency); setPaymentForm(x => ({ ...x, currency: organization.defaultCurrency })); } }, [organization?.defaultCurrency]);

  async function loadWorkspace() {
    const orgs = await api.organizations.list();
    setOrganizations(Array.isArray(orgs) ? orgs : []);
    const org = orgs?.[0] ?? null;
    setOrganization(org);
    if (org) setSettingsCurrency(org.defaultCurrency);
    return org?.id ?? "";
  }
  async function loadModule(module: Module, orgId = organizationId) {
    if (!orgId || module === "Settings") return;
    if (module === "Overview") setOverview(await api.analytics.overview(orgId));
    if (module === "Accounts") setAccounts(await api.accounts.list(orgId));
    if (module === "Transactions" || module === "Ledger") {
      const [tx, a] = await Promise.all([api.transactions.list(orgId), api.transactions.analytics(orgId)]);
      setTransactions(tx); setTransactionAnalytics(a);
    }
    if (module === "Payments") setPayments(records(await api.payments.list(orgId)));
    if (module === "Risk") setRisk(records(await api.risk.list(orgId)));
    if (module === "Reconciliation") setReconciliation(records(await api.reconciliation.list(orgId)));
    if (module === "Webhooks") { const [e, d] = await Promise.all([api.webhooks.endpoints(orgId), api.webhooks.deliveries(orgId)]); setEndpoints(records(e)); setDeliveries(records(d)); }
    if (module === "Analytics") {
      const [o, p, r, a, t] = await Promise.all([api.analytics.overview(orgId), api.analytics.payments(orgId), api.analytics.risk(orgId), api.analytics.accounts(orgId), api.transactions.analytics(orgId)]);
      setOverview(o); setAnalyticsPayments(p); setAnalyticsRisk(r); setAnalyticsAccounts(a); setTransactionAnalytics(t);
    }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { setLoading(true); setError(""); const id = await loadWorkspace(); if (!cancelled && id) await loadModule("Overview", id); }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load workspace."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!organizationId || active === "Overview") return;
    let cancelled = false;
    (async () => { try { setBusy(true); setError(""); await loadModule(active); } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : `Unable to load ${active}.`); } finally { if (!cancelled) setBusy(false); } })();
    return () => { cancelled = true; };
  }, [organizationId, active]);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(t => [t.reference, t.type, t.status, t.currency, t.description ?? ""].some(v => v.toLowerCase().includes(q)));
  }, [transactions, search]);
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(p => Object.values(p).some(v => String(v ?? "").toLowerCase().includes(q)));
  }, [payments, search]);
  const currency = organization?.defaultCurrency ?? overview?.organization?.defaultCurrency ?? "NGN";
  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";

  function select(module: Module) { setActive(module); setSearch(""); setError(""); setSelected(null); setMobileOpen(false); }
  function openPayment() { setPaymentForm(x => ({ ...x, idempotencyKey: `pay_${crypto.randomUUID()}`, currency, amount: "", description: "" })); setModal("payment"); }
  function openWebhook() { setWebhookForm({ url: "", secret: "" }); setModal("webhook"); }
  async function createPayment() {
    if (!organizationId) return;
    if (!paymentForm.debitAccountId || !paymentForm.creditAccountId || !paymentForm.amount || !paymentForm.idempotencyKey) { setError("Complete the required payment fields before creating the payment."); return; }
    try { setSaving(true); setError(""); await api.payments.create({ organizationId, ...paymentForm }); setModal(null); await loadModule("Payments"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to create payment."); } finally { setSaving(false); }
  }
  async function createWebhook() {
    if (!organizationId) return;
    if (!webhookForm.url || !webhookForm.secret) { setError("Enter the endpoint URL and signing secret."); return; }
    try { setSaving(true); setError(""); await api.webhooks.createEndpoint(organizationId, webhookForm); setModal(null); await loadModule("Webhooks"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to create webhook endpoint."); } finally { setSaving(false); }
  }
  async function deleteWebhook(id: string) { try { setError(""); await api.webhooks.deleteEndpoint(id); await loadModule("Webhooks"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete endpoint."); } }
  async function runReconciliation() { try { setBusy(true); setError(""); await api.reconciliation.run(organizationId); await loadModule("Reconciliation"); } catch (e) { setError(e instanceof Error ? e.message : "Unable to run reconciliation."); } finally { setBusy(false); } }
  async function saveSettings() { try { setSaving(true); const updated = await api.organizations.update(organizationId, { defaultCurrency: settingsCurrency }); setOrganization(updated); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save settings."); } finally { setSaving(false); } }
  async function logoutNow() { logout(); router.replace("/login"); }

  if (loading) return <div className="v2-loading"><div className="v2-logo">V</div><strong>VOLTIS</strong><span>Preparing your financial workspace…</span></div>;

  return (
    <div className={`v2-shell ${collapsed ? "is-collapsed" : ""}`}>
      {mobileOpen && <button className="v2-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <aside className={`v2-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="v2-brand"><div className="v2-brand-mark">V</div>{!collapsed && <div><strong>VOLTIS</strong><span>Financial infrastructure</span></div>}<button className="v2-collapse" onClick={() => setCollapsed(v => !v)}>{collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button></div>
        <div className="v2-org"><div className="v2-avatar">{initials(organization?.name ?? "VOLTIS")}</div>{!collapsed && <div><small>ORGANIZATION</small><strong>{organization?.name ?? "VOLTIS"}</strong></div>}{!collapsed && organizations.length > 1 && <ChevronDown size={15}/>}</div>
        <nav className="v2-nav">{nav.map(item => { const Icon = item.icon; return <div key={item.label}>{item.section && !collapsed && <div className="v2-section">{item.section}</div>}<button className={`v2-nav-item ${active === item.label ? "active" : ""}`} onClick={() => select(item.label)} title={collapsed ? item.label : undefined}><Icon size={17}/>{!collapsed && <span>{item.label}</span>}</button></div>; })}</nav>
        <div className="v2-sidebar-bottom"><div className="v2-online"><i/> {!collapsed && <span>System online</span>}</div><button className="v2-signout" onClick={logoutNow}><LogOut size={16}/>{!collapsed && <span>Sign out</span>}</button></div>
      </aside>

      <main className="v2-main">
        <header className="v2-topbar"><div className="v2-top-left"><button className="v2-icon mobile-only" onClick={() => setMobileOpen(true)}><Menu size={18}/></button><div className="v2-crumb"><span>VOLTIS</span><b>/</b><strong>{active}</strong></div></div><div className="v2-top-actions"><button className="v2-icon" onClick={() => loadModule(active)} disabled={busy}><RefreshCw size={17} className={busy ? "spin" : ""}/></button><button className="v2-icon"><Bell size={17}/><i/></button><button className="v2-icon" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="v2-user"><div>{initials(displayName)}</div><span><strong>{displayName}</strong><small>{user?.email}</small></span></div></div></header>
        <div className="v2-content">
          <div className="v2-page-head"><div><small>FINANCIAL CONTROL CENTER</small><h1>{active === "Overview" ? `Welcome back, ${displayName}.` : active}</h1><p>{active === "Overview" ? "Monitor payments, ledger integrity, risk and financial activity from one control surface." : `Manage ${active.toLowerCase()} across your VOLTIS organization.`}</p></div><div className="v2-head-meta"><span><i/> Live</span><b>{currency}</b></div></div>
          {error && <div className="v2-error"><X size={17}/><div><strong>Operation needs attention</strong><span>{error}</span></div><button onClick={() => setError("")}><X size={15}/></button></div>}

          {active === "Overview" && <OverviewView overview={overview} currency={currency} onPayments={() => select("Payments")} onRisk={() => select("Risk")} />}
          {active === "Accounts" && <AccountsView accounts={accounts} currency={currency} />}
          {active === "Transactions" && <TransactionsView transactions={filteredTransactions} analytics={transactionAnalytics} search={search} setSearch={setSearch} onSelect={setSelected} />}
          {active === "Payments" && <PaymentsView payments={filteredPayments} search={search} setSearch={setSearch} onCreate={openPayment} onSelect={setSelected} />}
          {active === "Ledger" && <LedgerView transactions={transactions} />}
          {active === "Risk" && <RiskView items={risk} />}
          {active === "Reconciliation" && <ReconciliationView runs={reconciliation} onRun={runReconciliation} busy={busy} />}
          {active === "Webhooks" && <WebhooksView endpoints={endpoints} deliveries={deliveries} onCreate={openWebhook} onDelete={deleteWebhook} />}
          {active === "Analytics" && <AnalyticsView overview={overview} payments={analyticsPayments} risk={analyticsRisk} accounts={analyticsAccounts} transactionAnalytics={transactionAnalytics} currency={currency} />}
          {active === "Settings" && <SettingsView currency={settingsCurrency} setCurrency={setSettingsCurrency} theme={theme} setTheme={setTheme} onSave={saveSettings} saving={saving} onSignOut={logoutNow} />}
          <footer className="v2-footer">VOLTIS Financial Infrastructure <span>•</span> {organization?.name ?? "Organization"} <span>•</span> {currency} <em>Production architecture</em></footer>
        </div>
      </main>

      {selected && <DetailModal value={selected} onClose={() => setSelected(null)} />}
      {modal === "payment" && <Modal title="Create payment" eyebrow="PAYMENT OPERATION" onClose={() => setModal(null)}><PaymentForm form={paymentForm} setForm={setPaymentForm} accounts={accounts} saving={saving} onSubmit={createPayment} onCancel={() => setModal(null)} /></Modal>}
      {modal === "webhook" && <Modal title="Add webhook endpoint" eyebrow="EVENT DELIVERY" onClose={() => setModal(null)}><WebhookForm form={webhookForm} setForm={setWebhookForm} saving={saving} onSubmit={createWebhook} onCancel={() => setModal(null)} /></Modal>}
    </div>
  );
}

function OverviewView({ overview, currency, onPayments, onRisk }: { overview: OverviewData | null; currency: string; onPayments: () => void; onRisk: () => void }) {
  const p = overview?.payments; const t = overview?.transactions; const a = overview?.accounts; const r = overview?.risk;
  return <section className="v2-module"><div className="v2-metrics"><Metric label="PAYMENT VOLUME" value={money(p?.volume, currency)} note={`${number(p?.total)} payments`} /><Metric label="TRANSACTIONS" value={number(t?.total)} note={`${number(t?.completed)} completed`} /><Metric label="ACCOUNTS" value={number(a?.total)} note={money(a?.balance, currency)} /><Metric label="RISK EVALUATIONS" value={number(r?.total)} note={`Average score ${number(r?.averageScore)}`} /></div><div className="v2-grid two"><Panel title="Payment performance" eyebrow="FINANCIAL OPERATIONS" action="View payments" onAction={onPayments}><div className="v2-performance"><div><span>Success rate</span><strong>{(p?.successRate ?? 0).toFixed(1)}%</strong><div className="v2-progress"><i style={{ width: `${Math.min(Math.max(p?.successRate ?? 0, 0), 100)}%` }}/></div></div><div className="v2-stat-row"><Stat label="Completed" value={number(p?.completed)}/><Stat label="Pending" value={number(p?.pending)}/><Stat label="Failed" value={number(p?.failed)}/></div></div></Panel><Panel title="Ledger integrity" eyebrow="LEDGER CONTROL"><State ok={overview?.ledger?.balanced ?? true} title={overview?.ledger?.balanced ? "Ledger balanced" : "Ledger requires review"} text="Debits and credits are aligned for the organization."/><div className="v2-mini-grid"><Stat label="Debits" value={money(overview?.ledger?.debits, currency)}/><Stat label="Credits" value={money(overview?.ledger?.credits, currency)}/></div></Panel><Panel title="Risk posture" eyebrow="RISK ENGINE" action="Open risk" onAction={onRisk}><div className="v2-risk-score"><strong>{number(r?.averageScore)}</strong><span>Average score</span></div><div className="v2-risk-list"><Stat label="Allowed" value={number(r?.allowed)}/><Stat label="Review" value={number(r?.review)}/><Stat label="Blocked" value={number(r?.blocked)}/></div></Panel><Panel title="Reconciliation" eyebrow="CONTROL"><div className="v2-control"><CheckCircle2 size={20}/><div><strong>{number(overview?.reconciliation?.completed)} completed</strong><span>{number(overview?.reconciliation?.total)} total runs</span></div></div></Panel></div></section>;
}
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article className="v2-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="v2-stat"><span>{label}</span><strong>{value}</strong></div>; }
function Panel({ title, eyebrow, action, onAction, children }: { title: string; eyebrow: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <article className="v2-panel"><header><div><small>{eyebrow}</small><h2>{title}</h2></div>{action && <button onClick={onAction}>{action}<Zap size={14}/></button>}</header><div className="v2-panel-body">{children}</div></article>; }
function State({ ok, title, text: copy }: { ok: boolean; title: string; text: string }) { return <div className={`v2-state ${ok ? "ok" : "bad"}`}><CheckCircle2 size={20}/><div><strong>{title}</strong><span>{copy}</span></div></div>; }
function Empty({ title, copy }: { title: string; copy: string }) { return <div className="v2-empty"><div>○</div><strong>{title}</strong><span>{copy}</span></div>; }

function AccountsView({ accounts, currency }: { accounts: Account[]; currency: string }) { return <section className="v2-module"><div className="v2-metrics"><Metric label="ACCOUNTS" value={number(accounts.length)} note="Financial accounts"/><Metric label="ACTIVE" value={number(accounts.filter(a => a.isActive).length)} note="Operational"/><Metric label="TOTAL BALANCE" value={money(accounts.reduce((s,a) => s + Number(a.balance || 0), 0), currency)} note={currency}/></div><DataPanel title="Accounts" eyebrow="ACCOUNT REGISTRY">{accounts.length === 0 ? <Empty title="No accounts yet" copy="Create accounts through the financial account workflow."/> : <Table headers={["Account","Code","Type","Currency","Balance","Status"]}>{accounts.map(a => <tr key={a.id}><td><strong>{a.name}</strong></td><td>{a.code}</td><td>{a.type}</td><td>{a.currency}</td><td>{money(a.balance, a.currency)}</td><td><span className={statusClass(a.isActive ? "active" : "inactive")}>{a.isActive ? "Active" : "Inactive"}</span></td></tr>)}</Table>}</DataPanel></section>; }
function TransactionsView({ transactions, analytics, search, setSearch, onSelect }: { transactions: Transaction[]; analytics: TransactionsResponse | null; search: string; setSearch: (v: string) => void; onSelect: (v: Transaction) => void }) { return <section className="v2-module"><div className="v2-metrics"><Metric label="TOTAL" value={number(analytics?.total ?? transactions.length)} note="Transactions"/><Metric label="COMPLETED" value={number(analytics?.byStatus?.completed)} note="Settled"/><Metric label="FAILED" value={number(analytics?.byStatus?.failed)} note="Requires attention"/></div><DataPanel title="Transactions" eyebrow="TRANSACTION ENGINE" toolbar={<input className="v2-search" placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)}/>}>{transactions.length === 0 ? <Empty title="No transactions" copy="Transactions created by the financial engine will appear here."/> : <Table headers={["Reference","Type","Amount","Currency","Status","Created"]}>{transactions.map(t => <tr key={t.id} onClick={() => onSelect(t)} className="clickable"><td><strong>{t.reference}</strong><small>{t.description ?? "—"}</small></td><td>{t.type}</td><td>{money(t.amount, t.currency)}</td><td>{t.currency}</td><td><span className={statusClass(t.status)}>{t.status}</span></td><td>{date(t.createdAt)}</td></tr>)}</Table>}</DataPanel></section>; }
function PaymentsView({ payments, search, setSearch, onCreate, onSelect }: { payments: RecordValue[]; search: string; setSearch: (v: string) => void; onCreate: () => void; onSelect: (v: RecordValue) => void }) { return <section className="v2-module"><div className="v2-actionbar"><div><small>PAYMENT PROCESSING</small><strong>{number(payments.length)} recorded payments</strong></div><button className="v2-primary" onClick={onCreate}><CreditCard size={16}/> Create payment</button></div><DataPanel title="Payments" eyebrow="PAYMENT REGISTRY" toolbar={<input className="v2-search" placeholder="Search payments…" value={search} onChange={e => setSearch(e.target.value)}/>} >{payments.length === 0 ? <Empty title="No payments yet" copy="Create your first payment using the guided payment form."/> : <Table headers={["Payment","Amount","Method","Status","Created"]}>{payments.map(p => <tr key={String(p.id ?? Math.random())} className="clickable" onClick={() => onSelect(p)}><td><strong>{text(p.id ?? p.paymentId)}</strong><small>{text(p.description, "Payment")}</small></td><td>{money(p.amount, text(p.currency, "NGN"))}</td><td>{text(p.method)}</td><td><span className={statusClass(p.status)}>{text(p.status)}</span></td><td>{date(p.createdAt)}</td></tr>)}</Table>}</DataPanel></section>; }
function LedgerView({ transactions }: { transactions: Transaction[] }) { return <section className="v2-module"><Panel title="Ledger explorer" eyebrow="DOUBLE-ENTRY LEDGER"><State ok title="Ledger engine available" text="Ledger entries are linked to individual transactions."/><div className="v2-callout"><BookOpen size={18}/><div><strong>{number(transactions.length)} transactions available</strong><span>Open a transaction from the Transactions module to inspect its financial record.</span></div></div></Panel></section>; }
function RiskView({ items }: { items: RecordValue[] }) { return <section className="v2-module"><div className="v2-metrics"><Metric label="EVALUATIONS" value={number(items.length)} note="Risk decisions"/></div><DataPanel title="Risk assessments" eyebrow="RISK ENGINE">{items.length === 0 ? <Empty title="No risk assessments" copy="Risk decisions will appear here when payments are evaluated."/> : <Table headers={["Assessment","Decision","Score","Created"]}>{items.map(x => <tr key={String(x.id ?? Math.random())}><td>{text(x.id)}</td><td><span className={statusClass(x.decision)}>{text(x.decision)}</span></td><td>{text(x.score)}</td><td>{date(x.createdAt)}</td></tr>)}</Table>}</DataPanel></section>; }
function ReconciliationView({ runs, onRun, busy }: { runs: RecordValue[]; onRun: () => void; busy: boolean }) { return <section className="v2-module"><div className="v2-actionbar"><div><small>CONTROL ENGINE</small><strong>{number(runs.length)} reconciliation runs</strong></div><button className="v2-primary" onClick={onRun} disabled={busy}><RefreshCw size={16} className={busy ? "spin" : ""}/> Run reconciliation</button></div><DataPanel title="Reconciliation history" eyebrow="RECONCILIATION">{runs.length === 0 ? <Empty title="No reconciliation runs" copy="Run reconciliation when you are ready to verify ledger consistency."/> : <Table headers={["Run","Status","Matched","Discrepancies","Created"]}>{runs.map(r => <tr key={String(r.id ?? Math.random())}><td>{text(r.id)}</td><td><span className={statusClass(r.status)}>{text(r.status)}</span></td><td>{text(r.matched ?? r.matchedCount, "0")}</td><td>{text(r.discrepancies ?? r.discrepancyCount, "0")}</td><td>{date(r.createdAt ?? r.created_at)}</td></tr>)}</Table>}</DataPanel></section>; }
function WebhooksView({ endpoints, deliveries, onCreate, onDelete }: { endpoints: RecordValue[]; deliveries: RecordValue[]; onCreate: () => void; onDelete: (id: string) => void }) { return <section className="v2-module"><div className="v2-actionbar"><div><small>EVENT DELIVERY</small><strong>{number(endpoints.length)} endpoints · {number(deliveries.length)} deliveries</strong></div><button className="v2-primary" onClick={onCreate}><Webhook size={16}/> Add endpoint</button></div><div className="v2-grid two"><Panel title="Webhook infrastructure" eyebrow="ENDPOINTS"><State ok title="Event delivery ready" text="Endpoints receive signed VOLTIS events."/></Panel><Panel title="Delivery activity" eyebrow="DELIVERIES"><div className="v2-big-number">{number(deliveries.length)}</div><span className="v2-muted">Recorded deliveries</span></Panel></div><DataPanel title="Configured endpoints" eyebrow="CONFIGURATION">{endpoints.length === 0 ? <Empty title="No webhook endpoints" copy="Add an endpoint using the guided form."/> : <Table headers={["Endpoint","URL","Status","Created","Action"]}>{endpoints.map(e => { const id = text(e.id); return <tr key={id}><td><strong>{text(e.name, id)}</strong></td><td>{text(e.url)}</td><td><span className={statusClass(e.status ?? (e.isActive ? "active" : "inactive"))}>{text(e.status ?? (e.isActive ? "active" : "inactive"))}</span></td><td>{date(e.createdAt ?? e.created_at)}</td><td><button className="v2-danger-icon" onClick={() => onDelete(id)}><Trash2 size={15}/></button></td></tr>; })}</Table>}</DataPanel></section>; }
function AnalyticsView({ overview, payments, risk, accounts, transactionAnalytics, currency }: { overview: OverviewData | null; payments: unknown; risk: unknown; accounts: unknown; transactionAnalytics: TransactionsResponse | null; currency: string }) { return <section className="v2-module"><div className="v2-metrics"><Metric label="PAYMENT VOLUME" value={money(overview?.payments?.volume, currency)} note="Payment processing"/><Metric label="SUCCESS RATE" value={`${(overview?.payments?.successRate ?? 0).toFixed(1)}%`} note="Completed payments"/><Metric label="TRANSACTION VOLUME" value={money(overview?.transactions?.volume, currency)} note="Financial activity"/><Metric label="ACCOUNT BALANCE" value={money(overview?.accounts?.balance, currency)} note="Current balance"/></div><div className="v2-grid two"><AnalyticsCard title="Payments analytics" data={payments}/><AnalyticsCard title="Risk analytics" data={risk}/><AnalyticsCard title="Accounts analytics" data={accounts}/><Panel title="Transaction mix" eyebrow="TRANSACTIONS"><DataRows data={transactionAnalytics?.byStatus}/><DataRows data={transactionAnalytics?.byType}/></Panel></div></section>; }
function AnalyticsCard({ title, data }: { title: string; data: unknown }) { return <Panel title={title} eyebrow="ANALYTICS"><DataRows data={data}/></Panel>; }
function DataRows({ data }: { data: unknown }) { if (!data || typeof data !== "object") return <Empty title="No analytics data" copy="There is no data to display yet."/>; const entries = Object.entries(data as RecordValue).slice(0, 10); return <div className="v2-rows">{entries.map(([k,v]) => <div key={k}><span>{k}</span><strong>{typeof v === "object" ? JSON.stringify(v) : String(v)}</strong></div>)}</div>; }
function SettingsView({ currency, setCurrency, theme, setTheme, onSave, saving, onSignOut }: { currency: string; setCurrency: (v: string) => void; theme: "dark" | "light"; setTheme: (v: "dark" | "light") => void; onSave: () => void; saving: boolean; onSignOut: () => void }) { return <section className="v2-module"><div className="v2-grid two"><Panel title="Workspace preferences" eyebrow="ORGANIZATION"><label className="v2-field"><span>Default currency</span><select value={currency} onChange={e => setCurrency(e.target.value)}><option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option></select></label><div className="v2-theme"><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={16}/> Dark</button><button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={16}/> Light</button></div><button className="v2-primary" onClick={onSave} disabled={saving}><CheckCircle2 size={16}/> {saving ? "Saving…" : "Save preferences"}</button></Panel><Panel title="Session" eyebrow="ACCESS"><p className="v2-muted">Your authenticated VOLTIS session is active.</p><button className="v2-secondary" onClick={onSignOut}><LogOut size={16}/> Sign out</button></Panel></div></section>; }
function DataPanel({ title, eyebrow, toolbar, children }: { title: string; eyebrow: string; toolbar?: React.ReactNode; children: React.ReactNode }) { return <article className="v2-data"><header><div><small>{eyebrow}</small><h2>{title}</h2></div>{toolbar}</header><div>{children}</div></article>; }
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="v2-table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }

function Modal({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) { return <div className="v2-modal-backdrop" onClick={onClose}><div className="v2-modal" onClick={e => e.stopPropagation()}><header><div><small>{eyebrow}</small><h2>{title}</h2></div><button className="v2-icon" onClick={onClose}><X size={17}/></button></header>{children}</div></div>; }
function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) { return <label className="v2-field"><span>{label}{required && <b>*</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
function PaymentForm({ form, setForm, accounts, saving, onSubmit, onCancel }: { form: { debitAccountId: string; creditAccountId: string; method: PaymentMethod; amount: string; currency: string; idempotencyKey: string; description: string }; setForm: React.Dispatch<React.SetStateAction<{ debitAccountId: string; creditAccountId: string; method: PaymentMethod; amount: string; currency: string; idempotencyKey: string; description: string }>>; accounts: Account[]; saving: boolean; onSubmit: () => void; onCancel: () => void }) { return <><div className="v2-form-grid"><Field label="Debit account" required><select value={form.debitAccountId} onChange={e => setForm(x => ({ ...x, debitAccountId: e.target.value }))}><option value="">Select account…</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name} · {a.currency}</option>)}</select></Field><Field label="Credit account" required><select value={form.creditAccountId} onChange={e => setForm(x => ({ ...x, creditAccountId: e.target.value }))}><option value="">Select account…</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name} · {a.currency}</option>)}</select></Field><Field label="Amount" required hint="Enter minor currency units, e.g. 1000 = NGN 10.00 if your ledger uses kobo. "><input inputMode="numeric" value={form.amount} onChange={e => setForm(x => ({ ...x, amount: e.target.value.replace(/\D/g, "") }))} placeholder="100000" /></Field><Field label="Currency" required><select value={form.currency} onChange={e => setForm(x => ({ ...x, currency: e.target.value }))}><option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option></select></Field><Field label="Payment method" required><select value={form.method} onChange={e => setForm(x => ({ ...x, method: e.target.value as PaymentMethod }))}><option value="card">Card</option><option value="bank_transfer">Bank transfer</option><option value="wallet">Wallet</option><option value="cash">Cash</option></select></Field><Field label="Idempotency key" required hint="Generated automatically so retries do not create duplicate payments."><input value={form.idempotencyKey} onChange={e => setForm(x => ({ ...x, idempotencyKey: e.target.value }))} /></Field><Field label="Description"><input value={form.description} onChange={e => setForm(x => ({ ...x, description: e.target.value }))} placeholder="Optional payment description" /></Field></div><div className="v2-modal-actions"><button className="v2-secondary" onClick={onCancel}>Cancel</button><button className="v2-primary" onClick={onSubmit} disabled={saving}>{saving ? <><RefreshCw size={16} className="spin"/> Creating…</> : <><CreditCard size={16}/> Create payment</>}</button></div></>; }
function WebhookForm({ form, setForm, saving, onSubmit, onCancel }: { form: { url: string; secret: string }; setForm: React.Dispatch<React.SetStateAction<{ url: string; secret: string }>>; saving: boolean; onSubmit: () => void; onCancel: () => void }) { return <><div className="v2-form-stack"><Field label="Endpoint URL" required hint="VOLTIS will send event deliveries to this address."><input type="url" value={form.url} onChange={e => setForm(x => ({ ...x, url: e.target.value }))} placeholder="https://example.com/webhooks/voltis" /></Field><Field label="Signing secret" required hint="Used by the backend to sign and verify webhook deliveries."><input type="password" value={form.secret} onChange={e => setForm(x => ({ ...x, secret: e.target.value }))} placeholder="Enter a signing secret" /></Field></div><div className="v2-modal-actions"><button className="v2-secondary" onClick={onCancel}>Cancel</button><button className="v2-primary" onClick={onSubmit} disabled={saving}>{saving ? <><RefreshCw size={16} className="spin"/> Creating…</> : <><Webhook size={16}/> Add endpoint</>}</button></div></>; }
function DetailModal({ value, onClose }: { value: RecordValue | Transaction; onClose: () => void }) { return <Modal title="Record detail" eyebrow="FINANCIAL RECORD" onClose={onClose}><div className="v2-detail">{Object.entries(value).map(([k,v]) => <div key={k}><span>{k}</span><strong>{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</strong></div>)}</div></Modal>; }
