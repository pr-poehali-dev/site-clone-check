/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────
type Section = "home" | "about" | "services" | "portfolio" | "blog" | "faq" | "contacts" | "cabinet";
type CabinetTab = "dashboard" | "orders" | "documents" | "messages" | "settings";

// ─── Data ────────────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: "Briefcase", title: "Юридическое сопровождение", desc: "Полное сопровождение сделок, договорная работа, защита интересов компании в спорных ситуациях." },
  { icon: "TrendingUp", title: "Бизнес-консалтинг", desc: "Стратегический анализ, оптимизация бизнес-процессов, разработка моделей роста." },
  { icon: "FileText", title: "Финансовый аудит", desc: "Независимая оценка финансового состояния, выявление рисков, подготовка к проверкам." },
  { icon: "Users", title: "HR-аутсорсинг", desc: "Подбор персонала, кадровое администрирование, оформление трудовых отношений." },
  { icon: "BarChart2", title: "Маркетинговый анализ", desc: "Исследование рынка, конкурентный анализ, разработка стратегии продвижения." },
  { icon: "Shield", title: "Комплаенс и безопасность", desc: "Оценка рисков, внедрение систем внутреннего контроля, защита от мошенничества." },
];

const PORTFOLIO = [
  { title: "Реструктуризация холдинга", tag: "Консалтинг", year: "2024", result: "Снижение издержек на 34%" },
  { title: "Выход на международный рынок", tag: "Стратегия", year: "2024", result: "3 новые страны присутствия" },
  { title: "Цифровая трансформация", tag: "Процессы", year: "2023", result: "Рост эффективности на 41%" },
  { title: "Слияние двух компаний", tag: "M&A", year: "2023", result: "Успешное юридическое сопровождение" },
  { title: "Антикризисное управление", tag: "Финансы", year: "2023", result: "Выход из убытков за 8 месяцев" },
  { title: "Оптимизация налоговой нагрузки", tag: "Аудит", year: "2022", result: "Экономия 12 млн руб/год" },
];

const BLOG = [
  { date: "10 марта 2026", tag: "Право", title: "Изменения в корпоративном законодательстве 2026: что важно знать", excerpt: "Разбираем ключевые поправки, вступившие в силу с января, и их влияние на бизнес." },
  { date: "28 февраля 2026", tag: "Финансы", title: "ESG-отчётность: как подготовить компанию к новым требованиям", excerpt: "Пошаговое руководство по внедрению ESG-практик для малого и среднего бизнеса." },
  { date: "15 февраля 2026", tag: "HR", title: "Дистанционный труд: актуальные риски для работодателя в 2026 году", excerpt: "Юридические аспекты оформления удалённых сотрудников с учётом последних изменений ТК." },
];

const FAQ = [
  { q: "С какими размерами бизнеса вы работаете?", a: "Мы работаем с компаниями любого масштаба — от малого бизнеса с оборотом от 10 млн руб. до крупных корпораций. Для каждого сегмента есть специализированные предложения." },
  { q: "Как проходит первая консультация?", a: "Первичная консультация занимает 60 минут, проводится бесплатно. Мы анализируем вашу ситуацию, задаём уточняющие вопросы и формируем предварительную программу работ." },
  { q: "Какие гарантии вы предоставляете?", a: "Мы работаем по договору с прописанными KPI и зафиксированными результатами. При недостижении целевых показателей возможен частичный возврат оплаты — условия обсуждаются индивидуально." },
  { q: "Возможна ли работа в режиме аутстаффинга?", a: "Да, наши специалисты могут работать как на территории заказчика, так и удалённо. Режим взаимодействия определяется при заключении договора." },
  { q: "Какой минимальный срок сотрудничества?", a: "Мы не устанавливаем жёстких ограничений. Разовые консультации доступны всегда. Для комплексного сопровождения рекомендуем контракт от 3 месяцев для достижения измеримых результатов." },
];

const CABINET_ORDERS = [
  { id: "ORD-2847", service: "Юридическое сопровождение", status: "active", date: "01.03.2026", manager: "Иванов А.С." },
  { id: "ORD-2791", service: "Финансовый аудит", status: "done", date: "15.01.2026", manager: "Петрова М.В." },
  { id: "ORD-2634", service: "HR-аутсорсинг", status: "done", date: "10.11.2025", manager: "Сидоров К.Д." },
];

