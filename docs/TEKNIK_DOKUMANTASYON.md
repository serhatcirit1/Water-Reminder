# Water Reminder - Teknik Dökümantasyon

Bu döküman, Water Reminder (Su Hatırlatıcı) uygulamasının teknik yapısını, kurulumunu ve önemli modüllerini detaylandırmaktadır.

## 📱 Proje Genel Bakış

Water Reminder, kullanıcıların günlük su tüketimlerini takip etmelerine yardımcı olan, kişiselleştirilmiş hedefler sunan ve oyunlaştırma öğeleri (rozetler, seviyeler) içeren bir React Native mobil uygulamasıdır.

**Temel Özellikler:**
*   Günlük su takibi ve geçmiş analizi
*   Akıllı hedef belirleme (Hava durumu, aktivite ve geçmişe dayalı)
*   Kişiselleştirilmiş hatırlatıcılar ve bildirimler
*   Apple HealthKit entegrasyonu (iOS)
*   Oyunlaştırma: Seviye sistemi, rozetler ve seriler (streaks)
*   Premium özellikler ve tema desteği
*   Çoklu dil desteği (i18n)

## 🛠 Kurulum ve Başlatma

Geliştirme ortamını hazırlamak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Node.js (v18+)
*   npm veya yarn
*   Expo Go uygulaması (Telefonda test için)

### Adımlar

1.  **Depoyu Klonlayın:**
    ```bash
    git clone <repo-url>
    cd Water
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    yarn install
    ```

3.  **Uygulamayı Başlatın:**
    ```bash
    npx expo start
    ```
    Çıkan QR kodunu Expo Go uygulaması ile taratarak (Android) veya Kamera ile taratarak (iOS) uygulamayı çalıştırabilirsiniz.

## 📂 Proje Yapısı

```
Water/
├── App.tsx                 # Ana giriş noktası ve Navigasyon yapısı
├── assets/                 # Resimler, ikonlar ve fontlar
├── components/             # Yeniden kullanılabilir UI bileşenleri
├── screens/                # Uygulama ekranları
│   ├── AnaSayfaEkrani.tsx
│   ├── IstatistiklerEkrani.tsx
│   ├── AyarlarEkrani.tsx
│   └── OnboardingEkrani.tsx
├── locales/                # Dil dosyaları (i18n)
├── docs/                   # Dökümantasyon
└── ...yardımcı modüller (*.ts)
```

## 🧩 Temel Bileşenler ve Modüller

### 1. Ekranlar (Screens)
*   **AnaSayfaEkrani (`screens/AnaSayfaEkrani.tsx`)**: Günlük su ekleme, ilerleme halkası, hızlı ekleme butonları ve günlük ipuçlarının bulunduğu ana ekran.
*   **IstatistiklerEkrani (`screens/IstatistiklerEkrani.tsx`)**: Haftalık/Aylık grafikler, rozet koleksiyonu ve detaylı tüketim analizleri.
*   **AyarlarEkrani (`screens/AyarlarEkrani.tsx`)**: Kullanıcı tercihleri, bildirim ayarları, tema seçimi, dil ayarları ve veri yönetimi.
*   **OnboardingEkrani (`screens/OnboardingEkrani.tsx`)**: İlk açılışta kullanıcıdan temel bilgileri (kilo, cinsiyet, vb.) alan karşılama ekranı.

### 2. Akıllı Özellikler (AI Utils)
**Dosya:** `aiUtils.ts`

Uygulamanın "beyni" olarak çalışan bu modül, kullanıcı davranışlarını analiz eder ve öneriler sunar:
*   **Akıllı Hedef (`akilliHedefHesapla`)**: Sıcaklık, adım sayısı ve geçmiş verilere göre dinamik su hedefi belirler.
*   **İçgörüler (`Insight Generator`)**: "Sabahları az su içiyorsun", "Rekora çok yakınsın" gibi kişiselleştirilmiş mesajlar üretir.
*   **Trend Analizi**: Tüketim alışkanlıklarındaki artış veya azalış eğilimlerini tespit eder.

### 3. Bildirim Sistemi
**Dosya:** `bildirimler.ts`

Expo Notifications kütüphanesini kullanarak yerel bildirimleri yönetir:
*   **Hatırlatmalar**: Belirlenen aralıklarla su içme hatırlatması yapar.
*   **Akıllı Hatırlatma**: Kullanıcı uzun süre su içmediyse devreye girer.
*   **Günlük/Haftalık Özetler**: Gün sonunda veya hafta bitiminde performans raporu sunar.

### 4. Sağlık Entegrasyonu (HealthKit)
**Dosya:** `healthKit.ts`

Sadece iOS cihazlarda aktiftir. `react-native-health` kütüphanesini kullanır:
*   Su tüketim verilerini Apple Health'e yazar.
*   Adım sayısı ve aktif enerji (kalori) verilerini okuyarak akıllı hedef hesaplamasında kullanır.
*   Çift yönlü senkronizasyon sağlar.

### 5. Veri Yönetimi
Uygulama, verilerin kalıcılığı için `AsyncStorage` kullanır.
*   **Anahtarlar**: `@gunluk_su`, `@su_gecmisi`, `@ayarlar`, `@user_profile` vb.
*   Tüm veriler cihazda yerel olarak saklanır, dış sunucuya gönderilmez (Gizlilik odaklı).

### 6. Tema ve Premium
*   **TemaContext (`TemaContext.tsx`)**: Uygulama genelinde renk temalarını (Açık, Koyu, Mavi, Yeşil vb.) yönetir.
*   **PremiumContext (`PremiumContext.tsx`)**: Premium üyelik durumunu ve özellik kısıtlamalarını kontrol eder.

## 🌍 Dil Desteği (Localization)
`i18next` ve `react-i18next` kullanılmıştır.
*   Dil dosyaları `locales/` klasöründe bulunur (`tr.json`, `en.json`, vb.).
*   Cihaz diline göre otomatik seçim yapar veya ayarlardan değiştirilebilir.

## 📝 Geliştirme Notları
*   Yeni bir özellik eklerken `docs/TODO.md` dosyasını kontrol edin.
*   Kod stilini korumak için TypeScript tiplerine sadık kalın.
*   Her yeni fonksiyon için kısa bir JSDoc/Yorum satırı eklemeyi unutmayın.
