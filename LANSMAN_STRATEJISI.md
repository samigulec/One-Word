# ONE WORD - LANSMAN STRATEJISI ve EKSIK ANALIZI

**Haziran: Arastirmaci Ajan | Tarih: 8 Mart 2026**
**Yaklasim: "Simdiki haliyle yayinla, sonra iyilestir"**

---

## 1. MVP DEGERLENDIRMESI

### Sonuc: EVET, uygulama su haliyle yayinlanabilir.

Uygulama v2.0.0 seviyesinde ve asagidaki temel ozellikler calisiyor:

| Ozellik | Durum | MVP icin Gerekli mi? |
|---------|-------|---------------------|
| Gunluk kelime karti | TAMAM | EVET |
| 11 dil destegi | TAMAM | EVET |
| Onboarding (dil secimi) | TAMAM | EVET |
| CEFR seviyeleri (A1-C2) | TAMAM | EVET |
| Streak sistemi | TAMAM | EVET |
| XP & seviye sistemi | TAMAM | EVET |
| Quiz ekrani | TAMAM | EVET |
| Pratik/Chat ekrani | TAMAM | EVET |
| Review (tekrar) sistemi | TAMAM | EVET |
| Favori sistemi | TAMAM | EVET |
| Bildirimler | TAMAM | EVET |
| Paylasim (share card) | TAMAM | HAYIR ama guzel |
| Rozet sistemi | TAMAM | HAYIR ama guzel |
| Haftalik gorevler | TAMAM | HAYIR ama guzel |
| Leaderboard | TAMAM | HAYIR (lokal veri) |
| Kulturel baglam modal | TAMAM | HAYIR ama fark yaratir |

### v1'de Olmasi GEREKEN ama EKSIK Olanlar (KRITIK):

1. **Privacy Policy sayfasi/linki** -- App Store ve Play Store REDDEDER. Yok.
2. **Terms of Service** -- Ozellikle Play Store icin gerekli. Yok.
3. **Crash reporting** -- Sentry/Crashlytics/Bugsnag yok. Yayinda hatalari gormezsin.
4. **App icon boyutlari** -- icon.png 5.4MB, cok buyuk. App Store icin 1024x1024 gerekli ama dosya boyutu optimize edilmeli.
5. **Splash screen arka plan rengi** -- app.json'da #F8FAFC (beyaz) ama uygulama koyu tema. Uyumsuz.
6. **Versiyon uyumsuzlugu** -- app.json "1.4.0" ama package.json "2.0.0". Duzeltilmeli.

### v2'ye Birakilabilecekler:

- Backend/sunucu (su an tamamen lokal, bu aslinda MVP icin avantaj)
- Kullanici hesaplari ve sync
- Gercek leaderboard (sunucu gerektirir)
- In-app purchase
- A/B testing
- Detayli analytics

---

## 2. APP STORE & GOOGLE PLAY GEREKSINIMLERI

### A. Apple App Store (iOS)

**Hesap:** Apple Developer Program -- yillik $99
**Zorunlu:**
- Xcode ile iOS 26 SDK veya Expo SDK 54 (guncel, TAMAM)
- App icon: 1024x1024px PNG, alfa kanali yok, kose yuvarlatmasi yok
- En az 1 screenshot: 6.9" iPhone (1320x2868px) -- ZORUNLU
- iPad destegi varsa: 13" iPad screenshot (2064x2752px) -- app.json'da supportsTablet: true, GEREKLI
- Privacy Policy URL -- YOK, OLUSTURULMALI
- Support URL -- YOK, OLUSTURULMALI
- Age Rating (IARC) -- doldurulacak (muhtemelen 4+)
- App Privacy Nutrition Label -- doldurulacak
- Inceleme suresi: 24-72 saat (ilk gonderimlerde daha uzun olabilir)

**Dikkat:** Nisan 2026'dan itibaren iOS 26 SDK ile build zorunlu. Expo SDK 54 suan iOS 18 SDK kullanabilir -- SDK uyumlulugunu kontrol et.

### B. Google Play Store (Android)

**Hesap:** Google Play Developer -- tek seferlik $25
**Zorunlu:**
- AAB (Android App Bundle) formati -- EAS Build bunu otomatik yapar
- App icon: 512x512px PNG, max 1024KB
- Feature Graphic: 1024x500px
- En az 2 screenshot (telefon): 320-3840px arasi
- Privacy Policy URL -- YOK, OLUSTURULMALI
- Data Safety formu doldurulmali (hangi veriler toplanir)
- Content Rating (IARC anketi) -- doldurulacak
- Target audience ve content declaration
- Ilk gonderim inceleme suresi: 3-7 gun
- **Ilk gonderim Play Store API uzerinden yapilamaz, manuel yukleme gerekli**

### C. Her Iki Magaza icin Ortak Gereksinimler:

