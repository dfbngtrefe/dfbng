import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  ShieldCheck,
  LogOut,
  ShoppingBag,
  Settings,
  Package,
  Users,
  MessagesSquare,
  LayoutDashboard,
  Plus,
  Save,
  Upload,
  LockKeyhole,
  Landmark,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";
import { useApp, api, Link, CTA } from "./app-context";
const messages = {
  invalid_credentials: [
    "Kullanıcı adı veya şifre hatalı.",
    "Incorrect username or password.",
  ],
  invalid_input: [
    "Lütfen alanları ve tarih bilgisini kontrol edin.",
    "Please check the fields and date.",
  ],
  unauthorized: ["Devam etmek için giriş yapın.", "Sign in to continue."],
  forbidden: [
    "Bu işlem için yönetici yetkisi gerekiyor.",
    "Administrator access is required.",
  ],
  payment_not_configured: [
    "Havale bilgileri henüz tamamlanmadı. Lütfen iletişim sayfasından bize ulaşın.",
    "Bank details are not complete yet. Please contact us.",
  ],
  invalid_transition: [
    "Sipariş durumu değişti. Listeyi yenileyip tekrar deneyin.",
    "The order status has changed. Refresh and try again.",
  ],
  invalid_iban: [
    "IBAN geçerli değil. Lütfen kontrol edin.",
    "Invalid IBAN. Please check it.",
  ],
  invalid_file: ["Geçerli bir ZIP dosyası seçin.", "Choose a valid ZIP file."],
  file_too_large: [
    "Dosya en fazla 25 MB olabilir.",
    "Maximum file size is 25 MB.",
  ],
  rate_limited: [
    "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.",
    "Too many attempts. Please try again later.",
  ],
  not_found: ["Kayıt bulunamadı.", "Record not found."],
};
const textError = (e, t) =>
  t(
    ...(messages[e.message] || [
      "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
      "Could not complete the request. Please try again.",
    ]),
  );
const statuses = {
  pending_payment: ["Ödeme bekleniyor", "Awaiting payment"],
  payment_review: ["Ödeme inceleniyor", "Payment under review"],
  payment_rejected: ["Ödeme doğrulanamadı", "Payment not verified"],
  paid: ["Ödeme onaylandı", "Payment approved"],
  fulfilled: ["Teslim edildi", "Delivered"],
  cancelled: ["İptal edildi", "Cancelled"],
};
const money = (cents, lang = "tr") =>
  new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    style: "currency",
    currency: "TRY",
  }).format(cents / 100);
