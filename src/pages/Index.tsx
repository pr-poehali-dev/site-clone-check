/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Section = "home" | "about" | "services" | "portfolio" | "blog" | "faq" | "contacts" | "cabinet";
type CabinetTab = "dashboard" | "orders" | "documents" | "messages" | "rates" | "settings";

// ── Currency rates hook ────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", name: "Доллар США", flag: "🇺🇸", buyFallback: 95.50, sellFallback: 96.20 },
  { code: "EUR", name: "Евро", flag: "🇪🇺", buyFallback: 104.25, sellFallback: 105.15 },
  { code: "CNY", name: "Юань", flag: "🇨🇳", buyFallback: 13.15, sellFallback: 13.35 },
  { code: "AED", name: "Дирхам ОАЭ", flag: "🇦🇪", buyFallback: 25.98, sellFallback: 26.15 },
];

type RateData = { code: string; name: string; flag: string; buy: number; sell: number; change: number };

function useCurrencyRates() {
  const [rates, setRates] = useState<RateData[]>(
    CURRENCIES.map(c => ({ code: c.code, name: c.name, flag: c.flag, buy: c.buyFallback, sell: c.sellFallback, change: 0 }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/RUB");
        const data = await res.json();
        setRates(CURRENCIES.map(c => {
          const mid = 1 / data.rates[c.code];
          const spread = 0.015;
          const change = (Math.random() - 0.5) * 0.4;
          return { code: c.code, name: c.name, flag: c.flag, buy: +(mid * (1 - spread)).toFixed(2), sell: +(mid * (1 + spread)).toFixed(2), change: +change.toFixed(2) };
        }));
      } catch {
        setRates(CURRENCIES.map(c => ({ code: c.code, name: c.name, flag: c.flag, buy: c.buyFallback, sell: c.sellFallback, change: 0 })));
      } finally { setLoading(false); }
    };
    fetch_();
    const t = setInterval(fetch_, 300000);
    return () => clearInterval(t);
  }, []);

  return { rates, loading };
}

// ── Data ───────────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: "Globe", title: "Международные платежи", desc: "Переводы в 50+ стран в любой валюте. Комиссия от 0.5%. Срок исполнения 1–3 рабочих дня. Собственная инфраструктура без санкционных ограничений.", price: "от 0.5%" },
  { icon: "Shield", title: "Валютное регулирование", desc: "Паспорта сделок, справки о валютных операциях, сопровождение проверок ЦБ РФ. Полное соответствие требованиям 173-ФЗ и инструкции ЦБ 181-И.", price: "по запросу" },
  { icon: "TrendingUp", title: "FX операции", desc: "Конверсия 50+ валютных пар. Фиксация курса на срок до 30 дней. Хеджирование валютных рисков. Спред от 0.3%.", price: "спред от 0.3%" },
  { icon: "Search", title: "Комплаенс и безопасность", desc: "Due Diligence контрагентов, AML-проверки, санкционный скрининг по базам OFAC, EU, UN. Защита от блокировки платежей.", price: "от 5 000 ₽" },
  { icon: "Bitcoin", title: "Криптовалютные операции", desc: "Легальная конвертация крипты в фиат и обратно. Работа с USDT, BTC, ETH. Полное юридическое оформление операций.", price: "от 1.5%" },
  { icon: "FileText", title: "Документооборот и ВЭД", desc: "Подготовка внешнеторговых договоров, инвойсов, упаковочных листов. Сопровождение таможенного оформления. Консультации по ВЭД.", price: "от 3 000 ₽" },
];

const ADVANTAGES = [
  { icon: "Zap", title: "Быстрое исполнение", desc: "1–3 рабочих дня для стандартных переводов, 24/7 для срочных операций" },
  { icon: "Lock", title: "Полная безопасность", desc: "ISO 27001, AML/KYC, соответствие 152-ФЗ, санкционный скрининг" },
  { icon: "Globe2", title: "50+ стран и валют", desc: "Собственная инфраструктура: 30+ юр. лиц в банках разных юрисдикций" },
  { icon: "Percent", title: "Низкие комиссии", desc: "От 0.5% — в 2–3 раза ниже банковских тарифов на международные переводы" },
];

const FAQ_ITEMS = [
  { q: "В какие страны вы осуществляете платежи?", a: "Мы работаем с 50+ странами: Китай, ОАЭ, Турция, страны ЕС, США, Юго-Восточная Азия, СНГ и другие. Собственная инфраструктура позволяет проводить платежи без санкционных ограничений." },
  { q: "Какой минимальный размер платежа?", a: "Минимальная сумма перевода — $500 или эквивалент в другой валюте. Для постоянных клиентов с оборотом от $50 000 в месяц действуют специальные условия." },
  { q: "Как долго проходят платежи?", a: "Стандартный срок — 1–3 рабочих дня. Для срочных операций предусмотрен режим 24/7 с исполнением в тот же день (доп. комиссия 0.3%)." },
  { q: "Какие документы нужны для проведения платежа?", a: "Стандартный пакет: инвойс, контракт с зарубежным поставщиком, документы о праве подписи. Для новых клиентов — первичная KYC-верификация (занимает 1 рабочий день)." },
  { q: "Как происходит ценообразование?", a: "Комиссия зависит от направления, суммы и срочности: от 0.5% для крупных регулярных переводов до 4% для единичных срочных операций. Точный расчёт — по запросу." },
  { q: "Вы работаете с физическими лицами?", a: "Нет, мы работаем только с юридическими лицами и ИП, осуществляющими внешнеэкономическую деятельность." },
];

const BLOG_ITEMS = [
  { date: "12 марта 2026", tag: "Регулирование", title: "Новые требования ЦБ к валютным операциям: что изменилось в 2026 году", excerpt: "Разбираем актуальные изменения в инструкции ЦБ РФ 181-И и их влияние на порядок проведения международных расчётов." },
  { date: "5 марта 2026", tag: "Китай", title: "Платежи в Китай в 2026: рабочие схемы и подводные камни", excerpt: "Как проводить оплату китайским поставщикам в условиях ужесточения комплаенс-требований со стороны китайских банков." },
  { date: "20 февраля 2026", tag: "Криптовалюта", title: "USDT для ВЭД: легальные схемы конвертации для бизнеса", excerpt: "Правовой статус крипто-транзакций в рамках ВЭД, актуальные инструменты и риски использования стейблкоинов в расчётах." },
];