const MESSAGES = [
  { from: "Иванов А.С.", role: "Менеджер проекта", text: "Добрый день! Документы по вашему запросу подготовлены и загружены в раздел «Документы».", time: "Сегодня, 11:24", unread: true },
  { from: "Служба поддержки", role: "Поддержка", text: "Ваше обращение №4521 принято в работу. Ожидайте ответа в течение 2 рабочих дней.", time: "Вчера, 16:05", unread: false },
  { from: "Петрова М.В.", role: "Финансовый аналитик", text: "Отчёт по аудиту за Q4 2025 готов к согласованию. Пожалуйста, ознакомьтесь и подтвердите.", time: "12.03.2026", unread: false },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [cabinetTab, setCabinetTab] = useState<CabinetTab>("dashboard");
  const [contactForm, setContactForm] = useState({ name: "", company: "", phone: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", company: "", email: "", phone: "", password: "" });
  const [regDone, setRegDone] = useState(false);

  const nav = (s: Section) => {
    setSection(s);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password.length >= 4) {
      setIsLoggedIn(true);
      setLoginError("");
      setCabinetTab("dashboard");
    } else {
      setLoginError("Введите корректный email и пароль (минимум 4 символа)");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.name && regForm.email && regForm.password.length >= 6) {
      setRegDone(true);
    }
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
  };

  const navItems: { label: string; key: Section }[] = [
    { label: "Главная", key: "home" },
    { label: "О компании", key: "about" },
    { label: "Услуги", key: "services" },
    { label: "Портфолио", key: "portfolio" },
    { label: "Блог", key: "blog" },
    { label: "FAQ", key: "faq" },
    { label: "Контакты", key: "contacts" },
  ];

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Golos Text', sans-serif" }}>
      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: "var(--navy)", borderBottom: "1px solid rgba(200,168,75,0.18)" }}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => nav("home")} className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--gold)" }}>
                <span style={{ fontFamily: "Cormorant, serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--navy)" }}>V</span>
              </div>
              <div className="text-left">
                <div style={{ fontFamily: "Cormorant, serif", fontSize: "1.15rem", fontWeight: 700, color: "white", lineHeight: 1.1 }}>VedAgent</div>
                <div style={{ fontSize: "0.6rem", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Service</div>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <button key={item.key} onClick={() => nav(item.key)} className={`nav-link ${section === item.key ? "active" : ""}`}>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => nav("cabinet")} className="hidden sm:flex items-center gap-2 btn-outline text-sm py-2 px-4">
                <Icon name="User" size={14} />
                {isLoggedIn ? "Личный кабинет" : "Войти"}
              </button>
              <button className="lg:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{ backgroundColor: "var(--navy-light)", borderTop: "1px solid rgba(200,168,75,0.2)" }} className="lg:hidden px-6 py-4">
            {navItems.map((item) => (
              <button key={item.key} onClick={() => nav(item.key)} className="block w-full text-left nav-link py-3 border-b border-white/10 last:border-0">
                {item.label}
              </button>
            ))}
            <button onClick={() => nav("cabinet")} className="mt-4 w-full btn-primary text-center">
              {isLoggedIn ? "Личный кабинет" : "Войти в кабинет"}
            </button>
          </div>
        )}
      </header>

      <main className="pt-16">

        {/* ════════ HOME ════════ */}
        {section === "home" && (
          <>
            <section className="relative overflow-hidden" style={{ minHeight: "92vh", backgroundColor: "var(--navy)" }}>
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/32a090cb-9d08-49dc-b3c2-f159b4dbd023.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,31,61,0.95) 50%, rgba(15,31,61,0.7) 100%)" }} />
              <div className="relative container mx-auto px-6 flex flex-col justify-center" style={{ minHeight: "92vh" }}>
                <div className="max-w-2xl animate-slide-up">
                  <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-sm" style={{ border: "1px solid rgba(200,168,75,0.4)", backgroundColor: "rgba(200,168,75,0.08)" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--gold)" }} />
                    <span style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Профессиональные B2B-услуги</span>
                  </div>
                  <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: "1.5rem" }}>
                    Экспертиза,<br />которая работает<br /><span style={{ color: "var(--gold)" }}>на ваш результат</span>
                  </h1>
                  <p className="animate-fade-in-delay-1" style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: "520px", marginBottom: "2.5rem", fontFamily: "Golos Text, sans-serif" }}>
                    Комплексное сопровождение бизнеса — от стратегии до операционного управления. Работаем с компаниями, для которых важны конкретные результаты.
                  </p>
                  <div className="flex flex-wrap gap-4 animate-fade-in-delay-2">
                    <button onClick={() => nav("services")} className="btn-primary">Наши услуги</button>
                    <button onClick={() => nav("contacts")} className="btn-outline">Бесплатная консультация</button>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(200,168,75,0.15)" }}>
                  <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/10">
                      {[
                        { n: "12+", l: "лет на рынке" },
                        { n: "340+", l: "успешных проектов" },
                        { n: "98%", l: "клиентов возвращаются" },
                        { n: "47", l: "эксперта в команде" },
                      ].map((s, i) => (
                        <div key={i} className="px-6 py-6 text-center">
                          <div className="stat-number">{s.n}</div>
                          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Golos Text, sans-serif" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="text-center mb-14">
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--navy)" }} className="gold-line-center">Наши услуги</h2>
                  <p style={{ color: "var(--text-mid)", marginTop: "24px", maxWidth: "540px", margin: "24px auto 0", fontFamily: "Golos Text, sans-serif" }}>Полный спектр профессиональных сервисов для развития и защиты вашего бизнеса</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SERVICES.map((s, i) => (
                    <div key={i} className="card-service">
                      <div className="w-12 h-12 rounded flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(200,168,75,0.1)" }}>
                        <Icon name={s.icon as any} size={22} style={{ color: "var(--gold)" }} />
                      </div>
                      <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)", marginBottom: "10px" }}>{s.title}</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "0.92rem", lineHeight: 1.65, fontFamily: "Golos Text, sans-serif" }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-10">
                  <button onClick={() => nav("services")} className="btn-primary">Все услуги и цены</button>
                </div>
              </div>
            </section>

            <section className="section-padding" style={{ backgroundColor: "var(--navy)" }}>
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "white" }} className="gold-line">Почему выбирают нас</h2>
                    <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginTop: "24px", fontFamily: "Golos Text, sans-serif" }}>
                      За 12 лет работы мы выстроили систему, которая даёт измеримый результат. Наши клиенты получают не просто консультацию — а конкретный план действий и поддержку на каждом этапе реализации.
                    </p>
                    <div className="mt-8 space-y-4">
                      {[
                        "Команда с практическим опытом в 15+ отраслях",
                        "Фиксированные сроки и бюджеты по договору",
                        "Персональный менеджер на весь период работы",
                        "Отчётность и KPI для каждого проекта",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(200,168,75,0.15)", border: "1px solid var(--gold)" }}>
                            <Icon name="Check" size={11} style={{ color: "var(--gold)" }} />
                          </div>
                          <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "Golos Text, sans-serif" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => nav("about")} className="btn-outline mt-8">О компании</button>
                  </div>
                  <div className="relative">
                    <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/f4cd3994-da5c-48a6-aee1-38574ccee131.jpg" alt="Команда" className="w-full rounded" style={{ objectFit: "cover", height: "420px" }} />
                    <div className="absolute -bottom-4 -left-4 p-5 rounded" style={{ backgroundColor: "var(--gold)", maxWidth: "200px" }}>
                      <div style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "var(--navy)" }}>12+</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--navy)", fontWeight: 600, fontFamily: "Golos Text, sans-serif" }}>лет экспертизы</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-20 bg-cream">
              <div className="container mx-auto px-6 text-center">
                <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "var(--navy)" }}>Готовы обсудить ваш проект?</h2>
                <p style={{ color: "var(--text-mid)", marginTop: "16px", marginBottom: "32px", fontFamily: "Golos Text, sans-serif" }}>Первичная консультация — бесплатно. Расскажите о задаче, мы предложим решение.</p>
                <button onClick={() => nav("contacts")} className="btn-primary text-base px-10 py-3">Связаться с нами</button>
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
                <p style={{ color: "var(--gold)", marginTop: "8px", fontFamily: "Golos Text, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.85rem" }}>VedAgent Service</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                  <div>
                    <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--navy)" }} className="gold-line">Наша история</h2>
                    <p style={{ color: "var(--text-mid)", lineHeight: 1.8, marginTop: "24px", fontFamily: "Golos Text, sans-serif" }}>
                      VedAgent Service основана в 2014 году группой практикующих юристов и консультантов с опытом работы в крупнейших российских корпорациях. Наша цель — создать компанию нового формата, где экспертиза встречается с реальной бизнес-практикой.
                    </p>
                    <p style={{ color: "var(--text-mid)", lineHeight: 1.8, marginTop: "16px", fontFamily: "Golos Text, sans-serif" }}>
                      Сегодня мы — это команда из 47 специалистов, которые ежедневно решают сложные задачи для компаний из 15+ отраслей. Наши клиенты — от небольших производственных компаний до крупных холдингов с оборотом более 10 млрд рублей.
                    </p>
                    <p style={{ color: "var(--text-mid)", lineHeight: 1.8, marginTop: "16px", fontFamily: "Golos Text, sans-serif" }}>
                      Мы придерживаемся принципа полной прозрачности: чёткие договорённости, измеримые результаты, честная отчётность на каждом этапе работы.
                    </p>
                  </div>
                  <div>
                    <img src="https://cdn.poehali.dev/projects/bdb0b596-d990-4173-9987-44d3766a158a/files/d16a817d-c941-448a-8da7-9acc2b9dfd77.jpg" alt="О компании" className="w-full rounded" style={{ height: "360px", objectFit: "cover" }} />
                  </div>
                </div>

                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { n: "2014", l: "год основания" },
                    { n: "47", l: "специалистов" },
                    { n: "340+", l: "реализованных проектов" },
                    { n: "15+", l: "отраслей" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-8 rounded" style={{ backgroundColor: "white", border: "1px solid #e8ecf3" }}>
                      <div className="stat-number">{s.n}</div>
                      <div style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Golos Text, sans-serif" }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-20">
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "var(--navy)" }} className="gold-line">Руководство</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                    {[
                      { name: "Александр Ведерников", role: "Генеральный директор", exp: "22 года в корпоративном праве" },
                      { name: "Марина Соколова", role: "Финансовый директор", exp: "18 лет в финансовом консалтинге" },
                      { name: "Дмитрий Орлов", role: "Управляющий партнёр", exp: "16 лет в стратегическом управлении" },
                    ].map((p, i) => (
                      <div key={i} className="p-6 rounded" style={{ backgroundColor: "white", border: "1px solid #e8ecf3" }}>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--navy)", fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>
                          {p.name[0]}
                        </div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)" }}>{p.name}</h3>
                        <p style={{ color: "var(--gold)", fontSize: "0.85rem", fontWeight: 600, marginTop: "4px", fontFamily: "Golos Text, sans-serif" }}>{p.role}</p>
                        <p style={{ color: "var(--text-mid)", fontSize: "0.85rem", marginTop: "8px", fontFamily: "Golos Text, sans-serif" }}>{p.exp}</p>
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
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Полный спектр профессиональных сервисов</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                  {SERVICES.map((s, i) => (
                    <div key={i} className="card-service">
                      <div className="w-12 h-12 rounded flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(200,168,75,0.1)" }}>
                        <Icon name={s.icon as any} size={22} style={{ color: "var(--gold)" }} />
                      </div>
                      <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)", marginBottom: "10px" }}>{s.title}</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "0.92rem", lineHeight: 1.65, fontFamily: "Golos Text, sans-serif", marginBottom: "16px" }}>{s.desc}</p>
                      <button onClick={() => nav("contacts")} className="text-sm font-semibold flex items-center gap-1 hover-gold" style={{ color: "var(--navy)", fontFamily: "Golos Text, sans-serif" }}>
                        Узнать подробнее <Icon name="ArrowRight" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded p-10 text-center" style={{ backgroundColor: "var(--navy)" }}>
                  <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>Нужна индивидуальная программа?</h2>
                  <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "28px", fontFamily: "Golos Text, sans-serif" }}>Обсудим задачи вашего бизнеса и сформируем персональное предложение</p>
                  <button onClick={() => nav("contacts")} className="btn-primary">Получить коммерческое предложение</button>
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
                <h1 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: "white" }}>Портфолио</h1>
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Избранные проекты</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PORTFOLIO.map((p, i) => (
                    <div key={i} className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3", transition: "all 0.3s" }}>
                      <div className="h-2" style={{ backgroundColor: "var(--gold)" }} />
                      <div className="p-7">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(200,168,75,0.1)", color: "var(--gold)", fontFamily: "Golos Text, sans-serif", letterSpacing: "0.05em" }}>{p.tag}</span>
                          <span style={{ color: "var(--text-light)", fontSize: "0.8rem", fontFamily: "Golos Text, sans-serif" }}>{p.year}</span>
                        </div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--navy)", marginBottom: "12px" }}>{p.title}</h3>
                        <div className="flex items-center gap-2">
                          <Icon name="TrendingUp" size={15} style={{ color: "var(--gold)" }} />
                          <span style={{ color: "var(--text-mid)", fontSize: "0.9rem", fontFamily: "Golos Text, sans-serif" }}>{p.result}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <button onClick={() => nav("contacts")} className="btn-primary">Обсудить ваш проект</button>
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
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Экспертные материалы</p>
              </div>
            </div>
            <div className="section-padding bg-cream">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {BLOG.map((b, i) => (
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
                  {FAQ.map((item, i) => (
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
                  <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "16px", fontFamily: "Golos Text, sans-serif" }}>Не нашли ответ на свой вопрос?</p>
                  <button onClick={() => nav("contacts")} className="btn-primary">Задать вопрос</button>
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
                    <p style={{ color: "var(--text-mid)", marginBottom: "28px", fontFamily: "Golos Text, sans-serif", fontSize: "0.92rem" }}>Заполните форму — мы свяжемся в течение 2 рабочих часов</p>
                    {contactSent ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(200,168,75,0.15)" }}>
                          <Icon name="CheckCircle" size={32} style={{ color: "var(--gold)" }} />
                        </div>
                        <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)" }}>Заявка отправлена!</h3>
                        <p style={{ color: "var(--text-mid)", marginTop: "8px", fontFamily: "Golos Text, sans-serif" }}>Мы свяжемся с вами в ближайшее время.</p>
                        <button className="btn-primary mt-6" onClick={() => setContactSent(false)}>Отправить ещё</button>
                      </div>
                    ) : (
                      <form onSubmit={handleContact} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Имя *</label>
                            <input required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none transition-all" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="Александр" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Компания</label>
                            <input value={contactForm.company} onChange={e => setContactForm({ ...contactForm, company: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="ООО «Компания»" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Телефон *</label>
                            <input required value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="+7 (900) 000-00-00" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Email *</label>
                            <input required type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="info@company.ru" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>Сообщение</label>
                          <textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} rows={4} className="w-full px-4 py-3 rounded text-sm outline-none resize-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder="Опишите вашу задачу..." />
                        </div>
                        <button type="submit" className="btn-primary w-full text-center py-3">Отправить заявку</button>
                      </form>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)" }} className="gold-line">Контактная информация</h2>
                    </div>
                    {[
                      { icon: "MapPin", title: "Адрес", val: "г. Москва, Пресненская набережная, д. 8, стр. 1, БЦ «Москва-Сити», офис 1204" },
                      { icon: "Phone", title: "Телефон", val: "+7 (495) 123-45-67" },
                      { icon: "Mail", title: "Email", val: "info@vedagentservice.ru" },
                      { icon: "Clock", title: "Режим работы", val: "Пн–Пт: 9:00–19:00 (МСК)" },
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
                <p style={{ color: "var(--gold)", marginTop: "8px", fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Golos Text, sans-serif" }}>Управление проектами и документами</p>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="section-padding bg-cream">
                <div className="container mx-auto px-6 max-w-md">
                  {!registerMode ? (
                    <div className="bg-white rounded p-8" style={{ border: "1px solid #e8ecf3" }}>
                      <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "6px" }}>Вход в систему</h2>
                      <p style={{ color: "var(--text-mid)", marginBottom: "28px", fontSize: "0.9rem", fontFamily: "Golos Text, sans-serif" }}>Введите данные вашего аккаунта</p>
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
                          <p style={{ color: "var(--text-mid)", marginTop: "8px", fontFamily: "Golos Text, sans-serif", fontSize: "0.9rem" }}>Мы проверим данные и активируем доступ в течение 1 рабочего дня.</p>
                          <button className="btn-primary mt-6" onClick={() => { setRegisterMode(false); setRegDone(false); }}>Вернуться ко входу</button>
                        </div>
                      ) : (
                        <>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "6px" }}>Регистрация</h2>
                          <p style={{ color: "var(--text-mid)", marginBottom: "28px", fontSize: "0.9rem", fontFamily: "Golos Text, sans-serif" }}>Создайте аккаунт для доступа к личному кабинету</p>
                          <form onSubmit={handleRegister} className="space-y-4">
                            {[
                              { label: "Имя *", key: "name", ph: "Александр Иванов", type: "text" },
                              { label: "Компания", key: "company", ph: "ООО «Компания»", type: "text" },
                              { label: "Email *", key: "email", ph: "email@company.ru", type: "email" },
                              { label: "Телефон", key: "phone", ph: "+7 (900) 000-00-00", type: "text" },
                              { label: "Пароль (мин. 6 симв.) *", key: "password", ph: "••••••••", type: "password" },
                            ].map((f) => (
                              <div key={f.key}>
                                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>{f.label}</label>
                                <input type={f.type} required={f.label.includes("*")} value={(regForm as any)[f.key]} onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} placeholder={f.ph} />
                              </div>
                            ))}
                            <button type="submit" className="btn-primary w-full text-center py-3">Зарегистрироваться</button>
                            <div className="text-center pt-2">
                              <button type="button" className="text-sm" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }} onClick={() => setRegisterMode(false)}>
                                Уже есть аккаунт? Войти
                              </button>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-cream min-h-screen">
                <div className="container mx-auto px-6 py-8">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="lg:w-56 flex-shrink-0">
                      <div className="bg-white rounded p-5 mb-4" style={{ border: "1px solid #e8ecf3" }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "var(--navy)", fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--gold)" }}>
                          {loginForm.email[0]?.toUpperCase() || "U"}
                        </div>
                        <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{loginForm.email}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>Клиент</div>
                      </div>
                      <nav className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3" }}>
                        {([
                          { key: "dashboard", icon: "LayoutDashboard", label: "Обзор" },
                          { key: "orders", icon: "ClipboardList", label: "Заказы" },
                          { key: "documents", icon: "FolderOpen", label: "Документы" },
                          { key: "messages", icon: "MessageSquare", label: "Сообщения", badge: 1 },
                          { key: "settings", icon: "Settings", label: "Настройки" },
                        ] as Array<{ key: CabinetTab; icon: string; label: string; badge?: number }>).map((item) => (
                          <button key={item.key} onClick={() => setCabinetTab(item.key)} className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2" style={{ borderLeftColor: cabinetTab === item.key ? "var(--gold)" : "transparent", backgroundColor: cabinetTab === item.key ? "rgba(200,168,75,0.06)" : "transparent", color: cabinetTab === item.key ? "var(--navy)" : "var(--text-mid)", fontFamily: "Golos Text, sans-serif", fontWeight: cabinetTab === item.key ? 600 : 400 }}>
                            <Icon name={item.icon as any} size={16} />
                            <span>{item.label}</span>
                            {item.badge ? <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--gold)", color: "var(--navy)", fontWeight: 700 }}>{item.badge}</span> : null}
                          </button>
                        ))}
                        <div style={{ borderTop: "1px solid #e8ecf3" }}>
                          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-4 py-3 text-sm" style={{ color: "#e53e3e", fontFamily: "Golos Text, sans-serif" }}>
                            <Icon name="LogOut" size={16} />
                            <span>Выйти</span>
                          </button>
                        </div>
                      </nav>
                    </aside>

                    {/* Content */}
                    <div className="flex-1">
                      {cabinetTab === "dashboard" && (
                        <div className="space-y-6">
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)" }}>Обзор</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { icon: "ClipboardList", label: "Активных заказов", val: "1", color: "var(--gold)" },
                              { icon: "FolderOpen", label: "Документов", val: "8", color: "#4a90d9" },
                              { icon: "MessageSquare", label: "Новых сообщений", val: "1", color: "#48bb78" },
                            ].map((stat, i) => (
                              <div key={i} className="bg-white rounded p-5" style={{ border: "1px solid #e8ecf3" }}>
                                <div className="flex items-center gap-3 mb-2">
                                  <Icon name={stat.icon as any} size={18} style={{ color: stat.color }} />
                                  <span style={{ fontSize: "0.8rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{stat.label}</span>
                                </div>
                                <div style={{ fontFamily: "Cormorant, serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--navy)" }}>{stat.val}</div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-white rounded p-6" style={{ border: "1px solid #e8ecf3" }}>
                            <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", marginBottom: "16px" }}>Последние заказы</h3>
                            <div className="space-y-3">
                              {CABINET_ORDERS.slice(0, 2).map((o, i) => (
                                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #f0f4f8" }}>
                                  <div>
                                    <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{o.service}</div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{o.id} · {o.date}</div>
                                  </div>
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: o.status === "active" ? "rgba(200,168,75,0.12)" : "rgba(72,187,120,0.12)", color: o.status === "active" ? "var(--gold)" : "#2f855a", fontFamily: "Golos Text, sans-serif" }}>
                                    {o.status === "active" ? "В работе" : "Завершён"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {cabinetTab === "orders" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Мои заказы</h2>
                          <div className="bg-white rounded overflow-hidden" style={{ border: "1px solid #e8ecf3" }}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #e8ecf3", backgroundColor: "#fafbfc" }}>
                                    {["Номер", "Услуга", "Менеджер", "Дата", "Статус"].map((h) => (
                                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Golos Text, sans-serif" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {CABINET_ORDERS.map((o, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                                      <td className="px-4 py-4 text-sm" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif", fontWeight: 600 }}>{o.id}</td>
                                      <td className="px-4 py-4 text-sm" style={{ color: "var(--navy)", fontFamily: "Golos Text, sans-serif" }}>{o.service}</td>
                                      <td className="px-4 py-4 text-sm" style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>{o.manager}</td>
                                      <td className="px-4 py-4 text-sm" style={{ color: "var(--text-mid)", fontFamily: "Golos Text, sans-serif" }}>{o.date}</td>
                                      <td className="px-4 py-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: o.status === "active" ? "rgba(200,168,75,0.12)" : "rgba(72,187,120,0.12)", color: o.status === "active" ? "var(--gold)" : "#2f855a", fontFamily: "Golos Text, sans-serif" }}>
                                          {o.status === "active" ? "В работе" : "Завершён"}
                                        </span>
                                      </td>
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
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Документы</h2>
                          <div className="space-y-3">
                            {[
                              { name: "Договор оказания услуг №847", type: "PDF", size: "1.2 МБ", date: "01.03.2026" },
                              { name: "Акт выполненных работ Q4 2025", type: "PDF", size: "0.8 МБ", date: "20.01.2026" },
                              { name: "Отчёт финансового аудита", type: "XLSX", size: "3.4 МБ", date: "15.01.2026" },
                              { name: "Коммерческое предложение", type: "PDF", size: "0.5 МБ", date: "02.11.2025" },
                              { name: "Дополнительное соглашение №2", type: "PDF", size: "0.3 МБ", date: "10.10.2025" },
                            ].map((doc, i) => (
                              <div key={i} className="flex items-center justify-between bg-white rounded p-4" style={{ border: "1px solid #e8ecf3" }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: doc.type === "PDF" ? "rgba(229,62,62,0.1)" : "rgba(74,144,217,0.1)" }}>
                                    <Icon name="FileText" size={16} style={{ color: doc.type === "PDF" ? "#e53e3e" : "#4a90d9" }} />
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 500, color: "var(--navy)", fontSize: "0.9rem" }}>{doc.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{doc.type} · {doc.size} · {doc.date}</div>
                                  </div>
                                </div>
                                <button className="flex items-center gap-1 text-sm" style={{ color: "var(--gold)", fontFamily: "Golos Text, sans-serif" }}>
                                  <Icon name="Download" size={14} /> Скачать
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cabinetTab === "messages" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Сообщения</h2>
                          <div className="space-y-3">
                            {MESSAGES.map((msg, i) => (
                              <div key={i} className="bg-white rounded p-5" style={{ border: msg.unread ? "1.5px solid var(--gold)" : "1px solid #e8ecf3" }}>
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: "var(--navy)", fontFamily: "Cormorant, serif", fontWeight: 700, color: "var(--gold)" }}>{msg.from[0]}</div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span style={{ fontFamily: "Golos Text, sans-serif", fontWeight: 600, color: "var(--navy)", fontSize: "0.9rem" }}>{msg.from}</span>
                                      <span style={{ fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "Golos Text, sans-serif" }}>{msg.role}</span>
                                      {msg.unread && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--gold)", color: "var(--navy)", fontWeight: 700 }}>Новое</span>}
                                    </div>
                                    <p style={{ color: "var(--text-mid)", fontSize: "0.88rem", lineHeight: 1.6, marginTop: "6px", fontFamily: "Golos Text, sans-serif" }}>{msg.text}</p>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "8px", fontFamily: "Golos Text, sans-serif" }}>{msg.time}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cabinetTab === "settings" && (
                        <div>
                          <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>Настройки профиля</h2>
                          <div className="bg-white rounded p-6" style={{ border: "1px solid #e8ecf3" }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                { label: "Имя", val: "Пользователь" },
                                { label: "Email", val: loginForm.email },
                                { label: "Телефон", val: "+7 (900) 000-00-00" },
                                { label: "Компания", val: "ООО «Компания»" },
                              ].map((f, i) => (
                                <div key={i}>
                                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-dark)", fontFamily: "Golos Text, sans-serif" }}>{f.label}</label>
                                  <input defaultValue={f.val} className="w-full px-4 py-3 rounded text-sm outline-none" style={{ border: "1.5px solid #e0e6f0", fontFamily: "Golos Text, sans-serif", color: "var(--navy)" }} onFocus={e => (e.target.style.borderColor = "var(--gold)")} onBlur={e => (e.target.style.borderColor = "#e0e6f0")} />
                                </div>
                              ))}
                            </div>
                            <button className="btn-primary mt-6">Сохранить изменения</button>
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
                    <span style={{ fontFamily: "Cormorant, serif", fontWeight: 700, color: "var(--navy)" }}>V</span>
                  </div>
                  <span style={{ fontFamily: "Cormorant, serif", fontSize: "1.1rem", fontWeight: 700, color: "white" }}>VedAgent Service</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", lineHeight: 1.7, fontFamily: "Golos Text, sans-serif" }}>Профессиональные B2B-услуги для роста и защиты вашего бизнеса.</p>
              </div>
              {[
                { title: "Компания", links: ["О нас", "Команда", "Партнёры", "Вакансии"] },
                { title: "Услуги", links: ["Юридическое сопровождение", "Бизнес-консалтинг", "Финансовый аудит", "HR-аутсорсинг"] },
                { title: "Контакты", links: ["+7 (495) 123-45-67", "info@vedagentservice.ru", "Пн–Пт: 9:00–19:00"] },
              ].map((col, i) => (
                <div key={i}>
                  <h4 style={{ color: "var(--gold)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", fontFamily: "Golos Text, sans-serif", fontWeight: 600 }}>{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map((link, j) => (
                      <li key={j} style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", cursor: "pointer", fontFamily: "Golos Text, sans-serif" }}>{link}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", fontFamily: "Golos Text, sans-serif" }}>© 2026 VedAgent Service. Все права защищены.</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", fontFamily: "Golos Text, sans-serif" }}>ИНН 7712345678 · ОГРН 1147712345678</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}