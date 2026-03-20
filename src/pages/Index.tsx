/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ── Admin API ─────────────────────────────────────────────────────────────
const ADMIN_URL = "https://functions.poehali.dev/f758ecae-a645-410a-8cfa-84490d910c0e";
async function apiAdmin(action: string, body: object = {}, token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["X-Auth-Token"] = token;
  const res = await fetch(ADMIN_URL, { method: "POST", headers: h, body: JSON.stringify({ action, ...body }) });
  return res.json();
}

// ── Scroll-reveal hook ────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}

// ── API ───────────────────────────────────────────────────────────────────
const AUTH_URL = "https://functions.poehali.dev/7c289e46-e8a8-4c96-99ad-263a6455d72f";
const DATA_URL = "https://functions.poehali.dev/3aad21f0-3c3d-4a2c-acf4-724687d855f1";

async function apiAuth(action: string, body: object, token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["X-Auth-Token"] = token;
  const res = await fetch(AUTH_URL, { method: "POST", headers: h, body: JSON.stringify({ action, ...body }) });
  return res.json();
}
async function apiData(action: string, body: object = {}, token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["X-Auth-Token"] = token;
  const res = await fetch(DATA_URL, { method: "POST", headers: h, body: JSON.stringify({ action, ...body }) });
  return res.json();
}

type CabinetTab = "dashboard" | "orders" | "documents" | "messages" | "rates" | "settings";
type CabinetUser = { id: number; email: string; contact_name: string; company: string; inn: string; phone: string; kpp: string; is_verified: boolean };
type OrderItem = { id: number; order_num: string; service: string; country: string; amount: string; currency: string; status: string; manager: string; comment: string; date: string };
type DocItem = { id: number; name: string; file_type: string; file_size: string; date: string };
type MsgItem = { id: number; from_name: string; from_role: string; body: string; is_read: boolean; is_from_user: boolean; time: string };
type Stats = { total_orders: number; active_orders: number; done_orders: number; unread_messages: number; docs_count: number; total_volume_usd: number };

// ── Currency rates ────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", name: "Доллар США",  flag: "🇺🇸", buyFallback: 95.50,  sellFallback: 96.20 },
  { code: "EUR", name: "Евро",        flag: "🇪🇺", buyFallback: 104.25, sellFallback: 105.15 },
  { code: "CNY", name: "Юань",        flag: "🇨🇳", buyFallback: 13.15,  sellFallback: 13.35 },
  { code: "AED", name: "Дирхам ОАЭ", flag: "🇦🇪", buyFallback: 25.98,  sellFallback: 26.15 },
];
type RateData = { code: string; name: string; flag: string; buy: number; sell: number; change: number };

function useCurrencyRates() {
  const [rates, setRates] = useState<RateData[]>(
    CURRENCIES.map(c => ({ code: c.code, name: c.name, flag: c.flag, buy: c.buyFallback, sell: c.sellFallback, change: 0 }))
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/RUB");
        const data = await res.json();
        setRates(CURRENCIES.map(c => {
          const mid = 1 / data.rates[c.code];
          const change = +((Math.random() - 0.5) * 0.4).toFixed(2);
          return { code: c.code, name: c.name, flag: c.flag, buy: +(mid * 0.985).toFixed(2), sell: +(mid * 1.015).toFixed(2), change };
        }));
      } catch { /* fallback */ } finally { setLoading(false); }
    };
    load();
    const t = setInterval(load, 300_000);
    return () => clearInterval(t);
  }, []);
  return { rates, loading };
}

// ── Static data ───────────────────────────────────────────────────────────
const SERVICES = [
  { icon: "Globe",     title: "Международные платежи",   desc: "Переводы в 50+ стран в любой валюте. Комиссия от 0.5%. Срок 1–3 рабочих дня. Собственная инфраструктура без санкционных ограничений.", price: "от 0.5%" },
  { icon: "Shield",    title: "Валютное регулирование",  desc: "Паспорта сделок, справки о валютных операциях, сопровождение проверок ЦБ РФ. Полное соответствие 173-ФЗ и инструкции ЦБ 181-И.", price: "по запросу" },
  { icon: "TrendingUp",title: "FX операции",             desc: "Конверсия 50+ валютных пар. Фиксация курса на срок до 30 дней. Хеджирование валютных рисков. Спред от 0.3%.", price: "спред от 0.3%" },
  { icon: "Search",    title: "Комплаенс и безопасность",desc: "Due Diligence контрагентов, AML-проверки, санкционный скрининг по базам OFAC, EU, UN. Защита от блокировки платежей.", price: "от 5 000 ₽" },
  { icon: "Bitcoin",   title: "Криптовалютные операции", desc: "Легальная конвертация крипты в фиат и обратно. Работа с USDT, BTC, ETH. Полное юридическое оформление.", price: "от 1.5%" },
  { icon: "FileText",  title: "Документооборот и ВЭД",  desc: "Подготовка внешнеторговых договоров, инвойсов, упаковочных листов. Сопровождение таможенного оформления.", price: "от 3 000 ₽" },
];

const PORTFOLIO = [
  { title: "Регулярные платежи в Китай", tag: "🇨🇳 Китай",    volume: "$2.5M/мес",     result: "Поток платежей 40+ поставщикам без отказов", industry: "Импорт товаров" },
  { title: "Выход на рынок ОАЭ",         tag: "🇦🇪 ОАЭ",      volume: "AED 5M разово", result: "Первые транзакции за 5 дней", industry: "Недвижимость" },
  { title: "Платежи в Турцию",           tag: "🇹🇷 Турция",   volume: "€800k/мес",     result: "0 отклонённых платежей за 8 месяцев", industry: "Текстиль" },
  { title: "Комплаенс — Германия",       tag: "🇩🇪 Германия", volume: "€1.2M разово",  result: "Due Diligence за 3 рабочих дня", industry: "Машиностроение" },
  { title: "FX хеджирование для IT",     tag: "🌍 Multi",     volume: "$500k/мес",     result: "Зафиксирован курс на 30 дней, экономия 4%", industry: "IT" },
  { title: "Крипто-конвертация ВЭД",     tag: "₿ Крипто",     volume: "USDT 300k",     result: "Легальная конвертация с полным пакетом документов", industry: "E-commerce" },
];

const BLOG_ITEMS = [
  { date: "12 марта 2026",    tag: "Регулирование", title: "Новые требования ЦБ к валютным операциям в 2026 году",  excerpt: "Разбираем изменения в инструкции ЦБ РФ 181-И и их влияние на порядок проведения международных расчётов." },
  { date: "5 марта 2026",     tag: "Китай",         title: "Платежи в Китай в 2026: рабочие схемы и подводные камни", excerpt: "Как проводить оплату китайским поставщикам в условиях ужесточения комплаенс-требований." },
  { date: "20 февраля 2026",  tag: "Криптовалюта",  title: "USDT для ВЭД: легальные схемы конвертации для бизнеса", excerpt: "Правовой статус крипто-транзакций, актуальные инструменты и риски использования стейблкоинов в расчётах." },
];

const FAQ_ITEMS = [
  { q: "В какие страны вы осуществляете платежи?",  a: "Мы работаем с 50+ странами: Китай, ОАЭ, Турция, страны ЕС, США, Юго-Восточная Азия, СНГ и другие." },
  { q: "Какой минимальный размер платежа?",          a: "Минимальная сумма — $500 или эквивалент. Для клиентов с оборотом от $50 000/мес — специальные условия." },
  { q: "Как долго проходят платежи?",                a: "Стандарт — 1–3 рабочих дня. Срочный режим — в тот же день (доп. комиссия 0.3%)." },
  { q: "Какие документы нужны?",                    a: "Инвойс, контракт с зарубежным поставщиком, документы о праве подписи. Новым клиентам — KYC-верификация (1 рабочий день)." },
  { q: "Как происходит ценообразование?",           a: "Комиссия от 0.5% до 4% в зависимости от направления, суммы и срочности. Точный расчёт — по запросу." },
  { q: "Вы работаете с физическими лицами?",        a: "Нет, только с юридическими лицами и ИП, осуществляющими внешнеэкономическую деятельность." },
];

const I = "Inter, system-ui, sans-serif";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:  { label: "В процессе",  cls: "badge-amber" },
    done:    { label: "Исполнен",    cls: "badge-green" },
    pending: { label: "На проверке", cls: "badge-blue" },
  };
  const s = map[status] || map.pending;
  return <span className={s.cls}>{s.label}</span>;
}