const ORDERS_DATA = [
  { id: "PAY-8847", service: "Международный платёж", country: "🇨🇳 Китай", amount: "$12,500", status: "done", date: "05.03.2026", manager: "Козлов В.А." },
  { id: "PAY-8821", service: "FX операция", country: "🇦🇪 ОАЭ", amount: "AED 45,000", status: "active", date: "14.03.2026", manager: "Лебедева О.С." },
  { id: "PAY-8796", service: "Комплаенс", country: "🇩🇪 Германия", amount: "€8,200", status: "pending", date: "16.03.2026", manager: "Козлов В.А." },
  { id: "PAY-8750", service: "Международный платёж", country: "🇹🇷 Турция", amount: "$6,800", status: "done", date: "10.02.2026", manager: "Лебедева О.С." },
];

const MESSAGES_DATA = [
  { from: "Козлов В.А.", role: "Персональный менеджер", text: "Добрый день! Платёж PAY-8821 в ОАЭ подтверждён банком-корреспондентом. Ожидайте зачисление в течение 24 часов.", time: "Сегодня, 10:42", unread: true },
  { from: "Служба комплаенс", role: "Compliance", text: "По запросу PAY-8796: для завершения Due Diligence германского контрагента требуется предоставить выписку из торгового реестра (Handelsregister).", time: "Вчера, 16:15", unread: true },
  { from: "Система", role: "Уведомление", text: "Платёж PAY-8847 в Китай успешно зачислен получателю. Свифт-подтверждение загружено в раздел «Документы».", time: "05.03.2026", unread: false },
];

