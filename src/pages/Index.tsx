/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Section = "home" | "about" | "services" | "portfolio" | "blog" | "faq" | "contacts" | "cabinet";
type CabinetTab = "dashboard" | "orders" | "documents" | "messages" | "rates" | "settings";

// ── Currency rates ─────────────────────────────────────────────────────────
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
          const spread = 0.015;
          const change = +(( Math.random() - 0.5) * 0.4).toFixed(2);
          return { code: c.code, name: c.name, flag: c.flag, buy: +(mid*(1-spread)).toFixed(2), sell: +(mid*(1+spread)).toFixed(2), change };
        }));
      } catch { /* fallback stays */ }
      finally { setLoading(false); }
    };
    load();
    const t = setInterval(load, 300_000);
    return () => clearInterval(t);
  }, []);

  return { rates, loading };
}

// ── Static data ────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: "Globe", title: "Международные платежи", desc: "Переводы в 50+ стран в любой валюте. Комиссия от 0.5%. Срок 1–3 рабочих дня. Собственная инфраструктура без санкционных ограничений.", price: "от 0.5%" },
  { icon: "Shield", title: "Валютное регулирование", desc: "Паспорта сделок, справки о валютных операциях, сопровождение проверок ЦБ РФ. Полное соответствие 173-ФЗ и инструкции ЦБ 181-И.", price: "по запросу" },
  { icon: "TrendingUp", title: "FX операции", desc: "Конверсия 50+ валютных пар. Фиксация курса на срок до 30 дней. Хеджирование валютных рисков. Спред от 0.3%.", price: "спред от 0.3%" },
  { icon: "Search", title: "Комплаенс и безопасность", desc: "Due Diligence контрагентов, AML-проверки, санкционный скрининг по базам OFAC, EU, UN. Защита от блокировки платежей.", price: "от 5 000 ₽" },
  { icon: "Bitcoin", title: "Криптовалютные операции", desc: "Легальная конвертация крипты в фиат и обратно. Работа с USDT, BTC, ETH. Полное юридическое оформление.", price: "от 1.5%" },
  { icon: "FileText", title: "Документооборот и ВЭД", desc: "Подготовка внешнеторговых договоров, инвойсов, упаковочных листов. Сопровождение таможенного оформления.", price: "от 3 000 ₽" },
];

const ADVANTAGES = [
  { icon: "Zap", title: "Быстрое исполнение", desc: "1–3 рабочих дня для стандартных переводов, 24/7 для срочных" },
  { icon: "Lock", title: "Полная безопасность", desc: "ISO 27001, AML/KYC, соответствие 152-ФЗ, санкционный скрининг" },
  { icon: "Globe2", title: "50+ стран и валют", desc: "Собственная инфраструктура: 30+ юр. лиц в банках разных юрисдикций" },
  { icon: "Percent", title: "Низкие комиссии", desc: "От 0.5% — в 2–3 раза ниже банковских тарифов" },
];

const FAQ_ITEMS = [
  { q: "В какие страны вы осуществляете платежи?", a: "Мы работаем с 50+ странами: Китай, ОАЭ, Турция, страны ЕС, США, Юго-Восточная Азия, СНГ и другие." },
  { q: "Какой минимальный размер платежа?", a: "Минимальная сумма — $500 или эквивалент. Для клиентов с оборотом от $50 000/мес — специальные условия." },
  { q: "Как долго проходят платежи?", a: "Стандарт — 1–3 рабочих дня. Срочный режим — в тот же день (доп. комиссия 0.3%)." },
  { q: "Какие документы нужны?", a: "Инвойс, контракт с зарубежным поставщиком, документы о праве подписи. Новым клиентам — KYC-верификация (1 рабочий день)." },
  { q: "Как происходит ценообразование?", a: "Комиссия от 0.5% до 4% в зависимости от направления, суммы и срочности. Точный расчёт — по запросу." },
  { q: "Вы работаете с физическими лицами?", a: "Нет, только с юридическими лицами и ИП, осуществляющими внешнеэкономическую деятельность." },
];

const BLOG_ITEMS = [
  { date: "12 марта 2026", tag: "Регулирование", title: "Новые требования ЦБ к валютным операциям в 2026 году", excerpt: "Разбираем изменения в инструкции ЦБ РФ 181-И и их влияние на порядок проведения международных расчётов." },
  { date: "5 марта 2026", tag: "Китай", title: "Платежи в Китай в 2026: рабочие схемы и подводные камни", excerpt: "Как проводить оплату китайским поставщикам в условиях ужесточения комплаенс-требований." },
  { date: "20 февраля 2026", tag: "Криптовалюта", title: "USDT для ВЭД: легальные схемы конвертации для бизнеса", excerpt: "Правовой статус крипто-транзакций, актуальные инструменты и риски использования стейблкоинов в расчётах." },
];

const ORDERS_DATA = [
  { id: "PAY-8847", service: "Международный платёж", country: "🇨🇳 Китай",    amount: "$12,500",   status: "done",    date: "05.03.2026", manager: "Козлов В.А." },
  { id: "PAY-8821", service: "FX операция",          country: "🇦🇪 ОАЭ",      amount: "AED 45,000", status: "active",  date: "14.03.2026", manager: "Лебедева О.С." },
  { id: "PAY-8796", service: "Комплаенс",            country: "🇩🇪 Германия", amount: "€8,200",    status: "pending", date: "16.03.2026", manager: "Козлов В.А." },
  { id: "PAY-8750", service: "Международный платёж", country: "🇹🇷 Турция",   amount: "$6,800",    status: "done",    date: "10.02.2026", manager: "Лебедева О.С." },
];

const MESSAGES_DATA = [
  { from: "Козлов В.А.", role: "Персональный менеджер", text: "Добрый день! Платёж PAY-8821 в ОАЭ подтверждён банком-корреспондентом. Ожидайте зачисление в течение 24 часов.", time: "Сегодня, 10:42", unread: true },
  { from: "Служба комплаенс", role: "Compliance", text: "По запросу PAY-8796: для завершения Due Diligence германского контрагента требуется выписка из торгового реестра (Handelsregister).", time: "Вчера, 16:15", unread: true },
  { from: "Система", role: "Уведомление", text: "Платёж PAY-8847 в Китай успешно зачислен получателю. SWIFT-подтверждение загружено в раздел «Документы».", time: "05.03.2026", unread: false },
];