// ── Sections list for nav ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "hero",      label: "Главная" },
  { id: "about",     label: "О компании" },
  { id: "services",  label: "Услуги" },
  { id: "portfolio", label: "Кейсы" },
  { id: "blog",      label: "Блог" },
  { id: "faq",       label: "FAQ" },
  { id: "contacts",  label: "Контакты" },
];

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Index() {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [showCabinet, setShowCabinet]   = useState(false);
  const [faqOpen, setFaqOpen]           = useState<number | null>(null);
  const [contactForm, setContactForm]   = useState({ name: "", company: "", phone: "", email: "", message: "", service: "" });
  const [contactSent, setContactSent]   = useState(false);
  const { rates, loading: rLoading }    = useCurrencyRates();

  // ── Auth ──
  const [token, setToken]               = useState<string>(() => localStorage.getItem("cab_token") || "");
  const [cabinetUser, setCabinetUser]   = useState<CabinetUser | null>(null);
  const [loginForm, setLoginForm]       = useState({ email: "", password: "" });
  const [loginError, setLoginError]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [regForm, setRegForm]           = useState({ name: "", company: "", inn: "", email: "", phone: "", password: "" });
  const [regDone, setRegDone]           = useState(false);
  const [regError, setRegError]         = useState("");

  // ── Cabinet data ──
  const [cabinetTab, setCabinetTab]     = useState<CabinetTab>("dashboard");
  const [orders, setOrders]             = useState<OrderItem[]>([]);
  const [docs, setDocs]                 = useState<DocItem[]>([]);
  const [messages, setMessages]         = useState<MsgItem[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [dataLoading, setDataLoading]   = useState(false);
  const [settingsForm, setSettingsForm] = useState({ contact_name: "", company: "", inn: "", phone: "", kpp: "" });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newMsg, setNewMsg]             = useState("");
  const [msgSending, setMsgSending]     = useState(false);

  // ── Admin state ──
  type AdminTab = "stats" | "users" | "orders" | "user_detail";
  const [adminTab, setAdminTab]             = useState<AdminTab>("stats");
  const [adminStats, setAdminStats]         = useState<any>(null);
  const [adminUsers, setAdminUsers]         = useState<any[]>([]);
  const [adminOrders, setAdminOrders]       = useState<any[]>([]);
  const [adminLoading, setAdminLoading]     = useState(false);
  const [selectedUser, setSelectedUser]     = useState<any>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<any[]>([]);
  const [selectedUserDocs, setSelectedUserDocs]     = useState<any[]>([]);
  const [adminMsg, setAdminMsg]             = useState("");
  const [adminMsgSending, setAdminMsgSending] = useState(false);
  const [orderEditId, setOrderEditId]       = useState<number | null>(null);
  const [orderEditForm, setOrderEditForm]   = useState({ status: "", manager: "", comment: "" });
  const [newOrderForm, setNewOrderForm]     = useState({ user_id: "", service: "Международный платёж", country: "", amount: "", currency: "USD", manager: "" });
  const [newDocForm, setNewDocForm]         = useState({ user_id: "", name: "", file_type: "PDF", file_size: "" });
  const [adminActionMsg, setAdminActionMsg] = useState("");

  const isAdmin = !!(cabinetUser as any)?.is_admin;
  const isLoggedIn = !!cabinetUser;
  const unreadCount = messages.filter(m => !m.is_read && !m.is_from_user).length;

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("cab_token");
    if (saved) {
      apiAuth("me", {}, saved).then(d => {
        if (d.user) { setCabinetUser(d.user); setToken(saved); }
        else { localStorage.removeItem("cab_token"); setToken(""); }
      }).catch(() => {});
    }
  }, []);

  // Sync settings with user
  useEffect(() => {
    if (cabinetUser) setSettingsForm({
      contact_name: cabinetUser.contact_name || "",
      company: cabinetUser.company || "",
      inn: cabinetUser.inn || "",
      phone: cabinetUser.phone || "",
      kpp: cabinetUser.kpp || "",
    });
  }, [cabinetUser]);

  // Load admin data
  const loadAdminData = useCallback(async (tab: AdminTab, uid?: number) => {
    if (!token) return;
    setAdminLoading(true);
    try {
      if (tab === "stats") {
        const d = await apiAdmin("stats", {}, token);
        if (d.total_users !== undefined) setAdminStats(d);
      } else if (tab === "users") {
        const d = await apiAdmin("users", {}, token);
        if (d.users) setAdminUsers(d.users);
      } else if (tab === "orders") {
        const d = await apiAdmin("orders", {}, token);
        if (d.orders) setAdminOrders(d.orders);
      } else if (tab === "user_detail" && uid) {
        const d = await apiAdmin("user_detail", { user_id: uid }, token);
        if (d.user) { setSelectedUser(d.user); setSelectedUserOrders(d.orders || []); setSelectedUserDocs(d.documents || []); }
      }
    } finally { setAdminLoading(false); }
  }, [token]);

  useEffect(() => {
    if (isAdmin && showCabinet) loadAdminData(adminTab);
  }, [isAdmin, showCabinet, adminTab, loadAdminData]);

  // Load cabinet data
  const loadData = useCallback(async (tab: CabinetTab) => {
    if (!token) return;
    setDataLoading(true);
    try {
      if (tab === "dashboard") {
        const [s, o, m] = await Promise.all([apiData("stats", {}, token), apiData("orders", {}, token), apiData("messages", {}, token)]);
        if (s.total_orders !== undefined) setStats(s);
        if (o.orders) setOrders(o.orders);
        if (m.messages) setMessages(m.messages);
      } else if (tab === "orders") {
        const d = await apiData("orders", {}, token);
        if (d.orders) setOrders(d.orders);
      } else if (tab === "documents") {
        const d = await apiData("documents", {}, token);
        if (d.documents) setDocs(d.documents);
      } else if (tab === "messages") {
        const d = await apiData("messages", {}, token);
        if (d.messages) setMessages(d.messages);
      }
    } finally { setDataLoading(false); }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && showCabinet) loadData(cabinetTab);
  }, [isLoggedIn, showCabinet, cabinetTab, loadData]);

  // Active section tracker on scroll
  useEffect(() => {
    const handler = () => {
      for (const item of [...NAV_ITEMS].reverse()) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(item.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Scroll-reveal
  useReveal();

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError("");
    try {
      const d = await apiAuth("login", loginForm);
      if (d.token) {
        localStorage.setItem("cab_token", d.token);
        setToken(d.token); setCabinetUser(d.user); setCabinetTab("dashboard");
      } else setLoginError(d.error || "Ошибка входа");
    } catch { setLoginError("Ошибка соединения"); }
    finally { setLoginLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setRegError("");
    const d = await apiAuth("register", { email: regForm.email, password: regForm.password, contact_name: regForm.name, company: regForm.company, inn: regForm.inn, phone: regForm.phone });
    if (d.success) setRegDone(true); else setRegError(d.error || "Ошибка");
  };

  const handleLogout = async () => {
    await apiAuth("logout", {}, token).catch(() => {});
    localStorage.removeItem("cab_token");
    setToken(""); setCabinetUser(null); setOrders([]); setDocs([]); setMessages([]); setStats(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = await apiAuth("save_me", settingsForm, token);
    if (d.success) { setSettingsSaved(true); setCabinetUser(prev => prev ? { ...prev, ...settingsForm } : prev); setTimeout(() => setSettingsSaved(false), 3000); }
  };

  const handleSendMessage = async () => {
    if (!newMsg.trim()) return;
    setMsgSending(true);
    await apiData("send_message", { body: newMsg }, token);
    setNewMsg("");
    const d = await apiData("messages", {}, token);
    if (d.messages) setMessages(d.messages);
    setMsgSending(false);
  };

  const handleMarkRead = async (ids: number[]) => {
    await apiData("read_messages", { ids }, token);
    setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, is_read: true } : m));
  };

  const handleContact = (e: React.FormEvent) => { e.preventDefault(); setContactSent(true); };

  const openSection = (id: string) => {
    setMobileOpen(false);
    setShowCabinet(false);
    setTimeout(() => scrollTo(id), 50);
  };

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: I }} className="min-h-screen bg-white">

      {/* ═══ HEADER (fixed) ═══ */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        {/* Top info bar */}
        <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "5px 0" }}>
          <div className="container mx-auto px-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-5">
              <a href="tel:+74993985002" style={{ color: "#64748b", fontSize: "0.77rem", fontFamily: I, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="Phone" size={11} style={{ color: "#2563eb" }} />+7 (499) 398-50-02
              </a>
              <a href="mailto:info@vedagentservice.ru" className="hidden sm:flex" style={{ color: "#64748b", fontSize: "0.77rem", fontFamily: I, textDecoration: "none", alignItems: "center", gap: 5 }}>
                <Icon name="Mail" size={11} style={{ color: "#2563eb" }} />info@vedagentservice.ru
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              {!rLoading && rates.slice(0, 3).map(r => (
                <span key={r.code} style={{ fontSize: "0.73rem", color: "#64748b", fontFamily: I }}>
                  {r.flag} <span style={{ color: "#2563eb", fontWeight: 600 }}>{r.code}</span> {r.sell.toFixed(2)} ₽
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Main nav */}
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => openSection("hero")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Globe" size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontFamily: I, fontSize: "1rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>ВЭД Агент</div>
                <div style={{ fontSize: "0.58rem", color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Сервис</div>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => openSection(item.id)}
                  style={{ fontFamily: I, fontSize: "0.85rem", fontWeight: activeSection === item.id ? 600 : 400, color: activeSection === item.id ? "#2563eb" : "#475569", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 6, transition: "all 0.15s", position: "relative" }}>
                  {item.label}
                  {activeSection === item.id && <span style={{ position: "absolute", bottom: 0, left: 10, right: 10, height: 2, background: "#2563eb", borderRadius: 2 }} />}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={() => openSection("contacts")} className="btn-primary hidden sm:flex" style={{ padding: "7px 18px", fontSize: "0.82rem" }}>Консультация</button>
              {/* Единая кнопка ЛК: открывает старый кабинет ИЛИ ведёт на /lk */}
              <a href="/lk" className="hidden sm:flex"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontFamily: I, fontSize: "0.82rem", fontWeight: 500, color: "#374151", cursor: "pointer", textDecoration: "none", position: "relative" }}>
                <Icon name="User" size={14} style={{ color: "#64748b" }} />
                Личный кабинет
              </a>
              {isLoggedIn && (
                <button onClick={handleLogout} title="Выйти из аккаунта"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.borderColor = "#f87171"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; }}>
                  <Icon name="LogOut" size={15} style={{ color: "#ef4444" }} />
                </button>
              )}
              <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name={mobileOpen ? "X" : "Menu"} size={22} style={{ color: "#374151" }} />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 24px 20px" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => openSection(item.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 0", fontFamily: I, fontSize: "0.9rem", fontWeight: activeSection === item.id ? 600 : 400, color: activeSection === item.id ? "#2563eb" : "#374151", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>{item.label}</button>
            ))}
            <div className="flex gap-2 mt-4">
              <button onClick={() => openSection("contacts")} className="btn-primary flex-1 justify-center" style={{ padding: "10px 0", fontSize: "0.875rem" }}>Консультация</button>
              <a href="/lk" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 justify-center" style={{ padding: "10px 0", fontSize: "0.875rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="User" size={14} />Личный кабинет
              </a>
              {isLoggedIn && (
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", fontFamily: I, fontSize: "0.875rem", fontWeight: 500, color: "#ef4444", cursor: "pointer" }}>
                  <Icon name="LogOut" size={14} />Выйти
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ═══ CABINET OVERLAY ═══ */}
      {showCabinet && (
        <div style={{ paddingTop: 97 }}>
          <div style={{ background: isAdmin ? "linear-gradient(135deg,#0f172a,#1e293b)" : "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "48px 0" }}>
            <div className="container mx-auto px-6 flex items-center justify-between">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  {isAdmin && <span style={{ background: "#f59e0b", color: "#0f172a", fontFamily: I, fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.06em", textTransform: "uppercase" }}>Администратор</span>}
                </div>
                <h1 style={{ fontFamily: I, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#fff" }}>
                  {isAdmin ? "Панель администратора" : "Личный кабинет"}
                </h1>
                <p style={{ fontFamily: I, color: "rgba(255,255,255,0.6)", marginTop: 6, fontSize: "0.875rem" }}>
                  {isAdmin ? "Управление клиентами, платежами и сервисом" : "Управление платежами и документами"}
                </p>
              </div>
              <button onClick={() => setShowCabinet(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", color: "#fff", fontFamily: I, fontSize: "0.85rem", cursor: "pointer" }}>
                <Icon name="X" size={14} />Закрыть
              </button>
            </div>
          </div>

          {/* ═══ ADMIN PANEL ═══ */}
          {isLoggedIn && isAdmin ? (
            <div style={{ background: "#f1f5f9", minHeight: "70vh" }}>
              <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Admin sidebar */}
                  <aside className="lg:w-56 flex-shrink-0">
                    <div style={{ background: "#fff", borderRadius: 12, padding: "14px", border: "1px solid #e2e8f0", marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                        <Icon name="ShieldCheck" size={18} style={{ color: "#fff" }} />
                      </div>
                      <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{cabinetUser?.contact_name}</div>
                      <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8" }}>{cabinetUser?.email}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 100, padding: "3px 10px", marginTop: 6 }}>
                        <Icon name="Star" size={10} style={{ color: "#d97706" }} />
                        <span style={{ fontFamily: I, fontSize: "0.68rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>Администратор</span>
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "8px" }}>
                      {([
                        { key: "stats",  icon: "LayoutDashboard", label: "Обзор" },
                        { key: "users",  icon: "Users",           label: "Клиенты" },
                        { key: "orders", icon: "ArrowLeftRight",  label: "Все платежи" },
                      ] as Array<{key: AdminTab; icon: string; label: string}>).map(item => (
                        <button key={item.key} onClick={() => { setAdminTab(item.key); setSelectedUser(null); }} className={`sidebar-item ${adminTab === item.key ? "active" : ""}`}>
                          <Icon name={item.icon as any} size={16} /><span>{item.label}</span>
                        </button>
                      ))}
                      <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 4, paddingTop: 4 }}>
                        <button onClick={handleLogout} className="sidebar-item" style={{ color: "#dc2626" }}><Icon name="LogOut" size={16} /><span>Выйти</span></button>
                      </div>
                    </div>
                  </aside>

                  {/* Admin content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {adminActionMsg && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontFamily: I, color: "#16a34a", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="CheckCircle" size={15} style={{ color: "#16a34a" }} />{adminActionMsg}
                      </div>
                    )}

                    {/* ─── Stats ─── */}
                    {adminTab === "stats" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>Обзор платформы</h2>
                        {adminLoading ? <div style={{ fontFamily: I, color: "#94a3b8" }}>Загрузка...</div> : adminStats && (
                          <>
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                              {[
                                { icon: "Users",         label: "Всего клиентов",  val: adminStats.total_users,    color: "#2563eb", bg: "#eff6ff" },
                                { icon: "ShieldCheck",   label: "Верифицировано",  val: adminStats.verified_users, color: "#16a34a", bg: "#f0fdf4" },
                                { icon: "ArrowLeftRight",label: "Всего платежей",  val: adminStats.total_orders,   color: "#7c3aed", bg: "#f5f3ff" },
                                { icon: "MessageSquare", label: "Новых сообщений", val: adminStats.unread_messages,color: "#d97706", bg: "#fffbeb" },
                              ].map((s, i) => (
                                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon as any} size={14} style={{ color: s.color }} /></div>
                                    <span style={{ fontFamily: I, fontSize: "0.78rem", color: "#64748b" }}>{s.label}</span>
                                  </div>
                                  <div style={{ fontFamily: I, fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                              {[
                                { label: "В процессе",  val: adminStats.active_orders,  color: "#d97706" },
                                { label: "Исполнено",   val: adminStats.done_orders,    color: "#16a34a" },
                                { label: "На проверке", val: adminStats.pending_orders, color: "#2563eb" },
                                { label: "Объём ($)",   val: `$${(adminStats.total_volume_usd/1000).toFixed(1)}k`, color: "#7c3aed" },
                              ].map((s, i) => (
                                <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                                  <div style={{ fontFamily: I, fontSize: "1.5rem", fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.val}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={() => setAdminTab("users")} className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.85rem" }}><Icon name="Users" size={15} />Управление клиентами</button>
                          <button onClick={() => setAdminTab("orders")} className="btn-outline" style={{ padding: "9px 20px", fontSize: "0.85rem" }}><Icon name="ArrowLeftRight" size={15} />Все платежи</button>
                        </div>
                      </div>
                    )}

                    {/* ─── Users ─── */}
                    {adminTab === "users" && !selectedUser && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>Клиенты</h2>
                          <button onClick={() => loadAdminData("users")} className="btn-outline" style={{ padding: "7px 16px", fontSize: "0.82rem" }}><Icon name="RefreshCw" size={13} />Обновить</button>
                        </div>
                        {adminLoading ? <div style={{ fontFamily: I, color: "#94a3b8" }}>Загрузка...</div> : (
                          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>{["Клиент","Компания","ИНН","Платежей","Статус","Действия"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {adminUsers.map(u => (
                                    <tr key={u.id}>
                                      <td>
                                        <div style={{ fontFamily: I, fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{u.contact_name || "—"}</div>
                                        <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8" }}>{u.email}</div>
                                      </td>
                                      <td style={{ fontSize: "0.82rem" }}>{u.company || "—"}</td>
                                      <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>{u.inn || "—"}</td>
                                      <td style={{ textAlign: "center", fontWeight: 600, color: "#2563eb" }}>{u.order_count}</td>
                                      <td>
                                        <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                                          <span className={u.is_verified ? "badge-green" : "badge-amber"}>{u.is_verified ? "Верифицирован" : "Не верифицирован"}</span>
                                          {!u.is_active && <span className="badge-blue" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Заблокирован</span>}
                                        </div>
                                      </td>
                                      <td>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                          <button onClick={async () => {
                                            await loadAdminData("user_detail", u.id);
                                            setAdminTab("user_detail");
                                            setNewOrderForm(f => ({ ...f, user_id: String(u.id) }));
                                            setNewDocForm(f => ({ ...f, user_id: String(u.id) }));
                                          }} style={{ fontFamily: I, fontSize: "0.75rem", fontWeight: 600, color: "#2563eb", background: "none", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                                            Детали
                                          </button>
                                          <button onClick={async () => {
                                            const d = await apiAdmin("toggle_verify", { user_id: u.id }, token);
                                            if (d.success) { setAdminActionMsg(d.is_verified ? "Верификация выдана" : "Верификация снята"); loadAdminData("users"); setTimeout(() => setAdminActionMsg(""), 3000); }
                                          }} style={{ fontFamily: I, fontSize: "0.75rem", fontWeight: 600, color: u.is_verified ? "#d97706" : "#16a34a", background: "none", border: `1px solid ${u.is_verified ? "#fde68a" : "#bbf7d0"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                                            {u.is_verified ? "Снять KYC" : "✓ KYC"}
                                          </button>
                                          <button onClick={async () => {
                                            const d = await apiAdmin("toggle_active", { user_id: u.id }, token);
                                            if (d.success) { setAdminActionMsg(d.is_active ? "Аккаунт разблокирован" : "Аккаунт заблокирован"); loadAdminData("users"); setTimeout(() => setAdminActionMsg(""), 3000); }
                                          }} style={{ fontFamily: I, fontSize: "0.75rem", fontWeight: 600, color: u.is_active ? "#dc2626" : "#16a34a", background: "none", border: `1px solid ${u.is_active ? "#fecaca" : "#bbf7d0"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                                            {u.is_active ? "Блок" : "Разблок"}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── User detail ─── */}
                    {(adminTab === "user_detail" || (adminTab === "users" && selectedUser)) && selectedUser && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button onClick={() => { setAdminTab("users"); setSelectedUser(null); loadAdminData("users"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: I, fontSize: "0.85rem", color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <Icon name="ChevronLeft" size={16} />Назад к клиентам
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 14, fontSize: "0.95rem" }}>Профиль клиента</div>
                            {[["Имя", selectedUser.contact_name],["Email", selectedUser.email],["Телефон", selectedUser.phone],["Компания", selectedUser.company],["ИНН", selectedUser.inn],["КПП", selectedUser.kpp],["Дата регистрации", selectedUser.created_at]].map(([l,v], i) => (
                              <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9", marginBottom: 8 }}>
                                <span style={{ fontFamily: I, fontSize: "0.78rem", color: "#94a3b8", minWidth: 120 }}>{l}</span>
                                <span style={{ fontFamily: I, fontSize: "0.85rem", color: "#0f172a", fontWeight: 500 }}>{v || "—"}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                              <button onClick={async () => {
                                const d = await apiAdmin("toggle_verify", { user_id: selectedUser.id }, token);
                                if (d.success) { setAdminActionMsg(d.is_verified ? "KYC выдана" : "KYC снята"); setSelectedUser((p: any) => ({ ...p, is_verified: d.is_verified })); setTimeout(() => setAdminActionMsg(""), 3000); }
                              }} className={selectedUser.is_verified ? "btn-outline" : "btn-primary"} style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
                                <Icon name="ShieldCheck" size={13} />{selectedUser.is_verified ? "Снять KYC" : "Выдать KYC"}
                              </button>
                              <button onClick={async () => {
                                const d = await apiAdmin("toggle_active", { user_id: selectedUser.id }, token);
                                if (d.success) { setAdminActionMsg(d.is_active ? "Разблокирован" : "Заблокирован"); setSelectedUser((p: any) => ({ ...p, is_active: d.is_active })); setTimeout(() => setAdminActionMsg(""), 3000); }
                              }} style={{ padding: "8px 16px", fontSize: "0.82rem", fontFamily: I, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: `1.5px solid ${selectedUser.is_active ? "#fecaca" : "#bbf7d0"}`, background: "none", color: selectedUser.is_active ? "#dc2626" : "#16a34a" }}>
                                {selectedUser.is_active ? "Заблокировать" : "Разблокировать"}
                              </button>
                            </div>
                          </div>

                          {/* Message to client */}
                          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 14, fontSize: "0.95rem" }}>Написать клиенту</div>
                            <textarea rows={4} className="form-input" style={{ resize: "none" } as any} value={adminMsg} onChange={e => setAdminMsg(e.target.value)} placeholder="Введите сообщение для клиента..." />
                            <button className="btn-primary" style={{ marginTop: 10, padding: "9px 20px", fontSize: "0.85rem" }} disabled={adminMsgSending || !adminMsg.trim()}
                              onClick={async () => {
                                setAdminMsgSending(true);
                                const d = await apiAdmin("send_message", { user_id: selectedUser.id, body: adminMsg }, token);
                                if (d.success) { setAdminMsg(""); setAdminActionMsg("Сообщение отправлено"); setTimeout(() => setAdminActionMsg(""), 3000); }
                                setAdminMsgSending(false);
                              }}>
                              {adminMsgSending ? "Отправка..." : "Отправить"}
                            </button>
                          </div>
                        </div>

                        {/* Add order */}
                        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 14, fontSize: "0.95rem" }}>Создать платёж клиенту</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div><label className="form-label">Услуга</label>
                              <select className="form-input" value={newOrderForm.service} onChange={e => setNewOrderForm(f => ({ ...f, service: e.target.value }))}>
                                {["Международный платёж","FX операция","Комплаенс","Криптовалютные операции","Документооборот и ВЭД"].map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div><label className="form-label">Направление *</label><input className="form-input" value={newOrderForm.country} onChange={e => setNewOrderForm(f => ({ ...f, country: e.target.value }))} placeholder="🇨🇳 Китай" /></div>
                            <div><label className="form-label">Сумма</label><input className="form-input" value={newOrderForm.amount} onChange={e => setNewOrderForm(f => ({ ...f, amount: e.target.value }))} placeholder="10000" /></div>
                            <div><label className="form-label">Валюта</label>
                              <select className="form-input" value={newOrderForm.currency} onChange={e => setNewOrderForm(f => ({ ...f, currency: e.target.value }))}>
                                {["USD","EUR","CNY","AED","RUB"].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div><label className="form-label">Менеджер</label><input className="form-input" value={newOrderForm.manager} onChange={e => setNewOrderForm(f => ({ ...f, manager: e.target.value }))} placeholder="Козлов В.А." /></div>
                          </div>
                          <button className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.85rem" }} disabled={!newOrderForm.country}
                            onClick={async () => {
                              const d = await apiAdmin("add_order", { ...newOrderForm, user_id: selectedUser.id }, token);
                              if (d.success) { setAdminActionMsg(`Платёж ${d.order_num} создан`); setNewOrderForm(f => ({ ...f, country: "", amount: "" })); loadAdminData("user_detail", selectedUser.id); setTimeout(() => setAdminActionMsg(""), 3000); }
                            }}>
                            <Icon name="Plus" size={14} />Создать платёж
                          </button>
                        </div>

                        {/* Orders table */}
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontFamily: I, fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Платежи клиента ({selectedUserOrders.length})</div>
                          {selectedUserOrders.length === 0 ? <div style={{ padding: "20px", fontFamily: I, color: "#94a3b8", fontSize: "0.875rem" }}>Платежей нет</div> : (
                            <div style={{ overflowX: "auto" }}>
                              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>{["ID","Услуга","Направление","Сумма","Статус","Действия"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {selectedUserOrders.map(o => (
                                    <tr key={o.id}>
                                      <td style={{ color: "#2563eb", fontWeight: 600 }}>{o.order_num}</td>
                                      <td style={{ fontSize: "0.82rem" }}>{o.service}</td>
                                      <td style={{ whiteSpace: "nowrap" }}>{o.country}</td>
                                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{o.amount} {o.currency}</td>
                                      <td>
                                        {orderEditId === o.id ? (
                                          <select className="form-input" style={{ padding: "4px 8px", fontSize: "0.8rem" }} value={orderEditForm.status} onChange={e => setOrderEditForm(f => ({ ...f, status: e.target.value }))}>
                                            <option value="pending">На проверке</option>
                                            <option value="active">В процессе</option>
                                            <option value="done">Исполнен</option>
                                          </select>
                                        ) : <StatusBadge status={o.status} />}
                                      </td>
                                      <td>
                                        {orderEditId === o.id ? (
                                          <div style={{ display: "flex", gap: 5 }}>
                                            <button onClick={async () => {
                                              await apiAdmin("update_order", { order_id: o.id, ...orderEditForm }, token);
                                              setOrderEditId(null); setAdminActionMsg("Статус обновлён"); loadAdminData("user_detail", selectedUser.id); setTimeout(() => setAdminActionMsg(""), 3000);
                                            }} className="btn-primary" style={{ padding: "4px 12px", fontSize: "0.75rem" }}>Сохранить</button>
                                            <button onClick={() => setOrderEditId(null)} style={{ fontFamily: I, fontSize: "0.75rem", color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Отмена</button>
                                          </div>
                                        ) : (
                                          <button onClick={() => { setOrderEditId(o.id); setOrderEditForm({ status: o.status, manager: o.manager, comment: "" }); }} style={{ fontFamily: I, fontSize: "0.75rem", color: "#2563eb", background: "none", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Изменить</button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Add document */}
                        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 14, fontSize: "0.95rem" }}>Добавить документ</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="sm:col-span-2"><label className="form-label">Название документа *</label><input className="form-input" value={newDocForm.name} onChange={e => setNewDocForm(f => ({ ...f, name: e.target.value }))} placeholder="SWIFT-подтверждение PAY-0001" /></div>
                            <div><label className="form-label">Тип</label>
                              <select className="form-input" value={newDocForm.file_type} onChange={e => setNewDocForm(f => ({ ...f, file_type: e.target.value }))}>
                                {["PDF","XLSX","DOCX","ZIP"].map(t => <option key={t}>{t}</option>)}
                              </select>
                            </div>
                            <div><label className="form-label">Размер</label><input className="form-input" value={newDocForm.file_size} onChange={e => setNewDocForm(f => ({ ...f, file_size: e.target.value }))} placeholder="1.2 МБ" /></div>
                          </div>
                          <button className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.85rem" }} disabled={!newDocForm.name}
                            onClick={async () => {
                              const d = await apiAdmin("add_document", { ...newDocForm, user_id: selectedUser.id }, token);
                              if (d.success) { setAdminActionMsg("Документ добавлен"); setNewDocForm(f => ({ ...f, name: "", file_size: "" })); loadAdminData("user_detail", selectedUser.id); setTimeout(() => setAdminActionMsg(""), 3000); }
                            }}>
                            <Icon name="Plus" size={14} />Добавить документ
                          </button>
                          {selectedUserDocs.length > 0 && (
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                              {selectedUserDocs.map(doc => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                  <Icon name="FileText" size={14} style={{ color: "#2563eb" }} />
                                  <span style={{ fontFamily: I, fontSize: "0.82rem", color: "#0f172a", flex: 1 }}>{doc.name}</span>
                                  <span style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8" }}>{doc.file_type} · {doc.file_size} · {doc.date}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ─── All orders ─── */}
                    {adminTab === "orders" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>Все платежи</h2>
                          <button onClick={() => loadAdminData("orders")} className="btn-outline" style={{ padding: "7px 16px", fontSize: "0.82rem" }}><Icon name="RefreshCw" size={13} />Обновить</button>
                        </div>
                        {adminLoading ? <div style={{ fontFamily: I, color: "#94a3b8" }}>Загрузка...</div> : (
                          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>{["ID","Клиент","Услуга","Направление","Сумма","Менеджер","Дата","Статус","Изменить"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {adminOrders.map(o => (
                                    <tr key={o.id}>
                                      <td style={{ color: "#2563eb", fontWeight: 600 }}>{o.order_num}</td>
                                      <td>
                                        <div style={{ fontFamily: I, fontWeight: 500, color: "#0f172a", fontSize: "0.82rem" }}>{o.client_name || "—"}</div>
                                        <div style={{ fontFamily: I, fontSize: "0.7rem", color: "#94a3b8" }}>{o.client_email}</div>
                                      </td>
                                      <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>{o.service}</td>
                                      <td style={{ whiteSpace: "nowrap" }}>{o.country}</td>
                                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{o.amount} {o.currency}</td>
                                      <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>{o.manager}</td>
                                      <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>{o.date}</td>
                                      <td>
                                        {orderEditId === o.id ? (
                                          <select className="form-input" style={{ padding: "4px 8px", fontSize: "0.8rem" }} value={orderEditForm.status} onChange={e => setOrderEditForm(f => ({ ...f, status: e.target.value }))}>
                                            <option value="pending">На проверке</option>
                                            <option value="active">В процессе</option>
                                            <option value="done">Исполнен</option>
                                          </select>
                                        ) : <StatusBadge status={o.status} />}
                                      </td>
                                      <td>
                                        {orderEditId === o.id ? (
                                          <div style={{ display: "flex", gap: 4 }}>
                                            <button onClick={async () => {
                                              await apiAdmin("update_order", { order_id: o.id, ...orderEditForm }, token);
                                              setOrderEditId(null); setAdminActionMsg("Обновлено"); loadAdminData("orders"); setTimeout(() => setAdminActionMsg(""), 3000);
                                            }} className="btn-primary" style={{ padding: "4px 10px", fontSize: "0.72rem" }}>✓</button>
                                            <button onClick={() => setOrderEditId(null)} style={{ fontFamily: I, fontSize: "0.72rem", color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                                          </div>
                                        ) : (
                                          <button onClick={() => { setOrderEditId(o.id); setOrderEditForm({ status: o.status, manager: o.manager, comment: "" }); }} style={{ fontFamily: I, fontSize: "0.72rem", color: "#2563eb", background: "none", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Изменить</button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : !isLoggedIn ? (
            <div style={{ background: "#f8fafc", minHeight: "70vh", padding: "60px 0" }}>
              <div className="container mx-auto px-6" style={{ maxWidth: 440 }}>
                {!registerMode ? (
                  <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Вход в систему</h2>
                    <p style={{ fontFamily: I, color: "#64748b", marginBottom: 24, fontSize: "0.875rem" }}>Введите данные для доступа</p>
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div><label className="form-label">Email</label><input type="email" required className="form-input" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="email@company.ru" /></div>
                      <div><label className="form-label">Пароль</label><input type="password" required className="form-input" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" /></div>
                      {loginError && <p style={{ fontFamily: I, fontSize: "0.85rem", color: "#dc2626" }}>{loginError}</p>}
                      <button type="submit" className="btn-primary" style={{ padding: "12px 0", justifyContent: "center", width: "100%" }} disabled={loginLoading}>{loginLoading ? "Вход..." : "Войти"}</button>
                      <div style={{ textAlign: "center" }}><button type="button" onClick={() => setRegisterMode(true)} style={{ fontFamily: I, fontSize: "0.85rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Нет аккаунта? Зарегистрироваться</button></div>
                      <div style={{ textAlign: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <span style={{ fontFamily: I, fontSize: "0.77rem", color: "#94a3b8" }}>Демо: </span><span style={{ fontFamily: I, fontSize: "0.77rem", color: "#475569", fontWeight: 500 }}>demo@vedagent.ru / demo1234</span>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                    {regDone ? (
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="CheckCircle" size={30} style={{ color: "#2563eb" }} /></div>
                        <h3 style={{ fontFamily: I, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Заявка отправлена!</h3>
                        <p style={{ fontFamily: I, color: "#64748b", marginTop: 8, fontSize: "0.875rem" }}>Активируем доступ после KYC-верификации (1 рабочий день).</p>
                        <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }} onClick={() => { setRegisterMode(false); setRegDone(false); }}>Вернуться ко входу</button>
                      </div>
                    ) : (
                      <>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Регистрация</h2>
                        <p style={{ fontFamily: I, color: "#64748b", marginBottom: 24, fontSize: "0.875rem" }}>Только для юридических лиц и ИП</p>
                        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {[{label:"Контактное лицо *",key:"name",ph:"Александр Иванов",type:"text"},{label:"Компания *",key:"company",ph:"ООО «Компания»",type:"text"},{label:"ИНН *",key:"inn",ph:"7714123456",type:"text"},{label:"Email *",key:"email",ph:"email@company.ru",type:"email"},{label:"Телефон *",key:"phone",ph:"+7 (___) ___-__-__",type:"text"},{label:"Пароль (мин. 6 символов) *",key:"password",ph:"••••••••",type:"password"}].map(f => (
                            <div key={f.key}><label className="form-label">{f.label}</label><input type={f.type} required className="form-input" value={(regForm as any)[f.key]} onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })} placeholder={f.ph} /></div>
                          ))}
                          {regError && <p style={{ fontFamily: I, fontSize: "0.85rem", color: "#dc2626" }}>{regError}</p>}
                          <button type="submit" className="btn-primary" style={{ padding: "12px 0", justifyContent: "center", width: "100%", marginTop: 4 }}>Подать заявку</button>
                          <div style={{ textAlign: "center" }}><button type="button" onClick={() => setRegisterMode(false)} style={{ fontFamily: I, fontSize: "0.85rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Уже есть аккаунт? Войти</button></div>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: "#f8fafc", minHeight: "70vh" }}>
              <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Sidebar */}
                  <aside className="lg:w-56 flex-shrink-0">
                    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 14px", border: "1px solid #e2e8f0", marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 10 }}>{cabinetUser?.email[0]?.toUpperCase() || "U"}</div>
                      <div style={{ fontFamily: I, fontWeight: 600, color: "#0f172a", fontSize: "0.85rem" }}>{cabinetUser?.contact_name || cabinetUser?.email}</div>
                      <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cabinetUser?.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cabinetUser?.is_verified ? "#22c55e" : "#f59e0b" }} />
                        <span style={{ fontFamily: I, fontSize: "0.72rem", color: "#64748b" }}>{cabinetUser?.is_verified ? "Верифицирован" : "Ожидает верификации"}</span>
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "8px" }}>
                      {([{key:"dashboard",icon:"LayoutDashboard",label:"Обзор"},{key:"orders",icon:"ArrowLeftRight",label:"Платежи"},{key:"documents",icon:"FolderOpen",label:"Документы"},{key:"messages",icon:"MessageSquare",label:"Сообщения",badge:unreadCount||undefined},{key:"rates",icon:"TrendingUp",label:"Курсы"},{key:"settings",icon:"Settings",label:"Настройки"}] as Array<{key:CabinetTab;icon:string;label:string;badge?:number}>).map(item => (
                        <button key={item.key} onClick={() => setCabinetTab(item.key)} className={`sidebar-item ${cabinetTab === item.key ? "active" : ""}`}>
                          <Icon name={item.icon as any} size={16} /><span>{item.label}</span>
                          {item.badge && <span style={{ marginLeft: "auto", background: "#2563eb", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px", borderRadius: 100, fontFamily: I }}>{item.badge}</span>}
                        </button>
                      ))}
                      <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 4, paddingTop: 4 }}>
                        <button onClick={handleLogout} className="sidebar-item" style={{ color: "#dc2626" }}><Icon name="LogOut" size={16} /><span>Выйти</span></button>
                      </div>
                    </div>
                  </aside>

                  {/* Cabinet content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {cabinetTab === "dashboard" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>Добро пожаловать, {cabinetUser?.contact_name?.split(" ")[0]}!</h2>
                          <button onClick={() => openSection("contacts")} className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.82rem" }}>+ Новый платёж</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                          {[{icon:"ArrowLeftRight",label:"Всего платежей",val:String(stats?.total_orders??0),sub:"за всё время",color:"#2563eb",bg:"#eff6ff"},{icon:"Clock",label:"В процессе",val:String(stats?.active_orders??0),sub:"активных",color:"#d97706",bg:"#fffbeb"},{icon:"CheckCircle",label:"Исполнено",val:String(stats?.done_orders??0),sub:"успешных",color:"#16a34a",bg:"#f0fdf4"},{icon:"DollarSign",label:"Объём",val:`$${((stats?.total_volume_usd??0)/1000).toFixed(1)}k`,sub:"исполнено",color:"#7c3aed",bg:"#f5f3ff"}].map((s,i) => (
                            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "20px 18px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon as any} size={15} style={{ color: s.color }} /></div>
                                <span style={{ fontFamily: I, fontSize: "0.8rem", color: "#64748b" }}>{s.label}</span>
                              </div>
                              <div style={{ fontFamily: I, fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>{dataLoading ? "–" : s.val}</div>
                              <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>{s.sub}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Последние платежи</span>
                            <button onClick={() => setCabinetTab("orders")} style={{ fontFamily: I, fontSize: "0.82rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Все →</button>
                          </div>
                          {orders.length === 0 ? <div style={{ padding: "20px", fontFamily: I, color: "#94a3b8", fontSize: "0.875rem" }}>Нет платежей</div> :
                            orders.slice(0, 3).map((o, i) => (
                              <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", gap: 12, borderBottom: i < 2 ? "1px solid #f8fafc" : "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="Globe" size={14} style={{ color: "#2563eb" }} /></div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontFamily: I, fontWeight: 600, color: "#0f172a", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.country} · {o.service}</div>
                                    <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8" }}>{o.order_num} · {o.date}</div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                  <span style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>{o.amount} {o.currency}</span>
                                  <StatusBadge status={o.status} />
                                </div>
                              </div>
                            ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Новые сообщения</span>
                            <button onClick={() => setCabinetTab("messages")} style={{ fontFamily: I, fontSize: "0.82rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Все →</button>
                          </div>
                          {messages.filter(m => !m.is_read && !m.is_from_user).length === 0 ? <div style={{ padding: "20px", fontFamily: I, color: "#94a3b8", fontSize: "0.875rem" }}>Нет новых сообщений</div> :
                            messages.filter(m => !m.is_read && !m.is_from_user).slice(0, 2).map(msg => (
                              <div key={msg.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 20px", borderBottom: "1px solid #f8fafc" }}>
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontWeight: 700, color: "#fff", fontSize: "0.85rem", flexShrink: 0 }}>{msg.from_name[0]}</div>
                                <div><div style={{ fontFamily: I, fontWeight: 600, color: "#0f172a", fontSize: "0.85rem" }}>{msg.from_name}</div><p style={{ fontFamily: I, color: "#64748b", fontSize: "0.8rem", lineHeight: 1.5, marginTop: 2 }}>{msg.body.slice(0, 90)}…</p></div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {cabinetTab === "orders" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>Мои платежи</h2>
                          <button onClick={() => openSection("contacts")} className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.82rem" }}>+ Новый</button>
                        </div>
                        {dataLoading ? <div style={{ fontFamily: I, color: "#94a3b8" }}>Загрузка...</div> : orders.length === 0 ? (
                          <div style={{ background: "#fff", borderRadius: 12, padding: "40px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                            <Icon name="ArrowLeftRight" size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} />
                            <p style={{ fontFamily: I, color: "#94a3b8" }}>Платежей пока нет</p>
                            <button onClick={() => openSection("contacts")} className="btn-primary" style={{ marginTop: 16, padding: "9px 24px" }}>Создать платёж</button>
                          </div>
                        ) : (
                          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>{["ID","Услуга","Направление","Сумма","Менеджер","Дата","Статус"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                <tbody>{orders.map(o => <tr key={o.id}><td style={{ color: "#2563eb", fontWeight: 600 }}>{o.order_num}</td><td>{o.service}</td><td style={{ whiteSpace: "nowrap" }}>{o.country}</td><td style={{ fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{o.amount} {o.currency}</td><td style={{ whiteSpace: "nowrap" }}>{o.manager}</td><td style={{ whiteSpace: "nowrap" }}>{o.date}</td><td><StatusBadge status={o.status} /></td></tr>)}</tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {cabinetTab === "documents" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>Документы</h2>
                        {dataLoading ? <div style={{ fontFamily: I, color: "#94a3b8" }}>Загрузка...</div> : docs.length === 0 ? <div style={{ background: "#fff", borderRadius: 12, padding: "40px", border: "1px solid #e2e8f0", textAlign: "center" }}><Icon name="FolderOpen" size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} /><p style={{ fontFamily: I, color: "#94a3b8" }}>Документов пока нет</p></div> : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {docs.map(doc => (
                              <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 8, background: doc.file_type === "PDF" ? "#fef2f2" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="FileText" size={16} style={{ color: doc.file_type === "PDF" ? "#dc2626" : "#2563eb" }} /></div>
                                  <div><div style={{ fontFamily: I, fontWeight: 500, color: "#0f172a", fontSize: "0.875rem" }}>{doc.name}</div><div style={{ fontFamily: I, fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>{doc.file_type} · {doc.file_size} · {doc.date}</div></div>
                                </div>
                                <button style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}><Icon name="Download" size={14} />Скачать</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {cabinetTab === "messages" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>Сообщения</h2>
                          {unreadCount > 0 && <button onClick={() => handleMarkRead(messages.filter(m => !m.is_read && !m.is_from_user).map(m => m.id))} style={{ fontFamily: I, fontSize: "0.82rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Отметить прочитанными</button>}
                        </div>
                        {dataLoading ? <div style={{ fontFamily: I, color: "#94a3b8" }}>Загрузка...</div> : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                            {messages.map(msg => (
                              <div key={msg.id} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: (!msg.is_read && !msg.is_from_user) ? "1.5px solid #bfdbfe" : "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: msg.is_from_user ? "#f1f5f9" : "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontWeight: 700, color: msg.is_from_user ? "#475569" : "#fff", flexShrink: 0 }}>{msg.from_name[0]}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 5 }}>
                                      <span style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>{msg.from_name}</span>
                                      <span style={{ fontFamily: I, fontSize: "0.73rem", color: "#94a3b8" }}>{msg.from_role}</span>
                                      {!msg.is_read && !msg.is_from_user && <span style={{ marginLeft: "auto", background: "#2563eb", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100, fontFamily: I }}>Новое</span>}
                                    </div>
                                    <p style={{ fontFamily: I, color: "#475569", fontSize: "0.875rem", lineHeight: 1.6 }}>{msg.body}</p>
                                    <div style={{ fontFamily: I, fontSize: "0.7rem", color: "#94a3b8", marginTop: 6 }}>{msg.time}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
                          <label className="form-label">Написать менеджеру</label>
                          <textarea rows={3} className="form-input" style={{ resize: "none" } as any} value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Напишите ваш вопрос..." />
                          <button className="btn-primary" style={{ marginTop: 10, padding: "9px 20px", fontSize: "0.85rem" }} onClick={handleSendMessage} disabled={msgSending || !newMsg.trim()}>{msgSending ? "Отправка..." : "Отправить"}</button>
                        </div>
                      </div>
                    )}

                    {cabinetTab === "rates" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Курсы валют</h2>
                        <p style={{ fontFamily: I, color: "#64748b", marginBottom: 20, fontSize: "0.875rem" }}>Обновляется каждые 5 мин · Спред ±1.5%</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          {rates.map(r => (
                            <div key={r.code} style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                <span style={{ fontSize: "1.8rem" }}>{r.flag}</span>
                                <div><div style={{ fontFamily: I, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>{r.code}</div><div style={{ fontFamily: I, fontSize: "0.73rem", color: "#94a3b8" }}>{r.name}</div></div>
                                <span style={{ marginLeft: "auto", fontFamily: I, fontWeight: 600, fontSize: "0.875rem", color: r.change >= 0 ? "#16a34a" : "#dc2626" }}>{r.change >= 0 ? "▲" : "▼"}{Math.abs(r.change).toFixed(2)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px" }}>
                                  <div style={{ fontFamily: I, fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Покупка</div>
                                  <div style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>{r.buy.toFixed(2)}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.7rem", color: "#94a3b8" }}>₽ за 1 {r.code}</div>
                                </div>
                                <div style={{ background: "#eff6ff", borderRadius: 8, padding: "12px" }}>
                                  <div style={{ fontFamily: I, fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Продажа</div>
                                  <div style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#2563eb" }}>{r.sell.toFixed(2)}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.7rem", color: "#94a3b8" }}>₽ за 1 {r.code}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Фиксация курса</div>
                          <p style={{ fontFamily: I, color: "#64748b", fontSize: "0.85rem", marginBottom: 14 }}>Зафиксируем курс на срок до 30 дней.</p>
                          <button onClick={() => openSection("contacts")} className="btn-primary" style={{ padding: "9px 22px", fontSize: "0.85rem" }}>Запросить фиксацию</button>
                        </div>
                      </div>
                    )}

                    {cabinetTab === "settings" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>Настройки профиля</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>Данные аккаунта</div>
                            <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                              <div style={{ fontFamily: I, fontSize: "0.7rem", color: "#94a3b8", marginBottom: 2 }}>EMAIL</div>
                              <div style={{ fontFamily: I, color: "#0f172a", fontWeight: 500 }}>{cabinetUser?.email}</div>
                            </div>
                            <form onSubmit={handleSaveSettings}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[{label:"Контактное лицо",key:"contact_name",ph:"Иванов Александр"},{label:"Телефон",key:"phone",ph:"+7 (___) ___-__-__"},{label:"Компания",key:"company",ph:"ООО «Компания»"},{label:"ИНН",key:"inn",ph:"7714123456"},{label:"КПП",key:"kpp",ph:"771401001"}].map(f => (
                                  <div key={f.key}><label className="form-label">{f.label}</label><input className="form-input" value={(settingsForm as any)[f.key]} onChange={e => setSettingsForm({ ...settingsForm, [f.key]: e.target.value })} placeholder={f.ph} /></div>
                                ))}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
                                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>Сохранить</button>
                                {settingsSaved && <span style={{ fontFamily: I, fontSize: "0.875rem", color: "#16a34a", display: "flex", alignItems: "center", gap: 5 }}><Icon name="CheckCircle" size={15} style={{ color: "#16a34a" }} />Сохранено</span>}
                              </div>
                            </form>
                          </div>
                          <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Верификация</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 8, background: cabinetUser?.is_verified ? "#f0fdf4" : "#fffbeb", border: `1px solid ${cabinetUser?.is_verified ? "#bbf7d0" : "#fde68a"}` }}>
                              <Icon name={cabinetUser?.is_verified ? "ShieldCheck" : "Clock"} size={18} style={{ color: cabinetUser?.is_verified ? "#16a34a" : "#d97706" }} />
                              <div>
                                <div style={{ fontFamily: I, fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{cabinetUser?.is_verified ? "KYC пройдена" : "Ожидает KYC-верификации"}</div>
                                <div style={{ fontFamily: I, fontSize: "0.77rem", color: "#64748b", marginTop: 2 }}>{cabinetUser?.is_verified ? "Доступны все операции" : "Срок верификации — 1 рабочий день"}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MAIN ONE-PAGE CONTENT ═══ */}
      {!showCabinet && (
        <main style={{ paddingTop: 97 }}>

          {/* ─── HERO ─── */}
          <section id="hero" style={{ position: "relative", minHeight: "88vh", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
            {/* Фоновая картинка */}
            <img
              src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/5b19751e-6f30-4b4f-adf6-99b75b6a716b.jpg"
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
            {/* Оверлей — синий градиент */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(15,23,42,0.82) 0%, rgba(30,58,138,0.75) 45%, rgba(79,70,229,0.55) 100%)" }} />

            {/* Контент поверх */}
            <div className="container mx-auto px-6 py-20 relative" style={{ zIndex: 2 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Левая колонка — текст */}
                <div className="animate-slide-up">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                    <span style={{ fontFamily: I, fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "0.04em" }}>Профессиональный участник валютного рынка · с 2018 года</span>
                  </div>
                  <h1 style={{ fontFamily: I, fontSize: "clamp(2.4rem,4.8vw,3.8rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 22 }}>
                    Международные<br />платежи{" "}
                    <span style={{ background: "linear-gradient(90deg,#93c5fd,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>без ограничений</span>
                  </h1>
                  <p style={{ fontFamily: I, fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, maxWidth: 480, marginBottom: 36 }}>
                    Оплата инвойсов зарубежным поставщикам, FX‑операции и ВЭД‑сопровождение. 50+ стран, собственная инфраструктура, без санкционных ограничений.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => openSection("contacts")} className="btn-white" style={{ padding: "13px 32px", fontSize: "0.92rem" }}>
                      Получить расчёт <Icon name="ArrowRight" size={16} />
                    </button>
                    <button onClick={() => openSection("services")} className="btn-white-outline" style={{ padding: "12px 28px", fontSize: "0.92rem" }}>Наши услуги</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-8">
                    {["ISO 27001","AML/KYC","ЦБ РФ 181-И","152-ФЗ"].map(b => (
                      <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "5px 14px", fontFamily: I, fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                        <Icon name="ShieldCheck" size={11} style={{ color: "#93c5fd" }} />{b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Правая колонка — курсы + статы */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Карточка курсов */}
                  <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ fontFamily: I, fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Курсы валют</span>
                      <span style={{ fontFamily: I, fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>обновляется каждые 5 мин</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {(rLoading ? CURRENCIES.map(c => ({ code: c.code, name: c.name, flag: c.flag, buy: c.buyFallback, sell: c.sellFallback, change: 0 })) : rates).map(r => (
                        <div key={r.code} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.12)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: "1.1rem" }}>{r.flag}</span>
                            <span style={{ fontFamily: I, fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{r.code}</span>
                            <span style={{ marginLeft: "auto", fontFamily: I, fontSize: "0.68rem", fontWeight: 600, color: r.change >= 0 ? "#4ade80" : "#f87171" }}>{r.change >= 0 ? "▲" : "▼"}{Math.abs(r.change).toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div>
                              <div style={{ fontFamily: I, fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>покупка</div>
                              <div style={{ fontFamily: I, fontWeight: 700, color: "#93c5fd", fontSize: "0.9rem" }}>{r.buy.toFixed(2)}</div>
                            </div>
                            <div style={{ width: 1, background: "rgba(255,255,255,0.15)", margin: "2px 0" }} />
                            <div>
                              <div style={{ fontFamily: I, fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>продажа</div>
                              <div style={{ fontFamily: I, fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>{r.sell.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Статистика */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {[{n:"50+",l:"стран"},{n:"500k+",l:"операций"},{n:"99.8%",l:"успешность"},{n:"2018",l:"год осн."}].map((s, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                        <div style={{ fontFamily: I, fontSize: "1.2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.n}</div>
                        <div style={{ fontFamily: I, fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── ABOUT ─── */}
          <section id="about" style={{ background: "#fff" }} className="section-padding">
            <div className="container mx-auto px-6">
              <div className="reveal" style={{ textAlign: "center", marginBottom: 52 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Кто мы</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>О компании</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="reveal reveal-left">
                  <h3 style={{ fontFamily: I, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 16 }}>Специализированный провайдер международных платёжных сервисов</h3>
                  {["ВЭД Агент Сервис работает с 2018 года. Провели более 500 000 операций на сумму свыше $1,5 млрд. Специализируемся на международных платёжных и ВЭД-сервисах для российского бизнеса.",
                    "Ключевое преимущество — собственная инфраструктура: 30+ юридических лиц в банках разных юрисдикций. Проводим платежи туда, куда крупные банки отказывают из-за санкций.",
                    "Работаем в правовом поле: соответствуем требованиям ЦБ РФ, соблюдаем стандарты AML/KYC, сертифицированы по ISO 27001."
                  ].map((t, i) => <p key={i} style={{ fontFamily: I, color: "#475569", lineHeight: 1.75, marginBottom: 12 }}>{t}</p>)}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                    {["Профессиональный участник валютного рынка","Соответствие требованиям ЦБ РФ 181-И","Страхование операций до $10 млн","Рейтинг надёжности AAA"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", border: "1.5px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}><Icon name="Check" size={11} style={{ color: "#2563eb" }} /></div>
                        <span style={{ fontFamily: I, color: "#374151", fontSize: "0.9rem" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="reveal reveal-right">
                  <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/d793b5de-291a-4218-8af6-74901298deb8.jpg" alt="ВЭД Агент Сервис — офис" style={{ width: "100%", height: 340, objectFit: "cover", borderRadius: 16, boxShadow: "0 8px 32px rgba(37,99,235,0.1)" }} />
                  <div style={{ marginTop: 20, padding: "18px 24px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p style={{ fontFamily: I, fontSize: "0.95rem", color: "#1e40af", lineHeight: 1.65, fontStyle: "italic", fontWeight: 500 }}>«Наша миссия — помочь российскому бизнесу работать с зарубежными партнёрами легально, безопасно и без лишних сложностей»</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
                {[{n:"2018",l:"год основания"},{n:"500k+",l:"операций"},{n:"50+",l:"стран"},{n:"30+",l:"банков-партнёров"}].map((s, i) => (
                  <div key={i} className={`card-stat reveal reveal-delay-${i + 1}`} style={{ textAlign: "center" }}>
                    <div className="stat-number">{s.n}</div>
                    <div style={{ fontFamily: I, color: "#64748b", fontSize: "0.8rem", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── SERVICES ─── */}
          <section id="services" style={{ background: "#f8fafc" }} className="section-padding">
            <div className="container mx-auto px-6">
              <div className="reveal" style={{ textAlign: "center", marginBottom: 52 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Что мы предлагаем</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>Услуги</h2>
                <p style={{ fontFamily: I, color: "#64748b", marginTop: 12, maxWidth: 520, margin: "12px auto 0", lineHeight: 1.7 }}>Полный спектр сервисов для безопасных международных расчётов и ВЭД-сопровождения</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {SERVICES.map((s, i) => (
                  <div key={i} className={`card-service reveal reveal-delay-${(i % 3) + 1}`} style={{ background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#eff6ff,#eef2ff)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon as any} size={22} style={{ color: "#2563eb" }} /></div>
                      <span className="badge-blue">{s.price}</span>
                    </div>
                    <h3 style={{ fontFamily: I, fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontFamily: I, color: "#64748b", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>
                    <button onClick={() => openSection("contacts")} style={{ fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>Узнать подробнее <Icon name="ArrowRight" size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── PORTFOLIO ─── */}
          <section id="portfolio" style={{ background: "#fff" }} className="section-padding">
            <div className="container mx-auto px-6">
              <div className="reveal" style={{ textAlign: "center", marginBottom: 52 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Наш опыт</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>Кейсы</h2>
                <p style={{ fontFamily: I, color: "#64748b", marginTop: 12, maxWidth: 520, margin: "12px auto 0", lineHeight: 1.7 }}>Реальные задачи, которые мы уже решили для российского бизнеса</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {PORTFOLIO.map((p, i) => (
                  <div key={i} className={`reveal reveal-delay-${(i % 3) + 1}`} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(37,99,235,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                    <div style={{ height: 4, background: "linear-gradient(90deg,#2563eb,#4f46e5)" }} />
                    <div style={{ padding: "22px 22px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span className="badge-blue">{p.tag}</span>
                        <span style={{ fontFamily: I, fontSize: "0.75rem", color: "#94a3b8" }}>{p.industry}</span>
                      </div>
                      <h3 style={{ fontFamily: I, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "10px 0 8px" }}>{p.title}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Icon name="DollarSign" size={12} style={{ color: "#2563eb" }} />
                        <span style={{ fontFamily: I, color: "#64748b", fontSize: "0.82rem" }}>Объём: {p.volume}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Icon name="CheckCircle" size={13} style={{ color: "#16a34a", marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontFamily: I, color: "#475569", fontSize: "0.85rem" }}>{p.result}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── PROCESS ─── */}
          <section style={{ background: "#f8fafc" }} className="section-padding">
            <div className="container mx-auto px-6">
              <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Как работаем</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>Четыре шага до платежа</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { n: "01", title: "Заявка",           desc: "Оставьте заявку. Ответим за 30 минут." },
                  { n: "02", title: "KYC-верификация",  desc: "Однократная проверка документов. 1 рабочий день." },
                  { n: "03", title: "Договор",          desc: "Согласуем условия, комиссию и сроки." },
                  { n: "04", title: "Исполнение",       desc: "1–3 рабочих дня. SWIFT-подтверждение в кабинете." },
                ].map((s, i) => (
                  <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px 22px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 16, right: 18, fontFamily: I, fontSize: "3rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.n}</div>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <span style={{ fontFamily: I, fontWeight: 800, color: "#fff", fontSize: "0.85rem" }}>{s.n}</span>
                    </div>
                    <h3 style={{ fontFamily: I, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{s.title}</h3>
                    <p style={{ fontFamily: I, color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── BLOG ─── */}
          <section id="blog" style={{ background: "#fff" }} className="section-padding">
            <div className="container mx-auto px-6">
              <div className="reveal" style={{ textAlign: "center", marginBottom: 52 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Экспертиза</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>Блог</h2>
                <p style={{ fontFamily: I, color: "#64748b", marginTop: 12, maxWidth: 520, margin: "12px auto 0", lineHeight: 1.7 }}>Актуальные материалы о валютном регулировании и международных расчётах</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BLOG_ITEMS.map((b, i) => (
                  <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(37,99,235,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                    <div style={{ height: 4, background: "linear-gradient(90deg,#2563eb,#4f46e5)" }} />
                    <div style={{ padding: "22px 22px 26px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span className="badge-blue">{b.tag}</span>
                        <span style={{ fontFamily: I, color: "#94a3b8", fontSize: "0.78rem" }}>{b.date}</span>
                      </div>
                      <h3 style={{ fontFamily: I, fontSize: "1rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.35, marginBottom: 10 }}>{b.title}</h3>
                      <p style={{ fontFamily: I, color: "#64748b", fontSize: "0.875rem", lineHeight: 1.65 }}>{b.excerpt}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 18, fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb" }}>Читать далее <Icon name="ArrowRight" size={14} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── FAQ ─── */}
          <section id="faq" style={{ background: "#f8fafc" }} className="section-padding">
            <div className="container mx-auto px-6" style={{ maxWidth: 780 }}>
              <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Вопросы и ответы</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>FAQ</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className={`reveal reveal-delay-${Math.min(i + 1, 6)}`} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${faqOpen === i ? "#bfdbfe" : "#e2e8f0"}`, overflow: "hidden", transition: "border-color 0.15s, opacity 0.65s, transform 0.65s" }}>
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: "100%", textAlign: "left", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "none", border: "none", cursor: "pointer" }}>
                      <span style={{ fontFamily: I, fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>{item.q}</span>
                      <Icon name={faqOpen === i ? "ChevronUp" : "ChevronDown"} size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
                    </button>
                    {faqOpen === i && (
                      <div className="animate-fade-in" style={{ padding: "0 22px 20px", borderTop: "1px solid #f1f5f9" }}>
                        <p style={{ fontFamily: I, color: "#475569", lineHeight: 1.75, marginTop: 14 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── CONTACTS ─── */}
          <section id="contacts" style={{ background: "#fff" }} className="section-padding">
            <div className="container mx-auto px-6">
              <div className="reveal" style={{ textAlign: "center", marginBottom: 52 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Свяжитесь с нами</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>Контакты</h2>
                <p style={{ fontFamily: I, color: "#64748b", marginTop: 12, maxWidth: 480, margin: "12px auto 0", lineHeight: 1.7 }}>Ответим в течение 30 минут в рабочее время</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Form */}
                <div className="reveal reveal-left" style={{ background: "#fff", borderRadius: 16, padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(37,99,235,0.06)" }}>
                  <h3 style={{ fontFamily: I, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Оставить заявку</h3>
                  <p style={{ fontFamily: I, color: "#64748b", marginBottom: 24, fontSize: "0.875rem" }}>Расчёт комиссии и сроков бесплатно</p>
                  {contactSent ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="CheckCircle" size={30} style={{ color: "#2563eb" }} /></div>
                      <h3 style={{ fontFamily: I, fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>Заявка принята!</h3>
                      <p style={{ fontFamily: I, color: "#64748b", marginTop: 8 }}>Менеджер свяжется с вами в ближайшее время.</p>
                      <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }} onClick={() => setContactSent(false)}>Отправить ещё</button>
                    </div>
                  ) : (
                    <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="form-label">Имя *</label><input required className="form-input" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Александр" /></div>
                        <div><label className="form-label">Компания</label><input className="form-input" value={contactForm.company} onChange={e => setContactForm({ ...contactForm, company: e.target.value })} placeholder="ООО «Компания»" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="form-label">Телефон *</label><input required type="tel" className="form-input" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="+7 (___) ___-__-__" /></div>
                        <div><label className="form-label">Email *</label><input required type="email" className="form-input" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="info@company.ru" /></div>
                      </div>
                      <div>
                        <label className="form-label">Услуга</label>
                        <select className="form-input" value={contactForm.service} onChange={e => setContactForm({ ...contactForm, service: e.target.value })}>
                          <option value="">Выберите услугу</option>
                          {SERVICES.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                        </select>
                      </div>
                      <div><label className="form-label">Сообщение</label><textarea rows={3} className="form-input" style={{ resize: "none" } as any} value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Страна назначения, сумма, валюта..." /></div>
                      <button type="submit" className="btn-primary" style={{ padding: "12px 0", justifyContent: "center", width: "100%", fontSize: "0.95rem" }}>Отправить заявку</button>
                    </form>
                  )}
                </div>
                {/* Info */}
                <div className="reveal reveal-right" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[{icon:"MapPin",title:"Адрес",val:"123112, Москва, Пресненская наб., 12"},{icon:"Phone",title:"Телефон",val:"+7 (499) 398-50-02"},{icon:"Mail",title:"Email",val:"info@vedagentservice.ru"},{icon:"Clock",title:"Режим работы",val:"Пн–Пт: 9:00–18:00 (МСК)"}].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={c.icon as any} size={18} style={{ color: "#2563eb" }} /></div>
                      <div>
                        <div style={{ fontFamily: I, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 3 }}>{c.title}</div>
                        <div style={{ fontFamily: I, color: "#0f172a", fontWeight: 500 }}>{c.val}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ background: "linear-gradient(135deg,#eff6ff,#eef2ff)", borderRadius: 12, padding: "20px 22px", border: "1px solid #bfdbfe", marginTop: 4 }}>
                    <p style={{ fontFamily: I, color: "#1e40af", fontSize: "0.875rem", marginBottom: 12, fontWeight: 500 }}>Быстрая связь:</p>
                    <div className="flex gap-3">
                      <a href="https://t.me/+74993985002" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.85rem", textDecoration: "none" }}><Icon name="Send" size={14} />Telegram</a>
                      <a href="https://wa.me/74993985002" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: "9px 20px", fontSize: "0.85rem", textDecoration: "none" }}><Icon name="MessageCircle" size={14} />WhatsApp</a>
                    </div>
                  </div>
                  {/* Реквизиты */}
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px 22px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontFamily: I, fontWeight: 700, color: "#0f172a", marginBottom: 12, fontSize: "0.9rem" }}>Реквизиты компании</div>
                    {[["ООО «ВЭД Агент Сервис»",""],["ИНН","7714123456"],["ОГРН","1187746123456"],["КПП","771401001"]].map(([label, val], i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: I, color: "#94a3b8", fontSize: "0.8rem", minWidth: 60 }}>{val ? label : ""}</span>
                        <span style={{ fontFamily: I, color: val ? "#0f172a" : "#475569", fontWeight: val ? 500 : 400, fontSize: "0.82rem" }}>{val || label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* ═══ FOOTER ═══ */}
      {!showCabinet && (
        <footer style={{ background: "#0f172a", borderTop: "1px solid #1e293b" }}>
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8" style={{ borderBottom: "1px solid #1e293b" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="Globe" size={15} style={{ color: "#fff" }} /></div>
                  <span style={{ fontFamily: I, fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>ВЭД Агент Сервис</span>
                </div>
                <p style={{ fontFamily: I, color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7 }}>Международные платежи и ВЭД-сопровождение для российского бизнеса.</p>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {[{icon:"Send",href:"https://t.me/+74993985002"},{icon:"MessageCircle",href:"https://wa.me/74993985002"}].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #334155" }}><Icon name={s.icon as any} size={14} style={{ color: "#64748b" }} /></a>
                  ))}
                </div>
              </div>
              {[
                { title: "Разделы", links: [["Главная","hero"],["О компании","about"],["Услуги","services"],["Кейсы","portfolio"],["Блог","blog"],["FAQ","faq"],["Контакты","contacts"]] },
                { title: "Услуги", links: [["Международные платежи",""],["Валютное регулирование",""],["FX операции",""],["Комплаенс",""],["Криптовалюта",""]] },
                { title: "Контакты", links: [["+7 (499) 398-50-02",""],["info@vedagentservice.ru",""],["Пресненская наб., 12",""],["Пн–Пт: 9:00–18:00",""]] },
              ].map((col, ci) => (
                <div key={ci}>
                  <h4 style={{ fontFamily: I, fontSize: "0.77rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 14 }}>{col.title}</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.links.map(([link, id], j) => (
                      <li key={j}>
                        {id ? (
                          <button onClick={() => openSection(id)} style={{ fontFamily: I, color: "#64748b", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s", textAlign: "left" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>{link}</button>
                        ) : (
                          <span style={{ fontFamily: I, color: "#64748b", fontSize: "0.85rem" }}>{link}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <p style={{ fontFamily: I, color: "#475569", fontSize: "0.78rem" }}>© 2024 ООО «ВЭД Агент Сервис». Все права защищены.</p>
              <p style={{ fontFamily: I, color: "#475569", fontSize: "0.78rem" }}>ИНН 7714123456 · ОГРН 1187746123456</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}