# dfbng software

Türkçe/İngilizce yazılım mağazası. React + Vite, Node.js 24 ve SQLite. Ana site, kullanıcı hesabı, IBAN ile havale/EFT siparişleri ve yönetim paneli birlikte çalışır.

## Hızlı kurulum

Node.js **24 veya üstünü** yükleyin, ZIP'i çıkartın ve proje klasöründe terminal açın:

```sh
npm ci
npm run dev
```

Site: **http://localhost:5173** — Yönetim: **http://localhost:5173/admin**

Teslim edilen ZIP'te Efe hesabının şifre özeti `.private/admin-seed.json` içinde bulunur. Belirttiğiniz şifreyle giriş yapabilirsiniz. Şifre açık metin olarak frontend veya kaynak koda yazılmaz. İlk çalıştırmada hesap oluşturulur. Yeniden başlatma mevcut yönetici şifresini değiştirmez. Güvenlik bölümünden şifrenizi değiştirebilirsiniz.

## İlk yapılacaklar

1. **Site Ayarları:** Havale bilgileri hazırdır. IBAN: `TR95 0001 5001 5800 7314 5318 43`, alıcı: **EFE KENAN ULUS**. Ücretli siparişler açıktır; banka adı isteğe bağlıdır. İleride bu bilgileri panelden değiştirebilirsiniz.
2. **Ürünler:** Fiyatları ve Türkçe/İngilizce açıklamaları düzenleyin. Kendi gerçek ürün ZIP dosyalarınızı yükleyin (en fazla 25 MB). Varsayılan katalog görselleri tanıtım içindir; ticari plugin/harita dosyaları pakete dahil değildir.
3. İletişim e-postanızı ekleyin. Sosyal bağlantılar için **Siteyi Düzenle → Sosyal bağlantılar** ekranını kullanın; buradaki özel bağlantılar başlangıçtaki Discord/Instagram ayarlarına göre önceliklidir.
4. **Siteyi Düzenle → Tüm metinler / Sayfa oluşturucu:** İşletmenize ait kullanım, teslimat ve gizlilik metinlerini panelden düzenleyin. Kaydetmeniz yeterlidir.

## Havale / EFT akışı

- Müşteri kayıt olur/giriş yapar, ürünü seçer ve siparişini oluşturur.
- Tutar sunucudaki ürün fiyatından alınır. Sipariş IBAN'ı, hesap sahibi ve fiyat siparişe kaydedilir; sonraki ayar değişiklikleri eski siparişleri değiştirmez.
- Müşteri havale açıklamasına sipariş numarasını yazar. Transfer yaptıktan sonra gönderen adı, tarih ve banka işlem/dekont numarasıyla bildirim gönderir.
- Bildirim otomatik onay değildir. **Banka hesabınızdaki gerçek transferi kontrol edin**, ardından Siparişler & Ödemeler bölümünden onaylayın veya gerekçesiyle reddedin. Reddedilen bildirim müşteri tarafından düzeltilebilir.
- Onaydan sonra müşterinin kendi sipariş sayfasında ürün indirme bağlantısı açılır. Dosya yoksa hazırlanıyor bilgisi gösterilir. Ücretsiz siparişler otomatik onaylanır.
- Aynı isteğin tekrarı aynı siparişi döndürür. Diğer müşterilerin sipariş ve dosyalarına erişilemez.

## Yönetim paneli

- Özet: sipariş sayıları, onay bekleyen ödemeler, onaylanan toplam tutar, müşteriler ve işlem kaydı.
- Siparişler: arama, durum filtresi, manuel banka kontrolü sonrası onay/ret, iptal ve teslim durumu.
- Ürünler: oluşturma, düzenleme, fiyat/etiket/görsel, Türkçe/İngilizce içerik, ZIP yükleme ve yayından kaldırma. Ürün gizlense de mevcut sipariş kayıtları korunur.
- Talepler: iletişim, kariyer ve özel sipariş taleplerini görüntüleme, yanıtlama, durum güncelleme. Giriş yapmış müşteriler yanıtlarını hesaplarında görür; misafir için ayrıca e-posta ile ulaşın.
- Üyeler: müşteri ve yönetici listesi. Şifre özetleri API yanıtlarına dahil edilmez.
- Güvenlik: yönetici şifresi değiştirme; diğer açık yönetici oturumları iptal edilir.