| Gereksinim | Durumu | Oncelik |
|------------|--------|---------|
| Apple Developer hesabi ($99/yil) | KONTROL ET | BLOCKER |
| Google Play hesabi ($25) | KONTROL ET | BLOCKER |
| Privacy Policy URL | YOK | BLOCKER |
| Terms of Service URL | YOK | YUKSEK |
| Support email/URL | YOK | BLOCKER |
| Screenshots (iPhone 6.9") | YOK | BLOCKER |
| Screenshots (iPad 13") | YOK | BLOCKER (supportsTablet: true) |
| Feature Graphic (Play Store) | YOK | BLOCKER |
| App icon optimize | GEREKLI | YUKSEK |
| Content/Age Rating | DOLDURULACAK | BLOCKER |

---

## 3. LANSMAN ONCESI MINIMUM CHECKLIST

### A. Teknik (1-2 gun)

- [ ] `app.json` versiyon duzeltmesi: "1.4.0" -> "2.0.0" (package.json ile eslesmeli)
- [ ] `app.json` splash backgroundColor: "#F8FAFC" -> "#0F0A2E" (koyu tema ile uyumlu)
- [ ] `eas build --platform all --profile production` ile production build olustur
- [ ] Crash reporting ekle (oneri: `expo-sentry` -- en hizli entegrasyon)
  - `npx expo install @sentry/react-native`
  - App.tsx'e Sentry.init() ekle
- [ ] iOS simulator ve Android emulator'da son test
- [ ] Gercek cihazda test (en az 1 iPhone, 1 Android)
- [ ] Performans kontrolu: ilk acilma suresi, animasyon kasmasi
- [ ] Offline calisma testi (internet kapatarak)

### B. Yasal (1 gun)

- [ ] Privacy Policy olustur -- https://app-privacy-policy-generator.firebaseapp.com/ (ucretsiz)
  - AsyncStorage ile lokal veri depolama belirt
  - Bildirim izni kullanimi belirt
  - Expo SDK veri toplama belirt
  - Ucuncu parti SDK'lar: expo-notifications, expo-haptics
- [ ] Terms of Service olustur -- ayni siteden
- [ ] Bir web sayfasinda host et (GitHub Pages ucretsiz, 5 dakikada kurulur)
- [ ] Support email adresi olustur (oneword@gmail.com veya benzer)

### C. Magaza Gorselleri (1-2 gun)

- [ ] App Icon: 1024x1024px (iOS) + 512x512px (Play Store)
  - Mevcut icon.png'yi optimize et (5.4MB cok buyuk)
- [ ] iPhone Screenshots: 5 adet, 1320x2868px
  1. Ana sayfa -- kelime karti
  2. Anlam acilmis hali + kulturel baglam
  3. Quiz ekrani
  4. 11 dil secimi (onboarding)
  5. Streak/XP/Seviye gosterimi
- [ ] iPad Screenshots: 5 adet, 2064x2752px (supportsTablet: true oldugu icin zorunlu)
- [ ] Feature Graphic (Play Store): 1024x500px -- basit banner
- [ ] Arac: Screely, Shotsnapp veya AppMockup (ucretsiz mockup araclar)

### D. Analitik (Sonraya birakilabilir ama onerilir)

- [ ] **Minimum:** Expo'nun yerlesik analytics'i (EAS Insights)
- [ ] **Onerilir:** expo-analytics veya PostHog (ucretsiz tier)
- [ ] Temel metrikler: DAU, retention, hangi diller populer, streak ortalamasi
- [ ] App Store Connect / Play Console yerlesik analytics'i de kullan

---

## 4. HIZLI LANSMAN STRATEJISI

### Strateji: SOFT LAUNCH -> HARD LAUNCH (2 asamali)

#### Asama 1: Soft Launch (Gun 1-7)

**Platform:** Once iOS TestFlight + Google Play Internal Testing
**Hedef:** 20-30 beta tester ile kritik hatalari yakala

**Nasil:**
1. TestFlight'a yukle -- link'i yakin cevre ile paylas
2. Google Play Internal Testing -- ayni sekilde
3. 3-5 gun kullansınlar, geri bildirim topla
4. Kritik hatalari duzelt
5. Kucuk ayarlamalar yap

**Beta Tester Bulmak:**
- Yakin arkadaslar ve aile (10-15 kisi)
- Reddit r/betatesting (5-10 kisi)
- Twitter'da "beta tester ariyorum" (5-10 kisi)

#### Asama 2: Hard Launch (Gun 8-14)

**Ulke Stratejisi:**
1. **Ilk dalga:** Turkiye + ABD -- Turkiye ana pazar, ABD en buyuk App Store pazari
2. **Ikinci dalga (Ay 2):** Almanya, Fransa, Brezilya -- buyuk dil ogrenme pazarlari
3. **Ucuncu dalga (Ay 3):** Global acilis

**Neden once Turkiye?**
- Gelistirici Turkiye'de (com.bikelime.app bundle ID'si)
- Turkce aciklama ve ASO zaten hazir
- Daha az rekabet, daha kolay ilk kullanicilar
- Organik buyume icin iyi test pazari

### Ilk 100 Kullaniciyi Nasil Elde Ederiz?

| Kanal | Beklenen Kullanici | Maliyet | Zamanlama |
|-------|-------------------|---------|-----------|
| Yakin cevre + aile | 15-20 | $0 | Gun 1 |
| Reddit r/languagelearning | 20-30 | $0 | Gun 8-10 |
| Reddit r/learnturkish + r/turkey | 10-15 | $0 | Gun 8-10 |
| Twitter/X lansman thread | 10-15 | $0 | Gun 8 |
| Product Hunt | 20-30 | $0 | Gun 10-12 |
| Eksisozluk/Technopat paylasimlari | 10-15 | $0 | Gun 8-10 |
| **TOPLAM** | **85-125** | **$0** | **2 hafta** |

**Product Hunt Lansmanı icin:**
- Pazar veya Sali gunu gonder (en iyi gunler)
- Kisa, net tanitim videosu (30 sn)
- "First Comment" stratejisi: gelistirici olarak hikayeni anlat
- Upvote icin cevrenden destek iste

---

## 5. ZAMAN CIZELGESI -- EN HIZLI SENARYO

```
GUN 1-2: Teknik hazirlik
  - Versiyon duzelt, splash duzelt
  - Sentry ekle
  - Production build olustur ve test et
  - Privacy Policy + ToS olustur ve host et

GUN 3-4: Magaza gorselleri
  - Screenshot'lar al (simulator'dan)
  - Mockup'lara yerlestir
  - App icon optimize et
  - Feature graphic tasarla

GUN 5: Magaza basvurusu
  - App Store Connect'e yukle
  - Google Play Console'a yukle
  - Tum metadata doldur
  - TestFlight'a gonder

GUN 6-8: Beta test
  - TestFlight linkini dagit
  - Geri bildirim topla
  - Kritik duzeltmeler

GUN 9-10: Son duzeltmeler
  - Beta'dan gelen hatalari duzelt
  - Yeni build yolla

GUN 11: MAGAZA GONDERIMI
  - App Store Review'a gonder
  - Google Play Production'a gonder

GUN 12-14: Inceleme bekleme
  - iOS: 1-3 gun
  - Android: 3-7 gun (ilk gonderim)

GUN 15: CANLI!
  - Sosyal medya lansman baslar
  - Reddit paylasimi
  - Product Hunt gonderisi planla
```

**TOPLAM: Yaklasik 2 hafta icinde yayinda olabilir.**

---

## 6. RISK ANALIZI VE AZALTMA

| Risk | Olasilik | Etki | Cozum |
|------|----------|------|-------|
| App Store rejection (privacy policy eksik) | YUKSEK | BLOCKER | Privacy policy olustur |
| iPad screenshot eksik rejection | ORTA | BLOCKER | supportsTablet: false yap VEYA iPad screenshot hazirla |
| Crash raporlama olmadan hata tespit edilemez | YUKSEK | YUKSEK | Sentry ekle |
| Versiyon uyumsuzlugu rejection | DUSUK | ORTA | app.json guncelle |
| iOS 26 SDK zorunlulugu (Nisan 2026) | ORTA | YUKSEK | Expo SDK guncelligini kontrol et |
| Ilk kullanicilardan olumsuz yorum | ORTA | ORTA | Beta test ile once duzelt |

### En Hizli Yol icin Kisa Yol:

**iPad destegini kaldir** (`supportsTablet: false` yap) -- iPad screenshot hazirlamaktan kurtulursun, lansman 1 gun kisalir. v2'de iPad destegi eklenebilir.

---

## 7. ONERI OZETI -- EN KRITIK 5 ADIM

1. **Privacy Policy + Terms of Service olustur ve bir URL'de host et** (BLOCKER)
2. **app.json duzelt:** versiyon "2.0.0", splash rengi "#0F0A2E", supportsTablet: false
3. **Sentry crash reporting ekle** (10 dakikalik is)
4. **5 adet iPhone screenshot hazirla** (1320x2868px)
5. **EAS Build ile production build olustur ve TestFlight'a gonder**

Bu 5 adim tamamlaninca uygulama yayina hazir.

---

## 8. MALIYET TABLOSU

| Kalem | Maliyet | Zorunlu mu? |
|-------|---------|-------------|
| Apple Developer Program | $99/yil | EVET |
| Google Play Developer | $25 (tek seferlik) | EVET |
| Sentry (ucretsiz tier) | $0 | HAYIR ama cok onerilir |
| Privacy Policy hosting (GitHub Pages) | $0 | EVET |
| Screenshot mockup araci | $0 | EVET |
| **TOPLAM MINIMUM** | **$124** | |

---

*Bu belge "arastirmaci" ajani tarafindan hazirlanmistir. Efe'nin LANSMAN_PLANI.md dosyasi ile birlikte kullanilmalidir.*