const DOCS_DATA = [
  { name: "SWIFT-подтверждение PAY-8847", type: "PDF", size: "0.3 МБ", date: "05.03.2026" },
  { name: "Инвойс — Китай (Supplier Ltd)",  type: "PDF", size: "0.8 МБ", date: "03.03.2026" },
  { name: "Договор-оферта №2025-847",       type: "PDF", size: "1.2 МБ", date: "10.01.2026" },
  { name: "Due Diligence отчёт — Германия", type: "PDF", size: "2.1 МБ", date: "14.03.2026" },
  { name: "Акт об оказании услуг фев. 2026",type: "PDF", size: "0.4 МБ", date: "28.02.2026" },
  { name: "Справка о вал. операциях Q1",    type: "XLSX",size: "0.6 МБ", date: "01.03.2026" },
];

const I = "Inter, system-ui, sans-serif";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:  { label: "В процессе", cls: "badge-amber" },
    done:    { label: "Исполнен",   cls: "badge-green" },
    pending: { label: "На проверке", cls: "badge-blue" },
  };
  const s = map[status] || map.pending;
  return <span className={s.cls}>{s.label}</span>;
}

export default function Index() {
  const [section, setSection]           = useState<Section>("home");
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [loginForm, setLoginForm]       = useState({ email: "", password: "" });
  const [loginError, setLoginError]     = useState("");
  const [cabinetTab, setCabinetTab]     = useState<CabinetTab>("dashboard");
  const [contactForm, setContactForm]   = useState({ name: "", company: "", phone: "", email: "", message: "", service: "" });
  const [contactSent, setContactSent]   = useState(false);
  const [faqOpen, setFaqOpen]           = useState<number | null>(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [regForm, setRegForm]           = useState({ name: "", company: "", inn: "", email: "", phone: "", password: "" });
  const [regDone, setRegDone]           = useState(false);
  const { rates, loading: rLoading }    = useCurrencyRates();

  const nav = (s: Section) => { setSection(s); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((loginForm.email === "jobtravel@bk.ru" && loginForm.password === "18081991") || (loginForm.email && loginForm.password.length >= 4)) {
      setIsLoggedIn(true); setLoginError(""); setCabinetTab("dashboard");
    } else {
      setLoginError("Неверный email или пароль");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.name && regForm.email && regForm.password.length >= 6) setRegDone(true);
  };

  const handleContact = (e: React.FormEvent) => { e.preventDefault(); setContactSent(true); };

  const navItems: { label: string; key: Section }[] = [
    { label: "Главная", key: "home" }, { label: "О компании", key: "about" },
    { label: "Услуги", key: "services" }, { label: "Портфолио", key: "portfolio" },
    { label: "Блог", key: "blog" }, { label: "FAQ", key: "faq" }, { label: "Контакты", key: "contacts" },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: I }}>

      {/* ─── HEADER ─── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Top bar */}
        <div style={{ background: "#1e3a8a", padding: "7px 0" }}>
          <div className="container mx-auto px-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-5">
              <a href="tel:+74993985002" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem", fontFamily: I, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="Phone" size={11} style={{ color: "#93c5fd" }} />+7 (499) 398-50-02
              </a>
              <a href="mailto:info@vedagentservice.ru" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem", fontFamily: I, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }} className="hidden sm:flex">
                <Icon name="Mail" size={11} style={{ color: "#93c5fd" }} />info@vedagentservice.ru
              </a>
            </div>
            <div className="flex items-center gap-3">
              {!rLoading && rates.slice(0, 3).map(r => (
                <span key={r.code} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontFamily: I }}>
                  {r.flag} <span style={{ color: "#93c5fd", fontWeight: 600 }}>{r.code}</span> {r.sell.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Main row */}
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => nav("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Globe" size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontFamily: I, fontSize: "1rem", fontWeight: 800, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.02em" }}>ВЭД Агент</div>
                <div style={{ fontSize: "0.58rem", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: I }}>Сервис</div>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map(item => (
                <button key={item.key} onClick={() => nav(item.key)} className={`nav-link ${section === item.key ? "active" : ""}`}>{item.label}</button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={() => nav("contacts")} className="btn-primary hidden sm:flex" style={{ padding: "8px 18px", fontSize: "0.82rem" }}>Консультация</button>
              <button onClick={() => nav("cabinet")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "white", fontFamily: I, fontSize: "0.82rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
                <Icon name="User" size={14} style={{ color: "#6b7280" }} />{isLoggedIn ? "Кабинет" : "Войти"}
              </button>
              <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name={mobileOpen ? "X" : "Menu"} size={22} style={{ color: "#374151" }} />
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "16px 24px" }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => nav(item.key)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 0", fontFamily: I, fontSize: "0.9rem", fontWeight: section === item.key ? 600 : 400, color: section === item.key ? "#2563eb" : "#374151", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>{item.label}</button>
            ))}
            <div className="flex gap-2 mt-4">
              <button onClick={() => nav("contacts")} className="btn-primary flex-1 justify-center" style={{ padding: "10px 0", fontSize: "0.875rem" }}>Консультация</button>
              <button onClick={() => nav("cabinet")} className="btn-outline flex-1 justify-center" style={{ padding: "10px 0", fontSize: "0.875rem" }}>{isLoggedIn ? "Кабинет" : "Войти"}</button>
            </div>
          </div>
        )}
      </header>

      <main style={{ paddingTop: 97 }}>

        {/* ══════ HOME ══════ */}
        {section === "home" && <>
          {/* Hero */}
          <section className="hero-bg" style={{ minHeight: "88vh", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.35) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 40, left: "10%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.25) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div className="container mx-auto px-6 py-20 relative">
              <div style={{ maxWidth: 680 }} className="animate-slide-up">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                  <span style={{ fontFamily: I, fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "0.05em" }}>Профессиональный участник валютного рынка · с 2018 года</span>
                </div>
                <h1 style={{ fontFamily: I, fontSize: "clamp(2.4rem,5.5vw,4rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24 }}>
                  Международные<br />платежи{" "}
                  <span style={{ background: "linear-gradient(90deg,#93c5fd,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>без ограничений</span>
                </h1>
                <p style={{ fontFamily: I, fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, maxWidth: 500, marginBottom: 36 }}>
                  Оплата инвойсов зарубежным поставщикам, FX‑операции и ВЭД‑сопровождение. 50+ стран, собственная инфраструктура.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => nav("contacts")} className="btn-white" style={{ padding: "13px 32px", fontSize: "0.9rem" }}>
                    Получить расчёт <Icon name="ArrowRight" size={16} />
                  </button>
                  <button onClick={() => nav("services")} className="btn-white-outline" style={{ padding: "13px 32px", fontSize: "0.9rem" }}>Наши услуги</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-8">
                  {["ISO 27001","AML/KYC","ЦБ РФ 181-И","152-ФЗ"].map(b => (
                    <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 100, padding: "4px 12px", fontFamily: I, fontSize: "0.72rem", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
                      <Icon name="ShieldCheck" size={11} style={{ color: "#93c5fd" }} />{b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Stats bar */}
            <div style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "auto" }}>
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderLeft: "none" }}>
                  {[{n:"50+",l:"стран и валют"},{n:"500k+",l:"операций"},{n:"99.8%",l:"успешность"},{n:"$127M",l:"объём/мес"}].map((s,i) => (
                    <div key={i} style={{ padding: "20px 16px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                      <div style={{ fontFamily: I, fontSize: "1.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.n}</div>
                      <div style={{ fontFamily: I, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Rates ticker */}
          <div style={{ background: "#1e40af", padding: "10px 0", borderBottom: "1px solid #1d4ed8" }}>
            <div className="container mx-auto px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span style={{ fontFamily: I, fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8 }}>Курсы валют:</span>
                {rLoading ? <span style={{ fontFamily: I, fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Загрузка...</span> : rates.map(r => (
                  <div key={r.code} className="rate-pill">
                    <span>{r.flag}</span>
                    <span style={{ fontWeight: 600 }}>{r.code}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>покупка</span>
                    <span style={{ color: "#93c5fd", fontWeight: 600 }}>{r.buy.toFixed(2)}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>продажа</span>
                    <span style={{ color: "#93c5fd", fontWeight: 600 }}>{r.sell.toFixed(2)}</span>
                    <span style={{ fontSize: "0.68rem", color: r.change >= 0 ? "#4ade80" : "#f87171" }}>{r.change >= 0 ? "▲" : "▼"}{Math.abs(r.change).toFixed(2)}</span>
                  </div>
                ))}
                <span style={{ marginLeft: "auto", fontFamily: I, fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>обновление каждые 5 мин</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <section className="section-padding" style={{ background: "#f9fafb" }}>
            <div className="container mx-auto px-6">
              <div style={{ textAlign: "center", marginBottom: 52 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Что мы делаем</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.8rem,3.5vw,2.5rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>Наши услуги</h2>
                <p style={{ fontFamily: I, color: "#6b7280", marginTop: 12, maxWidth: 520, margin: "12px auto 0", lineHeight: 1.7 }}>Полный спектр сервисов для безопасных международных расчётов</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {SERVICES.map((s, i) => (
                  <div key={i} className="card-service">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                      <div className="icon-box"><Icon name={s.icon as any} size={22} style={{ color: "#2563eb" }} /></div>
                      <span className="badge-blue">{s.price}</span>
                    </div>
                    <h3 style={{ fontFamily: I, fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>
                    <button onClick={() => nav("contacts")} style={{ fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                      Узнать подробнее <Icon name="ArrowRight" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why us */}
          <section className="section-padding" style={{ background: "#fff" }}>
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="section-label">Почему мы</div>
                  <h2 style={{ fontFamily: I, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1.25, marginTop: 8 }}>
                    Работаем с зарубежными партнёрами легально и безопасно
                  </h2>
                  <p style={{ fontFamily: I, color: "#6b7280", lineHeight: 1.75, marginTop: 18 }}>
                    Собственная инфраструктура из 30+ юридических лиц в банках разных юрисдикций позволяет проводить платежи туда, куда банки отказывают. С 2018 года, 500k+ операций.
                  </p>
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ADVANTAGES.map((a, i) => (
                      <div key={i} style={{ padding: "18px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fafafa" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name={a.icon as any} size={15} style={{ color: "#2563eb" }} />
                          </div>
                          <span style={{ fontFamily: I, fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{a.title}</span>
                        </div>
                        <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.55 }}>{a.desc}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => nav("about")} className="btn-outline" style={{ marginTop: 28 }}>О компании</button>
                </div>
                <div style={{ position: "relative" }}>
                  <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/f4cd3994-da5c-48a6-aee1-38574ccee131.jpg" alt="Команда" style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 16 }} />
                  <div style={{ position: "absolute", bottom: -16, left: -16, padding: "18px 22px", background: "linear-gradient(135deg,#2563eb,#4f46e5)", borderRadius: 12 }}>
                    <div style={{ fontFamily: I, fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>2018</div>
                    <div style={{ fontFamily: I, fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: 500 }}>год основания</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="section-padding section-gray">
            <div className="container mx-auto px-6">
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div className="section-label" style={{ justifyContent: "center" }}>Как работаем</div>
                <h2 style={{ fontFamily: I, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>Четыре шага до платежа</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { n: "01", title: "Заявка", desc: "Оставьте заявку. Ответим за 30 минут." },
                  { n: "02", title: "KYC-верификация", desc: "Однократная проверка документов. 1 рабочий день." },
                  { n: "03", title: "Договор", desc: "Согласуем условия, комиссию и сроки." },
                  { n: "04", title: "Исполнение", desc: "1–3 рабочих дня. SWIFT-подтверждение в кабинете." },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 22px" }}>
                    <div style={{ fontFamily: I, fontSize: "2.5rem", fontWeight: 800, color: "#dbeafe", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>{s.n}</div>
                    <h3 style={{ fontFamily: I, fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: 6 }}>{s.title}</h3>
                    <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="section-dark" style={{ padding: "72px 0" }}>
            <div className="container mx-auto px-6 text-center">
              <h2 style={{ fontFamily: I, fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginBottom: 14 }}>Готовы провести международный платёж?</h2>
              <p style={{ fontFamily: I, color: "rgba(255,255,255,0.65)", marginBottom: 32 }}>Первичная консультация бесплатно. Расчёт комиссии — в течение 2 часов.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => nav("contacts")} className="btn-white" style={{ padding: "13px 36px", fontSize: "0.95rem" }}>Получить расчёт</button>
                <a href="https://t.me/+74993985002" target="_blank" rel="noopener noreferrer" className="btn-white-outline" style={{ padding: "13px 28px", fontSize: "0.95rem", textDecoration: "none" }}>
                  <Icon name="Send" size={16} />Telegram
                </a>
              </div>
            </div>
          </section>
        </>}

        {/* ══════ ABOUT ══════ */}
        {section === "about" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "72px 0" }}>
            <div className="container mx-auto px-6">
              <div className="section-label" style={{ color: "#93c5fd" }}><span style={{ background: "#93c5fd" }} />О компании</div>
              <h1 style={{ fontFamily: I, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 8 }}>ВЭД Агент Сервис</h1>
              <p style={{ fontFamily: I, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Международные платежи и ВЭД-сопровождение с 2018 года</p>
            </div>
          </div>
          <div className="section-padding" style={{ background: "#fff" }}>
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div>
                  <div className="section-label">Кто мы</div>
                  <h2 style={{ fontFamily: I, fontSize: "1.8rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1.25, marginTop: 8 }}>Специализированный провайдер международных платёжных сервисов</h2>
                  {["ВЭД Агент Сервис работает с 2018 года. Провели более 500 000 операций на сумму свыше $1,5 млрд. Специализируемся на международных платёжных и ВЭД-сервисах для российского бизнеса.",
                    "Ключевое преимущество — собственная инфраструктура: 30+ юридических лиц в банках разных юрисдикций. Проводим платежи туда, куда крупные банки отказывают из-за санкций.",
                    "Работаем в правовом поле: соответствуем требованиям ЦБ РФ, соблюдаем стандарты AML/KYC, сертифицированы по ISO 27001."
                  ].map((t, i) => <p key={i} style={{ fontFamily: I, color: "#4b5563", lineHeight: 1.75, marginTop: 16 }}>{t}</p>)}
                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Профессиональный участник валютного рынка","Соответствие требованиям ЦБ РФ 181-И","Страхование операций до $10 млн","Рейтинг надёжности AAA"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", border: "1.5px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <Icon name="Check" size={11} style={{ color: "#2563eb" }} />
                        </div>
                        <span style={{ fontFamily: I, color: "#374151", fontSize: "0.9rem" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/d16a817d-c941-448a-8da7-9acc2b9dfd77.jpg" alt="О компании" style={{ width: "100%", height: 340, objectFit: "cover", borderRadius: 16 }} />
                  <div style={{ marginTop: 20, padding: "20px 24px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p style={{ fontFamily: I, fontSize: "0.95rem", color: "#1e40af", lineHeight: 1.65, fontStyle: "italic", fontWeight: 500 }}>«Наша миссия — помочь российскому бизнесу работать с зарубежными партнёрами легально, безопасно и без лишних сложностей»</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
                {[{n:"2018",l:"год основания"},{n:"500k+",l:"операций"},{n:"50+",l:"стран"},{n:"30+",l:"банков-партнёров"}].map((s, i) => (
                  <div key={i} className="card-stat" style={{ textAlign: "center" }}>
                    <div className="stat-number">{s.n}</div>
                    <div style={{ fontFamily: I, color: "#6b7280", fontSize: "0.8rem", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: "32px 28px", marginTop: 32, border: "1px solid #e5e7eb" }}>
                <h2 style={{ fontFamily: I, fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: 20 }}>Реквизиты компании</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {[["Полное наименование","ООО «ВЭД Агент Сервис»"],["Юридический адрес","123112, г. Москва, Пресненская наб., 12"],["ИНН","7714123456"],["ОГРН","1187746123456"],["КПП","771401001"],["Расчётный счёт","40702810XXXX0000XXXX"]].map(([label, val], i) => (
                    <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid #e5e7eb", marginBottom: 12 }}>
                      <span style={{ fontFamily: I, color: "#9ca3af", fontSize: "0.82rem", minWidth: 150, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontFamily: I, color: "#111827", fontWeight: 500, fontSize: "0.875rem" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>}

        {/* ══════ SERVICES ══════ */}
        {section === "services" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "72px 0" }}>
            <div className="container mx-auto px-6">
              <div className="section-label" style={{ color: "#93c5fd" }}><span style={{ background: "#93c5fd" }} />Что мы предлагаем</div>
              <h1 style={{ fontFamily: I, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 8 }}>Услуги</h1>
            </div>
          </div>
          <div className="section-padding section-gray">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
                {SERVICES.map((s, i) => (
                  <div key={i} className="card-service" style={{ background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                      <div className="icon-box"><Icon name={s.icon as any} size={22} style={{ color: "#2563eb" }} /></div>
                      <span className="badge-blue">{s.price}</span>
                    </div>
                    <h3 style={{ fontFamily: I, fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>
                    <button onClick={() => nav("contacts")} style={{ fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                      Запросить расчёт <Icon name="ArrowRight" size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", borderRadius: 16, padding: "48px 40px", textAlign: "center" }}>
                <h2 style={{ fontFamily: I, fontSize: "1.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>Готовы начать?</h2>
                <p style={{ fontFamily: I, color: "rgba(255,255,255,0.65)", marginBottom: 28 }}>Расчёт комиссии и сроков — в течение 2 часов</p>
                <button onClick={() => nav("contacts")} className="btn-white" style={{ padding: "12px 32px" }}>Получить расчёт бесплатно</button>
              </div>
            </div>
          </div>
        </>}

        {/* ══════ PORTFOLIO ══════ */}
        {section === "portfolio" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "72px 0" }}>
            <div className="container mx-auto px-6">
              <div className="section-label" style={{ color: "#93c5fd" }}><span style={{ background: "#93c5fd" }} />Опыт</div>
              <h1 style={{ fontFamily: I, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 8 }}>Кейсы</h1>
            </div>
          </div>
          <div className="section-padding section-gray">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { title: "Регулярные платежи в Китай", tag: "🇨🇳 Китай",    volume: "$2.5M/мес",     result: "Поток платежей 40+ поставщикам без отказов", industry: "Импорт товаров" },
                  { title: "Выход на рынок ОАЭ",         tag: "🇦🇪 ОАЭ",      volume: "AED 5M разово", result: "Первые транзакции за 5 дней", industry: "Недвижимость" },
                  { title: "Платежи в Турцию",           tag: "🇹🇷 Турция",   volume: "€800k/мес",     result: "0 отклонённых платежей за 8 месяцев", industry: "Текстиль" },
                  { title: "Комплаенс — Германия",       tag: "🇩🇪 Германия", volume: "€1.2M разово",  result: "Due Diligence за 3 рабочих дня", industry: "Машиностроение" },
                  { title: "FX хеджирование для IT",     tag: "🌍 Multi",     volume: "$500k/мес",     result: "Зафиксирован курс на 30 дней, экономия 4%", industry: "IT" },
                  { title: "Крипто-конвертация ВЭД",    tag: "₿ Крипто",     volume: "USDT 300k",     result: "Легальная конвертация с полным пакетом", industry: "E-commerce" },
                ].map((p, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    <div style={{ height: 4, background: "linear-gradient(90deg,#2563eb,#4f46e5)" }} />
                    <div style={{ padding: "22px 22px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span className="badge-blue">{p.tag}</span>
                        <span style={{ fontFamily: I, fontSize: "0.75rem", color: "#9ca3af" }}>{p.industry}</span>
                      </div>
                      <h3 style={{ fontFamily: I, fontSize: "0.95rem", fontWeight: 700, color: "#111827", margin: "10px 0 8px" }}>{p.title}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Icon name="DollarSign" size={12} style={{ color: "#2563eb" }} />
                        <span style={{ fontFamily: I, color: "#6b7280", fontSize: "0.82rem" }}>Объём: {p.volume}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Icon name="CheckCircle" size={13} style={{ color: "#16a34a", marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontFamily: I, color: "#4b5563", fontSize: "0.85rem" }}>{p.result}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <button onClick={() => nav("contacts")} className="btn-primary" style={{ padding: "12px 32px" }}>Обсудить ваш платёж</button>
              </div>
            </div>
          </div>
        </>}

        {/* ══════ BLOG ══════ */}
        {section === "blog" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "72px 0" }}>
            <div className="container mx-auto px-6">
              <div className="section-label" style={{ color: "#93c5fd" }}><span style={{ background: "#93c5fd" }} />Экспертиза</div>
              <h1 style={{ fontFamily: I, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 8 }}>Блог</h1>
            </div>
          </div>
          <div className="section-padding section-gray">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BLOG_ITEMS.map((b, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(37,99,235,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                    <div style={{ height: 4, background: "linear-gradient(90deg,#2563eb,#4f46e5)" }} />
                    <div style={{ padding: "22px 22px 26px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span className="badge-blue">{b.tag}</span>
                        <span style={{ fontFamily: I, color: "#9ca3af", fontSize: "0.78rem" }}>{b.date}</span>
                      </div>
                      <h3 style={{ fontFamily: I, fontSize: "1rem", fontWeight: 700, color: "#111827", lineHeight: 1.35, marginBottom: 10 }}>{b.title}</h3>
                      <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.65 }}>{b.excerpt}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 18, fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb" }}>
                        Читать далее <Icon name="ArrowRight" size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>}

        {/* ══════ FAQ ══════ */}
        {section === "faq" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "72px 0" }}>
            <div className="container mx-auto px-6">
              <div className="section-label" style={{ color: "#93c5fd" }}><span style={{ background: "#93c5fd" }} />FAQ</div>
              <h1 style={{ fontFamily: I, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 8 }}>Вопросы и ответы</h1>
            </div>
          </div>
          <div className="section-padding section-gray">
            <div className="container mx-auto px-6" style={{ maxWidth: 720 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${faqOpen === i ? "#bfdbfe" : "#e5e7eb"}`, overflow: "hidden", transition: "border-color 0.15s" }}>
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: "100%", textAlign: "left", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "none", border: "none", cursor: "pointer" }}>
                      <span style={{ fontFamily: I, fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{item.q}</span>
                      <Icon name={faqOpen === i ? "ChevronUp" : "ChevronDown"} size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
                    </button>
                    {faqOpen === i && (
                      <div className="animate-fade-in" style={{ padding: "0 22px 20px", borderTop: "1px solid #e5e7eb" }}>
                        <p style={{ fontFamily: I, color: "#4b5563", lineHeight: 1.75, marginTop: 14 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ background: "linear-gradient(135deg,#eff6ff,#eef2ff)", borderRadius: 12, padding: "28px 32px", textAlign: "center", marginTop: 32, border: "1px solid #bfdbfe" }}>
                <p style={{ fontFamily: I, color: "#1e40af", fontWeight: 500, marginBottom: 16 }}>Остались вопросы? Ответим бесплатно</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={() => nav("contacts")} className="btn-primary" style={{ padding: "10px 24px" }}>Задать вопрос</button>
                  <a href="https://wa.me/74993985002" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: "10px 24px", textDecoration: "none" }}>
                    <Icon name="MessageCircle" size={15} />WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>}

        {/* ══════ CONTACTS ══════ */}
        {section === "contacts" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "72px 0" }}>
            <div className="container mx-auto px-6">
              <div className="section-label" style={{ color: "#93c5fd" }}><span style={{ background: "#93c5fd" }} />Связь</div>
              <h1 style={{ fontFamily: I, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginTop: 8 }}>Контакты</h1>
            </div>
          </div>
          <div className="section-padding section-gray">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #e5e7eb" }}>
                  <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.02em" }}>Оставить заявку</h2>
                  <p style={{ fontFamily: I, color: "#6b7280", marginBottom: 24, fontSize: "0.875rem" }}>Ответим в течение 30 минут в рабочее время</p>
                  {contactSent ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="CheckCircle" size={30} style={{ color: "#2563eb" }} />
                      </div>
                      <h3 style={{ fontFamily: I, fontSize: "1.3rem", fontWeight: 700, color: "#111827" }}>Заявка принята!</h3>
                      <p style={{ fontFamily: I, color: "#6b7280", marginTop: 8 }}>Менеджер свяжется с вами в ближайшее время.</p>
                      <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }} onClick={() => setContactSent(false)}>Отправить ещё</button>
                    </div>
                  ) : (
                    <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Имя *</label>
                          <input required className="form-input" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} placeholder="Александр" />
                        </div>
                        <div>
                          <label className="form-label">Компания</label>
                          <input className="form-input" value={contactForm.company} onChange={e => setContactForm({...contactForm, company: e.target.value})} placeholder="ООО «Компания»" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Телефон *</label>
                          <input required type="tel" className="form-input" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} placeholder="+7 (___) ___-__-__" />
                        </div>
                        <div>
                          <label className="form-label">Email *</label>
                          <input required type="email" className="form-input" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} placeholder="info@company.ru" />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Услуга</label>
                        <select className="form-input" value={contactForm.service} onChange={e => setContactForm({...contactForm, service: e.target.value})}>
                          <option value="">Выберите услугу</option>
                          {SERVICES.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Сообщение</label>
                        <textarea rows={3} className="form-input" style={{ resize: "none" } as any} value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} placeholder="Страна назначения, сумма, валюта..." />
                      </div>
                      <button type="submit" className="btn-primary" style={{ padding: "12px 0", justifyContent: "center", width: "100%", fontSize: "0.95rem" }}>Отправить заявку</button>
                    </form>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>Контактная информация</h2>
                  {[
                    { icon: "MapPin", title: "Адрес", val: "123112, Москва, Пресненская наб., 12" },
                    { icon: "Phone", title: "Телефон", val: "+7 (499) 398-50-02" },
                    { icon: "Mail", title: "Email", val: "info@vedagentservice.ru" },
                    { icon: "Clock", title: "Режим работы", val: "Пн–Пт: 9:00–18:00 (МСК)" },
                  ].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                      <div className="icon-box"><Icon name={c.icon as any} size={18} style={{ color: "#2563eb" }} /></div>
                      <div>
                        <div style={{ fontFamily: I, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 3 }}>{c.title}</div>
                        <div style={{ fontFamily: I, color: "#111827", fontWeight: 500 }}>{c.val}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", borderRadius: 12, padding: "20px 22px" }}>
                    <p style={{ fontFamily: I, color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", marginBottom: 12 }}>Быстрая связь:</p>
                    <div className="flex gap-3">
                      <a href="https://t.me/+74993985002" target="_blank" rel="noopener noreferrer" className="btn-white" style={{ padding: "9px 20px", fontSize: "0.85rem", textDecoration: "none" }}>
                        <Icon name="Send" size={14} />Telegram
                      </a>
                      <a href="https://wa.me/74993985002" target="_blank" rel="noopener noreferrer" className="btn-white-outline" style={{ padding: "9px 20px", fontSize: "0.85rem", textDecoration: "none" }}>
                        <Icon name="MessageCircle" size={14} />WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>}

        {/* ══════ CABINET ══════ */}
        {section === "cabinet" && <>
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)", padding: "48px 0" }}>
            <div className="container mx-auto px-6">
              <h1 style={{ fontFamily: I, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>Личный кабинет</h1>
              <p style={{ fontFamily: I, color: "rgba(255,255,255,0.6)", marginTop: 6, fontSize: "0.875rem" }}>Управление платежами и документами</p>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="section-padding section-gray">
              <div className="container mx-auto px-6" style={{ maxWidth: 440 }}>
                {!registerMode ? (
                  <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Вход в систему</h2>
                    <p style={{ fontFamily: I, color: "#6b7280", marginBottom: 24, fontSize: "0.875rem" }}>Введите данные для доступа</p>
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label className="form-label">Email</label>
                        <input type="email" required className="form-input" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} placeholder="email@company.ru" />
                      </div>
                      <div>
                        <label className="form-label">Пароль</label>
                        <input type="password" required className="form-input" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="••••••••" />
                      </div>
                      {loginError && <p style={{ fontFamily: I, fontSize: "0.85rem", color: "#dc2626" }}>{loginError}</p>}
                      <button type="submit" className="btn-primary" style={{ padding: "12px 0", justifyContent: "center", width: "100%" }}>Войти</button>
                      <div style={{ textAlign: "center" }}>
                        <button type="button" onClick={() => setRegisterMode(true)} style={{ fontFamily: I, fontSize: "0.85rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Нет аккаунта? Зарегистрироваться</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #e5e7eb" }}>
                    {regDone ? (
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="CheckCircle" size={30} style={{ color: "#2563eb" }} />
                        </div>
                        <h3 style={{ fontFamily: I, fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>Заявка отправлена!</h3>
                        <p style={{ fontFamily: I, color: "#6b7280", marginTop: 8, fontSize: "0.875rem" }}>Активируем доступ после KYC-верификации (1 рабочий день).</p>
                        <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }} onClick={() => { setRegisterMode(false); setRegDone(false); }}>Вернуться ко входу</button>
                      </div>
                    ) : (
                      <>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Регистрация</h2>
                        <p style={{ fontFamily: I, color: "#6b7280", marginBottom: 24, fontSize: "0.875rem" }}>Только для юридических лиц и ИП</p>
                        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {[
                            { label: "Контактное лицо *", key: "name", ph: "Александр Иванов", type: "text" },
                            { label: "Наименование компании *", key: "company", ph: "ООО «Компания»", type: "text" },
                            { label: "ИНН компании *", key: "inn", ph: "7714123456", type: "text" },
                            { label: "Email *", key: "email", ph: "email@company.ru", type: "email" },
                            { label: "Телефон *", key: "phone", ph: "+7 (___) ___-__-__", type: "text" },
                            { label: "Пароль (мин. 6 символов) *", key: "password", ph: "••••••••", type: "password" },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="form-label">{f.label}</label>
                              <input type={f.type} required className="form-input" value={(regForm as any)[f.key]} onChange={e => setRegForm({...regForm, [f.key]: e.target.value})} placeholder={f.ph} />
                            </div>
                          ))}
                          <button type="submit" className="btn-primary" style={{ padding: "12px 0", justifyContent: "center", width: "100%", marginTop: 4 }}>Подать заявку</button>
                          <div style={{ textAlign: "center" }}>
                            <button type="button" onClick={() => setRegisterMode(false)} style={{ fontFamily: I, fontSize: "0.85rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Уже есть аккаунт? Войти</button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: "#f9fafb", minHeight: "calc(100vh - 97px)" }}>
              <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Sidebar */}
                  <aside className="lg:w-56 flex-shrink-0">
                    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 14px", border: "1px solid #e5e7eb", marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                        {loginForm.email[0]?.toUpperCase() || "U"}
                      </div>
                      <div style={{ fontFamily: I, fontWeight: 600, color: "#111827", fontSize: "0.85rem", wordBreak: "break-all" }}>{loginForm.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                        <span style={{ fontFamily: I, fontSize: "0.72rem", color: "#6b7280" }}>Верифицирован</span>
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", padding: "8px" }}>
                      {([
                        { key: "dashboard", icon: "LayoutDashboard", label: "Обзор" },
                        { key: "orders",    icon: "ArrowLeftRight",  label: "Платежи" },
                        { key: "documents", icon: "FolderOpen",      label: "Документы" },
                        { key: "messages",  icon: "MessageSquare",   label: "Сообщения", badge: 2 },
                        { key: "rates",     icon: "TrendingUp",      label: "Курсы валют" },
                        { key: "settings",  icon: "Settings",        label: "Настройки" },
                      ] as Array<{ key: CabinetTab; icon: string; label: string; badge?: number }>).map(item => (
                        <button key={item.key} onClick={() => setCabinetTab(item.key)} className={`sidebar-item ${cabinetTab === item.key ? "active" : ""}`}>
                          <Icon name={item.icon as any} size={16} />
                          <span>{item.label}</span>
                          {item.badge && <span style={{ marginLeft: "auto", background: "#2563eb", color: "#fff", fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px", borderRadius: 100, fontFamily: I }}>{item.badge}</span>}
                        </button>
                      ))}
                      <div style={{ borderTop: "1px solid #f3f4f6", marginTop: 4, paddingTop: 4 }}>
                        <button onClick={() => setIsLoggedIn(false)} className="sidebar-item" style={{ color: "#dc2626" }}>
                          <Icon name="LogOut" size={16} /><span>Выйти</span>
                        </button>
                      </div>
                    </div>
                  </aside>

                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 0 }}>

                    {cabinetTab === "dashboard" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827" }}>Обзор</h2>
                          <button onClick={() => nav("contacts")} className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.82rem" }}>+ Новый платёж</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                          {[
                            { icon: "ArrowLeftRight", label: "Всего платежей", val: "4",    sub: "за всё время", color: "#2563eb", bg: "#eff6ff" },
                            { icon: "Clock",          label: "В процессе",     val: "2",    sub: "активных",    color: "#d97706", bg: "#fffbeb" },
                            { icon: "CheckCircle",    label: "Исполнено",      val: "2",    sub: "успешных",    color: "#16a34a", bg: "#f0fdf4" },
                            { icon: "DollarSign",     label: "Объём",          val: "$27.5k", sub: "всего",    color: "#7c3aed", bg: "#f5f3ff" },
                          ].map((s, i) => (
                            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "20px 18px", border: "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon name={s.icon as any} size={15} style={{ color: s.color }} />
                                </div>
                                <span style={{ fontFamily: I, fontSize: "0.8rem", color: "#6b7280" }}>{s.label}</span>
                              </div>
                              <div style={{ fontFamily: I, fontSize: "1.8rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.val}</div>
                              <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#9ca3af", marginTop: 4 }}>{s.sub}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: I, fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>Последние платежи</span>
                            <button onClick={() => setCabinetTab("orders")} style={{ fontFamily: I, fontSize: "0.82rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Все →</button>
                          </div>
                          {ORDERS_DATA.slice(0, 3).map((o, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", gap: 12, borderBottom: i < 2 ? "1px solid #f9fafb" : "none" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Icon name="Globe" size={15} style={{ color: "#2563eb" }} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontFamily: I, fontWeight: 600, color: "#111827", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.country} · {o.service}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.75rem", color: "#9ca3af" }}>{o.id} · {o.date}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                <span style={{ fontFamily: I, fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>{o.amount}</span>
                                <StatusBadge status={o.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: I, fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>Новые сообщения</span>
                            <button onClick={() => setCabinetTab("messages")} style={{ fontFamily: I, fontSize: "0.82rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Все →</button>
                          </div>
                          {MESSAGES_DATA.filter(m => m.unread).map((msg, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 20px", borderBottom: "1px solid #f9fafb" }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontWeight: 700, color: "#fff", fontSize: "0.9rem", flexShrink: 0 }}>{msg.from[0]}</div>
                              <div>
                                <div style={{ fontFamily: I, fontWeight: 600, color: "#111827", fontSize: "0.85rem" }}>{msg.from}</div>
                                <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.5, marginTop: 2 }}>{msg.text.slice(0, 100)}…</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cabinetTab === "orders" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827" }}>Мои платежи</h2>
                          <button onClick={() => nav("contacts")} className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.82rem" }}>+ Новый платёж</button>
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                          <div style={{ overflowX: "auto" }}>
                            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead><tr>{["ID","Услуга","Направление","Сумма","Менеджер","Дата","Статус"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                              <tbody>
                                {ORDERS_DATA.map((o, i) => (
                                  <tr key={i}>
                                    <td style={{ color: "#2563eb", fontWeight: 600 }}>{o.id}</td>
                                    <td>{o.service}</td>
                                    <td style={{ whiteSpace: "nowrap" }}>{o.country}</td>
                                    <td style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{o.amount}</td>
                                    <td style={{ whiteSpace: "nowrap" }}>{o.manager}</td>
                                    <td style={{ whiteSpace: "nowrap" }}>{o.date}</td>
                                    <td><StatusBadge status={o.status} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {cabinetTab === "documents" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 20 }}>Документы</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {DOCS_DATA.map((doc, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: doc.type === "PDF" ? "#fef2f2" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon name="FileText" size={16} style={{ color: doc.type === "PDF" ? "#dc2626" : "#2563eb" }} />
                                </div>
                                <div>
                                  <div style={{ fontFamily: I, fontWeight: 500, color: "#111827", fontSize: "0.875rem" }}>{doc.name}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#9ca3af", marginTop: 2 }}>{doc.type} · {doc.size} · {doc.date}</div>
                                </div>
                              </div>
                              <button style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: I, fontSize: "0.83rem", fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                                <Icon name="Download" size={14} />Скачать
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cabinetTab === "messages" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 20 }}>Сообщения</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {MESSAGES_DATA.map((msg, i) => (
                            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: msg.unread ? "1.5px solid #bfdbfe" : "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: I, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{msg.from[0]}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontFamily: I, fontWeight: 700, color: "#111827", fontSize: "0.875rem" }}>{msg.from}</span>
                                    <span style={{ fontFamily: I, fontSize: "0.75rem", color: "#9ca3af" }}>{msg.role}</span>
                                    {msg.unread && <span style={{ marginLeft: "auto", background: "#2563eb", color: "#fff", fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100, fontFamily: I }}>Новое</span>}
                                  </div>
                                  <p style={{ fontFamily: I, color: "#4b5563", fontSize: "0.875rem", lineHeight: 1.65 }}>{msg.text}</p>
                                  <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#9ca3af", marginTop: 8 }}>{msg.time}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", marginTop: 12 }}>
                          <label className="form-label">Написать менеджеру</label>
                          <textarea rows={3} className="form-input" style={{ resize: "none" } as any} placeholder="Напишите ваш вопрос..." />
                          <button className="btn-primary" style={{ marginTop: 10, padding: "9px 20px", fontSize: "0.85rem" }}>Отправить</button>
                        </div>
                      </div>
                    )}

                    {cabinetTab === "rates" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Курсы валют</h2>
                        <p style={{ fontFamily: I, color: "#6b7280", marginBottom: 20, fontSize: "0.875rem" }}>Обновляется каждые 5 минут · Спред ±1.5%</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          {rLoading ? <div style={{ fontFamily: I, color: "#6b7280" }}>Загрузка...</div> : rates.map(r => (
                            <div key={r.code} style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: "1.8rem" }}>{r.flag}</span>
                                <div>
                                  <div style={{ fontFamily: I, fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>{r.code}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.75rem", color: "#9ca3af" }}>{r.name}</div>
                                </div>
                                <span style={{ marginLeft: "auto", fontFamily: I, fontWeight: 600, fontSize: "0.875rem", color: r.change >= 0 ? "#16a34a" : "#dc2626" }}>
                                  {r.change >= 0 ? "▲" : "▼"}{Math.abs(r.change).toFixed(2)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px" }}>
                                  <div style={{ fontFamily: I, fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Покупка</div>
                                  <div style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>{r.buy.toFixed(2)}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#9ca3af" }}>₽ за 1 {r.code}</div>
                                </div>
                                <div style={{ background: "#eff6ff", borderRadius: 8, padding: "12px" }}>
                                  <div style={{ fontFamily: I, fontSize: "0.68rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Продажа</div>
                                  <div style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#2563eb", letterSpacing: "-0.02em" }}>{r.sell.toFixed(2)}</div>
                                  <div style={{ fontFamily: I, fontSize: "0.72rem", color: "#9ca3af" }}>₽ за 1 {r.code}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e5e7eb" }}>
                          <div style={{ fontFamily: I, fontWeight: 700, color: "#111827", marginBottom: 6, fontSize: "0.95rem" }}>Фиксация курса</div>
                          <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.85rem", marginBottom: 14 }}>Зафиксируем курс на срок до 30 дней.</p>
                          <button onClick={() => nav("contacts")} className="btn-primary" style={{ padding: "9px 22px", fontSize: "0.85rem" }}>Запросить фиксацию</button>
                        </div>
                      </div>
                    )}

                    {cabinetTab === "settings" && (
                      <div>
                        <h2 style={{ fontFamily: I, fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 20 }}>Настройки профиля</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 22px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontFamily: I, fontWeight: 700, color: "#111827", marginBottom: 18, fontSize: "0.95rem" }}>Данные компании</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[{label:"Контактное лицо",val:"Пользователь"},{label:"Email",val:loginForm.email},{label:"Телефон",val:""},{label:"Компания",val:""},{label:"ИНН",val:""},{label:"КПП",val:""}].map((f,i)=>(
                                <div key={i}>
                                  <label className="form-label">{f.label}</label>
                                  <input defaultValue={f.val} className="form-input" />
                                </div>
                              ))}
                            </div>
                            <button className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }}>Сохранить</button>
                          </div>
                          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 22px", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontFamily: I, fontWeight: 700, color: "#111827", marginBottom: 18, fontSize: "0.95rem" }}>Уведомления</div>
                            {[{label:"Email-уведомления об исполнении платежей",on:true},{label:"SMS при смене статуса заявки",on:true},{label:"Еженедельный отчёт по курсам валют",on:false}].map((n,i)=>(
                              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                                <span style={{ fontFamily: I, fontSize: "0.875rem", color: "#374151" }}>{n.label}</span>
                                <div style={{ width: 40, height: 22, borderRadius: 100, background: n.on ? "#2563eb" : "#d1d5db", cursor: "pointer", display: "flex", alignItems: "center", padding: "0 3px" }}>
                                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: n.on ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>}
      </main>

      {/* ─── FOOTER ─── */}
      {section !== "cabinet" && (
        <footer style={{ background: "#111827", borderTop: "1px solid #1f2937" }}>
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8" style={{ borderBottom: "1px solid #1f2937" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="Globe" size={15} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontFamily: I, fontSize: "0.95rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>ВЭД Агент Сервис</span>
                </div>
                <p style={{ fontFamily: I, color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.7 }}>Международные платежи и ВЭД-сопровождение для российского бизнеса.</p>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {[{icon:"Send",href:"https://t.me/+74993985002"},{icon:"MessageCircle",href:"https://wa.me/74993985002"}].map((s,i)=>(
                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #374151" }}>
                      <Icon name={s.icon as any} size={14} style={{ color: "#6b7280" }} />
                    </a>
                  ))}
                </div>
              </div>
              {[
                { title: "Услуги", links: ["Международные платежи","Валютное регулирование","FX операции","Комплаенс и безопасность","Криптовалютные операции"] },
                { title: "Компания", links: ["О нас","Блог","FAQ","Политика конфиденциальности","Пользовательское соглашение"] },
                { title: "Контакты", links: ["+7 (499) 398-50-02","info@vedagentservice.ru","Пресненская наб., 12, Москва","Пн–Пт: 9:00–18:00"] },
              ].map((col, i) => (
                <div key={i}>
                  <h4 style={{ fontFamily: I, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>{col.title}</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.links.map((link, j) => (
                      <li key={j} style={{ fontFamily: I, color: "#6b7280", fontSize: "0.85rem", cursor: "pointer" }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#d1d5db")}
                        onMouseLeave={e => ((e.target as HTMLElement).style.color = "#6b7280")}>
                        {link}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <p style={{ fontFamily: I, color: "#4b5563", fontSize: "0.78rem" }}>© 2024 ООО «ВЭД Агент Сервис». Все права защищены.</p>
              <p style={{ fontFamily: I, color: "#4b5563", fontSize: "0.78rem" }}>ИНН 7714123456 · ОГРН 1187746123456</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