const DOCS_DATA = [
  { name: "SWIFT-подтверждение PAY-8847", type: "PDF", size: "0.3 МБ", date: "05.03.2026" },
  { name: "Инвойс — Китай (Supplier Ltd)", type: "PDF", size: "0.8 МБ", date: "03.03.2026" },
  { name: "Договор-оферта №2025-847", type: "PDF", size: "1.2 МБ", date: "10.01.2026" },
  { name: "Due Diligence отчёт — Германия", type: "PDF", size: "2.1 МБ", date: "14.03.2026" },
  { name: "Акт об оказании услуг февраль 2026", type: "PDF", size: "0.4 МБ", date: "28.02.2026" },
  { name: "Справка о валютных операциях Q1", type: "XLSX", size: "0.6 МБ", date: "01.03.2026" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [cabinetTab, setCabinetTab] = useState<CabinetTab>("dashboard");
  const [contactForm, setContactForm] = useState({ name: "", company: "", phone: "", email: "", message: "", service: "" });
  const [contactSent, setContactSent] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", company: "", inn: "", email: "", phone: "", password: "" });
  const [regDone, setRegDone] = useState(false);
  const { rates, loading: ratesLoading } = useCurrencyRates();

  const nav = (s: Section) => { setSection(s); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email === "jobtravel@bk.ru" && loginForm.password === "18081991") {
      setIsLoggedIn(true); setLoginError(""); setCabinetTab("dashboard");
    } else if (loginForm.email && loginForm.password.length >= 4) {
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

  // Status badge helper
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      active: { label: "В процессе", bg: "rgba(200,168,75,0.12)", color: "var(--gold)" },
      done: { label: "Исполнен", bg: "rgba(72,187,120,0.12)", color: "#2f855a" },
      pending: { label: "На проверке", bg: "rgba(74,144,217,0.12)", color: "#2b6cb0" },
    };
    const s = map[status] || map.pending;
    return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color, fontFamily: "Golos Text, sans-serif", whiteSpace: "nowrap" }}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Golos Text', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: "var(--navy)", borderBottom: "1px solid rgba(200,168,75,0.2)" }}>
        {/* Top bar */}
        <div className="hidden md:block" style={{ backgroundColor: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(200,168,75,0.1)" }}>
          <div className="container mx-auto px-6 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <a href="tel:+74993985002" className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontFamily: "Golos Text, sans-serif" }}>
                <Icon name="Phone" size={11} style={{ color: "var(--gold)" }} />+7 (499) 398-50-02
              </a>
              <a href="mailto:info@vedagentservice.ru" className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontFamily: "Golos Text, sans-serif" }}>
                <Icon name="Mail" size={11} style={{ color: "var(--gold)" }} />info@vedagentservice.ru
              </a>
            </div>
            <div className="flex items-center gap-4">
              {!ratesLoading && rates.slice(0, 3).map(r => (
                <span key={r.code} style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontFamily: "Golos Text, sans-serif" }}>
                  {r.flag} {r.code} <span style={{ color: "var(--gold)" }}>{r.sell.toFixed(2)}</span>
                </span>
              ))}
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontFamily: "Golos Text, sans-serif" }}>Пн–Пт 9:00–18:00</span>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-15 py-3">
            <button onClick={() => nav("home")} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--gold)" }}>
                <Icon name="Globe" size={18} style={{ color: "var(--navy)" }} />
              </div>
              <div>
                <div style={{ fontFamily: "Cormorant, serif", fontSize: "1.15rem", fontWeight: 700, color: "white", lineHeight: 1.1 }}>ВЭД Агент</div>
                <div style={{ fontSize: "0.6rem", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Сервис</div>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-5">
              {navItems.map(item => (
                <button key={item.key} onClick={() => nav(item.key)} className={`nav-link ${section === item.key ? "active" : ""}`}>{item.label}</button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => nav("contacts")} className="hidden md:block btn-primary text-sm py-2 px-4">Консультация</button>
              <button onClick={() => nav("cabinet")} className="hidden sm:flex items-center gap-2 btn-outline text-sm py-2 px-4">
                <Icon name="User" size={14} />{isLoggedIn ? "Кабинет" : "Войти"}
              </button>
              <button className="lg:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div style={{ backgroundColor: "var(--navy-light)", borderTop: "1px solid rgba(200,168,75,0.2)" }} className="lg:hidden px-6 py-4">
            {navItems.map(item => (
              <button key={item.key} onClick={() => nav(item.key)} className="block w-full text-left nav-link py-3 border-b border-white/10 last:border-0">{item.label}</button>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => nav("contacts")} className="flex-1 btn-primary text-center text-sm py-2">Консультация</button>
              <button onClick={() => nav("cabinet")} className="flex-1 btn-outline text-center text-sm py-2">{isLoggedIn ? "Кабинет" : "Войти"}</button>
            </div>
          </div>
        )}
      </header>

      <main className="pt-20">

        {/* ════════ HOME ════════ */}
        {section === "home" && (
          <>
            {/* Hero */}
            <section className="relative overflow-hidden" style={{ minHeight: "90vh", backgroundColor: "var(--navy)" }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/32a090cb-9d08-49dc-b3c2-f159b4dbd023.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,31,61,0.97) 45%, rgba(15,31,61,0.75) 100%)" }} />
              {/* Geometric accents */}
              <div className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }} />
              <div className="absolute bottom-40 right-1/4 w-40 h-40 rounded-full opacity-5" style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }} />

              <div className="relative container mx-auto px-6 flex flex-col justify-center" style={{ minHeight: "90vh" }}>
                <div className="max-w-2xl animate-slide-up">
                  <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-sm" style={{ border: "1px solid rgba(200,168,75,0.35)", backgroundColor: "rgba(200,168,75,0.07)" }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--gold)" }} />
                    <span style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Профессиональный участник валютного рынка</span>
                  </div>
                  <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: "1.5rem" }}>
                    Международные<br />платежи<br /><span style={{ color: "var(--gold)" }}>без рисков</span>
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.1rem", lineHeight: 1.75, maxWidth: "520px", marginBottom: "2.5rem", fontFamily: "Golos Text, sans-serif" }}>
                    Оплата инвойсов зарубежным поставщикам, валютные операции и сопровождение ВЭД-сделок. 50+ стран, собственная инфраструктура, без санкционных ограничений.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => nav("contacts")} className="btn-primary">Заказать консультацию</button>
                    <button onClick={() => nav("services")} className="btn-outline">Наши услуги</button>
                  </div>
                  {/* Trust badges */}
                  <div className="mt-10 flex flex-wrap gap-4">
                    {["ISO 27001", "AML/KYC", "152-ФЗ", "ЦБ РФ 181-И"].map(b => (
                      <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm" style={{ border: "1px solid rgba(200,168,75,0.2)", backgroundColor: "rgba(200,168,75,0.05)", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontFamily: "Golos Text, sans-serif" }}>
                        <Icon name="ShieldCheck" size={11} style={{ color: "var(--gold)" }} />{b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats bar */}
                <div className="absolute bottom-0 left-0 right-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(200,168,75,0.15)" }}>
                  <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                      {[
                        { n: "50+", l: "стран и валют" },
                        { n: "500k+", l: "успешных операций" },
                        { n: "99.8%", l: "успешность платежей" },
                        { n: "$127M", l: "объём в месяц" },
                      ].map((s, i) => (
                        <div key={i} className="px-6 py-5 text-center">
                          <div className="stat-number">{s.n}</div>
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Golos Text, sans-serif" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Rates widget */}
            <section style={{ backgroundColor: "var(--navy-light)", borderBottom: "1px solid rgba(200,168,75,0.15)" }}>
              <div className="container mx-auto px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span style={{ fontSize: "0.75rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Golos Text, sans-serif", marginRight: "8px" }}>Курсы валют:</span>
                  {ratesLoading ? (
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>Загрузка...</span>
                  ) : (
                    rates.map(r => (
                      <div key={r.code} className="flex items-center gap-2 px-4 py-1.5 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize: "0.85rem" }}>{r.flag}</span>
                        <span style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "white", fontSize: "0.82rem" }}>{r.code}</span>
                        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontFamily: "Golos Text, sans-serif" }}>покупка</span>
                        <span style={{ fontFamily: "Golos Text, sans-serif", color: "var(--gold)", fontSize: "0.82rem" }}>{r.buy.toFixed(2)}</span>
                        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontFamily: "Golos Text, sans-serif" }}>продажа</span>
                        <span style={{ fontFamily: "Golos Text, sans-serif", color: "var(--gold)", fontSize: "0.82rem" }}>{r.sell.toFixed(2)}</span>
                        <span style={{ fontSize: "0.72rem", color: r.change >= 0 ? "#48bb78" : "#fc8181", fontFamily: "Golos Text, sans-serif" }}>{r.change >= 0 ? "▲" : "▼"}{Math.abs(r.change).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto", fontFamily: "Golos Text, sans-serif" }}>обновление каждые 5 мин</span>
                </div>
              </div>
            </section>

            {/* Services */}
            <section className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="text-center mb-14">
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--navy)" }} className="gold-line-center">Наши услуги</h2>
                  <p style={{ color: "var(--text-mid)", marginTop: "24px", maxWidth: "560px", margin: "24px auto 0", fontFamily: "Golos Text, sans-serif" }}>Полный спектр сервисов для безопасных международных расчётов и ВЭД-сопровождения</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SERVICES.map((s, i) => (
                    <div key={i} className="card-service">
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(200,168,75,0.1)" }}>
                          <Icon name={s.icon as any} size={22} style={{ color: "var(--gold)" }} />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--navy)", color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>{s.price}</span>
                      </div>
                      <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)", marginBottom: "10px" }}>{s.title}</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "0.88rem", lineHeight: 1.65, fontFamily: "Golos Text, sans-serif", marginBottom: "16px" }}>{s.desc}</p>
                      <button onClick={() => nav("contacts")} className="text-sm font-semibold flex items-center gap-1 hover-gold" style={{ color: "var(--navy)", fontFamily: "Golos Text, sans-serif" }}>
                        Узнать подробнее <Icon name="ArrowRight" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Why us */}
            <section className="section-padding" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "white" }} className="gold-line">Работаем с зарубежными партнёрами легально и безопасно</h2>
                    <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginTop: "24px", fontFamily: "Golos Text, sans-serif" }}>
                      Собственная инфраструктура из 30+ юридических лиц в банках разных юрисдикций позволяет нам проводить платежи туда, куда банки отказывают. Работаем с 2018 года, обработано 500k+ операций.
                    </p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ADVANTAGES.map((a, i) => (
                        <div key={i} className="p-4 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,168,75,0.12)" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon name={a.icon as any} size={16} style={{ color: "var(--gold)" }} />
                            <span style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "white", fontSize: "0.9rem" }}>{a.title}</span>
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", lineHeight: 1.5, fontFamily: "Golos Text, sans-serif" }}>{a.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => nav("about")} className="btn-outline mt-8">О компании</button>
                  </div>
                  <div className="relative">
                    <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/f4cd3994-da5c-48a6-aee1-38574ccee131.jpg" alt="Команда" className="w-full rounded" style={{ objectFit: "cover", height: "440px" }} />
                    <div className="absolute -bottom-4 -left-4 p-5 rounded" style={{ backgroundColor: "var(--gold)", maxWidth: "190px" }}>
                      <div style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "var(--navy)" }}>2018</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--navy)", fontWeight: 600, fontFamily: "Golos Text, sans-serif" }}>год основания</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-cream">
              <div className="container mx-auto px-6 text-center">
                <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "var(--navy)" }}>Нужно провести международный платёж?</h2>
                <p style={{ color: "var(--text-mid)", marginTop: "16px", marginBottom: "32px", fontFamily: "Golos Text, sans-serif" }}>Первичная консультация бесплатно. Расчёт комиссии — в течение 2 часов.</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button onClick={() => nav("contacts")} className="btn-primary text-base px-10 py-3">Получить расчёт</button>
                  <a href="https://t.me/+74993985002" target="_blank" rel="noopener noreferrer" className="btn-outline text-base px-10 py-3 flex items-center gap-2">
                    <Icon name="Send" size={16} />Telegram
                  </a>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ════════ ABOUT ════════ */}
        {section === "about" && (
          <div>
            <div className="py-24" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>О компании</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>ВЭД Агент Сервис — с 2018 года</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                  <div>
                    <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--navy)" }} className="gold-line">Кто мы</h2>
                    <p style={{ color: "var(--text-mid)", lineHeight: 1.8, marginTop: "24px", fontFamily: "Golos Text, sans-serif" }}>
                      ВЭД Агент Сервис — специализированный провайдер международных платёжных и ВЭД-сервисов для российского бизнеса. Мы работаем с 2018 года и за это время провели более 500 000 платёжных операций на общую сумму свыше $1,5 млрд.
                    </p>
                    <p style={{ color: "var(--text-mid)", lineHeight: 1.8, marginTop: "16px", fontFamily: "Golos Text, sans-serif" }}>
                      Наше ключевое преимущество — собственная инфраструктура: 30+ юридических лиц в банках разных юрисдикций, что позволяет проводить платежи туда, куда крупные банки отказывают из-за санкционных ограничений.
                    </p>
                    <p style={{ color: "var(--text-mid)", lineHeight: 1.8, marginTop: "16px", fontFamily: "Golos Text, sans-serif" }}>
                      Мы работаем исключительно в правовом поле: соответствуем требованиям ЦБ РФ (инструкция 181-И), соблюдаем стандарты AML/KYC, сертифицированы по ISO 27001 в части защиты данных.
                    </p>
                    <div className="mt-8 space-y-3">
                      {["Профессиональный участник валютного рынка", "Соответствие требованиям ЦБ РФ 181-И", "Страхование операций до $10 млн", "Рейтинг надёжности AAA"].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(200,168,75,0.15)", border: "1px solid var(--gold)" }}>
                            <Icon name="Check" size={11} style={{ color: "var(--gold)" }} />
                          </div>
                          <span style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/d16a817d-c941-448a-8da7-9acc2b9dfd77.jpg" alt="О компании" className="w-full rounded" style={{ height: "360px", objectFit: "cover" }} />
                    <div className="mt-6 p-5 rounded" style={{ backgroundColor: "var(--navy)", border: "1px solid rgba(200,168,75,0.2)" }}>
                      <p style={{ fontFamily: "Cormorant, serif", fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.6, fontStyle: "italic" }}>«Наша миссия — помочь российскому бизнесу работать с зарубежными партнёрами легально, безопасно и без лишних сложностей»</p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { n: "2018", l: "год основания" },
                    { n: "500k+", l: "операций" },
                    { n: "50+", l: "стран" },
                    { n: "30+", l: "банков-партнёров" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-8 rounded" style={{ backgroundColor: "white", border: "1px solid #e8ecf3" }}>
                      <div className="stat-number">{s.n}</div>
                      <div style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Golos Text, sans-serif" }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Реквизиты */}
                <div className="mt-16 bg-white rounded p-8" style={{ border: "1px solid #e8ecf3" }}>
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }} className="gold-line">Реквизиты компании</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {[
                      { label: "Полное наименование", val: "ООО «ВЭД Агент Сервис»" },
                      { label: "Юридический адрес", val: "123112, г. Москва, Пресненская наб., 12" },
                      { label: "ИНН", val: "7714123456" },
                      { label: "ОГРН", val: "1187746123456" },
                      { label: "КПП", val: "771401001" },
                      { label: "Расчётный счёт", val: "40702810XXXX0000XXXX" },
                    ].map((r, i) => (
                      <div key={i} className="flex gap-3 py-3" style={{ borderBottom: "1px solid #f0f4f8" }}>
                        <span style={{ color: "var(--text-light)", fontSize: "0.82rem", minWidth: "160px", fontFamily: "Golos Text, sans-serif" }}>{r.label}</span>
                        <span style={{ color: "var(--navy)", fontWeight: 500, fontSize: "0.88rem", fontFamily: "Golos Text, sans-serif" }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ SERVICES ════════ */}
        {section === "services" && (
          <div>
            <div className="py-24" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>Услуги</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Международные платежи и ВЭД-сопровождение</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                  {SERVICES.map((s, i) => (
                    <div key={i} className="card-service">
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(200,168,75,0.1)" }}>
                          <Icon name={s.icon as any} size={22} style={{ color: "var(--gold)" }} />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--navy)", color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>{s.price}</span>
                      </div>
                      <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)", marginBottom: "10px" }}>{s.title}</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "0.88rem", lineHeight: 1.65, fontFamily: "Golos Text, sans-serif", marginBottom: "16px" }}>{s.desc}</p>
                      <button onClick={() => nav("contacts")} className="text-sm font-semibold flex items-center gap-1 hover-gold" style={{ color: "var(--navy)", fontFamily: "Golos Text, sans-serif" }}>
                        Запросить расчёт <Icon name="ArrowRight" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Process */}
                <div className="mb-16">
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "var(--navy)", marginBottom: "12px" }} className="gold-line">Как мы работаем</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
                    {[
                      { n: "01", title: "Заявка", desc: "Оставьте заявку или напишите в мессенджер. Ответим в течение 30 минут." },
                      { n: "02", title: "KYC-верификация", desc: "Однократная проверка документов компании. Занимает 1 рабочий день." },
                      { n: "03", title: "Условия и договор", desc: "Согласуем условия, комиссию и сроки. Подписываем договор." },
                      { n: "04", title: "Исполнение", desc: "Проводим платёж. 1–3 рабочих дня. Предоставляем SWIFT-подтверждение." },
                    ].map((s, i) => (
                      <div key={i} className="relative p-6 rounded bg-white" style={{ border: "1px solid #e8ecf3" }}>
                        <div style={{ fontFamily: "Cormorant, serif", fontSize: "3rem", fontWeight: 700, color: "rgba(200,168,75,0.2)", lineHeight: 1, marginBottom: "8px" }}>{s.n}</div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>{s.title}</h3>
                        <p style={{ color: "var(--text-mid)", fontSize: "0.85rem", lineHeight: 1.6, fontFamily: "Golos Text, sans-serif" }}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded p-10 text-center" style={{ backgroundColor: "var(--navy)" }}>
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>Готовы начать?</h2>
                  <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "28px", fontFamily: "Golos Text, sans-serif" }}>Получите расчёт комиссии и сроков для вашего платежа в течение 2 часов</p>
                  <button onClick={() => nav("contacts")} className="btn-primary">Получить расчёт бесплатно</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ PORTFOLIO ════════ */}
        {section === "portfolio" && (
          <div>
            <div className="py-24" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>Кейсы</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Реализованные проекты</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: "Регулярные платежи в Китай", tag: "🇨🇳 Китай", volume: "$2.5M/мес", result: "Настроен поток платежей 40+ поставщикам", industry: "Импорт товаров" },
                    { title: "Выход на рынок ОАЭ", tag: "🇦🇪 ОАЭ", volume: "AED 5M разово", result: "Открытие счёта + первые транзакции за 5 дней", industry: "Недвижимость" },
                    { title: "Платежи в Турцию в обход санкций", tag: "🇹🇷 Турция", volume: "€800k/мес", result: "0 отклонённых платежей за 8 месяцев", industry: "Текстиль" },
                    { title: "Комплаенс для немецкого поставщика", tag: "🇩🇪 Германия", volume: "€1.2M разово", result: "Due Diligence пройден за 3 рабочих дня", industry: "Машиностроение" },
                    { title: "FX хеджирование для IT-компании", tag: "🌍 Multi", volume: "$500k/мес", result: "Зафиксирован курс на 30 дней, экономия 4%", industry: "IT" },
                    { title: "Крипто-конвертация для ВЭД", tag: "₿ Крипто", volume: "USDT 300k", result: "Легальная конвертация с полным пакетом документов", industry: "E-commerce" },
                  ].map((p, i) => (
                    <div key={i} className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3", transition: "all 0.3s" }}>
                      <div className="h-2" style={{ backgroundColor: "var(--gold)" }} />
                      <div className="p-7">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(200,168,75,0.1)", color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>{p.tag}</span>
                          <span style={{ color: "var(--text-light)", fontSize: "0.78rem", fontFamily: "Golos Text, sans-serif" }}>{p.industry}</span>
                        </div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", margin: "10px 0 8px" }}>{p.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon name="DollarSign" size={13} style={{ color: "var(--gold)" }} />
                          <span style={{ color: "var(--text-mid)", fontSize: "0.82rem", fontFamily: "Golos Text, sans-serif" }}>Объём: {p.volume}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="CheckCircle" size={13} style={{ color: "#48bb78", marginTop: "2px", flexShrink: 0 }} />
                          <span style={{ color: "var(--text-mid)", fontSize: "0.85rem", fontFamily: "Golos Text, sans-serif" }}>{p.result}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <button onClick={() => nav("contacts")} className="btn-primary">Обсудить ваш платёж</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ BLOG ════════ */}
        {section === "blog" && (
          <div>
            <div className="py-24" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>Блог</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Экспертные материалы по ВЭД</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {BLOG_ITEMS.map((b, i) => (
                    <div key={i} className="bg-white rounded overflow-hidden cursor-pointer" style={{ border: "1px solid #e8ecf3", transition: "all 0.3s" }} onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 40px rgba(15,31,61,0.1)")} onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                      <div className="p-7">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(200,168,75,0.1)", color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>{b.tag}</span>
                          <span style={{ color: "var(--text-light)", fontSize: "0.78rem", fontFamily: "Golos Text, sans-serif" }}>{b.date}</span>
                        </div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, marginBottom: "12px" }}>{b.title}</h3>
                        <p style={{ color: "var(--text-mid)", fontSize: "0.88rem", lineHeight: 1.65, fontFamily: "Golos Text, sans-serif" }}>{b.excerpt}</p>
                        <div className="mt-5 flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>
                          Читать далее <Icon name="ArrowRight" size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ FAQ ════════ */}
        {section === "faq" && (
          <div>
            <div className="py-24" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>Вопросы и ответы</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Часто задаваемые вопросы</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6 max-w-3xl">
                <div className="space-y-3">
                  {FAQ_ITEMS.map((item, i) => (
                    <div key={i} className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3" }}>
                      <button className="w-full text-left px-7 py-5 flex items-center justify-between gap-4" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                        <span style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "1rem" }}>{item.q}</span>
                        <Icon name={faqOpen === i ? "ChevronUp" : "ChevronDown"} size={18} style={{ color: "var(--gold)", flexShrink: 0 }} />
                      </button>
                      {faqOpen === i && (
                        <div className="px-7 pb-6 animate-fade-in">
                          <div style={{ height: "1px", backgroundColor: "#e8ecf3", marginBottom: "16px" }} />
                          <p style={{ color: "var(--text-mid)", lineHeight: 1.75, fontFamily: "Golos Text, sans-serif" }}>{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-10 p-8 rounded text-center" style={{ backgroundColor: "var(--navy)" }}>
                  <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "16px", fontFamily: "Golos Text, sans-serif" }}>Остались вопросы? Проконсультируем бесплатно</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button onClick={() => nav("contacts")} className="btn-primary">Задать вопрос</button>
                    <a href="https://wa.me/74993985002" target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center gap-2">
                      <Icon name="MessageCircle" size={15} />WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ CONTACTS ════════ */}
        {section === "contacts" && (
          <div>
            <div className="py-24" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>Контакты</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Свяжитесь с нами</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="bg-white rounded p-8" style={{ border: "1px solid #e8ecf3" }}>
                    <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>Оставить заявку</h2>
                    <p style={{ color: "var(--text-mid)", marginBottom: "28px", fontFamily: "Golos Text, sans-serif", fontSize: "0.92rem" }}>Ответим в течение 30 минут в рабочее время</p>
                    {contactSent ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(200,168,75,0.15)" }}>
                          <Icon name="CheckCircle" size={32} style={{ color: "var(--gold)" }} />
                        </div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>Заявка принята!</h3>
                        <p style={{ color: "var(--text-mid)", marginTop: "8px", fontFamily: "Golos Text, sans-serif" }}>Наш менеджер свяжется с вами в ближайшее время.</p>
                        <button className="btn-primary mt-6" onClick={() => setContactSent(false)}>Отправить ещё</button>
                      </div>
                    ) : (
                      <form onSubmit={handleContact} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Имя *</label>
                            <input required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="Александр" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Компания</label>
                            <input value={contactForm.company} onChange={e => setContactForm({ ...contactForm, company: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="ООО «Компания»" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Телефон *</label>
                            <input required value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="+7 (___) ___-__-__" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Email *</label>
                            <input required type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="info@company.ru" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Услуга</label>
                          <select value={contactForm.service} onChange={e => setContactForm({ ...contactForm, service: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: contactForm.service ? "var(--navy)" : "#9aabb8" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")}>
                            <option value="">Выберите услугу</option>
                            {SERVICES.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Сообщение</label>
                          <textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} rows={3} className="w-full px-4 py-3 rounded text-sm outline-none resize-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="Страна назначения, сумма, валюта..." />
                        </div>
                        <button type="submit" className="btn-primary w-full text-center py-3">Отправить заявку</button>
                      </form>
                    )}
                  </div>
                  <div className="space-y-5">
                    <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)" }} className="gold-line">Контактная информация</h2>
                    <div className="mt-8 space-y-4">
                      {[
                        { icon: "MapPin", title: "Адрес", val: "123112, Москва, Пресненская наб., 12" },
                        { icon: "Phone", title: "Телефон", val: "+7 (499) 398-50-02" },
                        { icon: "Mail", title: "Email", val: "info@vedagentservice.ru" },
                        { icon: "Clock", title: "Режим работы", val: "Пн–Пт: 9:00–18:00 (МСК)" },
                      ].map((c, i) => (
                        <div key={i} className="flex items-start gap-4 bg-white p-5 rounded" style={{ border: "1px solid #e8ecf3" }}>
                          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(200,168,75,0.1)" }}>
                            <Icon name={c.icon as any} size={18} style={{ color: "var(--gold)" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{c.title}</div>
                            <div style={{ color: "var(--navy)", marginTop: "4px", fontFamily: "Golos Text, sans-serif" }}>{c.val}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-5 rounded" style={{ backgroundColor: "var(--navy)", border: "1px solid rgba(200,168,75,0.2)" }}>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem", marginBottom: "12px", fontFamily: "Golos Text, sans-serif" }}>Для быстрой связи:</p>
                      <div className="flex gap-3">
                        <a href="https://t.me/+74993985002" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                          <Icon name="Send" size={13} />Telegram
                        </a>
                        <a href="https://wa.me/74993985002" target="_blank" rel="noopener noreferrer" className="btn-outline text-sm py-2 px-4 flex items-center gap-1.5">
                          <Icon name="MessageCircle" size={13} />WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ CABINET ════════ */}
        {section === "cabinet" && (
          <div>
            <div className="py-16" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "white" }}>Личный кабинет</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Управление платежами и документами</p>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="section-padding bg-cream">
                <div className="container mx-auto px-6 max-w-md">
                  {!registerMode ? (
                    <div className="bg-white rounded p-8" style={{ border: "1px solid #e8ecf3" }}>
                      <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "6px" }}>Вход в систему</h2>
                      <p style={{ color: "var(--text-mid)", marginBottom: "28px", fontSize: "0.9rem", fontFamily: "Golos Text, sans-serif" }}>Введите данные для доступа к кабинету</p>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Email</label>
                          <input type="email" required value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="email@company.ru" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Пароль</label>
                          <input type="password" required value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="••••••••" />
                        </div>
                        {loginError && <p className="text-sm" style={{ color: "#e53e3e", fontFamily: "Golos Text, sans-serif" }}>{loginError}</p>}
                        <button type="submit" className="btn-primary w-full text-center py-3">Войти</button>
                        <div className="text-center pt-2">
                          <button type="button" className="text-sm" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }} onClick={() => setRegisterMode(true)}>
                            Нет аккаунта? Зарегистрироваться
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded p-8" style={{ border: "1px solid #e8ecf3" }}>
                      {regDone ? (
                        <div className="text-center py-6">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(200,168,75,0.15)" }}>
                            <Icon name="CheckCircle" size={32} style={{ color: "var(--gold)" }} />
                          </div>
                          <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>Заявка отправлена!</h3>
                          <p style={{ color: "var(--text-mid)", marginTop: "8px", fontFamily: "Golos Text, sans-serif", fontSize: "0.9rem" }}>Мы проведём KYC-верификацию и активируем доступ в течение 1 рабочего дня.</p>
                          <button className="btn-primary mt-6" onClick={() => { setRegisterMode(false); setRegDone(false); }}>Вернуться ко входу</button>
                        </div>
                      ) : (
                        <>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "6px" }}>Регистрация</h2>
                          <p style={{ color: "var(--text-mid)", marginBottom: "28px", fontSize: "0.9rem", fontFamily: "Golos Text, sans-serif" }}>Только для юридических лиц и ИП</p>
                          <form onSubmit={handleRegister} className="space-y-4">
                            {[
                              { label: "Контактное лицо *", key: "name", ph: "Александр Иванов", type: "text" },
                              { label: "Наименование компании *", key: "company", ph: "ООО «Компания»", type: "text" },
                              { label: "ИНН компании *", key: "inn", ph: "7714123456", type: "text" },
                              { label: "Email *", key: "email", ph: "email@company.ru", type: "email" },
                              { label: "Телефон *", key: "phone", ph: "+7 (___) ___-__-__", type: "text" },
                              { label: "Пароль (мин. 6 симв.) *", key: "password", ph: "••••••••", type: "password" },
                            ].map(f => (
                              <div key={f.key}>
                                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>{f.label}</label>
                                <input type={f.type} required value={(regForm as any)[f.key]} onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder={f.ph} />
                              </div>
                            ))}
                            <button type="submit" className="btn-primary w-full text-center py-3">Подать заявку на регистрацию</button>
                            <div className="text-center pt-2">
                              <button type="button" className="text-sm" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }} onClick={() => setRegisterMode(false)}>Уже есть аккаунт? Войти</button>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ─── CABINET INTERIOR ─── */
              <div className="bg-cream min-h-screen">
                <div className="container mx-auto px-6 py-8">
                  <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar */}
                    <aside className="lg:w-60 flex-shrink-0">
                      <div className="bg-white rounded p-5 mb-4" style={{ border: "1px solid #e8ecf3" }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "var(--navy)", fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--gold)" }}>
                          {loginForm.email[0]?.toUpperCase() || "U"}
                        </div>
                        <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.88rem", wordBreak: "break-all" }}>{loginForm.email}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#48bb78" }} />
                          <span style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>Верифицирован</span>
                        </div>
                      </div>
                      <nav className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3" }}>
                        {([
                          { key: "dashboard", icon: "LayoutDashboard", label: "Обзор" },
                          { key: "orders", icon: "ArrowLeftRight", label: "Платежи" },
                          { key: "documents", icon: "FolderOpen", label: "Документы" },
                          { key: "messages", icon: "MessageSquare", label: "Сообщения", badge: 2 },
                          { key: "rates", icon: "TrendingUp", label: "Курсы валют" },
                          { key: "settings", icon: "Settings", label: "Настройки" },
                        ] as Array<{ key: CabinetTab; icon: string; label: string; badge?: number }>).map(item => (
                          <button key={item.key} onClick={() => setCabinetTab(item.key)} className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2" style={{ borderLeftColor: cabinetTab === item.key ? "var(--gold)" : "transparent", backgroundColor: cabinetTab === item.key ? "rgba(200,168,75,0.06)" : "transparent", color: cabinetTab === item.key ? "var(--navy)" : "var(--text-mid)", fontFamily: "Golos Text, sans-serif", fontWeight: cabinetTab === item.key ? 600 : 400 }}>
                            <Icon name={item.icon as any} size={16} />
                            <span>{item.label}</span>
                            {item.badge ? <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--gold)", color: "var(--navy)", fontWeight: 700 }}>{item.badge}</span> : null}
                          </button>
                        ))}
                        <div style={{ borderTop: "1px solid #e8ecf3" }}>
                          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-4 py-3 text-sm" style={{ color: "#e53e3e", fontFamily: "Golos Text, sans-serif" }}>
                            <Icon name="LogOut" size={16} /><span>Выйти</span>
                          </button>
                        </div>
                      </nav>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">

                      {/* Dashboard */}
                      {cabinetTab === "dashboard" && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)" }}>Обзор</h2>
                            <button onClick={() => nav("contacts")} className="btn-primary text-sm py-2 px-4">+ Новый платёж</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[
                              { icon: "ArrowLeftRight", label: "Всего платежей", val: "4", sub: "за всё время", color: "var(--gold)" },
                              { icon: "Clock", label: "В процессе", val: "2", sub: "активных", color: "#4a90d9" },
                              { icon: "CheckCircle", label: "Исполнено", val: "2", sub: "успешных", color: "#48bb78" },
                              { icon: "DollarSign", label: "Объём", val: "$27.5k", sub: "за всё время", color: "#9b7fe8" },
                            ].map((s, i) => (
                              <div key={i} className="bg-white rounded p-5" style={{ border: "1px solid #e8ecf3" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon name={s.icon as any} size={16} style={{ color: s.color }} />
                                  <span style={{ fontSize: "0.78rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{s.label}</span>
                                </div>
                                <div style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "var(--navy)" }}>{s.val}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{s.sub}</div>
                              </div>
                            ))}
                          </div>

                          {/* Recent orders */}
                          <div className="bg-white rounded p-6" style={{ border: "1px solid #e8ecf3" }}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Последние платежи</h3>
                              <button onClick={() => setCabinetTab("orders")} style={{ fontSize: "0.82rem", color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>Все платежи →</button>
                            </div>
                            <div className="space-y-3">
                              {ORDERS_DATA.slice(0, 3).map((o, i) => (
                                <div key={i} className="flex items-center justify-between py-3 gap-3" style={{ borderBottom: "1px solid #f0f4f8" }}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(200,168,75,0.1)" }}>
                                      <Icon name="Globe" size={15} style={{ color: "var(--gold)" }} />
                                    </div>
                                    <div className="min-w-0">
                                      <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.country} · {o.service}</div>
                                      <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{o.id} · {o.date}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <span style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{o.amount}</span>
                                    <StatusBadge status={o.status} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Messages preview */}
                          <div className="bg-white rounded p-6" style={{ border: "1px solid #e8ecf3" }}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>Новые сообщения</h3>
                              <button onClick={() => setCabinetTab("messages")} style={{ fontSize: "0.82rem", color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>Все сообщения →</button>
                            </div>
                            {MESSAGES_DATA.filter(m => m.unread).map((msg, i) => (
                              <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #f0f4f8" }}>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--navy)", fontFamily: "Cormorant, serif", fontWeight: 700, color: "var(--gold)", fontSize: "1rem" }}>{msg.from[0]}</div>
                                <div>
                                  <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.85rem" }}>{msg.from}</div>
                                  <p style={{ color: "var(--text-mid)", fontSize: "0.82rem", lineHeight: 1.5, fontFamily: "Golos Text, sans-serif", marginTop: "2px" }}>{msg.text.slice(0, 100)}...</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Orders */}
                      {cabinetTab === "orders" && (
                        <div>
                          <div className="flex items-center justify-between mb-5">
                            <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)" }}>Мои платежи</h2>
                            <button onClick={() => nav("contacts")} className="btn-primary text-sm py-2 px-4">+ Новый платёж</button>
                          </div>
                          <div className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3" }}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #e8ecf3", backgroundColor: "#fafbfc" }}>
                                    {["ID", "Услуга", "Направление", "Сумма", "Менеджер", "Дата", "Статус"].map(h => (
                                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Golos Text, sans-serif" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {ORDERS_DATA.map((o, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                                      <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif", fontWeight: 600 }}>{o.id}</td>
                                      <td className="px-4 py-4 text-sm" style={{ color: "var(--navy)", fontFamily: "Golos Text, sans-serif" }}>{o.service}</td>
                                      <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>{o.country}</td>
                                      <td className="px-4 py-4 text-sm whitespace-nowrap font-semibold" style={{ color: "var(--navy)", fontFamily: "Golos Text, sans-serif" }}>{o.amount}</td>
                                      <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>{o.manager}</td>
                                      <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>{o.date}</td>
                                      <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={o.status} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {cabinetTab === "documents" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Документы</h2>
                          <div className="space-y-3">
                            {DOCS_DATA.map((doc, i) => (
                              <div key={i} className="flex items-center justify-between bg-white rounded p-4" style={{ border: "1px solid #e8ecf3" }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: doc.type === "PDF" ? "rgba(229,62,62,0.1)" : "rgba(74,144,217,0.1)" }}>
                                    <Icon name="FileText" size={16} style={{ color: doc.type === "PDF" ? "#e53e3e" : "#4a90d9" }} />
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 500, color: "var(--navy)", fontSize: "0.9rem" }}>{doc.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{doc.type} · {doc.size} · {doc.date}</div>
                                  </div>
                                </div>
                                <button className="flex items-center gap-1 text-sm flex-shrink-0" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>
                                  <Icon name="Download" size={14} />Скачать
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messages */}
                      {cabinetTab === "messages" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Сообщения</h2>
                          <div className="space-y-3">
                            {MESSAGES_DATA.map((msg, i) => (
                              <div key={i} className="bg-white rounded p-5" style={{ border: msg.unread ? "1.5px solid var(--gold)" : "1px solid #e8ecf3" }}>
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: "var(--navy)", fontFamily: "Cormorant, serif", fontWeight: 700, color: "var(--gold)" }}>{msg.from[0]}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{msg.from}</span>
                                      <span style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{msg.role}</span>
                                      {msg.unread && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--gold)", color: "var(--navy)", fontWeight: 700 }}>Новое</span>}
                                    </div>
                                    <p style={{ color: "var(--text-mid)", fontSize: "0.88rem", lineHeight: 1.65, fontFamily: "Golos Text, sans-serif" }}>{msg.text}</p>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "8px", fontFamily: "Golos Text, sans-serif" }}>{msg.time}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Reply form */}
                          <div className="mt-6 bg-white rounded p-5" style={{ border: "1px solid #e8ecf3" }}>
                            <h3 style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", marginBottom: "12px", fontSize: "0.9rem" }}>Написать менеджеру</h3>
                            <textarea rows={3} className="w-full px-4 py-3 rounded text-sm outline-none resize-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="Напишите ваш вопрос..." />
                            <button className="btn-primary mt-3 text-sm py-2 px-5">Отправить</button>
                          </div>
                        </div>
                      )}

                      {/* Rates */}
                      {cabinetTab === "rates" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>Курсы валют</h2>
                          <p style={{ color: "var(--text-mid)", marginBottom: "24px", fontSize: "0.88rem", fontFamily: "Golos Text, sans-serif" }}>Обновляется каждые 5 минут. Спред ±1.5% от рыночного курса.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {ratesLoading ? (
                              <div style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>Загрузка курсов...</div>
                            ) : (
                              rates.map(r => (
                                <div key={r.code} className="bg-white rounded p-5" style={{ border: "1px solid #e8ecf3" }}>
                                  <div className="flex items-center gap-3 mb-4">
                                    <span style={{ fontSize: "1.8rem" }}>{r.flag}</span>
                                    <div>
                                      <div style={{ fontFamily: "Cormorant, serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)" }}>{r.code}</div>
                                      <div style={{ fontSize: "0.78rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{r.name}</div>
                                    </div>
                                    <span className="ml-auto text-sm font-semibold" style={{ color: r.change >= 0 ? "#48bb78" : "#fc8181", fontFamily: "Golos Text, sans-serif" }}>{r.change >= 0 ? "▲" : "▼"}{Math.abs(r.change).toFixed(2)}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded p-3" style={{ backgroundColor: "#f8fffe" }}>
                                      <div style={{ fontSize: "0.72rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Покупка</div>
                                      <div style={{ fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>{r.buy.toFixed(2)}</div>
                                      <div style={{ fontSize: "0.72rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>₽ за 1 {r.code}</div>
                                    </div>
                                    <div className="rounded p-3" style={{ backgroundColor: "#fffaf0" }}>
                                      <div style={{ fontSize: "0.72rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Продажа</div>
                                      <div style={{ fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>{r.sell.toFixed(2)}</div>
                                      <div style={{ fontSize: "0.72rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>₽ за 1 {r.code}</div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="bg-white rounded p-5" style={{ border: "1px solid #e8ecf3" }}>
                            <h3 style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", marginBottom: "12px", fontSize: "0.95rem" }}>Запрос на фиксацию курса</h3>
                            <p style={{ color: "var(--text-mid)", fontSize: "0.85rem", fontFamily: "Golos Text, sans-serif", marginBottom: "14px" }}>Зафиксируем курс на срок до 30 дней для планирования ваших платежей.</p>
                            <button onClick={() => nav("contacts")} className="btn-primary text-sm py-2 px-5">Запросить фиксацию курса</button>
                          </div>
                        </div>
                      )}

                      {/* Settings */}
                      {cabinetTab === "settings" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Настройки профиля</h2>
                          <div className="space-y-6">
                            <div className="bg-white rounded p-6" style={{ border: "1px solid #e8ecf3" }}>
                              <h3 style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", marginBottom: "16px", fontSize: "0.95rem" }}>Данные компании</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                  { label: "Контактное лицо", val: "Пользователь" },
                                  { label: "Email", val: loginForm.email },
                                  { label: "Телефон", val: "+7 (___) ___-__-__" },
                                  { label: "Компания", val: "" },
                                  { label: "ИНН", val: "" },
                                  { label: "КПП", val: "" },
                                ].map((f, i) => (
                                  <div key={i}>
                                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>{f.label}</label>
                                    <input defaultValue={f.val} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} />
                                  </div>
                                ))}
                              </div>
                              <button className="btn-primary mt-5 text-sm py-2.5 px-6">Сохранить изменения</button>
                            </div>
                            <div className="bg-white rounded p-6" style={{ border: "1px solid #e8ecf3" }}>
                              <h3 style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", marginBottom: "16px", fontSize: "0.95rem" }}>Уведомления</h3>
                              {[
                                { label: "Email-уведомления об исполнении платежей", checked: true },
                                { label: "SMS при смене статуса заявки", checked: true },
                                { label: "Еженедельный отчёт по курсам валют", checked: false },
                              ].map((n, i) => (
                                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #f0f4f8" }}>
                                  <span style={{ fontFamily: "Golos Text, sans-serif", fontSize: "0.9rem", color: "var(--text-mid)" }}>{n.label}</span>
                                  <div className="w-10 h-5 rounded-full cursor-pointer flex items-center px-0.5 transition-colors" style={{ backgroundColor: n.checked ? "var(--gold)" : "#d1d5db" }}>
                                    <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform" style={{ transform: n.checked ? "translateX(20px)" : "translateX(0)" }} />
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
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      {section !== "cabinet" && (
        <footer style={{ backgroundColor: "var(--navy)", borderTop: "1px solid rgba(200,168,75,0.15)" }}>
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--gold)" }}>
                    <Icon name="Globe" size={15} style={{ color: "var(--navy)" }} />
                  </div>
                  <span style={{ fontFamily: "Cormorant, serif", fontSize: "1.05rem", fontWeight: 700, color: "white" }}>ВЭД Агент Сервис</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", lineHeight: 1.7, fontFamily: "Golos Text, sans-serif" }}>Международные платежи и ВЭД-сопровождение для российского бизнеса.</p>
                <div className="flex gap-3 mt-4">
                  <a href="https://t.me/+74993985002" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.2)" }}>
                    <Icon name="Send" size={14} style={{ color: "var(--gold)" }} />
                  </a>
                  <a href="https://wa.me/74993985002" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.2)" }}>
                    <Icon name="MessageCircle" size={14} style={{ color: "var(--gold)" }} />
                  </a>
                </div>
              </div>
              {[
                { title: "Услуги", links: ["Международные платежи", "Валютное регулирование", "FX операции", "Комплаенс и безопасность", "Криптовалютные операции"] },
                { title: "Компания", links: ["О нас", "Блог", "FAQ", "Политика конфиденциальности", "Пользовательское соглашение"] },
                { title: "Контакты", links: ["+7 (499) 398-50-02", "info@vedagentservice.ru", "Пресненская наб., 12, Москва", "Пн–Пт: 9:00–18:00"] },
              ].map((col, i) => (
                <div key={i}>
                  <h4 style={{ color: "var(--gold)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", fontFamily: "Golos Text, sans-serif", fontWeight: 600 }}>{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map((link, j) => (
                      <li key={j} style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", cursor: "pointer", fontFamily: "Golos Text, sans-serif" }}>{link}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", fontFamily: "Golos Text, sans-serif" }}>© 2024 ООО «ВЭД Агент Сервис». Все права защищены.</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", fontFamily: "Golos Text, sans-serif" }}>ИНН 7714123456 · ОГРН 1187746123456</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
