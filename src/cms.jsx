import React, { useState, useEffect } from "react";
import { useApp, api, Link } from "./app-context";
import { templates } from "./site-defaults";
import { copyDefaults } from "./copy-defaults";
import "./cms.css";
export function SiteImage({ src, alt = "", ...props }) {
  const { site, lang } = useApp();
  const entry = site.assets.find((a) => a.source === src);
  if (entry && entry.url === "") return null;
  return (
    <img {...props} src={entry?.url || src} alt={entry?.alt?.[lang] || alt} />
  );
}
export function BrandName() {
  const { site } = useApp();
  return <>{site.brand.name}</>;
}
export function Blocks({ blocks = [] }) {
  const { lang } = useApp();
  return (
    <div className="cms-blocks container">
      {blocks
        .filter((b) => b.visible)
        .map((b, i) => (
          <section key={i} className={"cms-block cms-" + b.type}>
            {b.title[lang] && <h2>{b.title[lang]}</h2>}
            {b.image && <SiteImage src={b.image} alt={b.title[lang]} />}
            {b.body[lang] && <p>{b.body[lang]}</p>}
            {b.url && (
              <Link className="cta" to={b.url}>
                {b.button[lang] || b.title[lang] || b.url}
              </Link>
            )}
          </section>
        ))}
    </div>
  );
}
export function CustomPage({ page }) {
  const { lang } = useApp();
  return (
    <>
      <div className="page-hero container">
        <h1>{page.title[lang]}</h1>
        <p>{page.description[lang]}</p>
      </div>
      <Blocks blocks={page.blocks} />
    </>
  );
}
const labels = {
  brand: "Marka",
  name: "Site adı",
  logo: "Logo görseli",
  favicon: "Sekme simgesi",
  appearance: "Tasarım",
  background: "Arka plan",
  text: "Yazı rengi",
  muted: "İkincil yazı rengi",
  border: "Kenarlık",
  accent: "Vurgu rengi",
  secondary: "İkinci vurgu",
  surface: "Kart arka planı",
  font: "Yazı tipi",
  headingFont: "Başlık yazı tipi",
  fontSize: "Yazı boyutu",
  contentWidth: "İçerik genişliği",
  radius: "Köşe yuvarlaklığı",
  spacing: "Bölüm aralığı",
  options: "Görünüm ve dil",
  defaultLanguage: "Başlangıç dili",
  turkish: "Türkçe",
  english: "İngilizce",
  animations: "Animasyonlar",
  header: "Üst menü",
  footer: "Alt menü",
  cookieNotice: "Çerez bildirimi",
  socials: "Sosyal bağlantılar",
  login: "Giriş bağlantısı",
  os: "OS bağlantısı",
  home: "Ana sayfa bölümleri",
  id: "Kimlik / bağlantı kodu",
  visible: "Görünür",
  blocks: "Ek içerik blokları",
  type: "Blok türü",
  title: "Başlık",
  body: "İçerik",
  image: "Görsel",
  url: "Bağlantı",
  button: "Buton yazısı",
  navigation: "Üst menü",
  children: "Alt bağlantılar",
  links: "Bağlantılar",
  services: "Hizmetler",
  description: "Açıklama",
  icon: "Simge",
  faqs: "Sıkça sorulan sorular",
  question: "Soru",
  answer: "Yanıt",
  docs: "Dokümantasyon",
  heading: "İçerik başlığı",
  projects: "Referanslar",
  partners: "Ortaklar",
  integrations: "Entegrasyonlar",
  blog: "Blog",
  pages: "Sayfalar",
  path: "Sayfa adresi",
  assets: "Görsel değişimleri",
  source: "Mevcut adres",
  alt: "Görsel açıklaması",
  tr: "Türkçe",
  en: "İngilizce",
};
const areaNames = {
  brand: "Site adı ve logo",
  copy: "Tüm metinler",
  appearance: "Renkler ve tasarım",
  options: "Dil ve görünüm",
  home: "Ana sayfa düzeni",
  navigation: "Üst menü",
  footer: "Alt menü",
  socials: "Sosyal bağlantılar",
  services: "Hizmetler",
  faqs: "Sık sorulan sorular",
  docs: "Rehberler",
  projects: "Referanslar",
  partners: "Ortaklar",
  integrations: "Entegrasyonlar",
  blog: "Blog yazıları",
  pages: "Sayfa oluşturucu",
  assets: "Görseller",
  links: "Buton bağlantıları",
  media: "Görsel yükle",
  backup: "Yedek ve geçmiş",
};
const sectionNames = {
  hero: "Karşılama",
  partners: "Ortaklar",
  services: "Hizmet tanıtımı",
  popular: "Popüler ürünler",
  integrations: "Entegrasyonlar",
  products: "Tüm ürünler",
  projects: "Referanslar",
  order: "Özel sipariş",
  faq: "Sık sorulan sorular",
  community: "Topluluk",
};
const clone = (x) => structuredClone(x);
function titleOf(x, index) {
  return (
    x?.title?.tr ||
    x?.question?.tr ||
    sectionNames[x?.id] ||
    x?.path ||
    x?.id ||
    x?.source ||
    `Kayıt ${index + 1}`
  );
}
function Field({ value, onChange, name, media = [], path = "" }) {
  const label = labels[name] || name;
  if (Array.isArray(value)) {
    const template =
      name === "children" || (name === "links" && !path.startsWith("links"))
        ? { title: { tr: "Yeni bağlantı", en: "New link" }, url: "/contact" }
        : templates[name] || value[0];
    return (
      <div className="cms-array">
        <h3>
          {label} ({value.length})
        </h3>
        {value.map((item, i) => (
          <details key={i}>
            <summary>{titleOf(item, i)}</summary>
            <div className="cms-item-actions">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => {
                  const a = [...value];
                  [a[i - 1], a[i]] = [a[i], a[i - 1]];
                  onChange(a);
                }}
              >
                ↑ Yukarı
              </button>
              <button
                type="button"
                disabled={i === value.length - 1}
                onClick={() => {
                  const a = [...value];
                  [a[i + 1], a[i]] = [a[i], a[i + 1]];
                  onChange(a);
                }}
              >
                ↓ Aşağı
              </button>
              {name !== "home" && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, n) => n !== i))}
                >
                  Sil
                </button>
              )}
            </div>
            <Field
              name=""
              value={item}
              path={`${path}.${i}`}
              media={media}
              onChange={(v) => onChange(value.map((x, n) => (n === i ? v : x)))}
            />
          </details>
        ))}
        {name !== "home" && template && (
          <button
            type="button"
            onClick={() => onChange([...value, clone(template)])}
          >
            + {label} ekle
          </button>
        )}
      </div>
    );
  }
  if (value && typeof value === "object") {
    const fields = (
      <div className="cms-fields">
        {Object.entries(value).map(([key, v]) => (
          <Field
            key={key}
            name={key}
            value={v}
            path={`${path}.${key}`}
            media={media}
            onChange={(newValue) => onChange({ ...value, [key]: newValue })}
          />
        ))}
      </div>
    );
    return Object.hasOwn(value, "tr") && name ? (
      <fieldset className="cms-pair">
        <legend>{label}</legend>
        {fields}
      </fieldset>
    ) : (
      fields
    );
  }
  if (typeof value === "boolean")
    return (
      <label className="cms-toggle">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  if (typeof value === "number")
    return (
      <label>
        {label}
        <input
          type="number"
          value={value}
          min="0"
          max="2000"
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    );
  const selections = {
    type: ["text", "image", "button", "banner"],
    defaultLanguage: ["tr", "en"],
    font: ["Inter", "Arial", "Georgia", "monospace"],
    headingFont: ["Pixel", "Inter", "Arial", "Georgia", "monospace"],
    icon: [
      "Globe",
      "Blocks",
      "Gamepad2",
      "Bot",
      "Palette",
      "MessagesSquare",
      "Box",
      "Code2",
      "Zap",
      "Terminal",
      "Layers",
      "ShieldCheck",
    ],
  };
  if (selections[name])
    return (
      <label>
        {label}
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {selections[name].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    );
  if (
    [
      "background",
      "text",
      "muted",
      "border",
      "accent",
      "secondary",
      "surface",
    ].includes(name)
  )
    return (
      <label>
        {label}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  const imageField =
    ["image", "logo", "favicon"].includes(name) ||
    (name === "url" && path.startsWith("assets"));
  return (
    <label>
      {label}
      {["tr", "en", "body", "description", "answer"].includes(name) ? (
        <textarea
          rows={value.length > 160 ? 5 : 2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          readOnly={name === "id" && path.startsWith("home")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}{" "}
      {imageField && (
        <>
          <select
            aria-label="Yüklenen görseli seç"
            value=""
            onChange={(e) => e.target.value && onChange(e.target.value)}
          >
            <option value="">Yüklenen görseli seç…</option>
            {media.map((m) => (
              <option key={m.id} value={"/api/media/" + m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {value && (
            <img className="cms-image-preview" src={value} alt="Önizleme" />
          )}
        </>
      )}
    </label>
  );
}
export function CmsAdmin() {
  const { refreshSite } = useApp();
  const [data, setData] = useState(null),
    [draft, setDraft] = useState(null),
    [area, setArea] = useState("brand"),
    [query, setQuery] = useState(""),
    [section, setSection] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  async function load() {
    const d = await api("/admin/site");
    setData(d);
    setDraft(clone(d.site));
    setDirty(false);
  }
  useEffect(() => {
    load().catch(() => setMessage("İçerik yüklenemedi. Yeniden deneyin."));
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setMessage("");
  }
  async function save() {
    setBusy(true);
    try {
      const d = await api("/admin/site", {
        revision: data.revision,
        site: draft,
      });
      setData((old) => ({ ...old, ...d }));
      setDirty(false);
      await refreshSite();
      await load();
      setMessage("Değişiklikler kaydedildi. Site güncellendi.");
    } catch (e) {
      setMessage(
        e.message === "site_conflict"
          ? "Başka bir kayıt yapıldı. Taslağınızı dışa aktarın, ardından yeniden yükleyin."
          : "Kaydedilemedi. Alanları ve bağlantıları kontrol edin.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: file });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      const d = await api("/admin/site");
      setData((old) => ({ ...old, media: d.media }));
      setMessage(
        "Görsel yüklendi. Görsel alanlarından seçebilirsiniz: " + result.url,
      );
    } catch {
      setMessage(
        "Görsel yüklenemedi. PNG, JPEG veya WebP seçin; en fazla 6 MB.",
      );
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "site-icerik-yedegi.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (!draft) return <p>{message || "İçerik yükleniyor…"}</p>;
  const records = copyDefaults.filter(
    (c) =>
      (!section || c.section === section) &&
      (
        c.tr +
        " " +
        c.en +
        " " +
        c.section +
        " " +
        (draft.copy[c.key]?.tr || "") +
        " " +
        (draft.copy[c.key]?.en || "")
      )
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <div className="cms-admin">
      <div className="cms-toolbar">
        <div>
          <h2>Siteyi düzenle</h2>
          <small>
            Kayıt {data.revision} ·{" "}
            {dirty ? "Kaydedilmemiş değişiklikler" : "Güncel"}
          </small>
        </div>
        <a href="/" target="_blank" rel="noreferrer">
          Siteyi aç ↗
        </a>
        <button
          className="submit-button"
          disabled={busy || !dirty}
          onClick={save}
        >
          {busy ? "İşleniyor…" : "Değişiklikleri kaydet"}
        </button>
      </div>
      {message && (
        <p className="cms-message" role="status">
          {message}
        </p>
      )}
      <nav className="cms-tabs">
        {Object.entries(areaNames).map(([id, title]) => (
          <button
            key={id}
            className={area === id ? "selected" : ""}
            onClick={() => setArea(id)}
          >
            {title}
          </button>
        ))}
      </nav>
      <div className="cms-editor">
        <h3>{areaNames[area]}</h3>
        {area === "copy" ? (
          <>
            <p>
              Sayfalardaki metinleri bulun; iki dilde düzenleyin. Boş metin
              girerek kaldırabilirsiniz.
            </p>
            <div className="cms-fields">
              <label>
                Metin ara
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                Bölüm
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option value="">Tüm bölümler</option>
                  {[...new Set(copyDefaults.map((c) => c.section))]
                    .sort()
                    .map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                </select>
              </label>
            </div>
            <p>{records.length} metin</p>
            {records.slice(0, 80).map((c) => (
              <details key={c.key}>
                <summary>
                  {c.section} · {c.tr.slice(0, 85)}
                </summary>
                <Field
                  name=""
                  value={draft.copy[c.key] || { tr: c.tr, en: c.en }}
                  onChange={(v) =>
                    change("copy", { ...draft.copy, [c.key]: v })
                  }
                />
                <button
                  onClick={() => {
                    const v = { ...draft.copy };
                    delete v[c.key];
                    change("copy", v);
                  }}
                >
                  Özgün metne dön
                </button>
              </details>
            ))}
            {records.length > 80 && (
              <p>
                İlk 80 sonuç gösteriliyor. Aramayı veya bölüm filtresini
                kullanın.
              </p>
            )}
          </>
        ) : area === "media" ? (
          <>
            <p>
              PNG, JPEG veya WebP · en fazla 6 MB. Önce yükleyin, ardından
              görsel alanından seçin.
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={upload}
            />
            <div className="cms-media">
              {data.media.map((m) => (
                <div key={m.id}>
                  <img src={"/api/media/" + m.id} alt={m.name} />
                  <small>{m.name}</small>
                  <input readOnly value={"/api/media/" + m.id} />
                </div>
              ))}
            </div>
          </>
        ) : area === "backup" ? (
          <>
            <p>
              İçerik yedeği metinleri ve ayarları içerir. Görsel dosyaları,
              ürünler, üyeler ve siparişler için ayrıca sunucudaki .data
              klasörünü yedekleyin.
            </p>
            <button onClick={download}>Taslağı JSON olarak indir</button>
            <label>
              İçerik yedeğini içe aktar
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  try {
                    const f = e.target.files[0];
                    if (f.size > 1024 * 1024) throw Error();
                    const value = JSON.parse(await f.text());
                    const result = await api("/admin/site/validate", {
                      site: value,
                    });
                    setDraft(result.site);
                    setDirty(true);
                    setMessage(
                      "Yedek taslağa alındı. Kaydettiğinizde doğrulanıp uygulanacak.",
                    );
                  } catch {
                    setMessage("Geçersiz içerik yedeği.");
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => {
                if (!dirty || confirm("Kaydedilmemiş taslak silinsin mi?"))
                  load().catch(() => setMessage("Yüklenemedi."));
              }}
            >
              Sunucudan yeniden yükle
            </button>
            <h3>Önceki kayıtlar</h3>
            {data.history.map((h) => (
              <div key={h.revision} className="cms-history">
                <span>
                  Kayıt {h.revision} ·{" "}
                  {new Date(h.created_at).toLocaleString("tr-TR")}
                </span>
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !confirm(
                        "Bu kayda dönülsün mü? Kaydedilmemiş taslak silinir.",
                      )
                    )
                      return;
                    setBusy(true);
                    try {
                      await api("/admin/site/restore", {
                        revision: data.revision,
                        restoreRevision: h.revision,
                      });
                      await load();
                      await refreshSite();
                      setMessage("Önceki kayıt geri yüklendi.");
                    } catch {
                      setMessage("Geri yüklenemedi. Önce yeniden yükleyin.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Geri yükle
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            {area === "pages" && (
              <p>
                Özel sayfa ekleyin veya /about, /blog, /docs, /terms, /privacy
                gibi içerik sayfalarını kendi bloklarınızla değiştirin. Ana
                sayfaya / adresiyle alternatif tasarım ekleyebilirsiniz.
                Sipariş, hesap ve yönetim ekranları kendi işlemlerini korur.
              </p>
            )}
            {area === "home" && (
              <p>
                Bölümleri sıralayın, gizleyin veya her bölümün altına içerik
                blokları ekleyin.
              </p>
            )}
            {area === "assets" && (
              <p>
                Mevcut görsel adresini seçip yeni görseli atayın. Değişiklik o
                görselin sitedeki kullanımlarına uygulanır.
              </p>
            )}
            <Field
              name={area}
              value={draft[area]}
              media={data.media}
              path={area}
              onChange={(v) => change(area, v)}
            />
          </>
        )}
      </div>
    </div>
  );
}
export function SiteText({ tr, en = tr }) {
  const { t } = useApp();
  return <>{t(tr, en)}</>;
}
