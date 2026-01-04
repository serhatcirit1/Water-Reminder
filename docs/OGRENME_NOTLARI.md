# 📚 React Native Öğrenme Notları
# Su İçme Uygulaması Geliştirme Sürecinde Öğrendiklerim
# =====================================================

## 🚀 GENEL BİLGİLER
## ================

### React Native Nedir?
- Facebook tarafından geliştirilen bir mobil uygulama framework'ü
- Tek kod yazarak hem iOS hem Android uygulaması yapabilirsin
- JavaScript/TypeScript kullanılır (web'de kullanılan diller)
- Native (telefona özel) componentlere dönüştürülür = hızlı ve doğal görünüm

### Expo Nedir?
- React Native üzerine kurulmuş bir araç seti
- Kurulumu ve geliştirmeyi çok kolaylaştırır
- Expo Go uygulaması ile telefonunda anında test edebilirsin
- Mac olmadan bile iOS uygulaması geliştirmene izin verir!

### Hot Reload Nedir?
- Kod değiştirdiğinde uygulamanın otomatik güncellenmesi
- Uygulamayı baştan başlatmana gerek kalmaz
- Geliştirme sürecini çok hızlandırır


## 📁 PROJE DOSYA YAPISI
## ====================

Water/
├── App.tsx             → Ana uygulama dosyası, tüm kod burada başlar
├── bildirimler.ts      → Bildirim sistemi modülü (yeni eklendi)
├── app.json            → Uygulama ayarları (isim, ikon, açılış ekranı)
├── package.json        → Kullandığın kütüphanelerin listesi
├── package-lock.json   → Kütüphanelerin tam versiyonları (dokunma)
├── tsconfig.json       → TypeScript ayarları
├── index.ts            → Uygulamanın başladığı nokta
├── .gitignore          → Git'in yoksayacağı dosyalar
├── assets/             → Resimler, ikonlar, fontlar
└── node_modules/       → İndirilen kütüphaneler (çok büyük, Git'e eklenmez)


### Dosya Açıklamaları:

1. **App.tsx**
   - .tsx = TypeScript + JSX (HTML benzeri syntax)
   - Uygulamanın ana componenti burada
   - Şimdilik tek dosyada çalışıyoruz, ileride böleceğiz

2. **package.json**
   - Projenin kimlik kartı gibi
   - Hangi kütüphaneleri kullandığını yazar
   - "npm install" komutu bu dosyayı okuyarak kütüphaneleri indirir
   
3. **app.json**
   - Expo'ya özel ayarlar
   - Uygulama adı, sürümü, ikonu burada tanımlanır
   - App Store'a yüklerken bu bilgiler kullanılır

4. **node_modules/**
   - "npm install" ile indirilen tüm kütüphaneler burada
   - Çok yer kaplar (yüzlerce MB olabilir)
   - Asla Git'e eklenmez, her bilgisayarda yeniden indirilir


## 🧩 TEMEL KAVRAMLAR
## ==================

### 1. Component (Bileşen)
- UI'ın yapı taşları
- Tekrar kullanılabilir parçalar
- Her component bir fonksiyon olarak yazılır

Örnek:
```tsx
function Buton() {
  return (
    <TouchableOpacity>
      <Text>Tıkla!</Text>
    </TouchableOpacity>
  );
}
```

### 2. JSX (JavaScript XML)
- JavaScript içinde HTML-benzeri kod yazmanı sağlar
- Tarayıcıdaki HTML'e benzer ama farklı kuralları var

HTML vs JSX farkları:
- class → className (JSX'te class reserved keyword)
- onclick → onPress (React Native'de)
- style="..." → style={{...}} (obje olarak yazılır)

### 3. Props (Properties - Özellikler)
- Component'e dışarıdan veri göndermek için kullanılır
- Fonksiyon parametreleri gibi düşün

Örnek:
```tsx
// Component tanımı
function Selam({ isim }) {
  return <Text>Merhaba {isim}!</Text>;
}

// Kullanımı
<Selam isim="Ahmet" />  // Ekranda: "Merhaba Ahmet!"
```

### 4. State (Durum)
- Component'in değişebilen verileri
- State değişince ekran otomatik güncellenir
- useState hook'u ile tanımlanır

Örnek:
```tsx
const [sayac, setSayac] = useState(0);
// sayac: şu anki değer (0)
// setSayac: değeri değiştiren fonksiyon
// useState(0): başlangıç değeri 0

// Değeri değiştirmek için:
setSayac(5);        // sayac artık 5
setSayac(sayac + 1); // sayac bir artar
```

ÖNEMLİ: State'i doğrudan değiştirme!
```tsx
// YANLIŞ ❌
sayac = 5;

// DOĞRU ✅
setSayac(5);
```

### 5. Hook (Kanca)
- "use" ile başlayan özel fonksiyonlar
- React'ın özel yeteneklerini kullanmamızı sağlar
- En çok kullanılanlar:
  - useState: state yönetimi
  - useEffect: yan etkiler (API çağrısı, veri yükleme)
  - useRef: DOM elemanlarına erişim


## 🎨 TEMEL COMPONENTLER
## ====================

### View
- En temel container (kutu)
- Web'deki <div> gibi
- İçine başka componentler koyarsın

```tsx
<View style={{ padding: 20 }}>
  <Text>İçerik buraya</Text>
</View>
```

### Text
- Yazı göstermek için
- Web'deki <p> veya <span> gibi
- React Native'de yazılar mutlaka Text içinde olmalı!

```tsx
<Text style={{ fontSize: 24, color: 'blue' }}>
  Merhaba Dünya!
</Text>
```

### TouchableOpacity
- Tıklanabilir alan
- Basınca hafif şeffaflaşır (güzel feedback)
- onPress ile tıklama olayını yakala

```tsx
<TouchableOpacity onPress={() => alert('Tıkladın!')}>
  <Text>Bana Bas</Text>
</TouchableOpacity>
```

### Image
- Resim göstermek için
- Yerel veya internet'ten resim yükleyebilir

```tsx
// Yerel resim
<Image source={require('./assets/logo.png')} />

// İnternet'ten resim
<Image source={{ uri: 'https://example.com/resim.jpg' }} />
```

### ScrollView
- Kaydırılabilir alan
- İçerik ekrandan taşarsa kullanırsın

```tsx
<ScrollView>
  <Text>Uzun içerik...</Text>
  <Text>Daha fazla içerik...</Text>
</ScrollView>
```

### TextInput
- Kullanıcıdan yazı almak için
- Web'deki <input> gibi

```tsx
const [isim, setIsim] = useState('');

<TextInput
  value={isim}
  onChangeText={setIsim}
  placeholder="İsminizi yazın..."
/>
```


## 💅 STYLE (STİL) SİSTEMİ
## ======================

### StyleSheet.create
- Stilleri tanımlamak için kullanılır
- CSS'e benzer ama JavaScript objesi olarak yazılır
- camelCase kullanılır (background-color → backgroundColor)

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // Tüm alanı kapla
    backgroundColor: '#ffffff', // Arka plan rengi
    padding: 20,                // İç boşluk (tüm kenarlar)
    margin: 10,                 // Dış boşluk (tüm kenarlar)
  },
  baslik: {
    fontSize: 24,               // Yazı boyutu
    fontWeight: 'bold',         // Kalın yazı
    color: '#333333',           // Yazı rengi
    textAlign: 'center',        // Ortala
  },
});

// Kullanımı:
<View style={styles.container}>
  <Text style={styles.baslik}>Merhaba!</Text>
</View>
```

### Flexbox Layout
- Elemanları düzenlemek için kullanılır
- En önemli özellikler:

```tsx
{
  flex: 1,                    // Mevcut alanı kapla (oran)
  flexDirection: 'row',       // Yatay düzen ('column' dikey)
  justifyContent: 'center',   // Ana eksende hizalama
  alignItems: 'center',       // Çapraz eksende hizalama
  gap: 10,                    // Elemanlar arası boşluk
}
```

justifyContent değerleri:
- 'flex-start': Başa yasla
- 'flex-end': Sona yasla
- 'center': Ortala
- 'space-between': Eşit aralık (kenarlar hariç)
- 'space-around': Eşit aralık (kenarlar dahil)

### Birden fazla stil birleştirme
```tsx
<View style={[styles.container, styles.ozelStil, { marginTop: 50 }]}>
```


## 🔧 SIK KULLANILAN KOMUTLAR
## =========================

### Terminal Komutları

# Projeyi başlat
npx expo start

# Yeni paket kur
npx expo install paket-adi
# veya
npm install paket-adi

# Tüm bağımlılıkları yükle (yeni clone'da)
npm install

# Cache temizle ve başlat
npx expo start --clear


## 📱 TEST ETME YÖNTEMLERİ
## ======================

### 1. Expo Go (En Kolay)
- App Store/Play Store'dan Expo Go indir
- QR kodu tara
- Anında test et

### 2. Emulator/Simulator
- Android Studio kurarak Android emulator
- Mac gerektiren iOS simulator
- Daha yavaş ama ek özelliklere erişim var

### 3. Development Build
- İleri seviye testler için
- Native modüllere erişim
- EAS Build ile bulutta derleme


## 💡 İPUÇLARI
## ===========

1. Console.log yerine console.log kullan (aynı!)
   - Terminal'de çıktıları görebilirsin

2. Hata aldığında terminale bak
   - Expo çok açıklayıcı hata mesajları verir

3. Hot Reload çalışmazsa:
   - Terminalde 'r' tuşuna bas (reload)
   - Veya Expo Go'da telefonu salla → "Reload"

4. Her şeyi bir anda öğrenmeye çalışma
   - Temelleri öğren, pratik yap
   - Yeni özellik gerekince araştır

5. TypeScript hataları:
   - Kırmızı dalgalı çizgiler önemli
   - Type hataları runtime'da değil, yazarken görünsün


## 📖 SONRAKİ ADIMLAR
## =================

1. [x] Proje kurulumu ✅
2. [x] İlk component ve styling ✅
3. [x] Button ve state yönetimi ✅
4. [x] AsyncStorage ile veri kaydetme ✅
5. [x] Bildirimler (Push Notifications) ✅
6. [x] Component'leri dosyalara ayırma ✅
7. [x] Navigation (sayfalar arası geçiş) ✅
8. [ ] API bağlantısı


## 💾 ASYNCSTORAGE (VERİ KAYDETME)
## ===============================

### AsyncStorage Nedir?
- Telefonda kalıcı veri saklamak için kullanılır
- Uygulama kapansa bile veriler kaybolmaz
- Anahtar-değer (key-value) şeklinde çalışır
- Sadece STRING değerler kaydedebilir

### Kurulum
```bash
npx expo install @react-native-async-storage/async-storage
```

### Temel Kullanım

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// VERİ KAYDETME
// await = işlem bitene kadar bekle
await AsyncStorage.setItem('anahtar', 'değer');

// Obje kaydetmek için önce string'e çevir
const veri = { isim: 'Ahmet', yas: 25 };
await AsyncStorage.setItem('kullanici', JSON.stringify(veri));


// VERİ OKUMA
const deger = await AsyncStorage.getItem('anahtar');
// deger = 'değer' veya null (eğer yoksa)

// Obje okumak için parse et
const kayitliVeri = await AsyncStorage.getItem('kullanici');
if (kayitliVeri !== null) {
  const kullanici = JSON.parse(kayitliVeri);
  // kullanici = { isim: 'Ahmet', yas: 25 }
}


// VERİ SİLME
await AsyncStorage.removeItem('anahtar');

// TÜMÜNÜ TEMİZLE
await AsyncStorage.clear();
```

### async/await Nedir?
- Asenkron (beklemeli) işlemler için kullanılır
- Veri okuma/yazma gibi işlemler zaman alır
- await: "Bu işlem bitene kadar bekle" demek
- async: "Bu fonksiyon await kullanacak" demek

```tsx
// async fonksiyon tanımı
const veriYukle = async () => {
  // await ile bekle
  const veri = await AsyncStorage.getItem('sayac');
  console.log(veri);
};
```

### JSON.stringify ve JSON.parse
- AsyncStorage sadece string kaydeder
- Obje/dizi kaydetmek için dönüştürme gerekir

```tsx
// Obje → String (kaydetmek için)
const obje = { a: 1, b: 2 };
const string = JSON.stringify(obje);
// string = '{"a":1,"b":2}'

// String → Obje (okumak için)
const yeniObje = JSON.parse(string);
// yeniObje = { a: 1, b: 2 }
```


## ⚡ useEffect HOOK
## =================

### useEffect Nedir?
- "Yan etki" (side effect) işlemleri için kullanılır
- Veri yükleme, API çağrısı, abonelik gibi işlemler

### Syntax
```tsx
useEffect(() => {
  // Burası çalışır
  console.log('Effect çalıştı!');
}, [bağımlılıklar]);
```

### Bağımlılık Dizisi (Dependency Array)

```tsx
// 1. Boş dizi = Sadece ilk açılışta çalış
useEffect(() => {
  console.log('Uygulama açıldı!');
}, []);

// 2. Değişken var = O değişken değişince çalış
useEffect(() => {
  console.log('Sayaç değişti:', sayac);
}, [sayac]);

// 3. Dizi yok = Her render'da çalış (dikkat!)
useEffect(() => {
  console.log('Her seferinde çalışır');
}); // ⚠️ Genelde bu kullanılmaz
```

### Cleanup (Temizlik)
- Component kaldırıldığında yapılacak işlemler

```tsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Timer çalışıyor');
  }, 1000);
  
  // Cleanup fonksiyonu
  return () => {
    clearInterval(timer); // Timer'ı durdur
  };
}, []);
```


## 🚨 TRY-CATCH (HATA YÖNETİMİ)
## ============================

```tsx
try {
  // Hata verebilecek kod buraya
  const veri = await AsyncStorage.getItem('anahtar');
  console.log('Başarılı:', veri);
} catch (hata) {
  // Hata olursa burası çalışır
  console.error('Hata oluştu:', hata);
} finally {
  // Her durumda çalışır (opsiyonel)
  console.log('İşlem bitti');
}
```


## 🔔 BİLDİRİMLER (PUSH NOTIFICATIONS)
## ===================================

### Expo Notifications Kurulumu
```bash
npx expo install expo-notifications expo-device
```

### Temel Kullanım

```tsx
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

// Bildirim ayarları (uygulama ön plandayken nasıl davranacak)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Bildirim göster
    shouldPlaySound: true,    // Ses çal
    shouldSetBadge: true,     // Uygulama ikonunda sayı göster
    shouldShowBanner: true,   // Banner göster (iOS)
    shouldShowList: true,     // Liste göster (iOS)
  }),
});
```

### İzin İsteme
iOS'da bildirim için kullanıcı izni gerekir.

```tsx
import * as Device from 'expo-device';

// Fiziksel cihaz kontrolü
if (!Device.isDevice) {
  console.log('Bildirimler emülatörde çalışmaz!');
  return;
}

// İzin durumunu kontrol et
const { status } = await Notifications.getPermissionsAsync();

// İzin yoksa iste
if (status !== 'granted') {
  const { status: yeniDurum } = await Notifications.requestPermissionsAsync();
  if (yeniDurum !== 'granted') {
    alert('Bildirim izni verilmedi!');
  }
}
```

### Bildirim Zamanlama

```tsx
// Belirli saniye sonra bildirim gönder
await Notifications.scheduleNotificationAsync({
  content: {
    title: '💧 Su İçme Zamanı!',
    body: 'Sağlıklı kalmak için su iç!',
    sound: true,
  },
  trigger: {
    type: SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 60, // 60 saniye sonra
    repeats: false,
  },
});

// Tüm planlanmış bildirimleri iptal et
await Notifications.cancelAllScheduledNotificationsAsync();
```

### Modüler Yapı (Separation of Concerns)
Kodu düzenli tutmak için bildirim işlemleri ayrı dosyaya alındı:
- bildirimler.ts → Bildirim fonksiyonları
- App.tsx → Ana uygulama

Bu yaklaşımın faydaları:
- Kod daha okunabilir
- Test etmek kolay
- Bakım yapmak kolay
- Tekrar kullanılabilir


## 🔘 SWITCH COMPONENT
## ===================

Aç/kapa (toggle) butonu için kullanılır.

```tsx
import { Switch } from 'react-native';

const [aktif, setAktif] = useState(false);

<Switch
  value={aktif}
  onValueChange={setAktif}
  trackColor={{ false: '#767577', true: '#81b0ff' }}  // Arkaplan rengi
  thumbColor={aktif ? '#f5dd4b' : '#f4f3f4'}          // Düğme rengi
/>
```


## 📜 SCROLLVIEW
## =============

İçerik ekrandan uzunsa kaydırılabilir yapmak için kullanılır.

```tsx
import { ScrollView } from 'react-native';

<ScrollView 
  style={{ flex: 1 }}
  contentContainerStyle={{ padding: 20 }}
>
  {/* Uzun içerik buraya */}
</ScrollView>
```

NOT: ScrollView içindeki componentler için "flex: 1" çalışmaz, 
contentContainerStyle kullanılmalı.


## 🗂️ MODÜL OLUŞTURMA VE IMPORT
## ============================

### Fonksiyon Export Etme (bildirimler.ts)
```tsx
// Her fonksiyonu ayrı ayrı export edebilirsin
export async function bildirimGonder() {
  // ...
}

export function hesapla(x: number) {
  return x * 2;
}
```

### Modül Import Etme (App.tsx)
```tsx
// Belirli fonksiyonları import et
import { bildirimGonder, hesapla } from './bildirimler';

// Veya tüm modülü import et
import * as Bildirimler from './bildirimler';
Bildirimler.bildirimGonder();
```

Önemli:
- ./ = aynı klasör
- ../ = üst klasör
- Dosya uzantısı (.ts, .tsx) yazılmaz


## 📦 APP STORE'A YÜKLEME (EAS BUILD)
## ===================================

### EAS Nedir?
Expo Application Services - Expo'nun bulut hizmetleri:
- EAS Build: Uygulamanı bulutta derler
- EAS Submit: Store'a gönderir
- EAS Update: Yayın sonrası güncelleme

### Kurulum
```bash
# EAS CLI kur (bir kerelik)
npm install -g eas-cli

# Expo hesabıyla giriş
eas login

# Projeyi yapılandır
eas build:configure
```

### Build Alma
```bash
# iOS için
eas build --platform ios

# Android için
eas build --platform android

# İkisi birden
eas build --platform all
```

### Store'a Gönderme
```bash
eas submit --platform ios      # App Store
eas submit --platform android  # Play Store
```

### Gereksinimler

**iOS App Store:**
- Apple Developer hesabı ($99/yıl)
- 1024x1024 ikon
- Ekran görüntüleri
- Gizlilik politikası URL

**Google Play Store:**
- Google Developer hesabı ($25 tek seferlik)
- 512x512 ikon
- Feature graphic (1024x500)
- Ekran görüntüleri

### OTA Güncelleme (Store Review Beklemeden)
JavaScript değişiklikleri için:
```bash
eas update --branch production
```
Kullanıcılar uygulamayı açtığında otomatik güncellenir!

### Fiyatlandırma
- Free: 30 build/ay (başlangıç için yeterli)
- Production: $99/ay (sınırsız)


## 🧱 COMPONENT YAPISI
## ==================

### Neden Component'leri Ayırırız?
- Kod daha okunabilir olur
- Tekrar kullanılabilir parçalar oluşur
- Test etmek kolaylaşır
- Ekip çalışmasında çakışma azalır

### Proje Yapısı
```
Water/
├── App.tsx                 → Ana koordinatör
├── bildirimler.ts          → Bildirim işlemleri
└── components/             → UI component'leri
    ├── index.ts            → Barrel export
    ├── SuSayac.tsx         → Sayaç ve butonlar
    ├── IlerlemeCubugu.tsx  → İlerleme çubuğu
    └── AyarlarPaneli.tsx   → Bildirim ayarları
```

### Props ile Veri Aktarımı
```tsx
// Parent → Child veri gönderimi
<SuSayac
  suSayaci={5}           // Veri
  onSuIc={handleSuIc}    // Callback fonksiyon
/>

// Child component'te alma
interface SuSayacProps {
  suSayaci: number;
  onSuIc: () => void;
}

function SuSayac({ suSayaci, onSuIc }: SuSayacProps) {
  // ...
}
```

### Barrel Export Pattern
```tsx
// components/index.ts
export { SuSayac } from './SuSayac';
export { AyarlarPaneli } from './AyarlarPaneli';

// App.tsx'de kullanımı
import { SuSayac, AyarlarPaneli } from './components';
```

### State Nerede Tutulur?
- Paylaşılan state → Parent component'te (App.tsx)
- Sadece component'i ilgilendiren state → Component içinde

Örnek: AyarlarPaneli'nin açık/kapalı durumu sadece kendini
ilgilendiriyor, o yüzden kendi içinde tutulur.


## 🧭 NAVIGATION (SAYFA GEÇİŞLERİ)
## ===============================

### Kurulum
```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

### Proje Yapısı
```
Water/
├── App.tsx                    → Navigation setup
└── screens/                   → Ekranlar
    ├── index.ts               → Barrel export
    ├── AnaSayfaEkrani.tsx     → Ana sayfa
    ├── IstatistiklerEkrani.tsx → İstatistikler
    └── AyarlarEkrani.tsx      → Ayarlar
```

### Tab Navigator (Alt Tab Bar)
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="AnaSayfa" component={AnaSayfaEkrani} />
        <Tab.Screen name="Ayarlar" component={AyarlarEkrani} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### Tab Özellikleri
```tsx
<Tab.Screen
  name="AnaSayfa"
  component={AnaSayfaEkrani}
  options={{
    tabBarLabel: 'Ana Sayfa',     // Tab etiketi
    tabBarIcon: ({ focused }) => ( // İkon
      <Text>{focused ? '💧' : '💧'}</Text>
    ),
    headerShown: false,           // Üst header gizle
  }}
/>
```

### Navigator Stilleri
```tsx
<Tab.Navigator
  screenOptions={{
    tabBarStyle: {                // Tab bar stili
      backgroundColor: '#0D47A1',
      height: 60,
    },
    tabBarActiveTintColor: '#4FC3F7',   // Aktif renk
    tabBarInactiveTintColor: '#90CAF9', // Pasif renk
    headerShown: false,
  }}
>
```

### Screen vs Component Farkı
- **Screen**: Tam sayfa, navigation ile yönetilir
- **Component**: Yeniden kullanılabilir UI parçası

Screens → Ekran düzeni, veri yükleme
Components → UI parçaları, props ile çalışır
