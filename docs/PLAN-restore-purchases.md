# PLAN: Restore Purchases Butonu Ekleme

> **App Store Rejection Fix — Guideline 3.1.1 - In-App Purchase**
> Apple, kullanıcıların önceki satın almalarını geri yükleyebilmesi için belirgin bir **Restore Purchases** butonu zorunlu tutuyor.

---

## 📋 Proje Bağlamı

| Bilgi | Değer |
|-------|-------|
| **Proje** | Smart Water: AI Insights |
| **Platform** | React Native (Expo) |
| **IAP Yönetimi** | RevenueCat (`react-native-purchases`) — henüz kurulu DEĞİL |
| **Auth Sistemi** | Yok (Anonim kullanıcılar) |
| **Paywall Dosyası** | `screens/PremiumEkrani.tsx` |
| **Premium State** | `PremiumContext.tsx` + `premiumUtils.ts` (AsyncStorage) |
| **i18n** | 9 dil (`locales/` — en, tr, de, es, fr, ja, ko, pt, zh) |

---

## 🎯 Hedef

Apple App Store Guideline 3.1.1 uyumluluğunu sağlamak için:

1. Paywall ekranına "Restore Purchases" butonu ekle
2. RevenueCat `Purchases.restorePurchases()` entegrasyonu yap
3. Başarı/hata durumlarını uygun Alert mesajlarıyla yönet
4. Tüm 9 dilde çeviri ekle

---

## 📊 Mevcut Durum Analizi

### Paywall Ekranı (`PremiumEkrani.tsx`)
- **Satır sayısı**: 484
- **Alt bölüm yapısı**: Header → Features → Pricing Cards → Footer → Action Button + Legal Links
- **Mevcut legal bölümü** (satır 219-227): `Terms of Use` ve `Privacy Policy` linkleri var
- **"Restore" butonu**: **YOK** ← Bu eksik, Apple bunu istiyor

### Premium State Yönetimi
- `PremiumContext.tsx`: `setPremium(durum)` ve `checkPremium()` fonksiyonları mevcut
- `premiumUtils.ts`: `premiumDurumKaydet()` ile AsyncStorage'a kaydediliyor
- State güncelleme altyapısı hazır, restore sonrası kullanılabilir

