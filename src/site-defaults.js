import { assetDefaults } from "./asset-defaults.js";
import { serviceItems, faqs, docs } from "./content.js";
export const pair = (tr = "", en = tr) => ({ tr, en });
const link = (tr, en, url) => ({ title: pair(tr, en), url });
export const blockTemplate = {
  type: "text",
  title: pair(),
  body: pair(),
  image: "",
  url: "",
  button: pair(),
  visible: true,
};
export const templates = {
  navigation: {
    ...link("Yeni bağlantı", "New link", "/contact"),
    children: [],
    visible: true,
  },
  footer: { title: pair("Yeni sütun", "New column"), links: [] },
  socials: link("Yeni bağlantı", "New link", "/contact"),
  services: {
    id: "yeni-hizmet",
    title: pair(),
    description: pair(),
    icon: "Globe",
  },
  faqs: { question: pair(), answer: pair() },
  docs: { id: "yeni-rehber", title: pair(), heading: pair(), body: pair() },
  projects: { title: pair(), image: "", url: "/contact" },
  partners: link("Yeni ortak", "New partner", "/contact"),
  integrations: { title: pair(), url: "/contact", icon: "Globe" },
  blog: { title: pair(), body: pair(), image: "", url: "/contact" },
  pages: {
    path: "/yeni-sayfa",
    title: pair(),
    description: pair(),
    visible: true,
    blocks: [],
  },
  blocks: blockTemplate,
  links: { source: "/contact", url: "/contact" },
  assets: {
    source: "/assets/build1.png",
    url: "/assets/build1.png",
    alt: pair(),
  },
};
export const siteDefaults = {
  brand: { name: "dfbng software", logo: "", favicon: "/favicon.svg" },
  appearance: {
    background: "#030303",
    text: "#f6f6f7",
    muted: "#85858b",
    border: "#202024",
    accent: "#bb6ef5",
    secondary: "#ffdc43",
    surface: "#101013",
    font: "Inter",
    headingFont: "Pixel",
    fontSize: 14,
    contentWidth: 1280,
    radius: 16,
    spacing: 80,
  },
  options: {
    defaultLanguage: "tr",
    turkish: true,
    english: true,
    animations: true,
    header: true,
    footer: true,
    cookieNotice: true,
    socials: true,
    login: true,
    os: true,
  },
  home: [
    "hero",
    "partners",
    "services",
    "popular",
    "integrations",
    "products",
    "projects",
    "order",
    "faq",
    "community",
  ].map((id) => ({ id, visible: true, blocks: [] })),
  navigation: [
    {
      ...link("Takım", "Team", "/about"),
      visible: true,
      children: [
        link("Takım", "Team", "/career/team"),
        link("Kariyer", "Careers", "/career"),
        link("Hakkımızda", "About us", "/about"),
        link("Referanslar", "References", "/reference"),
        link("İletişim", "Contact", "/contact"),
      ],
    },
    {
      ...link("Mağaza", "Store", "/products"),
      visible: true,
      children: [
        link("Tüm ürünler", "All products", "/products"),
        ...serviceItems
          .slice(0, 4)
          .map((s) => link(s[1], s[2], "/products/" + s[0])),
      ],
    },
    {
      ...link("Özel Sipariş", "Custom order", "/custom-order"),
      visible: true,
      children: [],
    },
    {
      ...link("Hizmetler", "Services", "/services"),
      visible: true,
      children: serviceItems.map((s) => link(s[1], s[2], "/services/" + s[0])),
    },
    {
      ...link("Dokümantasyon", "Documentation", "/docs"),
      visible: true,
      children: [
        link("Rehberler", "Guides", "/docs"),
        link("API", "API", "/api-docs"),
        link("Destek", "Support", "/contact"),
      ],
    },
  ],
  footer: [
    {
      title: pair("Hızlı Bağlantılar", "Quick Links"),
      links: [
        link("Mağaza", "Store", "/products"),
        link("Hizmetler", "Services", "/services"),
        link("Referanslar", "References", "/reference"),
        link("Dokümantasyon", "Documentation", "/docs"),
        link("Blog", "Blog", "/blog"),
        link("Forum", "Forum", "/forum"),
      ],
    },
    {
      title: pair("Şirket", "Company"),
      links: [
        link("Hakkımızda", "About us", "/about"),
        link("Kariyer", "Careers", "/career"),
        link("Takım", "Team", "/career/team"),
        link("İletişim", "Contact", "/contact"),
      ],
    },
    {
      title: pair("Kaynaklar", "Resources"),
      links: [
        link("API", "API", "/api-docs"),
        link("Yönetim Paneli", "Admin Panel", "/admin"),
        link("Sıkça Sorulan Sorular", "FAQ", "/#sss"),
        link("Kullanım Koşulları", "Terms of use", "/terms"),
        link("Gizlilik Politikası", "Privacy policy", "/privacy"),
      ],
    },
  ],
  socials: [
    link("Instagram", "Instagram", "/reference"),
    link("Discord", "Discord", "/contact"),
    link("YouTube", "YouTube", "/docs"),
  ],
  services: serviceItems.map((s) => ({
    id: s[0],
    title: pair(s[1], s[2]),
    description: pair(s[3], s[4]),
    icon: s[5],
  })),
  faqs: faqs.map((f) => ({
    question: pair(f[0], f[1]),
    answer: pair(f[2], f[3]),
  })),
  docs: docs.map((d) => ({
    id: d[0],
    title: pair(d[1], d[2]),
    heading: pair(d[3], d[4]),
    body: pair(d[5], d[6]),
  })),
  projects: ["Survival", "Spawn", "Lobby", "Hub", "Arena", "City"].map(
    (name, i) => ({
      title: pair(name),
      image: `/assets/build${i + 1}.png`,
      url: "/services/design",
    }),
  ),
  partners: ["Minecraft", "Paper", "Spigot", "Folia", "Purpur"].map((name) =>
    link(name, name, "/products"),
  ),
  integrations: [
    "Minecraft",
    "Discord",
    "Folia",
    "Java",
    "React",
    "FiveM",
    "Purpur",
    "Node.js",
    "Paper",
    "Figma",
    "Vault",
    "TypeScript",
  ].map((name) => ({
    title: pair(name),
    url: "/services/minecraft-plugin",
    icon: "Globe",
  })),
  blog: docs
    .slice(1, 4)
    .map((d, i) => ({
      title: pair(d[3], d[4]),
      body: pair(d[5], d[6]),
      image: `/assets/build${i + 1}.png`,
      url: "/docs",
    })),
  pages: [],
  copy: {},
  assets: assetDefaults,
  links: [],
};
