import React, { useState, useEffect, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  ChevronDown,
  X,
  Menu,
  Globe,
  Blocks,
  Box,
  Bot,
  Gamepad2,
  Code2,
  Palette,
  MessagesSquare,
  BookOpen,
  Users,
  Briefcase,
  Building2,
  LifeBuoy,
  Search,
  Check,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  Send,
  ShoppingBag,
  LogOut,
  User,
  CheckCircle2,
  Terminal,
  Download,
  Layers,
  Instagram,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { serviceItems, faqs, docs } from "./content";
import "./style.css";
import {
  Context,
  useApp,
  safeGet,
  safeSet,
  api,
  Link,
  CTA,
} from "./app-context";
import { Admin, Checkout, OrderPage, OrdersList } from "./commerce";
import "./commerce.css";
const icons = { Blocks, Gamepad2, Bot, Globe, Palette, MessagesSquare };
function Brand() {
  return (
    <span className="brand-text">
      dfbng<span> software</span>
      <i>®</i>
    </span>
  );
}
function Socials() {
  const { t, settings } = useApp();
  return (
    <div className="socials">
      <Link to="/#integrations" title="Modrinth" className="green">
        <Zap size={18} />
      </Link>
      <Link to="/products" title={t("Mağaza", "Store")} className="blue">
        <Box size={18} />
      </Link>
      <Link to="/services/minecraft-plugin" title="SpigotMC" className="orange">
        <Gamepad2 size={18} />
      </Link>
      <Link
        to={settings.instagram || "/reference"}
        title="Instagram"
        className="pink"
      >
        <Instagram size={18} />
      </Link>
      <Link to="/docs" title="YouTube" className="red">
        <Youtube size={20} />
      </Link>
      <Link
        to={settings.discord || "/contact"}
        title="Discord"
        className="purple"
      >
        <Bot size={20} />
      </Link>
    </div>
  );
}
function Header() {
  const { t, lang, setLang, user } = useApp();
  const [menu, setMenu] = useState(null),
    [mobile, setMobile] = useState(false);
  const { path } = useApp();
  useEffect(() => {
    setMenu(null);
    setMobile(false);
  }, [path]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const navs = [
    ["team", t("Takım", "Team")],
    ["store", t("Mağaza", "Store")],
    ["custom", t("Özel Sipariş", "Custom order")],
    ["services", t("Hizmetler", "Services")],
    ["docs", t("Dokümantasyon", "Documentation")],
  ];
  const items =
    menu === "team"
      ? [
          [
            Users,
            t("Takım", "Team"),
            t("Projelerin arkasındaki ekip", "The people behind the projects"),
            "/career/team",
          ],
          [
            Briefcase,
            t("Kariyer", "Careers"),
            t("Birlikte üretelim", "Build with us"),
            "/career",
          ],
          [
            Building2,
            t("Hakkımızda", "About us"),
            t("Biz kimiz, neler yapıyoruz?", "Who we are and what we do"),
            "/about",
          ],
          [
            Layers,
            t("Referanslar", "References"),
            t("Üzerinde çalıştığımız projeler", "Explore our projects"),
            "/reference",
          ],
          [
            MessagesSquare,
            t("İletişim", "Contact"),
            t(
              "Tanışalım, projenizi konuşalım",
              "Let’s talk about your project",
            ),
            "/contact",
          ],
        ]
      : menu === "store"
        ? [
            ...serviceItems
              .slice(0, 4)
              .map((s) => [
                icons[s[5]],
                s[lang === "tr" ? 1 : 2],
                s[lang === "tr" ? 3 : 4],
                "/products/" + s[0],
              ]),
            [
              Palette,
              t("Tasarım", "Design"),
              t("Görsel kimlik ve arayüz", "Visual identity and interfaces"),
              "/products/design",
            ],
            [
              ShoppingBag,
              t("Tüm ürünler", "All products"),
              t("Mağazanın tamamını keşfedin", "Browse the whole store"),
              "/products",
            ],
          ]
        : menu === "services"
          ? serviceItems.map((s) => [
              icons[s[5]],
              s[lang === "tr" ? 1 : 2],
              s[lang === "tr" ? 3 : 4],
              "/services/" + s[0],
            ])
          : [
              [
                BookOpen,
                t("Dokümantasyon", "Documentation"),
                t("Kurulum ve kullanım rehberleri", "Setup and usage guides"),
                "/docs",
              ],
              [
                Code2,
                "API " + t("Dokümantasyonu", "Documentation"),
                t(
                  "Geliştiriciler için başvuru kaynağı",
                  "A reference for developers",
                ),
                "/api-docs",
              ],
              [
                Terminal,
                "Blog",
                t("Duyurular ve yazılar", "Announcements and articles"),
                "/blog",
              ],
              [
                MessagesSquare,
                "Forum",
                t(
                  "Sorun, deneyimlerinizi paylaşın",
                  "Ask questions, share your experience",
                ),
                "/forum",
              ],
              [
                ShieldCheck,
                t("Sözleşmeler", "Agreements"),
                t("Kullanım ve gizlilik koşulları", "Terms and privacy"),
                "/terms",
              ],
              [
                LifeBuoy,
                t("Destek Merkezi", "Help Center"),
                t("Size nasıl yardımcı olabiliriz?", "How can we help?"),
                "/contact",
              ],
            ];
  return (
    <header
      onClick={(e) => {
        if (e.target.closest("a")) {
          setMenu(null);
          setMobile(false);
        }
      }}
    >
      <div className="nav-wrap">
        <Link to="/" className="brand" aria-label="dfbng software">
          <Brand />
        </Link>
        <nav
          className={mobile ? "mobile-open" : ""}
          aria-label={t("Ana menü", "Main navigation")}
        >
          {navs.map(([id, label]) =>
            id === "custom" ? (
              <Link key={id} to="/custom-order">
                {label}
              </Link>
            ) : (
              <button
                key={id}
                onClick={() => setMenu(menu === id ? null : id)}
                aria-expanded={menu === id}
              >
                {label}
                <ChevronDown size={12} />
              </button>
            ),
          )}
        </nav>
        <div className="nav-account">
          <Link to="/dfbng-os" className="os-link">
            <Code2 size={15} />
            dfbngOS
          </Link>
          <div className="account-pill">
            <button
              className="language"
              aria-label={t("Dil seçimi", "Choose language")}
              aria-expanded={menu === "language"}
              onClick={() => setMenu(menu === "language" ? null : "language")}
            >
              <span>{lang === "tr" ? "🇹🇷" : "🇬🇧"}</span>
              <ChevronDown size={12} />
            </button>
            <Link
              to={user ? "/account" : "/login"}
              aria-label={
                user ? t("Panelim", "My dashboard") : t("Giriş Yap", "Sign In")
              }
            >
              {user ? <User size={18} /> : t("Giriş Yap", "Sign In")}
            </Link>
          </div>
        </div>
        <button
          className="mobile-toggle"
          aria-label={t("Menüyü aç", "Open menu")}
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <X /> : <Menu />}
        </button>
      </div>
      {menu === "language" && (
        <div className="language-menu">
          {[
            ["tr", "🇹🇷", "Türkçe"],
            ["en", "🇬🇧", "English"],
          ].map(([l, flag, title]) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                setMenu(null);
              }}
            >
              {flag} {title}
              <small>{l.toUpperCase()}</small>
              {lang === l && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
      {menu && menu !== "language" && (
        <div className="mega-menu">
          <div className="mega-grid">
            {items.map(([Icon, title, desc, to]) => (
              <Link key={to} to={to}>
                <span className="menu-icon">
                  <Icon size={20} />
                </span>
                <span>
                  <b>{title}</b>
                  <small>{desc}</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
          <div className="mega-bottom">
            <span>
              <i className="status-dot" />
              {t(
                "Bir sonraki projeniz için buradayız.",
                "We’re here for your next project.",
              )}
            </span>
            <Link to="/custom-order">
              {t("Özel sipariş oluştur", "Start a custom order")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
      {(menu || mobile) && (
        <button
          className="menu-dismiss"
          aria-label={t("Menüyü kapat", "Close menu")}
          onClick={() => {
            setMenu(null);
            setMobile(false);
          }}
        />
      )}
    </header>
  );
}
function Hero() {
  const { t, lang } = useApp();
  const [word, setWord] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setWord((w) => (w + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="hero">
      <Socials />
      <div className="hero-content">
        <Link to="/custom-order" className="announcement">
          <b>{t("YENİ", "NEW")}</b>
          <span>{t("Özel sipariş açık", "Custom orders are open")}</span>
          <i />
          {t("İncele", "Learn more")}
          <ArrowRight size={13} />
        </Link>
        <h1>
          {t("Sunucunu", "Make your server")}{" "}
          <span key={lang + word} className={"animated-word word-" + word}>
            {
              [
                t("geliştir", "stand out"),
                t("öne çıkar", "come alive"),
                t("farklı kıl", "level up"),
              ][word]
            }
            <span className="cursor">_</span>
          </span>
        </h1>
        <p>
          {t(
            "Minecraft pluginden FiveM scriptine, Discord botundan web markete —",
            "From Minecraft plugins to FiveM scripts, Discord bots to web stores —",
          )}
          <br className="desktop-break" />
          {t(
            " sunucunun neye ihtiyacı varsa sıfırdan, sana özel geliştiriyoruz.",
            " whatever your server needs, we build it from scratch, just for you.",
          )}
        </p>
        <CTA to="/products">{t("Mağazamızı İncele", "Browse our store")}</CTA>
      </div>
      <div className="hero-corner">
        dfbng software<span>CRAFTED FOR YOUR WORLD</span>
      </div>
      <span className="hero-scroll">
        {t("KEŞFETMEYE DEVAM ET", "KEEP EXPLORING")}
        <span>↓</span>
      </span>
    </section>
  );
}
function SectionTitle({ eyebrow, title, accent, description }) {
  return (
    <div className="section-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>
        {title} <span>{accent}</span>
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}
function Partners() {
  const { t } = useApp();
  return (
    <section className="partners">
      <p>
        {t("PROJENİZİN TEKNOLOJİ ORTAĞI", "YOUR PROJECT’S TECHNOLOGY PARTNER")}
      </p>
      <div>
        <span>
          <Blocks />
          Minecraft
        </span>
        <span className="fivem">
          <Gamepad2 />
          FiveM
        </span>
        <span>
          <Bot />
          Discord
        </span>
        <span>
          <Layers />
          Paper
        </span>
        <span>
          <Zap />
          Folia
        </span>
        <span>
          <Box />
          Purpur
        </span>
      </div>
    </section>
  );
}
function ServicesPreview() {
  const { t } = useApp();
  return (
    <section className="section container">
      <SectionTitle
        title={t(
          "Sunucunuzu Sıradanlıktan Çıkarın,",
          "Lift Your Server Out of the Ordinary,",
        )}
        accent={t("Liderliğe Taşıyın", "Take the Lead")}
        description={t(
          "Altyapıdan web markete, özel tasarımdan Discord botlarına kadar ihtiyacınız olan tüm profesyonel çözümler tek bir çatıda.",
          "From infrastructure to web stores, custom design to Discord bots — every professional solution you need, under one roof.",
        )}
      />
      <div className="bento">
        <Link to="/services/web-market" className="bento-card revenue">
          <span className="card-icon">
            <Globe size={20} />
          </span>
          <h3>
            {t(
              "Sunucunuzu Markalaştırın, Prestijinizi Katlayın",
              "Turn Your Server Into a Brand",
            )}
          </h3>
          <p>
            {t(
              "Özel web sitesi ve kusursuz market altyapımızla profesyonel bir deneyim sunun, gelirinizi artırın.",
              "Deliver a professional experience and grow your revenue with our custom websites and flawless store infrastructure.",
            )}
          </p>
          <div className="chart">
            <small>{t("TOPLAM SATIŞ", "TOTAL SALES")}</small>
            <strong>
              ₺34.850<span>,50</span>
              <i>↗ 24.8%</i>
            </strong>
            <svg
              viewBox="0 0 400 130"
              aria-label={t("Örnek satış grafiği", "Sample sales chart")}
            >
              <defs>
                <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity=".35" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 118 Q30 110 50 114 T95 90 T145 95 T190 64 T240 70 T285 35 T335 38 T400 7 L400 130 L0 130Z"
                fill="url(#chartfill)"
              />
              <path
                d="M0 118 Q30 110 50 114 T95 90 T145 95 T190 64 T240 70 T285 35 T335 38 T400 7"
                fill="none"
                stroke="#b46bfa"
                strokeWidth="2"
              />
            </svg>
            <div className="chart-months">
              {t("OCA ŞUB MAR NİS MAY", "JAN FEB MAR APR MAY")
                .split(" ")
                .map((m) => (
                  <span key={m}>{m}</span>
                ))}
            </div>
          </div>
        </Link>
        <Link to="/services" className="bento-card sectors">
          <span className="card-icon">
            <Layers size={20} />
          </span>
          <h3>
            {t(
              "Hangi Sektördesiniz? Biz Oradayız.",
              "Whatever Your Field — We’re There.",
            )}
          </h3>
          <p>
            {t(
              "FiveM, Minecraft, Discord toplulukları ya da özel yazılımlar… Her kulvarda ihtiyacınıza özel çözümler.",
              "FiveM, Minecraft, Discord communities or custom software… Tailored solutions in every field.",
            )}
          </p>
          <div className="sector-images">
            {["discord", "gta", "minecraft"].map((s, i) => (
              <div key={s}>
                <img
                  src={"/assets/" + s + ".jpg"}
                  alt={["Discord", "FiveM", "Minecraft"][i]}
                  loading="lazy"
                />
                <span>{["Discord", "FiveM", "Minecraft"][i]}</span>
              </div>
            ))}
          </div>
        </Link>
        <Link to="/services/minecraft-plugin" className="bento-card code-card">
          <span className="card-icon">
            <Code2 size={20} />
          </span>
          <h3>
            {t(
              "Alıntı Paketlerle Vakit Kaybetmeyin, Farkınızı Konuşturun",
              "Make Your Server Unmistakably Yours",
            )}
          </h3>
          <p>
            {t(
              "Konseptinize özgü, oyuncuyu yormayan ve sunucu performansını zirveye taşıyan özel altyapı çözümleri.",
              "Custom infrastructure built around your concept, easy on players and optimized for performance.",
            )}
          </p>
          <div className="code-window">
            <div>
              <i />
              <i />
              <i />
              <span>dfbng.config.ts</span>
            </div>
            <pre>
              <span>export default</span> {"{"}
              <br /> name: <em>"your next big idea"</em>,<br /> performance:{" "}
              <em>"maximum"</em>,<br /> possibilities: <b>Infinity</b>,<br />{" "}
              poweredBy: <em>"dfbng software"</em>
              <br />
              {"}"}
            </pre>
          </div>
        </Link>
        <Link to="/reference" className="bento-card map-card">
          <span className="card-icon">
            <Blocks size={20} />
          </span>
          <h3>
            {t(
              "İmzalı Mimarilerle Fark Yaratın",
              "Stand Out With Signature Architecture",
            )}
          </h3>
          <p>
            {t(
              "Oyuncuları ilk adımda etkileyen, sunucunuza özel yüksek detaylı haritalar ve spawn tasarımları.",
              "High-detail maps and spawn designs that impress your players from the very first step.",
            )}
          </p>
          <div className="map-stack">
            {[1, 2, 3].map((i) => (
              <img
                key={i}
                src={"/assets/build" + i + ".png"}
                alt={t("Minecraft harita tasarımı", "Minecraft map design")}
                loading="lazy"
              />
            ))}
          </div>
        </Link>
      </div>
      <div className="center-link">
        <Link to="/services">
          {t("Tüm hizmetleri keşfet", "Explore all services")}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
function ProductCard({ product: p }) {
  const { t, lang } = useApp();
  return (
    <Link to={"/product/" + p.id} className="product-card">
      <div className="product-image">
        <img
          src={"/assets/" + p.image}
          alt={p.title[lang === "tr" ? 0 : 1]}
          loading="lazy"
        />
        {p.id === "dfbng-stone" && (
          <div className="stone-art">
            <Box size={42} />
            <strong>
              dfbng<span>STONE</span>
            </strong>
            <small>MINECRAFT PLUGIN</small>
          </div>
        )}
        <span className="product-category">{p.category}</span>
        <span className="product-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="product-info">
        <h3>{p.title[lang === "tr" ? 0 : 1]}</h3>
        <p>{p.description[lang === "tr" ? 0 : 1]}</p>
        <div className="product-price">
          <span>
            {p.oldPrice && <del>₺{p.oldPrice.toLocaleString("tr-TR")}</del>}
            <b>{p.price ? "₺" + p.price : t("Ücretsiz", "Free")}</b>
          </span>
          <small>
            {t("Ömür boyu", "Lifetime")}
            <ArrowRight size={14} />
          </small>
        </div>
      </div>
    </Link>
  );
}
function ProductGrid({ compact = false, initial = "All" }) {
  const { t, products } = useApp();
  const [filter, setFilter] = useState(initial),
    [query, setQuery] = useState("");
  useEffect(() => setFilter(initial), [initial]);
  const list = products.filter(
    (p) =>
      (filter === "All" || p.category === filter) &&
      p.title
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <div className="product-toolbar">
        <div className="filters">
          {["All", "Minecraft", "FiveM", "Discord", "Web"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "All" ? t("Tümü", "All") : f}
            </button>
          ))}
        </div>
        {!compact && (
          <label className="search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Ürün ara…", "Search products…")}
              aria-label={t("Ürün ara", "Search products")}
            />
          </label>
        )}
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <Search size={32} />
          <h3>
            {t(
              "Aradığınız ürün henüz burada değil.",
              "Your next product isn’t here yet.",
            )}
          </h3>
          <p>
            {t(
              "Fikrinizi paylaşın, size özel geliştirelim.",
              "Tell us your idea. We’ll build it for you.",
            )}
          </p>
          <CTA to="/custom-order">
            {t("Özel sipariş oluştur", "Start a custom order")}
          </CTA>
        </div>
      )}
    </>
  );
}
function Integrations() {
  const { t } = useApp();
  return (
    <section id="integrations" className="section integrations">
      <SectionTitle
        eyebrow={t(
          "BİR FİKİRDEN, SINIRSIZ OLASILIĞA",
          "ONE IDEA, LIMITLESS POSSIBILITIES",
        )}
        title={t("Tüm Entegrasyonlarımız", "All Our Integrations")}
        accent={t("Hazır", "Ready")}
        description={t(
          "Minecraft, Folia, Purpur, FiveM, Discord ve web market sistemlerinizle uyumlu, birlikte çalışan bir ekosistem.",
          "An ecosystem that works together with Minecraft, Folia, Purpur, FiveM, Discord and your web store.",
        )}
      />
      <div className="integration-grid">
        {[
          [Blocks, "Minecraft"],
          [Bot, "Discord"],
          [Zap, "Folia"],
          [Code2, "Java"],
          [Globe, "React"],
          [Gamepad2, "FiveM"],
          [Box, "Purpur"],
          [Terminal, "Node.js"],
          [Layers, "Paper"],
          [Palette, "Figma"],
          [ShieldCheck, "Vault"],
          [Code2, "TypeScript"],
        ].map(([Icon, name], i) => (
          <Link
            to={"/services/" + serviceItems[i % 6][0]}
            className={"integration item-" + i}
            key={name}
          >
            <Icon size={32} />
            <span>{name}</span>
          </Link>
        ))}
      </div>
      <div className="integration-core">
        <img src="/favicon.svg" alt="" />
        <span>dfbng software</span>
      </div>
    </section>
  );
}
function Projects({ page = false }) {
  const { t } = useApp();
  return (
    <section
      className={page ? "container section projects-page" : "section projects"}
    >
      {!page && (
        <SectionTitle
          title={t("Hayata Geçirdiğimiz", "Projects We’ve")}
          accent={t("Projeler", "Brought to Life")}
          description={t(
            "Sunucular, haritalar, paneller. Yaptıklarımızdan birkaçı.",
            "Servers, maps, panels. A few of the things we build.",
          )}
        />
      )}
      <div className="project-strip">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Link to="/services/design" key={i}>
            <img
              src={"/assets/build" + i + ".png"}
              loading="lazy"
              alt={
                ["Survival", "Spawn", "Lobby", "Hub", "Arena", "City"][i - 1]
              }
            />
            <div>
              <span>
                {["Survival", "Spawn", "Lobby", "Hub", "Arena", "City"][i - 1]}
              </span>
              <ArrowUpRight size={18} />
            </div>
          </Link>
        ))}
      </div>
      {!page && (
        <div className="center-link">
          <Link to="/reference">
            {t("Tüm projeleri gör", "See all projects")}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
function OrderBanner() {
  const { t } = useApp();
  return (
    <section className="order-banner container">
      <div>
        <span className="eyebrow">
          <i className="status-dot" />
          {t("FİKRİNİ GERÇEĞE DÖNÜŞTÜR", "TURN YOUR IDEA INTO REALITY")}
        </span>
        <h2>
          {t("Katalogda yoksa,", "If it’s not in the catalog,")}
          <br />
          <span>{t("biz yaparız.", "we build it.")}</span>
        </h2>
        <p>
          {t(
            "Plugin, bot, panel veya harita. Sen fikrini anlat, gerisini birlikte şekillendirelim.",
            "Plugin, bot, panel or map. Share your idea and let’s build what comes next.",
          )}
        </p>
        <CTA to="/custom-order">
          {t("Özel sipariş oluştur", "Start a custom order")}
        </CTA>
      </div>
      <div className="order-visual">
        <div className="order-visual-head">
          <span>
            <span className="status-dot" />
            {t("Bir sonraki büyük fikir", "The next big idea")}
          </span>
          <span>↗</span>
        </div>
        {[
          ["Globe", "Web panel"],
          ["Bot", "Discord bot"],
          ["Blocks", "Map / spawn"],
        ].map(([icon, name], i) => {
          const Icon = icons[icon];
          return (
            <div className="request-card" key={name}>
              <span className={"request-icon req-" + i}>
                <Icon size={21} />
              </span>
              <div>
                <b>{name}</b>
                <small>dfbng software</small>
              </div>
              <span className="request-check">
                <Check size={15} />
              </span>
            </div>
          );
        })}
        <p>
          {t("Size özel. Baştan sona.", "Built for you. From start to finish.")}
        </p>
      </div>
    </section>
  );
}
function FAQ() {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq container" id="sss">
      <SectionTitle
        title={t("Sıkça Sorulan", "Frequently Asked")}
        accent={t("Sorular", "Questions")}
        description={t(
          "Aklınıza takılabilecek soruların cevapları.",
          "Answers to the questions you might have.",
        )}
      />
      <div className="faq-list">
        {faqs.map((f, i) => (
          <div
            key={i}
            className={open === i ? "faq-item expanded" : "faq-item"}
          >
            <button
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {f[lang === "tr" ? 0 : 1]}
              {open === i ? <Minus size={17} /> : <Plus size={17} />}
            </button>
            {open === i && <p>{f[lang === "tr" ? 2 : 3]}</p>}
          </div>
        ))}
      </div>
      <p className="faq-help">
        {t("Başka bir sorunuz mu var?", "Still have a question?")}{" "}
        <Link to="/contact">
          {t("Birlikte çözelim", "Let’s solve it together")}
          <ArrowUpRight size={14} />
        </Link>
      </p>
    </section>
  );
}
function Community() {
  const { t } = useApp();
  return (
    <section className="community container">
      <div className="community-art">
        <div className="chat-card">
          <div className="chat-brand">
            <Bot size={30} />
            <span>
              dfbng software
              <small>
                {t(
                  "Birlikte daha iyisini üretelim.",
                  "Let’s build better, together.",
                )}
              </small>
            </span>
            <i className="status-dot" />
          </div>
          <div className="chat-message">
            <span>d.</span>
            <div>
              <b>
                dfbng software <small>TEAM</small>
              </b>
              <p>
                {t(
                  "Bir fikrin mi var? Seni dinliyoruz. 👋",
                  "Got an idea? We’re listening. 👋",
                )}
              </p>
            </div>
          </div>
          <Link to="/contact">
            {t("Sohbeti başlat", "Start a conversation")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div>
        <span className="eyebrow">
          {t("İLETİŞİMDE KALALIM", "LET’S STAY CONNECTED")}
        </span>
        <h2>
          {t("Fikirler sende.", "You bring the ideas.")}
          <br />
          <span>{t("Çözümler bizde.", "We bring the solutions.")}</span>
        </h2>
        <p>
          {t(
            "Projenizi konuşmak, destek almak veya sadece merhaba demek için buradayız.",
            "We’re here to talk projects, help you out, or simply say hello.",
          )}
        </p>
        <CTA to="/contact">{t("Bize ulaşın", "Get in touch")}</CTA>
      </div>
    </section>
  );
}
function Footer() {
  const { t, settings } = useApp();
  const cols = [
    [
      t("Hızlı Bağlantılar", "Quick Links"),
      [
        ["/products", t("Mağaza", "Store")],
        ["/services", t("Hizmetler", "Services")],
        ["/reference", t("Referanslar", "References")],
        ["/docs", t("Dokümantasyon", "Documentation")],
        ["/blog", "Blog"],
        ["/forum", "Forum"],
      ],
    ],
    [
      t("Şirket", "Company"),
      [
        ["/about", t("Hakkımızda", "About us")],
        ["/career", t("Kariyer", "Careers")],
        ["/career/team", t("Takım", "Team")],
        ["/contact", t("İletişim", "Contact")],
      ],
    ],
    [
      t("Kaynaklar", "Resources"),
      [
        ["/api-docs", "API"],
        ["/admin", t("Yönetim Paneli", "Admin Panel")],
        ["/#sss", t("Sıkça Sorulan Sorular", "FAQ")],
        ["/terms", t("Kullanım Koşulları", "Terms of use")],
        ["/privacy", t("Gizlilik Politikası", "Privacy policy")],
      ],
    ],
  ];
  return (
    <footer className="container">
      {settings.email && (
        <a className="footer-email" href={"mailto:" + settings.email}>
          {settings.email}
        </a>
      )}
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/">
            <Brand />
          </Link>
          <p>
            {t(
              "Minecraft, FiveM, Discord ve web projeleri için plugin, script, bot ve özel yazılım geliştiren dijital ürün ekibi.",
              "A digital product team building plugins, scripts, bots and custom software for Minecraft, FiveM, Discord and the web.",
            )}
          </p>
          <Socials />
        </div>
        {cols.map(([title, links]) => (
          <div className="footer-col" key={title}>
            <h3>{title}</h3>
            {links.map(([to, text]) => (
              <Link to={to} key={to}>
                {text}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} dfbng software.{" "}
          {t("Tüm hakları saklıdır.", "All rights reserved.")}
        </span>
        <span>
          <i className="status-dot" />
          {t("Hayal et. Geliştir. Fark yarat.", "Imagine. Build. Stand out.")}
        </span>
        <span>
          {t("Geliştiren", "Crafted by")} <b>dfbng software</b>
        </span>
      </div>
    </footer>
  );
}
function Home() {
  const { t, products } = useApp();
  return (
    <>
      <Hero />
      <Partners />
      <ServicesPreview />
      <section className="section container">
        <SectionTitle
          eyebrow={t(
            "SUNUCUN İÇİN BİR SONRAKİ ADIM",
            "THE NEXT STEP FOR YOUR SERVER",
          )}
          title={t("Popüler", "Popular")}
          accent={t("Ürünler", "Products")}
          description={t(
            "Sunucuna değer katacak paketler. Keşfet, seç, fark yarat.",
            "Packages that bring your server to life. Explore, choose, stand out.",
          )}
        />
        <div className="popular-grid">
          {products.slice(0, 2).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <Integrations />
      <section className="section container">
        <SectionTitle
          title={t("Tüm", "All Our")}
          accent={t("Ürünlerimiz", "Products")}
          description={t(
            "Projelerinizin ihtiyaç duyduğu profesyonel paketler ve yazılımlar.",
            "Every professional package and piece of software your projects need.",
          )}
        />
        <ProductGrid compact />
      </section>
      <Projects />
      <OrderBanner />
      <FAQ />
      <Community />
    </>
  );
}
function PageHero({ label, title, description }) {
  const { t } = useApp();
  return (
    <div className="page-hero container">
      <Link to="/" className="breadcrumb">
        <ArrowLeft size={14} />
        {t("Ana Sayfa", "Home")}
        <span>/</span>
        {label || title}
      </Link>
      <span className="eyebrow">DFBNG SOFTWARE</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function Store() {
  const { t, path } = useApp();
  const segment = path.split("/")[2];
  const initial = segment?.includes("minecraft")
    ? "Minecraft"
    : segment === "fivem-script"
      ? "FiveM"
      : segment === "discord-bot"
        ? "Discord"
        : segment === "website" || segment === "design"
          ? "Web"
          : "All";
  return (
    <>
      <PageHero
        title={t(
          "Bir sonraki projeniz burada başlıyor.",
          "Your next project starts here.",
        )}
        label={t("Mağaza", "Store")}
        description={t(
          "Sunucunuza özel bir dokunuş. Profesyonel yazılımlar, eklentiler ve tasarımlar.",
          "A special touch for your server. Professional software, plugins and designs.",
        )}
      />
      <section className="container page-section">
        <ProductGrid initial={initial} />
      </section>
      <OrderBanner />
    </>
  );
}
function ProductDetail() {
  const { t, path, lang, products, catalogLoading } = useApp();
  const p = products.find((p) => "/product/" + p.id === path);
  if (catalogLoading)
    return (
      <div className="commerce-loading">{t("Yükleniyor…", "Loading…")}</div>
    );
  if (!p) return <NotFound />;
  return (
    <>
      <PageHero
        label={t("Ürün Detayı", "Product Details")}
        title={p.title[lang === "tr" ? 0 : 1]}
        description={p.description[lang === "tr" ? 0 : 1]}
      />
      <section className="container product-detail">
        <div>
          <div className="detail-image">
            <img
              src={"/assets/" + p.image}
              alt={p.title[lang === "tr" ? 0 : 1]}
            />
            {p.id === "dfbng-stone" && (
              <div className="stone-art">
                <Box size={60} />
                <strong>
                  dfbng<span>STONE</span>
                </strong>
                <small>MINECRAFT PLUGIN</small>
              </div>
            )}
          </div>
          <h2>{t("Projeniz için tasarlandı.", "Made for your project.")}</h2>
          <p>{p.description[lang === "tr" ? 0 : 1]}</p>
          <div className="feature-list">
            {[
              t(
                "Kolay kurulum ve yapılandırma",
                "Easy setup and configuration",
              ),
              t(
                "Performans odaklı geliştirme",
                "Built with performance in mind",
              ),
              t(
                "İhtiyacınıza uygun kişiselleştirme",
                "Customization for your needs",
              ),
            ].map((x) => (
              <span key={x}>
                <Check size={17} />
                {x}
              </span>
            ))}
          </div>
        </div>
        <aside className="detail-aside">
          <span className="eyebrow">{p.category}</span>
          <h2>{p.title[lang === "tr" ? 0 : 1]}</h2>
          <div className="detail-price">
            {p.oldPrice && <del>₺{p.oldPrice.toLocaleString("tr-TR")}</del>}
            <strong>{p.price ? "₺" + p.price : t("Ücretsiz", "Free")}</strong>
          </div>
          <span className="muted">
            {t("Ömür boyu lisans", "Lifetime license")}
          </span>
          <div className="tags">
            {p.tags.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <CTA to={"/checkout/" + p.id}>
            {p.price
              ? t("IBAN ile satın al", "Buy by bank transfer")
              : t("Ücretsiz edin", "Get for free")}
          </CTA>
          <p className="small-note">
            {t(
              "Havale / EFT ile ödeme yapabilirsiniz. Ödeme bildiriminiz yönetici tarafından kontrol edilerek onaylanır.",
              "Pay by bank transfer. Your payment report is checked and approved by the administrator.",
            )}
          </p>
          <Link to="/docs">
            <BookOpen size={16} />
            {t("Kurulum rehberleri", "Setup guides")}
            <ArrowUpRight size={15} />
          </Link>
        </aside>
      </section>
    </>
  );
}
function Services() {
  const { t, lang, path } = useApp();
  const service = serviceItems.find((s) => path === "/services/" + s[0]);
  return (
    <>
      <PageHero
        title={
          service
            ? service[lang === "tr" ? 1 : 2]
            : t(
                "İyi fikirler. Kusursuz çözümler.",
                "Great ideas. Flawless solutions.",
              )
        }
        label={t("Hizmetler", "Services")}
        description={
          service
            ? service[lang === "tr" ? 3 : 4]
            : t(
                "Tek bir ekip, sınırsız olasılık. Projenizin her aşamasında yanınızdayız.",
                "One team, limitless possibilities. By your side at every stage of your project.",
              )
        }
      />
      <section className="container page-section">
        {service ? (
          <div className="service-detail">
            <div className="service-art">
              {React.createElement(icons[service[5]], {
                size: 100,
                strokeWidth: 1,
              })}
              <span>dfbng software</span>
            </div>
            <div>
              <span className="eyebrow">
                {t("SİZE ÖZEL GELİŞTİRİYORUZ", "BUILT JUST FOR YOU")}
              </span>
              <h2>
                {t("Standartların ötesine geçin.", "Go beyond the ordinary.")}
              </h2>
              <p>{service[lang === "tr" ? 3 : 4]}</p>
              <div className="feature-list">
                {[
                  t(
                    "İhtiyaç analizi ve proje planlaması",
                    "Requirements analysis and project planning",
                  ),
                  t(
                    "Konseptinize uygun özgün geliştirme",
                    "Custom development around your concept",
                  ),
                  t(
                    "Test, kurulum ve teknik rehberlik",
                    "Testing, setup and technical guidance",
                  ),
                ].map((x) => (
                  <span key={x}>
                    <CheckCircle2 size={18} />
                    {x}
                  </span>
                ))}
              </div>
              <CTA to="/custom-order">
                {t("Projenizi konuşalım", "Let’s talk about your project")}
              </CTA>
            </div>
          </div>
        ) : (
          <div className="services-grid">
            {serviceItems.map((s) => {
              const Icon = icons[s[5]];
              return (
                <Link
                  to={"/services/" + s[0]}
                  className="service-tile"
                  key={s[0]}
                >
                  <Icon size={30} />
                  <h2>{s[lang === "tr" ? 1 : 2]}</h2>
                  <p>{s[lang === "tr" ? 3 : 4]}</p>
                  <span>
                    {t("Hizmeti keşfet", "Explore service")}
                    <ArrowUpRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <OrderBanner />
    </>
  );
}
const errorText = (error, t) =>
  ({
    invalid_input: t(
      "Bilgileri kontrol edin. Tüm zorunlu alanları doldurun.",
      "Check your details and fill in all required fields.",
    ),
    invalid_credentials: t(
      "E-posta veya şifre hatalı.",
      "Incorrect email or password.",
    ),
    email_exists: t(
      "Bu e-posta adresi zaten kayıtlı.",
      "This email is already registered.",
    ),
    rate_limited: t(
      "Çok fazla deneme. Lütfen daha sonra tekrar deneyin.",
      "Too many attempts. Please try again later.",
    ),
    unauthorized: t(
      "Lütfen hesabınıza giriş yapın.",
      "Please sign in to your account.",
    ),
    origin_rejected: t(
      "İstek doğrulanamadı. Sayfayı yenileyin.",
      "Could not verify the request. Refresh the page.",
    ),
  })[error] ||
  t(
    "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
    "Could not complete the request. Please try again.",
  );
function RequestForm({ contact = false, career = false }) {
  const { t, user, products } = useApp();
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const chosen = products.find(
    (p) => p.id === new URLSearchParams(location.search).get("product"),
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const result = await api("/requests", {
        ...data,
        type: career ? "career" : contact ? "contact" : "order",
      });
      setResult(result);
    } catch (e) {
      setError(errorText(e.message, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHero
        title={
          career
            ? t(
                "Birlikte daha iyisini üretelim.",
                "Let’s build better, together.",
              )
            : contact
              ? t("Bir merhaba ile başlayalım.", "Let’s start with a hello.")
              : t(
                  "Aklındaki projeyi hayata geçirelim.",
                  "Let’s bring your idea to life.",
                )
        }
        label={
          career
            ? t("Kariyer", "Careers")
            : contact
              ? t("İletişim", "Contact")
              : t("Özel Sipariş", "Custom Order")
        }
        description={t(
          "İhtiyaçlarınızı paylaşın. Projenizin bir sonraki adımını birlikte planlayalım.",
          "Share your needs. Let’s plan the next step for your project together.",
        )}
      />
      <section className="container form-layout">
        <aside>
          <div className="contact-icon">
            {career ? <Briefcase /> : contact ? <MessagesSquare /> : <Code2 />}
          </div>
          <h2>
            {t("Her büyük proje,", "Every great project starts")}
            <br />
            {t("bir fikirle başlar.", "with an idea.")}
          </h2>
          <p>
            {t(
              "Ne kadar ayrıntı paylaşırsanız, ihtiyacınıza o kadar uygun bir çözüm hazırlayabiliriz.",
              "The more details you share, the better we can tailor a solution to your needs.",
            )}
          </p>
          <div className="process">
            {[
              t("Fikrinizi paylaşın", "Share your idea"),
              t("Kapsamı birlikte belirleyelim", "Define the scope together"),
              t("Üretmeye başlayalım", "Start building"),
            ].map((x, i) => (
              <div key={x}>
                <span>0{i + 1}</span>
                {x}
              </div>
            ))}
          </div>
          <small>
            {t(
              "Talebiniz kaydedilir. Giriş yaptıysanız yanıtları hesabınızdaki talepler bölümünden takip edebilirsiniz.",
              "Your request is saved. If signed in, track replies in your account requests section.",
            )}
          </small>
        </aside>
        {result ? (
          <div className="form-panel success" role="status">
            <CheckCircle2 size={52} />
            <h2>
              {t("Talebiniz kaydedildi.", "Your request has been saved.")}
            </h2>
            <p>
              {t("Talep numaranız", "Your request number")}:{" "}
              <b>{result.reference}</b>
            </p>
            <p>
              {t(
                "İlettiğiniz bilgileri aldık. Takip için talep numaranızı saklayın.",
                "Your details have been saved. Keep your request number for reference.",
              )}
            </p>
            <CTA to={user ? "/account" : "/"}>
              {user
                ? t("Panelime git", "Go to my dashboard")
                : t("Ana sayfaya dön", "Back to home")}
            </CTA>
            <button className="text-button" onClick={() => setResult(null)}>
              {t("Yeni talep oluştur", "Create another request")}
            </button>
          </div>
        ) : (
          <form className="form-panel" onSubmit={submit}>
            <h2>
              {career
                ? t("Başvuru formu", "Application form")
                : contact
                  ? t("Size nasıl yardımcı olabiliriz?", "How can we help?")
                  : t("Projenizden bahsedin", "Tell us about your project")}
            </h2>
            <div className="form-row">
              <label>
                {t("Adınız", "Your name")}
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  defaultValue={user?.name || ""}
                  required
                  placeholder={t("Ad Soyad", "Full name")}
                />
              </label>
              <label>
                {t("E-posta adresiniz", "Email address")}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  defaultValue={user?.email || ""}
                  required
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label>
              {career
                ? t("İlgilendiğiniz alan", "Your area of interest")
                : t("Hizmet / Konu", "Service / Topic")}
              <select
                name="category"
                defaultValue={chosen?.category || ""}
                required
              >
                <option value="" disabled>
                  {t("Bir alan seçin", "Select a category")}
                </option>
                {[
                  "Minecraft",
                  "FiveM",
                  "Discord",
                  "Web",
                  t("Tasarım", "Design"),
                  t("Teknik Destek", "Technical Support"),
                  t("Diğer", "Other"),
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {!contact && !career && (
              <label>
                {t("Tahmini bütçe", "Estimated budget")}
                <select name="budget">
                  <option>{t("Birlikte belirleyelim", "Let’s discuss")}</option>
                  <option>₺1.000 – ₺5.000</option>
                  <option>₺5.000 – ₺15.000</option>
                  <option>₺15.000+</option>
                </select>
              </label>
            )}
            <label>
              {t("Başlık", "Subject")}
              <input
                name="subject"
                required
                maxLength={150}
                defaultValue={chosen ? t(...chosen.title) : ""}
                placeholder={t(
                  "Kısaca neye ihtiyacınız var?",
                  "Briefly, what do you need?",
                )}
              />
            </label>
            <label>
              {t("Detaylar", "Details")}
              <textarea
                name="message"
                required
                minLength={20}
                maxLength={5000}
                rows={5}
                placeholder={
                  career
                    ? t(
                        "Deneyiminiz, portföyünüz ve katkıda bulunmak istediğiniz alan…",
                        "Your experience, portfolio and how you would like to contribute…",
                      )
                    : t(
                        "Projenizi ve ihtiyaç duyduğunuz özellikleri anlatın… (en az 20 karakter)",
                        "Describe your project and the features you need… (at least 20 characters)",
                      )
                }
              />
            </label>
            <label className="checkbox">
              <input type="checkbox" required />
              <span>
                <Link to="/privacy">
                  {t("Gizlilik politikasını", "Privacy policy")}
                </Link>{" "}
                {t(
                  "okudum, bilgilerimin bu talep için kaydedilmesini kabul ediyorum.",
                  "has been read and I agree to my details being stored for this request.",
                )}
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="submit-button" disabled={busy}>
              {busy
                ? t("Kaydediliyor…", "Saving…")
                : t("Talebi gönder", "Submit request")}
              <Send size={17} />
            </button>
          </form>
        )}
      </section>
    </>
  );
}
function Auth() {
  const { t, setUser, navigate, path } = useApp();
  const register = path === "/register";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api(
        register ? "/register" : "/login",
        Object.fromEntries(new FormData(e.target)),
      );
      setUser(data.user);
      const next = new URLSearchParams(location.search).get("next");
      navigate(next?.startsWith("/checkout/") ? next : "/account");
    } catch (e) {
      setError(errorText(e.message, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-page container">
      <Link to="/" className="breadcrumb">
        <ArrowLeft size={14} />
        {t("Ana Sayfa", "Home")}
      </Link>
      <div className="auth-card">
        <span className="auth-icon">
          <User size={27} />
        </span>
        <h1>
          {register
            ? t("Aramıza katılın.", "Join us.")
            : t("Tekrar hoş geldiniz.", "Welcome back.")}
        </h1>
        <p>
          {t(
            "Projelerinizin yeni evi: dfbng software.",
            "The new home for your projects: dfbng software.",
          )}
        </p>
        <form onSubmit={submit} key={path}>
          {register && (
            <label>
              {t("Adınız", "Your name")}
              <input name="name" required autoComplete="name" maxLength={100} />
            </label>
          )}
          <label>
            {t("E-posta", "Email")}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
            />
          </label>
          <label>
            {t("Şifre", "Password")}
            <input
              name="password"
              type="password"
              minLength={register ? 10 : 1}
              maxLength={128}
              required
              autoComplete={register ? "new-password" : "current-password"}
            />
            {register && (
              <small>
                {t(
                  "En az 10 karakter kullanın.",
                  "Use at least 10 characters.",
                )}
              </small>
            )}
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="submit-button" disabled={busy}>
            {busy
              ? t("Lütfen bekleyin…", "Please wait…")
              : register
                ? t("Hesap oluştur", "Create account")
                : t("Giriş yap", "Sign in")}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-switch">
          {register
            ? t("Zaten hesabınız var mı?", "Already have an account?")
            : t("Henüz hesabınız yok mu?", "Don’t have an account?")}{" "}
          <Link to={(register ? "/login" : "/register") + location.search}>
            {register ? t("Giriş yap", "Sign in") : t("Kayıt ol", "Sign up")}
          </Link>
        </div>
      </div>
    </section>
  );
}
function Account() {
  const { t, user, setUser, navigate } = useApp();
  const [requests, setRequests] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (user)
      api("/requests")
        .then((d) => setRequests(d.requests))
        .catch((e) => setError(errorText(e.message, t)));
  }, [user]);
  if (!user) return <Auth />;
  return (
    <>
      <PageHero
        label={t("Panelim", "My dashboard")}
        title={t("Merhaba, ", "Hello, ") + user.name + "."}
        description={t(
          "Projeleriniz ve talepleriniz bir arada.",
          "All your projects and requests in one place.",
        )}
      />
      <section className="container page-section">
        <OrdersList />
        {user.role === "admin" && (
          <CTA to="/admin">{t("Yönetim paneli", "Admin panel")}</CTA>
        )}
        <div className="account-toolbar">
          <h2>{t("Taleplerim", "My requests")}</h2>
          <button
            className="outline-button"
            onClick={async () => {
              try {
                await api("/logout", {});
                setUser(null);
                navigate("/");
              } catch (e) {
                setError(errorText(e.message, t));
              }
            }}
          >
            <LogOut size={16} />
            {t("Çıkış yap", "Sign out")}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
        {requests?.length ? (
          requests.map((r) => (
            <div className="account-request" key={r.reference}>
              <span>
                <b>{r.subject}</b>
                <small>
                  {r.reference} · {r.category}
                </small>
              </span>
              <span className="request-status">
                {{
                  new: t("Alındı", "Received"),
                  in_progress: t("İşlemde", "In progress"),
                  completed: t("Tamamlandı", "Completed"),
                  closed: t("Kapandı", "Closed"),
                }[r.status] || t("Alındı", "Received")}
              </span>
              {r.reply && <p className="request-reply">{r.reply}</p>}
              <time>
                {new Date(r.created_at).toLocaleDateString(t("tr-TR", "en-GB"))}
              </time>
            </div>
          ))
        ) : (
          <div className="empty">
            <ShoppingBag size={36} />
            <h3>
              {requests
                ? t(
                    "Henüz bir talebiniz yok.",
                    "You don’t have any requests yet.",
                  )
                : t("Yükleniyor…", "Loading…")}
            </h3>
            <CTA to="/custom-order">
              {t("Yeni proje başlat", "Start a new project")}
            </CTA>
          </div>
        )}
      </section>
    </>
  );
}
function Documentation() {
  const { t, lang } = useApp();
  const [active, setActive] = useState("start"),
    [search, setSearch] = useState("");
  const current = docs.find((d) => d[0] === active) || docs[0];
  const filtered = docs.filter((d) =>
    d
      .join(" ")
      .toLocaleLowerCase("tr")
      .includes(search.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <PageHero
        title={t("Birlikte, adım adım.", "Together, step by step.")}
        label={t("Dokümantasyon", "Documentation")}
        description={t(
          "Kurulumdan yapılandırmaya, ihtiyaç duyduğunuz tüm rehberler.",
          "All the guides you need, from installation to configuration.",
        )}
      />
      <div className="container docs-layout">
        <aside>
          <label className="search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("Rehber ara", "Search guides")}
              placeholder={t("Rehber ara…", "Search guides…")}
            />
          </label>
          {filtered.map((d) => (
            <button
              key={d[0]}
              className={active === d[0] ? "active" : ""}
              onClick={() => setActive(d[0])}
            >
              <BookOpen size={16} />
              {d[lang === "tr" ? 1 : 2]}
              <ArrowRight size={14} />
            </button>
          ))}
          {!filtered.length && (
            <p>{t("Rehber bulunamadı.", "No guides found.")}</p>
          )}
        </aside>
        <article>
          <span className="eyebrow">{t("REHBER", "GUIDE")}</span>
          <h2>{current[lang === "tr" ? 3 : 4]}</h2>
          {current[lang === "tr" ? 5 : 6].split(". ").map((p, i) => (
            <div className="guide-step" key={i}>
              <span>{i + 1}</span>
              <p>{p.endsWith(".") ? p : p + "."}</p>
            </div>
          ))}
          <div className="doc-callout">
            <LifeBuoy size={22} />
            <div>
              <b>{t("Bir yerde takıldınız mı?", "Need a hand?")}</b>
              <p>
                {t(
                  "Projenizin detaylarıyla bize ulaşın.",
                  "Get in touch with your project details.",
                )}
              </p>
            </div>
            <Link to="/contact" aria-label={t("İletişime geç", "Contact us")}>
              <ArrowRight size={18} />
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
function About({ team = false }) {
  const { t } = useApp();
  return (
    <>
      <PageHero
        title={
          team
            ? t("Fikirlerin arkasındaki ekip.", "The team behind the ideas.")
            : t(
                "Dijital dünyanıza değer katıyoruz.",
                "We add value to your digital world.",
              )
        }
        label={team ? t("Takım", "Team") : t("Hakkımızda", "About us")}
        description={t(
          "dfbng software: Oyun dünyasını kodla, yaratıcılıkla ve tutkuyla buluşturuyoruz.",
          "dfbng software: Bringing the gaming world together with code, creativity and passion.",
        )}
      />
      <section className="container about-section">
        <div className="about-art">
          <Code2 size={110} strokeWidth={1} />
          <Brand />
          <span>IDEA. CODE. CREATE.</span>
        </div>
        <div>
          <span className="eyebrow">{t("BİZ KİMİZ?", "WHO ARE WE?")}</span>
          <h2>
            {t("Sizin dünyanız. Bizim tutkumuz.", "Your world. Our passion.")}
          </h2>
          <p>
            {t(
              "dfbng software olarak Minecraft sunucularından FiveM topluluklarına, Discord botlarından web uygulamalarına kadar farklı alanlarda dijital çözümler üretiyoruz.",
              "At dfbng software, we build digital solutions for everything from Minecraft servers and FiveM communities to Discord bots and web applications.",
            )}
          </p>
          <p>
            {t(
              "İyi yazılımın detaylarda gizli olduğuna inanıyoruz. Her projeye kendine özgü bir bakış açısıyla yaklaşıyor; performansı, sadeliği ve kullanıcı deneyimini ön planda tutuyoruz.",
              "We believe great software lives in the details. We approach each project with a fresh perspective, prioritizing performance, simplicity and user experience.",
            )}
          </p>
          <CTA to="/contact">{t("Tanışalım", "Let’s meet")}</CTA>
        </div>
      </section>
      <section className="container values-grid">
        {[
          [
            Code2,
            t("Geliştirme", "Development"),
            t("Temiz kod, güçlü altyapı.", "Clean code, solid foundations."),
          ],
          [
            Palette,
            t("Tasarım", "Design"),
            t("Akılda kalan deneyimler.", "Experiences worth remembering."),
          ],
          [
            LifeBuoy,
            t("Destek", "Support"),
            t("Her adımda birlikte.", "Together at every step."),
          ],
        ].map(([Icon, title, desc]) => (
          <div key={title}>
            <Icon />
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </section>
      {team && <OrderBanner />}
    </>
  );
}
function OS() {
  const { t } = useApp();
  const [app, setApp] = useState("welcome");
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <PageHero
        title="dfbngOS"
        description={t(
          "dfbng software dünyasını farklı bir açıdan keşfedin.",
          "Explore the world of dfbng software from a new perspective.",
        )}
      />
      <section className="container os-desktop">
        <div className="os-top">
          <b>dfbngOS</b>
          <span>
            {clock.toLocaleTimeString(t("tr-TR", "en-GB"), {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="os-window">
          <div className="window-title">
            <span>
              <i />
              <i />
              <i />
            </span>
            dfbng software —{" "}
            {app === "terminal" ? "Terminal" : t("Hoş geldiniz", "Welcome")}
          </div>
          {app === "terminal" ? (
            <div className="terminal-content">
              <p>
                <span>dfbng@software</span> ~ % hello
              </p>
              <p>
                {t(
                  "Bir sonraki büyük fikrine hoş geldin.",
                  "Welcome to your next big idea.",
                )}
              </p>
              <p>✓ Minecraft · FiveM · Discord · Web</p>
              <p>
                <span>dfbng@software</span> ~ % <b className="cursor">_</b>
              </p>
            </div>
          ) : (
            <div className="os-welcome">
              <Code2 size={40} />
              <h2>{t("Merhaba, dünya.", "Hello, world.")}</h2>
              <p>
                {t(
                  "Hayal ettiğiniz dünyayı birlikte geliştirelim.",
                  "Let’s build the world you imagine, together.",
                )}
              </p>
              <CTA to="/products">
                {t("Keşfetmeye başla", "Start exploring")}
              </CTA>
            </div>
          )}
        </div>
        <div className="os-dock">
          {[
            [Globe, "welcome", t("Masaüstü", "Desktop")],
            [Terminal, "terminal", "Terminal"],
          ].map(([Icon, id, label]) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              onClick={() => setApp(id)}
              className={app === id ? "active" : ""}
            >
              <Icon />
            </button>
          ))}
          <Link to="/products" title={t("Mağaza", "Store")}>
            <ShoppingBag />
          </Link>
          <Link to="/contact" title={t("İletişim", "Contact")}>
            <MessagesSquare />
          </Link>
        </div>
      </section>
    </>
  );
}
function Editorial() {
  const { t, path } = useApp();
  const forum = path === "/forum";
  return (
    <>
      <PageHero
        title={
          forum
            ? t("Birlikte öğrenelim.", "Let’s learn together.")
            : t("dfbng software’dan notlar.", "Notes from dfbng software.")
        }
        label={forum ? "Forum" : "Blog"}
        description={
          forum
            ? t(
                "Sorular, fikirler ve deneyimler için bir buluşma noktası.",
                "A meeting point for questions, ideas and experiences.",
              )
            : t(
                "Yazılım, topluluklar ve geliştirme üzerine.",
                "On software, communities and development.",
              )
        }
      />
      <section className="container page-section">
        {forum ? (
          <div className="services-grid">
            {["Minecraft", "FiveM", "Discord"].map((name, i) => (
              <Link key={name} to="/contact" className="service-tile">
                <MessagesSquare />
                <h2>{name}</h2>
                <p>
                  {t(
                    "Sorunuzu destek ekibiyle paylaşın, birlikte çözüm bulalım.",
                    "Share your question with our support team and let’s find a solution.",
                  )}
                </p>
                <span>
                  {t("Soru gönder", "Submit a question")}
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="services-grid">
            {docs.slice(1, 4).map((d, i) => (
              <Link key={d[0]} to="/docs" className="blog-card">
                <img
                  src={"/assets/" + ["minecraft", "discord", "gta"][i] + ".jpg"}
                  alt=""
                />
                <div>
                  <span className="eyebrow">
                    {t("REHBER", "GUIDE")} · 5 MIN
                  </span>
                  <h2>{d[t("tr", "en") === "tr" ? 3 : 4]}</h2>
                  <p>{d[t("tr", "en") === "tr" ? 5 : 6]}</p>
                  <span>
                    {t("Devamını oku", "Read more")}
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
function Legal() {
  const { t, path } = useApp();
  const privacy = path === "/privacy";
  return (
    <>
      <PageHero
        title={
          privacy
            ? t("Gizlilik Politikası", "Privacy Policy")
            : t("Kullanım Koşulları", "Terms of Use")
        }
        description="dfbng software"
      />
      <article className="container legal">
        <h2>{t("Verileriniz ve kullanım", "Your data and usage")}</h2>
        <p>
          {t(
            "Bu site, dfbng software hizmetlerini tanıtır ve proje taleplerini kaydeder. Hesap oluşturduğunuzda adınız, e-posta adresiniz ve güvenli biçimde özetlenmiş şifreniz saklanır.",
            "This site presents dfbng software services and records project requests. Creating an account stores your name, email address and securely hashed password.",
          )}
        </p>
        <h2>{t("Talep bilgileri", "Request information")}</h2>
        <p>
          {t(
            "Formlara girdiğiniz iletişim bilgileri ve proje ayrıntıları, talebinizi yönetmek amacıyla bu uygulamanın veritabanında saklanır. Hassas kişisel verilerinizi veya erişim şifrelerinizi formda paylaşmayın.",
            "Contact information and project details entered in forms are stored in this application’s database to manage your request. Do not submit sensitive personal data or access credentials.",
          )}
        </p>
        <h2>{t("Çerezler ve yerel depolama", "Cookies and local storage")}</h2>
        <p>
          {t(
            "Dil tercihiniz ve çerez bildirimi seçiminiz tarayıcınızda saklanır. Oturum açtığınızda girişinizi korumak için zorunlu oturum çerezi kullanılır. Reklam veya takip çerezi kullanılmaz.",
            "Language and cookie-notice preferences are stored in your browser. A necessary session cookie keeps you signed in. No advertising or tracking cookies are used.",
          )}
        </p>
        <h2>{t("Ürünler ve ödemeler", "Products and payments")}</h2>
        <p>
          {t(
            "Ürün bedeli, siparişte gösterilen IBAN’a havale / EFT ile ödenir. Ödeme bildirimi tek başına ödeme onayı değildir; yönetici banka kaydını kontrol eder. Onaylanan siparişe ait dosya yüklendiyse hesabınızdan indirebilirsiniz. Özel proje kapsamı ve teslim koşulları ayrıca kararlaştırılır.",
            "Pay the order total by bank transfer to the IBAN shown on your order. A payment report is not confirmation; the administrator checks the bank record. After approval, download the product from your account if its file has been uploaded. Custom project scope and delivery are agreed separately.",
          )}
        </p>
        <h2>
          {t("İletişim ve silme talepleri", "Contact and deletion requests")}
        </h2>
        <p>
          {t(
            "Bilgilerinizin düzeltilmesi veya silinmesi için iletişim formundan talep oluşturabilirsiniz.",
            "Use the contact form to request correction or deletion of your information.",
          )}
        </p>
        <CTA to="/contact">{t("İletişime geç", "Contact us")}</CTA>
      </article>
    </>
  );
}
function ApiDocs() {
  const { t } = useApp();
  return (
    <>
      <PageHero
        title="API"
        description={t(
          "dfbng software ürün kataloğu için geliştirici referansı.",
          "Developer reference for the dfbng software product catalog.",
        )}
      />
      <article className="container legal">
        <span className="api-method">GET</span>
        <code> /api/products</code>
        <h2>{t("Ürünleri listele", "List products")}</h2>
        <p>
          {t(
            "Kimlik doğrulama gerektirmeyen, herkese açık ürün kataloğu.",
            "The public product catalog. No authentication required.",
          )}
        </p>
        <pre className="api-example">
          {
            'fetch("/api/products")\n  .then(response => response.json())\n  .then(data => console.log(data.products));'
          }
        </pre>
        <h2>{t("Yanıt", "Response")}</h2>
        <pre className="api-example">
          {
            '{\n  "products": [\n    { "id": "dfbng-stone", "price": 500, "category": "Minecraft" }\n  ]\n}'
          }
        </pre>
      </article>
    </>
  );
}
function NotFound() {
  const { t } = useApp();
  return (
    <div className="not-found">
      <span>404</span>
      <h1>
        {t("Bu sayfa henüz yazılmadı.", "This page hasn’t been written yet.")}
      </h1>
      <CTA to="/">{t("Ana sayfaya dön", "Back to home")}</CTA>
    </div>
  );
}
function App() {
  const [products, setProducts] = useState([]),
    [settings, setSettings] = useState({}),
    [catalogLoading, setCatalogLoading] = useState(true);
  const refreshCatalog = async () => {
    const [catalog, config] = await Promise.all([
      api("/products"),
      api("/settings"),
    ]);
    setProducts(catalog.products);
    setSettings(config.settings);
    setCatalogLoading(false);
  };
  useEffect(() => {
    refreshCatalog().catch(() => setCatalogLoading(false));
  }, []);
  const [lang, setLanguage] = useState(() =>
    safeGet("dfbng-language", "tr") === "en" ? "en" : "tr",
  );
  const [path, setPath] = useState(location.pathname.replace(/\/$/, "") || "/");
  const [user, setUser] = useState(null),
    [cookie, setCookie] = useState(() => !safeGet("dfbng-cookie"));
  const t = (tr, en) => (lang === "tr" ? tr : en);
  const setLang = (l) => {
    setLanguage(l);
    safeSet("dfbng-language", l);
  };
  function navigate(to) {
    history.pushState({}, "", to);
    setPath(location.pathname.replace(/\/$/, "") || "/");
    if (location.hash)
      setTimeout(
        () =>
          document
            .getElementById(location.hash.slice(1))
            ?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    else window.scrollTo(0, 0);
  }
  useEffect(() => {
    const pop = () => {
      setPath(location.pathname.replace(/\/$/, "") || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", pop);
    api("/session")
      .then((d) => setUser(d.user))
      .catch(() => {});
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      "dfbng software — " +
      t("Profesyonel Yazılım Çözümleri", "Premium Software Solutions");
  }, [lang]);
  let page = path.startsWith("/admin") ? (
    <Admin />
  ) : path.startsWith("/checkout/") ? (
    <Checkout />
  ) : path.startsWith("/orders/") ? (
    <OrderPage key={path} />
  ) : path === "/" ? (
    <Home />
  ) : path.startsWith("/products") ? (
    <Store />
  ) : path.startsWith("/product/") ? (
    <ProductDetail />
  ) : path.startsWith("/services") ? (
    <Services />
  ) : path === "/custom-order" ? (
    <RequestForm key="order" />
  ) : path === "/contact" ? (
    <RequestForm contact key="contact" />
  ) : path === "/career" ? (
    <RequestForm career key="career" />
  ) : path === "/login" || path === "/register" ? (
    <Auth />
  ) : path === "/account" ? (
    <Account />
  ) : path === "/docs" ? (
    <Documentation />
  ) : path === "/about" || path === "/company" ? (
    <About />
  ) : path === "/career/team" ? (
    <About team />
  ) : path === "/reference" ? (
    <>
      <PageHero
        title={t("Hayata geçen fikirler.", "Ideas brought to life.")}
        label={t("Referanslar", "References")}
        description={t(
          "Minecraft mimarisi ve dijital tasarım seçkisi.",
          "A selection of Minecraft architecture and digital design.",
        )}
      />
      <Projects page />
    </>
  ) : path === "/dfbng-os" ? (
    <OS />
  ) : path === "/blog" || path === "/forum" ? (
    <Editorial />
  ) : path === "/terms" || path === "/privacy" ? (
    <Legal />
  ) : path === "/api-docs" ? (
    <ApiDocs />
  ) : (
    <NotFound />
  );
  return (
    <Context.Provider
      value={{
        lang,
        setLang,
        t,
        path,
        navigate,
        user,
        setUser,
        products,
        settings,
        refreshCatalog,
        catalogLoading,
      }}
    >
      <a className="skip-link" href="#main">
        {t("İçeriğe geç", "Skip to content")}
      </a>
      {!path.startsWith("/admin") && <Header />}
      <main id="main">{page}</main>
      {!path.startsWith("/admin") && <Footer />}
      {cookie && !path.startsWith("/admin") && (
        <aside
          className="cookie-notice"
          aria-label={t("Çerez bildirimi", "Cookie notice")}
        >
          <p>
            {t(
              "Size daha iyi bir deneyim sunmak için dil tercihinizi saklıyoruz. Yalnızca gerekli çerezleri kullanıyoruz.",
              "We save your language preference for a better experience. We only use necessary cookies.",
            )}
          </p>
          <div>
            <Link to="/privacy">{t("Detaylı Bilgi", "Learn More")}</Link>
            <button
              onClick={() => {
                safeSet("dfbng-cookie", "accepted");
                setCookie(false);
              }}
            >
              {t("Anladım", "Got it")}
              <Check size={14} />
            </button>
          </div>
        </aside>
      )}
    </Context.Provider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