### RevenueCat Durumu
- `package.json`'da `react-native-purchases` **YOK**
- Şu an satın alma simülasyonu ile çalışıyor (doğrudan AsyncStorage'a yazıyor)
- **Karar noktası**: RevenueCat henüz entegre edilmemişse, restore fonksiyonu RevenueCat API'si ile mi yoksa mevcut mock yapıyla mı çalışacak?

---

## 🏗️ Uygulama Planı

### Faz 1: RevenueCat Paketi Kurulumu (Opsiyonel)

> ⚠️ **NOT**: `react-native-purchases` henüz `package.json`'da yok. Eğer IAP henüz gerçek RevenueCat ile çalışmıyorsa, önce bu paketin kurulumu ve konfigürasyonu gerekir. Bu plan **mevcut yapıyı bozmadan** minimum değişiklikle restore butonunu eklemeye odaklanır.

| Görev | Dosya | Durum |
|-------|-------|-------|
| `react-native-purchases` kurulumu | `package.json` | ⏳ Kullanıcıya sor |
| RevenueCat SDK konfigürasyonu | Yeni dosya veya `App.tsx` | ⏳ Kullanıcıya sor |

**Kullanıcıya sorulacak**: RevenueCat zaten App Store Connect'te mi konfigüre edildi? API key mevcut mu?

### Faz 2: i18n Çevirileri Ekleme

**Eklenecek anahtarlar** (`premium.restore` namespace altında):

```json
{
  "premium": {
    "restore": {
      "button": "Restore Purchases",
      "success": "Your premium membership has been successfully restored.",
      "noActive": "No active subscription found for this Apple ID.",
      "error": "An error occurred during the restore process.",
      "restoring": "Restoring..."
    }
  }
}
```

| Dosya | Çeviriler |
|-------|-----------|
| `locales/en/translation.json` | `"button": "Restore Purchases"`, `"success": "Your premium membership has been successfully restored."`, `"noActive": "No active subscription found for this Apple ID."`, `"error": "An error occurred during the restore process."`, `"restoring": "Restoring..."` |
| `locales/tr/translation.json` | `"button": "Satın Almaları Geri Yükle"`, `"success": "Premium üyeliğiniz başarıyla geri yüklendi."`, `"noActive": "Bu Apple Kimliğine ait aktif bir abonelik bulunamadı."`, `"error": "Geri yükleme işlemi sırasında bir sorun oluştu."`, `"restoring": "Geri yükleniyor..."` |
| `locales/de/translation.json` | `"button": "Käufe wiederherstellen"`, `"success": "..."`, vb. |
| `locales/es/translation.json` | `"button": "Restaurar compras"`, vb. |
| `locales/fr/translation.json` | `"button": "Restaurer les achats"`, vb. |
| `locales/ja/translation.json` | `"button": "購入を復元"`, vb. |
| `locales/ko/translation.json` | `"button": "구매 복원"`, vb. |
| `locales/pt/translation.json` | `"button": "Restaurar compras"`, vb. |
| `locales/zh/translation.json` | `"button": "恢复购买"`, vb. |

### Faz 3: PremiumEkrani.tsx Güncelleme

#### 3.1 — `handleRestore` Fonksiyonu Ekleme

```typescript
const [restoring, setRestoring] = useState<boolean>(false);

const handleRestore = async () => {
    setRestoring(true);
    try {
        const customerInfo = await Purchases.restorePurchases();
        
        if (
            customerInfo.entitlements.active &&
            Object.keys(customerInfo.entitlements.active).length > 0
        ) {
            // Aktif abonelik bulundu
            const yeniDurum = {
                aktif: true,
                paketId: 'yillik' as const, // veya entitlement'tan çıkar
                satinAlmaTarihi: new Date().toISOString()
            };
            await premiumDurumKaydet(yeniDurum);
            setPremium(yeniDurum);
            
            Alert.alert(
                t('common.success'),
                t('premium.restore.success'),
                [{ text: t('common.great'), onPress: onClose }]
            );
        } else {
            // Aktif abonelik bulunamadı
            Alert.alert(
                t('common.ok'),
                t('premium.restore.noActive')
            );
        }
    } catch (error) {
        Alert.alert(
            t('common.error'),
            t('premium.restore.error')
        );
    } finally {
        setRestoring(false);
    }
};
```

**Konum**: `handleSatinAl` fonksiyonunun hemen altına (satır ~82)

#### 3.2 — UI Butonu Ekleme

Legal links bölümünün **altına** (satır 227 civarı), mevcut tasarımı bozmayacak şekilde:

```tsx
{/* Restore Purchases */}
<TouchableOpacity
    onPress={handleRestore}
    disabled={restoring}
    style={styles.restoreButton}
>
    <Text style={styles.restoreButtonText}>
        {restoring ? t('premium.restore.restoring') : t('premium.restore.button')}
    </Text>
</TouchableOpacity>
```

#### 3.3 — Stil Tanımları

```typescript
restoreButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
},
restoreButtonText: {
    color: '#64748B',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '500',
},
```

**Tasarım kararı**: Legal linkleriyle (Terms of Use / Privacy Policy) aynı görsel dilde, altı çizili, sade gri metin. Paywall tasarımını bozmaz, Apple için yeterince belirgin.

---

## 📁 Değişecek Dosyalar

| # | Dosya | Değişiklik Tipi | Öncelik |
|---|-------|----------------|---------|
| 1 | `screens/PremiumEkrani.tsx` | Modify — handleRestore + UI + styles | 🔴 Kritik |
| 2 | `locales/en/translation.json` | Modify — restore çevirileri | 🔴 Kritik |
| 3 | `locales/tr/translation.json` | Modify — restore çevirileri | 🔴 Kritik |
| 4 | `locales/de/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 5 | `locales/es/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 6 | `locales/fr/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 7 | `locales/ja/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 8 | `locales/ko/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 9 | `locales/pt/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 10 | `locales/zh/translation.json` | Modify — restore çevirileri | 🟡 Önemli |
| 11 | `package.json` | Modify — react-native-purchases ekleme | ⚠️ Bağımlı |

---

## ⚠️ Açık Sorular (Kullanıcıya Sorulmalı)

1. **RevenueCat entegrasyonu**: `react-native-purchases` henüz `package.json`'da yok. RevenueCat Dashboard'da API key oluşturuldu mu? Yoksa şimdilik restore butonunu sadece UI olarak mı ekleyelim ve gerçek RevenueCat entegrasyonunu ayrıca mı yapalım?

2. **Entitlement ID**: RevenueCat'te tanımlanan entitlement identifier'ı nedir? (genellikle `"premium"` veya `"pro"` olur)

3. **Paket eşleştirme**: Restore sonrası hangi `paketId` (`aylik`, `yillik`, `omur_boyu`) atanmalı? Yoksa RevenueCat'ten gelen bilgiden mi çıkarılmalı?

---

## ✅ Doğrulama Kontrol Listesi

- [ ] "Restore Purchases" butonu Paywall ekranında görünür durumda
- [ ] Buton tıklanınca `Purchases.restorePurchases()` çağrılıyor
- [ ] Aktif abonelik varsa başarı Alert'i gösteriliyor
- [ ] Aktif abonelik yoksa bilgi Alert'i gösteriliyor
- [ ] Hata durumunda hata Alert'i gösteriliyor
- [ ] Restore sırasında buton disable oluyor ("Restoring..." yazıyor)
- [ ] Premium state güncelleniyor (Context + AsyncStorage)
- [ ] 9 dilde çeviriler mevcut
- [ ] Mevcut Paywall tasarımı bozulmamış
- [ ] iOS 26.3 üzerinde buton düzgün görünüyor

---

## 🎯 Agent Atama

| Faz | Agent | Görev |
|-----|-------|-------|
| Faz 2 | `mobile-developer` | i18n çevirileri ekleme |
| Faz 3 | `mobile-developer` | PremiumEkrani.tsx güncelleme |

---

## 📝 Notlar

- Apple'ın review sürecinde **Restore butonu görünür ve işlevsel** olmalı
- Butonun konumu ideal olarak satın alma butonunun yakınında veya legal linklerinin yanında olmalı
- Sade tasarım Apple review'ı için yeterli, fazla gösterişli olması gerekmiyor
- `NSUserTrackingUsageDescription` `app.json`'dan kaldırıldı (Guideline 2.1 fix)