function Status({ value }) {
  const { t } = useApp();
  return (
    <span className={"payment-status status-" + value}>
      {t(...(statuses[value] || [value, value]))}
    </span>
  );
}
function ErrorMessage({ error }) {
  return error ? (
    <p role="alert" className="form-error">
      {error}
    </p>
  ) : null;
}
function CommerceHeading({ title, description }) {
  const { t } = useApp();
  return (
    <div className="container commerce-heading">
      <Link to="/account">
        <ArrowLeft size={14} />
        {t("Hesabım", "My account")}
      </Link>
      <span className="eyebrow">DFBNG SOFTWARE</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function Checkout() {
  const { t, lang, path, products, user, navigate, catalogLoading } = useApp();
  const p = products.find((p) => p.id === path.split("/")[2]);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [clientKey] = useState(() => crypto.randomUUID());
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/orders", { productId: p.id, clientKey });
      navigate("/orders/" + data.order.id);
    } catch (e) {
      setError(textError(e, t));
    } finally {
      setBusy(false);
    }
  }
  if (catalogLoading)
    return (
      <div className="commerce-loading">{t("Yükleniyor…", "Loading…")}</div>
    );
  return (
    <>
      <CommerceHeading
        title={t("Son bir adım.", "One last step.")}
        description={t(
          "Siparişinizi oluşturun, havale bilgilerinizi alın.",
          "Create your order and get your bank transfer details.",
        )}
      />
      <section className="container checkout-layout">
        {p ? (
          <>
            <div className="checkout-product">
              <img
                src={"/assets/" + p.image}
                alt={p.title[lang === "tr" ? 0 : 1]}
              />
              <span className="eyebrow">{p.category}</span>
              <h2>{p.title[lang === "tr" ? 0 : 1]}</h2>
              <p>{p.description[lang === "tr" ? 0 : 1]}</p>
            </div>
            <form className="form-panel" onSubmit={submit}>
              <Landmark size={30} />
              <h2>{t("Sipariş özeti", "Order summary")}</h2>
              <div className="checkout-total">
                <span>{t("Toplam tutar", "Total amount")}</span>
                <strong>{money(Math.round(p.price * 100), lang)}</strong>
              </div>
              <p>
                {p.price
                  ? t(
                      "Ödeme yöntemi: Havale / EFT. Sipariş oluşturulduktan sonra IBAN, hesap sahibi ve açıklama kodu gösterilir.",
                      "Payment method: bank transfer. Your order will show the IBAN, account holder and payment reference.",
                    )
                  : t(
                      "Bu ürün ücretsizdir. Hesabınıza eklenir.",
                      "This product is free and will be added to your account.",
                    )}
              </p>
              <p className="small-note">
                {p.downloadAvailable
                  ? t(
                      "Ürün dosyası, ödeme onayından sonra hesabınızdan indirilebilir.",
                      "Download the product from your account after approval.",
                    )
                  : t(
                      "Ürün dosyası henüz yüklenmemiş. Ödeme yapmadan önce teslimat durumunu iletişim sayfasından teyit edin.",
                      "The product file has not been uploaded yet. Confirm delivery availability with us before paying.",
                    )}
              </p>
              {user ? (
                <>
                  <label className="checkbox">
                    <input type="checkbox" required />
                    <span>
                      <Link to="/terms">
                        {t("Kullanım koşullarını", "Terms of use")}
                      </Link>{" "}
                      {t(
                        "okudum. Havalenin yönetici onayına tabi olduğunu anladım.",
                        "have been read. I understand that transfers require administrator approval.",
                      )}
                    </span>
                  </label>
                  <ErrorMessage error={error} />
                  <button className="submit-button" disabled={busy}>
                    {busy
                      ? t("Oluşturuluyor…", "Creating…")
                      : t("Siparişi oluştur", "Create order")}
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <CTA to={"/login?next=" + encodeURIComponent(path)}>
                  {t("Giriş yap ve devam et", "Sign in to continue")}
                </CTA>
              )}
            </form>
          </>
        ) : (
          <div className="empty">
            {t("Ürün bulunamadı.", "Product not found.")}
          </div>
        )}
      </section>
    </>
  );
}
export function OrderPage() {
  const { t, lang, path, user } = useApp();
  const [order, setOrder] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  const id = path.split("/")[2];
  async function refresh() {
    try {
      const data = await api("/orders/" + id);
      setOrder(data.order);
      setError("");
    } catch (e) {
      setError(textError(e, t));
    }
  }
  useEffect(() => {
    if (user) refresh();
  }, [id, user]);
  async function report(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api(
        "/orders/" + id + "/report",
        Object.fromEntries(new FormData(e.target)),
      );
      setOrder(data.order);
      setError("");
    } catch (e) {
      setError(textError(e, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <CommerceHeading
        title={t("Siparişiniz", "Your order")}
        description={id}
      />
      <section className="container order-detail">
        <ErrorMessage error={error} />
        {!user ? (
          <CTA to="/login">
            {t("Hesabınıza giriş yapın", "Sign in to your account")}
          </CTA>
        ) : order ? (
          <>
            <div className="order-summary">
              <div>
                <span className="eyebrow">{order.id}</span>
                <h2>{order.product.title[lang === "tr" ? 0 : 1]}</h2>
                <Status value={order.status} />
              </div>
              <strong>{money(order.amount, lang)}</strong>
              <button className="outline-button" onClick={refresh}>
                <RefreshCw size={15} />
                {t("Yenile", "Refresh")}
              </button>
            </div>
            {order.admin_note && (
              <div className="doc-callout">
                <MessagesSquare />
                <p>{order.admin_note}</p>
              </div>
            )}
            {["pending_payment", "payment_rejected"].includes(order.status) && (
              <div className="payment-layout">
                <div className="bank-card">
                  <span className="bank-icon">
                    <Landmark />
                  </span>
                  <h2>{t("Havale / EFT", "Bank transfer")}</h2>
                  <label>
                    {t("Alıcı hesap sahibi", "Account holder")}
                    <strong>{order.payment.holder}</strong>
                  </label>
                  {order.payment.bank && (
                    <label>
                      {t("Banka", "Bank")}
                      <strong>{order.payment.bank}</strong>
                    </label>
                  )}
                  <label>
                    IBAN<strong className="iban">{order.payment.iban}</strong>
                  </label>
                  <button
                    className="outline-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          order.payment.iban.replace(/\s/g, ""),
                        );
                        setCopied(true);
                      } catch {
                        setError(
                          t(
                            "Kopyalama yapılamadı. IBAN’ı seçip elle kopyalayabilirsiniz.",
                            "Select and copy the IBAN manually.",
                          ),
                        );
                      }
                    }}
                  >
                    <Copy size={15} />
                    {copied
                      ? t("Kopyalandı", "Copied")
                      : t("IBAN’ı kopyala", "Copy IBAN")}
                  </button>
                  <label>
                    {t("Havale açıklaması", "Payment reference")}
                    <strong>{order.id}</strong>
                  </label>
                  <p>
                    {t(
                      "Havale açıklamasına sipariş numaranızı yazın. Ödemeyi tamamladıktan sonra yan taraftaki bildirimi doldurun.",
                      "Use your order number as the transfer reference. After transferring, complete the payment report.",
                    )}
                  </p>
                </div>
                <form className="form-panel" onSubmit={report}>
                  <h2>{t("Ödeme bildirimi", "Payment report")}</h2>
                  <label>
                    {t("Gönderen adı soyadı", "Sender full name")}
                    <input
                      name="payer"
                      required
                      maxLength={150}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    {t("Transfer tarihi", "Transfer date")}
                    <input
                      name="transferDate"
                      type="date"
                      required
                      min={order.created_at.slice(0, 10)}
                      max={new Date().toISOString().slice(0, 10)}
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </label>
                  <label>
                    {t(
                      "Banka işlem / dekont numarası",
                      "Bank transaction / receipt number",
                    )}
                    <input name="bankReference" required maxLength={100} />
                  </label>
                  <label>
                    {t("Not (isteğe bağlı)", "Note (optional)")}
                    <textarea name="note" maxLength={1000} rows={3} />
                  </label>
                  <p className="small-note">
                    {t(
                      "Bu bildirim otomatik ödeme onayı değildir. Banka kaydı kontrol edildikten sonra durumunuz güncellenir.",
                      "This report does not automatically approve payment. Your status updates after the bank record is checked.",
                    )}
                  </p>
                  <button className="submit-button" disabled={busy}>
                    {busy
                      ? t("Gönderiliyor…", "Submitting…")
                      : t("Ödeme yaptım, bildir", "I have paid — notify")}
                  </button>
                </form>
              </div>
            )}
            {order.status === "payment_review" && (
              <div className="payment-result">
                <Clock size={42} />
                <h2>
                  {t(
                    "Bildiriminiz incelemede.",
                    "Your payment is under review.",
                  )}
                </h2>
                <p>
                  {t(
                    "Yönetici banka hesabındaki transferi kontrol ettikten sonra siparişiniz güncellenecek.",
                    "Your order will update after the administrator checks the transfer in the bank account.",
                  )}
                </p>
              </div>
            )}
            {["paid", "fulfilled"].includes(order.status) && (
              <div className="payment-result">
                <CheckCircle2 size={42} />
                <h2>
                  {t("Siparişiniz onaylandı.", "Your order is approved.")}
                </h2>
                {order.downloadAvailable ? (
                  <a
                    className="submit-button download-button"
                    href={"/api/orders/" + id + "/download"}
                  >
                    <Download size={17} />
                    {t("Ürün dosyasını indir", "Download product file")}
                  </a>
                ) : (
                  <p>
                    {t(
                      "Ürün dosyanız hazırlanıyor. Teslimat ayrıntıları için iletişim sayfasından bize ulaşabilirsiniz.",
                      "Your product file is being prepared. Contact us for delivery details.",
                    )}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p>{t("Yükleniyor…", "Loading…")}</p>
        )}
      </section>
    </>
  );
}
export function OrdersList() {
  const { t, lang, user } = useApp();
  const [orders, setOrders] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    if (user)
      api("/orders")
        .then((d) => setOrders(d.orders))
        .catch((e) => setError(textError(e, t)));
  }, [user]);
  return (
    <section className="customer-orders">
      <h2>{t("Siparişlerim", "My orders")}</h2>
      <ErrorMessage error={error} />
      {orders.length ? (
        orders.map((o) => (
          <Link key={o.id} to={"/orders/" + o.id} className="customer-order">
            <span>
              <b>{o.product.title[lang === "tr" ? 0 : 1]}</b>
              <small>{o.id}</small>
            </span>
            <Status value={o.status} />
            <strong>{money(o.amount, lang)}</strong>
            <ArrowRight size={17} />
          </Link>
        ))
      ) : (
        <p>
          {t(
            "Henüz siparişiniz yok. Mağazadan bir ürün seçerek başlayın.",
            "No orders yet. Start by choosing a product in the store.",
          )}
        </p>
      )}
    </section>
  );
}
function AdminLogin() {
  const { t, setUser } = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api(
        "/admin/login",
        Object.fromEntries(new FormData(e.target)),
      );
      setUser(data.user);
    } catch (e) {
      setError(textError(e, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <Link to="/" className="admin-brand">
        dfbng <span>software</span>
      </Link>
      <div className="auth-card">
        <span className="auth-icon">
          <ShieldCheck size={27} />
        </span>
        <span className="eyebrow">YÖNETİM MERKEZİ</span>
        <h1>{t("Hoş geldin, yönetici.", "Welcome, administrator.")}</h1>
        <p>
          {t(
            "Mağazanızı ve ödemelerinizi tek yerden yönetin.",
            "Manage your store and payments in one place.",
          )}
        </p>
        <form onSubmit={login}>
          <label>
            {t("Yönetici kullanıcı adı", "Administrator username")}
            <input
              name="username"
              required
              autoComplete="username"
              maxLength={40}
            />
          </label>
          <label>
            {t("Şifre", "Password")}
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              maxLength={128}
            />
          </label>
          <ErrorMessage error={error} />
          <button className="submit-button" disabled={busy}>
            {busy
              ? t("Giriş yapılıyor…", "Signing in…")
              : t("Yönetim paneline gir", "Sign in to admin")}
            <ArrowRight size={17} />
          </button>
        </form>
        <Link className="admin-back" to="/">
          <ArrowLeft size={13} />
          {t("Siteye dön", "Back to site")}
        </Link>
      </div>
    </div>
  );
}
function AdminOrder({ order: o, onChange }) {
  const { t, lang } = useApp();
  const [action, setAction] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function update(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = Object.fromEntries(new FormData(e.target));
      await api("/admin/order-status", {
        id: o.id,
        status: action,
        note: data.note,
        version: o.version,
        confirmed: data.confirmed === "on",
      });
      setAction("");
      await onChange();
    } catch (e) {
      setError(textError(e, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="admin-order">
      <div className="admin-order-head">
        <div>
          <b>{o.product.title[lang === "tr" ? 0 : 1]}</b>
          <small>
            {o.id} · {new Date(o.created_at).toLocaleDateString()}
          </small>
        </div>
        <Status value={o.status} />
        <strong>{money(o.amount, lang)}</strong>
      </div>
      <div className="admin-order-body">
        <div>
          <label>{t("Müşteri", "Customer")}</label>
          <span>{o.customer_name}</span>
          <small>{o.customer_email}</small>
        </div>
        <div>
          <label>{t("Alıcı hesap", "Recipient account")}</label>
          <span>{o.payment.holder || "—"}</span>
          <small>{o.payment.iban}</small>
        </div>
        {o.report && (
          <div>
            <label>{t("Ödeme bildirimi", "Payment report")}</label>
            <span>
              {o.report.payer} · {o.report.transferDate}
            </span>
            <small>{o.report.bankReference}</small>
            <p>{o.report.note}</p>
          </div>
        )}
      </div>
      {o.admin_note && <p className="admin-note">{o.admin_note}</p>}
      <div className="admin-actions">
        {o.status === "payment_review" && (
          <>
            <button
              className="approve-button"
              onClick={() => setAction("paid")}
            >
              <CheckCircle2 size={15} />
              {t("Ödemeyi onayla", "Approve payment")}
            </button>
            <button
              className="outline-button"
              onClick={() => setAction("payment_rejected")}
            >
              {t("Ödemeyi reddet", "Reject payment")}
            </button>
          </>
        )}
        {o.status === "paid" && (
          <button
            className="outline-button"
            onClick={() => setAction("fulfilled")}
          >
            {t("Teslim edildi olarak işaretle", "Mark as delivered")}
          </button>
        )}
        {["pending_payment", "payment_rejected"].includes(o.status) && (
          <button
            className="outline-button"
            onClick={() => setAction("cancelled")}
          >
            {t("Siparişi iptal et", "Cancel order")}
          </button>
        )}
      </div>
      {action && (
        <form className="admin-confirm" onSubmit={update}>
          <h3>{t(...statuses[action])}</h3>
          <label>
            {t("Müşteriye not", "Note to customer")}
            <textarea
              name="note"
              rows={2}
              maxLength={1500}
              required={action === "payment_rejected"}
            />
          </label>
          {action === "paid" && (
            <label className="checkbox">
              <input name="confirmed" type="checkbox" required />
              <span>
                {t(
                  "Banka hesabında bu siparişe ait tutarın ve açıklamanın eşleştiğini kontrol ettim.",
                  "I checked the bank account and verified that the amount and reference match this order.",
                )}
              </span>
            </label>
          )}
          <ErrorMessage error={error} />
          <div className="admin-actions">
            <button className="submit-button" disabled={busy}>
              {t("İşlemi onayla", "Confirm action")}
            </button>
            <button
              type="button"
              className="outline-button"
              onClick={() => setAction("")}
            >
              {t("Vazgeç", "Cancel")}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
function ProductEditor({ item, onSaved, onClose }) {
  const { t } = useApp();
  const [fileId, setFileId] = useState(item?.deliveryFile || ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError(t(...messages.file_too_large));
      return;
    }
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/files", {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFileId(data.fileId);
    } catch (e) {
      setError(textError(e, t));
    } finally {
      setUploading(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = Object.fromEntries(new FormData(e.target));
    try {
      await api("/admin/products", {
        id: f.id,
        category: f.category,
        image: f.image,
        title: [f.titleTr, f.titleEn],
        description: [f.descTr, f.descEn],
        price: Number(f.price),
        oldPrice: f.oldPrice === "" ? null : Number(f.oldPrice),
        tags: f.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        active: f.active === "on",
        deliveryFile: fileId,
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(textError(e, t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-panel editor-panel" onSubmit={submit}>
      <div className="admin-section-head">
        <h2>
          {item
            ? t("Ürünü düzenle", "Edit product")
            : t("Yeni ürün", "New product")}
        </h2>
        <button type="button" className="outline-button" onClick={onClose}>
          {t("Kapat", "Close")}
        </button>
      </div>
      <div className="form-row">
        <label>
          {t("Ürün kimliği (URL)", "Product ID (URL)")}
          <input
            name="id"
            required
            readOnly={!!item}
            pattern="[a-z0-9][a-z0-9-]*"
            maxLength={70}
            defaultValue={item?.id}
            placeholder="dfbng-plugin"
          />
        </label>
        <label>
          {t("Kategori", "Category")}
          <select name="category" defaultValue={item?.category || "Minecraft"}>
            {["Minecraft", "FiveM", "Discord", "Web", "Design"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Başlık · Türkçe
          <input
            name="titleTr"
            required
            maxLength={150}
            defaultValue={item?.title[0]}
          />
        </label>
        <label>
          Title · English
          <input
            name="titleEn"
            required
            maxLength={150}
            defaultValue={item?.title[1]}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Açıklama · Türkçe
          <textarea
            name="descTr"
            required
            rows={4}
            maxLength={4000}
            defaultValue={item?.description[0]}
          />
        </label>
        <label>
          Description · English
          <textarea
            name="descEn"
            required
            rows={4}
            maxLength={4000}
            defaultValue={item?.description[1]}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          {t("Fiyat (TL)", "Price (TRY)")}
          <input
            name="price"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            required
            defaultValue={item?.price ?? 0}
          />
        </label>
        <label>
          {t("Eski fiyat (isteğe bağlı)", "Old price (optional)")}
          <input
            name="oldPrice"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            defaultValue={item?.oldPrice ?? ""}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          {t("Kapak görseli", "Cover image")}
          <select name="image" defaultValue={item?.image || "minecraft.jpg"}>
            {[
              "minecraft.jpg",
              "gta.jpg",
              "discord.jpg",
              "spawn.png",
              "angel.png",
              "build1.png",
              "build2.png",
              "build3.png",
              "build4.png",
              "build5.png",
              "build6.png",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Etiketler (virgülle ayırın)", "Tags (comma separated)")}
          <input
            name="tags"
            maxLength={400}
            defaultValue={item?.tags.join(", ")}
          />
        </label>
      </div>
      <div className="file-upload">
        <Upload size={22} />
        <label>
          {t(
            "Teslim edilecek ürün dosyası (.zip, en fazla 25 MB)",
            "Product delivery file (.zip, up to 25 MB)",
          )}
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={upload}
            disabled={uploading}
          />
        </label>
        <small>
          {uploading
            ? t("Yükleniyor…", "Uploading…")
            : fileId
              ? t(
                  "Dosya hazır. Kaydettiğinizde bu ürüne bağlanacak.",
                  "File ready. Save to attach it to this product.",
                )
              : t("Dosya seçilmedi.", "No file selected.")}
        </small>
        {fileId && (
          <button
            type="button"
            className="text-button"
            onClick={() => setFileId("")}
          >
            {t("Dosya bağlantısını kaldır", "Remove file attachment")}
          </button>
        )}
      </div>
      <label className="checkbox">
        <input
          name="active"
          type="checkbox"
          defaultChecked={item?.active ?? true}
        />
        <span>{t("Ürün mağazada görünsün", "Show product in store")}</span>
      </label>
      <ErrorMessage error={error} />
      <button className="submit-button" disabled={busy || uploading}>
        <Save size={17} />
        {busy
          ? t("Kaydediliyor…", "Saving…")
          : t("Ürünü kaydet", "Save product")}
      </button>
    </form>
  );
}
function AdminRequest({ request: r, onChange }) {
  const { t } = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-panel request-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/admin/request", {
            reference: r.reference,
            ...Object.fromEntries(new FormData(e.target)),
          });
          await onChange();
        } catch (e) {
          setError(textError(e, t));
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="eyebrow">
        {r.reference} · {r.type}
      </span>
      <h3>{r.subject}</h3>
      <small>
        {r.name} · {r.email} · {r.category} {r.budget && " · " + r.budget}
      </small>
      <p className="request-message">{r.message}</p>
      <label>
        {t("Durum", "Status")}
        <select name="status" defaultValue={r.status}>
          {[
            ["new", "Yeni", "New"],
            ["in_progress", "İşlemde", "In progress"],
            ["completed", "Tamamlandı", "Completed"],
            ["closed", "Kapandı", "Closed"],
          ].map(([v, tr, en]) => (
            <option key={v} value={v}>
              {t(tr, en)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("Müşteriye yanıt", "Reply to customer")}
        <textarea
          name="reply"
          maxLength={4000}
          defaultValue={r.reply}
          rows={3}
        />
      </label>
      <small>
        {r.user_id
          ? t(
              "Yanıt müşterinin hesabında görünür.",
              "Reply is visible in the customer account.",
            )
          : t(
              "Misafir talebi: Yanıt panelde saklanır. Müşteriye e-posta adresinden ayrıca ulaşın.",
              "Guest request: reply is saved here. Contact the customer separately by email.",
            )}
      </small>
      <ErrorMessage error={error} />
      <button className="outline-button" disabled={busy}>
        <Save size={15} />
        {t("Güncelle", "Update")}
      </button>
    </form>
  );
}
function AdminSettings({ settings, onChange }) {
  const { t } = useApp();
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setSaved(false);
        setError("");
        try {
          await api(
            "/admin/settings",
            Object.fromEntries(new FormData(e.target)),
          );
          await onChange();
          setSaved(true);
        } catch (e) {
          setError(textError(e, t));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{t("Ödeme ve iletişim ayarları", "Payment and contact settings")}</h2>
      <p>
        {t(
          "IBAN ve alıcı adı yeni siparişlere uygulanır. Mevcut siparişlerde oluşturulma anındaki ödeme bilgileri korunur.",
          "New bank details apply to new orders. Existing orders retain the payment instructions recorded when created.",
        )}
      </p>
      <label>
        IBAN
        <input
          name="iban"
          required
          maxLength={40}
          defaultValue={settings.iban}
        />
      </label>
      <div className="form-row">
        <label>
          {t("Hesap sahibi / şirket unvanı", "Account holder / company name")}
          <input
            name="holder"
            required
            maxLength={150}
            defaultValue={settings.holder}
            placeholder={t(
              "Bankadaki tam ad",
              "Full name registered with bank",
            )}
          />
        </label>
        <label>
          {t("Banka adı (isteğe bağlı)", "Bank name (optional)")}
          <input name="bank" maxLength={100} defaultValue={settings.bank} />
        </label>
      </div>
      <label>
        {t("İletişim e-postası (isteğe bağlı)", "Contact email (optional)")}
        <input
          name="email"
          type="email"
          maxLength={254}
          defaultValue={settings.email}
        />
      </label>
      <div className="form-row">
        <label>
          Discord
          <input
            name="discord"
            type="url"
            defaultValue={settings.discord}
            placeholder="https://discord.gg/..."
          />
        </label>
        <label>
          Instagram
          <input
            name="instagram"
            type="url"
            defaultValue={settings.instagram}
            placeholder="https://www.instagram.com/..."
          />
        </label>
      </div>
      <ErrorMessage error={error} />
      {saved && (
        <p className="save-success" role="status">
          {t("Ayarlar kaydedildi.", "Settings saved.")}
        </p>
      )}
      <button className="submit-button" disabled={busy}>
        <Save size={16} />
        {t("Ayarları kaydet", "Save settings")}
      </button>
    </form>
  );
}
function PasswordSettings() {
  const { t } = useApp();
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setSaved(false);
        const form = e.target;
        const data = Object.fromEntries(new FormData(form));
        if (data.password !== data.repeat) {
          setError(
            t("Yeni şifreler eşleşmiyor.", "New passwords do not match."),
          );
          setBusy(false);
          return;
        }
        try {
          await api("/admin/password", data);
          form.reset();
          setSaved(true);
        } catch (e) {
          setError(textError(e, t));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{t("Yönetici şifresi", "Administrator password")}</h2>
      <label>
        {t("Mevcut şifre", "Current password")}
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          maxLength={128}
        />
      </label>
      <div className="form-row">
        <label>
          {t("Yeni şifre", "New password")}
          <input
            name="password"
            type="password"
            minLength={10}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          {t("Yeni şifre tekrar", "Repeat new password")}
          <input
            name="repeat"
            type="password"
            minLength={10}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </label>
      </div>
      <p className="small-note">
        {t(
          "Şifre değişikliği diğer açık yönetici oturumlarını sonlandırır.",
          "Changing the password ends other administrator sessions.",
        )}
      </p>
      <ErrorMessage error={error} />
      {saved && (
        <p className="save-success" role="status">
          {t("Şifreniz değiştirildi.", "Password changed.")}
        </p>
      )}
      <button className="submit-button" disabled={busy}>
        <LockKeyhole size={16} />
        {t("Şifreyi değiştir", "Change password")}
      </button>
    </form>
  );
}
export function Admin() {
  const { t, lang, setLang, user, setUser, navigate, refreshCatalog } =
    useApp();
  const [tab, setTab] = useState("overview"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [editor, setEditor] = useState(null);
  async function refresh() {
    try {
      const d = await api("/admin/dashboard");
      setData(d);
      setError("");
      await refreshCatalog();
    } catch (e) {
      setError(textError(e, t));
    }
  }
  useEffect(() => {
    if (user?.role === "admin") refresh();
  }, [user]);
  if (user?.role !== "admin") return <AdminLogin />;
  const tabs = [
    ["overview", LayoutDashboard, t("Genel Bakış", "Overview")],
    ["orders", Landmark, t("Siparişler & Ödemeler", "Orders & Payments")],
    ["products", Package, t("Ürünler", "Products")],
    ["requests", MessagesSquare, t("Talepler", "Requests")],
    ["users", Users, t("Üyeler", "Members")],
    ["settings", Settings, t("Site Ayarları", "Site Settings")],
    ["security", ShieldCheck, t("Güvenlik", "Security")],
  ];
  const orders =
    data?.orders.filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (o.id + " " + o.customer_name + " " + o.customer_email)
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          dfbng <span>software</span>
        </Link>
        <span className="admin-label">CONTROL CENTER</span>
        <nav>
          {tabs.map(([id, Icon, label]) => (
            <button
              key={id}
              className={tab === id ? "selected" : ""}
              onClick={() => {
                setTab(id);
                setEditor(null);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "orders" &&
                data?.orders.some((o) => o.status === "payment_review") && (
                  <i className="admin-badge">
                    {
                      data.orders.filter((o) => o.status === "payment_review")
                        .length
                    }
                  </i>
                )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span>
            <span className="admin-avatar">{user.name.slice(0, 1)}</span>
            <b>
              {user.name}
              <small>{t("Yönetici", "Administrator")}</small>
            </b>
          </span>
          <button
            aria-label={t("Çıkış yap", "Sign out")}
            onClick={async () => {
              try {
                await api("/logout", {});
                setUser(null);
                navigate("/admin");
              } catch (e) {
                setError(textError(e, t));
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <span>
            <i className="status-dot" />
            {t("Mağaza yönetimi", "Store management")}
          </span>
          <div>
            <button onClick={() => setLang(lang === "tr" ? "en" : "tr")}>
              {lang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
            </button>
            <Link to="/">
              {t("Siteyi görüntüle", "View site")}
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
        <div className="admin-content">
          <div className="admin-title">
            <div>
              <span className="eyebrow">DFBNG SOFTWARE / ADMIN</span>
              <h1>{tabs.find((x) => x[0] === tab)?.[2]}</h1>
              <p>
                {t(
                  "Her şey kontrolün altında.",
                  "Everything under your control.",
                )}
              </p>
            </div>
            <button className="outline-button" onClick={refresh}>
              <RefreshCw size={15} />
              {t("Yenile", "Refresh")}
            </button>
          </div>
          <ErrorMessage error={error} />
          {!data ? (
            <p>{t("Yükleniyor…", "Loading…")}</p>
          ) : (
            <>
              {!data.settings.holder && (
                <div className="setup-alert">
                  <Landmark size={20} />
                  <span>
                    {t(
                      "Havale almak için önce banka hesabının sahibini kaydedin.",
                      "Set the bank account holder before accepting transfers.",
                    )}
                  </span>
                  <button onClick={() => setTab("settings")}>
                    {t("Ayarları aç", "Open settings")}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
              {tab === "overview" && (
                <>
                  <div className="admin-stats">
                    {[
                      [
                        ShoppingBag,
                        t("Toplam sipariş", "Total orders"),
                        data.orders.length,
                      ],
                      [
                        Clock,
                        t("Onay bekleyen", "Awaiting approval"),
                        data.orders.filter((o) => o.status === "payment_review")
                          .length,
                      ],
                      [
                        Landmark,
                        t("Onaylanan tutar", "Approved amount"),
                        money(
                          data.orders
                            .filter((o) =>
                              ["paid", "fulfilled"].includes(o.status),
                            )
                            .reduce((n, o) => n + o.amount, 0),
                          lang,
                        ),
                      ],
                      [
                        Users,
                        t("Müşteriler", "Customers"),
                        data.users.filter((u) => u.role !== "admin").length,
                      ],
                    ].map(([Icon, label, value]) => (
                      <div key={label}>
                        <span>
                          <Icon size={18} />
                          {label}
                        </span>
                        <strong>{value}</strong>
                        <small>{t("Tüm zamanlar", "All time")}</small>
                      </div>
                    ))}
                  </div>
                  <div className="admin-section-head">
                    <h2>{t("Son siparişler", "Recent orders")}</h2>
                    <button
                      className="text-button"
                      onClick={() => setTab("orders")}
                    >
                      {t("Tümünü gör", "View all")}
                    </button>
                  </div>
                  {data.orders.length ? (
                    data.orders
                      .slice(0, 5)
                      .map((o) => (
                        <AdminOrder
                          key={o.id + "-" + o.version}
                          order={o}
                          onChange={refresh}
                        />
                      ))
                  ) : (
                    <div className="admin-empty">
                      <ShoppingBag size={35} />
                      <h3>
                        {t(
                          "İlk sipariş için her şey burada.",
                          "Ready for your first order.",
                        )}
                      </h3>
                      <p>
                        {t(
                          "Yeni siparişler ve ödeme bildirimleri bu ekranda görünecek.",
                          "New orders and payment reports will appear here.",
                        )}
                      </p>
                    </div>
                  )}
                  <div className="admin-panel">
                    <h2>
                      {t(
                        "Son yönetici işlemleri",
                        "Recent administrator activity",
                      )}
                    </h2>
                    {data.audit.length ? (
                      data.audit.map((a, i) => (
                        <div className="audit-row" key={i}>
                          <span>{a.action}</span>
                          <small>{a.target}</small>
                          <time>{new Date(a.created_at).toLocaleString()}</time>
                        </div>
                      ))
                    ) : (
                      <p>{t("Henüz işlem yok.", "No activity yet.")}</p>
                    )}
                  </div>
                </>
              )}
              {tab === "orders" && (
                <>
                  <div className="admin-filters">
                    <label className="search">
                      <Search size={15} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t(
                          "Sipariş, müşteri veya e-posta ara",
                          "Search order, customer or email",
                        )}
                      />
                    </label>
                    <select
                      aria-label={t("Sipariş durumu", "Order status")}
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">
                        {t("Tüm durumlar", "All statuses")}
                      </option>
                      {Object.entries(statuses).map(([v, n]) => (
                        <option key={v} value={v}>
                          {t(...n)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {orders.map((o) => (
                    <AdminOrder
                      key={o.id + "-" + o.version}
                      order={o}
                      onChange={refresh}
                    />
                  ))}
                  {!orders.length && (
                    <div className="admin-empty">
                      {t("Sipariş bulunamadı.", "No orders found.")}
                    </div>
                  )}
                </>
              )}
              {tab === "products" &&
                (editor ? (
                  <ProductEditor
                    item={editor === "new" ? null : editor}
                    onSaved={refresh}
                    onClose={() => setEditor(null)}
                  />
                ) : (
                  <>
                    <div className="admin-section-head">
                      <h2>
                        {data.products.length} {t("ürün", "products")}
                      </h2>
                      <button
                        className="approve-button"
                        onClick={() => setEditor("new")}
                      >
                        <Plus size={17} />
                        {t("Yeni ürün ekle", "Add product")}
                      </button>
                    </div>
                    <div className="admin-product-grid">
                      {data.products.map((p) => (
                        <div className="admin-product" key={p.id}>
                          <img src={"/assets/" + p.image} alt="" />
                          <span className={p.active ? "save-success" : "muted"}>
                            {p.active
                              ? t("Yayında", "Published")
                              : t("Gizli", "Hidden")}
                          </span>
                          <h3>{p.title[lang === "tr" ? 0 : 1]}</h3>
                          <p>
                            {money(Math.round(p.price * 100), lang)} ·{" "}
                            {p.category}
                          </p>
                          <small>
                            {p.deliveryFile
                              ? t(
                                  "Teslimat dosyası hazır",
                                  "Delivery file ready",
                                )
                              : t(
                                  "Teslimat dosyası eksik",
                                  "Delivery file missing",
                                )}
                          </small>
                          <button
                            className="outline-button"
                            onClick={() => setEditor(p)}
                          >
                            {t("Düzenle", "Edit")}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ))}
              {tab === "requests" && (
                <div className="admin-request-grid">
                  {data.requests.map((r) => (
                    <AdminRequest
                      key={r.reference + r.status + r.reply}
                      request={r}
                      onChange={refresh}
                    />
                  ))}
                  {!data.requests.length && (
                    <div className="admin-empty">
                      {t("Henüz talep yok.", "No requests yet.")}
                    </div>
                  )}
                </div>
              )}
              {tab === "users" && (
                <div className="admin-panel admin-user-list">
                  <h2>{t("Kayıtlı hesaplar", "Registered accounts")}</h2>
                  {data.users.map((u) => (
                    <div key={u.id}>
                      <span className="admin-avatar">{u.name[0]}</span>
                      <span>
                        <b>{u.name}</b>
                        <small>{u.username || u.email}</small>
                      </span>
                      <span className="payment-status">
                        {u.role === "admin"
                          ? t("Yönetici", "Administrator")
                          : t("Müşteri", "Customer")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "settings" && (
                <AdminSettings settings={data.settings} onChange={refresh} />
              )}{" "}
              {tab === "security" && <PasswordSettings />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