## Üretim

```sh
npm run build
npm start
```

ZIP, hazır `dist/` derlemesini de içerir. Kaynakları değiştirirseniz yeniden derleyin. `npm start` aynı Node sunucusundan API ve derlenmiş siteyi sunar; yalnızca `dist` klasörünü statik bir hosting'e yüklemek yeterli değildir.

Üretimde HTTPS ters vekili kullanın; oturum çerezleri Secure olarak ayarlanır. Yapılandırma ortam değişkenleri:

- `PORT`: 5173
- `DATA_DIR`: varsayılan proje içindeki `.data`; kalıcı ve yazılabilir olmalı.
- `APP_ORIGIN`: HTTPS alan adınız, örneğin `https://example.com`. Ters vekil kullanırken ayarlayın.
- `ADMIN_SEED_FILE`: alternatif yönetici başlangıç dosyası yolu; varsayılan `.private/admin-seed.json`.

`.data/` veritabanını ve yüklenen ürün dosyalarını içerir. Bu dizini düzenli yedekleyin. `.private/`, `.data/`, `.env` ve Git verileri statik yayın alanına koyulmamalıdır. Uygulamanın geliştirme sunucusu özel dosyaların indirilmesini engeller; üretimde yalnızca `dist` statik olarak sunulur.

## Kontroller

```sh
npm test
npm run build
```

Testler geçici veritabanlarında çalışır; gerçek banka transferi yapmaz. Yönetici yetkisi, müşteri izolasyonu, fiyat ve IBAN tutarlılığı, ödeme durumları, dosya indirme izni, şifre değiştirme ve yeniden başlatma sonrası kalıcılık doğrulanır.

## Kapsam

Banka entegrasyonu/otomatik banka sorgusu yoktur; havaleler yönetici tarafından kontrol edilir. Otomatik e-posta, şifre sıfırlama, e-posta doğrulama ve herkese açık forum gönderileri bulunmaz. Destek yanıtları site hesabında görüntülenir. Forum kartları destek formuna gider. Üçüncü taraf hizmetlere ve canlı siteye yayınlama bu ZIP'in parçası değildir.

Tasarım referansı: https://lbdevz.com/. Tanıtım görselleri ve fontlar referans sitenin herkese açık varlıklarından alınmıştır. Gerçek yayın öncesinde kendi görselleriniz ve ürünlerinizle değiştirin veya kullanım hakkını doğrulayın.

## Sitedeki içerikleri değiştirme

Yönetim panelinde **Siteyi Düzenle** bölümüne girin. Site adı da değiştirilebilir. İstediğiniz başlığı seçip alanları düzenleyin; **Değişiklikleri kaydet** butonuna basın. Türkçe/İngilizce başlıkları, görselleri, menüleri, ana sayfa sırasını, renkleri, blog/hizmet/SSS/rehber içeriklerini ve özel sayfaları buradan yönetebilirsiniz. Yeni görsel için önce **Görsel yükle**, sonra ilgili görsel alanından seçim yapın.

**Sayfa oluşturucu** ekranında bir sayfa adresi ve iki dilde başlık girin; içerik blokları ekleyin. `/about` gibi bir içerik sayfasının adresini kullanırsanız eski tasarımın yerine yeni sayfanız gösterilir. `/` adresiyle ana sayfayı da yeniden oluşturabilirsiniz. Ödeme, hesap, ürün ve admin ekranlarının işlem yolları korunur.

**Yedek ve geçmiş** son 20 kayda dönüş ve JSON içerik yedeği sunar. Tam yedek için sunucuyu durdurup `.data` ve `.private` klasörlerini güvenli bir yerde saklayın. Güncelleme sırasında bu klasörleri silmeyin. Yeni ZIP, mevcut veritabanınızı kendiliğinden sıfırlamaz.

Bu paket önceden derlenmiş `dist` içerir. `npm ci` ardından `npm start` ile başlatabilirsiniz. Geliştirme/yeniden derleme komutları kaynak görsellerini gerektiğinde otomatik geri yükler.
