# Yün Kondisyon ve Yün Oranı Test Laboratuvarı Web Paneli

Bu proje, Android uygulamasındaki hesaplama motorunu, veri yapılarını ve raporlama özelliklerini birebir koruyarak **Vercel** üzerinde tek tıkla canlıya alınabilecek ve **mobil cihazlarda (iOS & Android)** uygulama deneyimi sunacak şekilde Next.js + Tailwind CSS + TypeScript ile geliştirilmiştir.

---

## 🚀 Vercel ile Canlıya Alma (2 Dakika)

### Seçenek 1: GitHub & Vercel Dashboard (Önerilen)
1. GitHub üzerinde yeni bir repo oluşturun (örn: `yun-kondisyon-web`).
2. Terminalde `web` klasörü içindeyken reponuzu bağlayıp gönderin:
   ```bash
   cd C:\Users\ASUS\Desktop\Projeler\YunKondisyonTesti\web
   git remote add origin https://github.com/KULLANICI_ADINIZ/yun-kondisyon-web.git
   git branch -M main
   git push -u origin main
   ```
3. [Vercel Dashboard](https://vercel.com)'a girin, **"Add New Project"** butonuna tıklayın ve GitHub reponuzu seçip **"Deploy"** butonuna basın.
4. Vercel size anında `https://yun-kondisyon-web.vercel.app` şeklinde canlı bir web bağlantısı verecektir.

### Seçenek 2: Vercel CLI ile Doğrudan Terminalden
1. `npm i -g vercel` (eğer yüklü değilse)
2. `web` klasöründeyken terminalde `vercel` yazıp Enter'a basarak yönergeleri onaylayın.

---

## 📱 Mobilde Uygulama Olarak Kullanma (PWA)
Canlıya aldığınız bağlantıyı telefonunuzun tarayıcısında açtığınızda:
- **iPhone (Safari):** Paylaş butonuna dokunun > **"Ana Ekrana Ekle"** seçeneğini seçin.
- **Android (Chrome):** Sağ üstteki üç noktaya dokunun > **"Uygulamayı Yükle / Ana Ekrana Ekle"** seçeneğini seçin.
Uygulama telefonunuzun ana ekranına bir ikon olarak yerleşir ve tam ekran (tarayıcı çubuğu olmadan) bir yerel mobil uygulama gibi çalışır.

---

## 🧪 Fonksiyonlar ve Hesaplama Formülleri

### 1. Yün Kondisyon Testi
- **Nem İçeriği (Moisture Content %):** `(Numune Nemli - Numune Kuru) / Numune Nemli × 100`
- **Regain (Kuru Bazlı %):** `(Numune Nemli - Numune Kuru) / Numune Kuru × 100`
- **Toplam Kuru Ağırlık (Total Dry Weight kg):** `Net KG (Nemli) × (Numune Kuru / Numune Nemli)`
- **Parti Ticari Ağırlığı (Invoice Weight kg):** `Toplam Kuru Ağırlık × (1 + Standart Nem / 100)`
- **Standart Regain (kg ve %):** Standart nem oranına (ör. %17) göre gelen toplam içindeki regain miktarı.
- **Gain (Kazanım / Fark kg ve %):** `Parti Ticari Ağırlığı - Net KG`
- **Çeki Listesi Karşılaştırması:** Çeki listesindeki Kondisyon KG ve Kondisyon Oranı ile otomatik karşılaştırma.
- **Kurutma Notları:** Fırındaki numunenin peş peşe tartımlarını dara (TARE) düşerek kaydetme ve arşive kaldırma.
- **PDF Raporu:** Tüm formül açıklamaları ve değerleri içeren resmi A4 test raporu oluşturma ve doğrudan mobil paylaşım (WhatsApp, Mail vb.).

### 2. Yün Oranı Testi
- **1. Numune (Kostik Çözeltisi):** Yün tamamen çözünür, geriye yalnızca **Diğer** (viskon vb.) kalır.
- **2. Numune (Yıkama ve Kurutma):** Geriye **Yün + Diğer** kalır.
- **Diğer Oranı (%):** `Numune 1 Son Tartım / Numune 2 Son Tartım × 100`
- **Yün Oranı (%):** `100 − Diğer Oranı (%)`
- **Dahili Kurutma Kronometresi:** Mobil ekran kapansa dahi arka planda gerçek zamanlı sayan ileri kronometre.
- **Çoklu Test Seçimi & Tek Sayfa PDF:** Geçmişten istediğiniz testleri seçip aralarında ince ayırıcı çizgilerle tek bir sayfada toplu PDF çıktısı alma ve silme.

### 3. Notlar ve Veri Güvenliği
- **Test Bekleyen Lotlar:** Hızlı karalama ve lot listesi not defteri (otomatik kayıt).
- **Yedekleme & Geri Yükleme:** Tüm verilerinizi tek tıkla JSON dosyası olarak indirme ve başka cihaza aktarma.
- **Çevrimdışı (Offline) Desteği:** Veriler cihazınızın yerel hafızasında (LocalStorage) güvenle saklanır, internet olmasa bile çalışır.

---

## ☁️ Bulut Senkronizasyonu (PC + Telefon Canlı Eşitleme)

Uygulama **Hibrit (Offline-First)** mimariyle çalışır:
- **İnternet varken:** Bilgisayar veya telefondan kaydettiğiniz tüm testler anında bulut veritabanına kaydedilir ve diğer tüm cihazlarda saniyeler içinde görünür.
- **İnternet kesildiğinde:** Testler cihazın yerel hafızasına (LocalStorage) güvenle kaydedilir. İnternet tekrar geldiğinde arka planda otomatik olarak buluta aktarılır.

### Vercel Storage (Postgres/Neon) Aktif Etme:
1. [Vercel Dashboard](https://vercel.com)'da projenizi açın.
2. Üst menüden **"Storage"** sekmesine gidin.
3. **"Create Database"** butonuna tıklayıp **Postgres (Neon)** seçeneğini seçin.
4. **"Connect to Project"** diyerek projenize bağlayın.
5. Vercel gerekli `DATABASE_URL` ve `POSTGRES_URL` ortam değişkenlerini otomatik olarak ekler. Başka hiçbir ayar yapmanıza gerek yoktur!

---

## 💻 Yerel Geliştirme (Localhost)
Bilgisayarınızda test etmek için:
```bash
cd C:\Users\ASUS\Desktop\Projeler\YunKondisyonTesti\web
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresine gidin.
