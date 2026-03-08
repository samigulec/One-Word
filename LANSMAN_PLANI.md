# One Word - Lansman Plani
**Tarih:** 8 Mart 2026
**Versiyon:** 2.0.0 (package.json) / 1.4.0 (app.json -- guncellenmeli)

---

## A. Tamamlanan Ozellikler

1. **Onboarding** -- Dil secimi (11 dil), seviye secimi (A1-C2), kullanici adi
2. **Gunun Kelimesi** -- Her gun yeni kelime, ceviriler, ornek cumle, telaffuz (TTS)
3. **AI Sohbet** -- Kelime bazli senaryo tabanli konusma pratigi (6 farkli senaryo)
4. **Quiz Sistemi** -- Coktan secmeli, yazarak cevaplama, flashcard, eslestirme
5. **Spaced Repetition (SRS)** -- SM-2 algoritmasi ile tekrar zamanlama
6. **Review Ekrani** -- SRS'e gore tekrar edilecek kelimelerin listesi
7. **XP ve Seviye Sistemi** -- 12 farkli XP aksiyonu, 50 seviye
8. **Gunluk Gorevler** -- 3 gunluk gorev + bonus XP
9. **Haftalik Zorluklar** -- Kategori temali haftalik hedefler
10. **Streak Sistemi** -- Streak freeze destegi (max 2)
11. **Rozet/Badge Sistemi** -- Streak, kelime, quiz, ozel rozetler + modal
12. **Liderlik Tablosu** -- Bronze/Silver/Gold/Diamond ligler
13. **Haftalik Ozet** -- WeeklySummaryScreen
14. **Profil Ekrani** -- Ayarlar, calm mode, bildirim yonetimi, dil degistirme
15. **Gecmis Ekrani** -- Ogrenilen kelimelerin listesi
16. **Favori Sistemi** -- Kelimeleri favorilere ekleme
17. **Bildirimler** -- Gunluk kelime, streak, quiz hatirlatmalari
18. **Paylasim** -- Kelime karti ve basarim paylasimi
19. **Kulturel Baglam** -- Kelimeler icin kulturel bilgi kartlari
20. **Dilbilgisi Kapsulleri** -- Grammar nuggets
21. **Gercek Dunya Ornekleri** -- Film, sarki, haber ornekleri
22. **Calm Mode** -- Gamification ogelerini gizleme
23. **11 Dil Destegi** -- ES, EN, IT, DE, FR, PT, TR, RU, JA, KO, ZH

---

## B. Sorunlar ve Eksikler

### Kritik (Yayin Engelleyici)

1. **Versiyon uyumsuzlugu** -- `package.json` v2.0.0 ama `app.json` v1.4.0. Senkronize edilmeli.
2. **TypeScript hatalari (2 dosya, 5 hata):**
   - `src/utils/contentLoader.ts` -- JSON'lardaki `realWorldExamples` alani `string[]` ama tip `RealWorldExample[]` bekliyor. Cast duzeltilmeli veya JSON duzeltilmeli.
   - `src/utils/notifications.ts` -- `NotificationBehavior` tipinde `shouldShowBanner` ve `shouldShowList` property'leri eksik (Expo SDK 54 API degisikligi).
3. **Splash screen arka plan rengi** -- `#F8FAFC` (beyaz) ama uygulama koyu tema kullanyor (`#0F0A2E`). Gecis sirasinda beyaz flash olur.

### Orta (Duzeltilmesi Onerilen)

4. **Kullanilmayan ekranlar** -- `BadgesScreen.tsx`, `JourneyScreen.tsx`, `SettingsScreen.tsx` var ama App.tsx'de import edilmiyor. Dead code.
5. **`@ts-ignore` kullanimlari** -- HomeScreen.tsx'de `expo-speech`, `react-native-view-shot`, `expo-sharing` icin 3 adet ts-ignore. Tip tanimlamalari eksik olabilir.
6. **Navigasyon** -- React Navigation yerine manuel state yonetimi kullanilmis. Calisiyor ama geri butonu (Android hardware back) destegi yok.

### Dusuk

7. **`userInterfaceStyle: "light"`** -- app.json'da light ama uygulama dark tema. `"dark"` olmali.

---

## C. Yayin Icin ZORUNLU Adimlar

### 1. Kod Duzeltmeleri (1-2 saat)
- [ ] `contentLoader.ts`: Cast'leri `as unknown as ContentItem[]` yap veya JSON'lardaki `realWorldExamples` alanlarini `RealWorldExample` formatina cevir
- [ ] `notifications.ts`: `shouldShowBanner: true, shouldShowList: true` ekle
- [ ] `app.json` versiyonu `2.0.0` yap
- [ ] `app.json` splash backgroundColor `#0F0A2E` yap
- [ ] `app.json` userInterfaceStyle `"dark"` yap

### 2. App Store Gereksinimleri
- [ ] **Privacy Policy sayfasi** -- Zorunlu. Basit bir web sayfasi yeterli (AsyncStorage kullanimi, veri toplama yok). Netlify/GitHub Pages'e deploy et.
- [ ] `app.json`'a `"privacyPolicyUrl"` ekle
- [ ] **App Store ekran goruntuleri** -- iPhone 6.7" (Pro Max) ve 5.5" (SE) icin minimum 3 screenshot
- [ ] **App aciklamasi** -- App Store Connect'e girilecek (app.json'daki description iyi bir baslangic)
- [ ] **Yas siniflamasi** -- 4+ (icerik uygun)
- [ ] **Kategori** -- Education

### 3. Google Play Gereksinimleri
- [ ] Ekran goruntuleri (telefon + tablet)
- [ ] **Data Safety formu** -- Play Console'da doldurulacak
- [ ] **Icerik derecelendirme** -- IARC anketi
- [ ] `android.versionCode` guncelle (simdi 5, build'de autoIncrement acik)

### 4. EAS Yapilandirmasi
- [x] `eas.json` hazir (development, preview, production profilleri var)
- [x] EAS project ID mevcut
- [ ] Apple Developer hesabi (99$/yil) aktif mi kontrol et
- [ ] Google Play Developer hesabi (25$ tek seferlik) aktif mi kontrol et
- [ ] iOS icin Provisioning Profile ve Certificate olustur (EAS otomatik yapabilir)

---

## D. Onerilen Ama Zorunlu Olmayan Isler

1. **Android geri butonu destegi** -- `BackHandler` ile onceki ekrana donme
2. **Kullanilmayan ekranlari sil** -- BadgesScreen, JourneyScreen, SettingsScreen (ya da entegre et)
3. **ts-ignore'lari kaldir** -- Tip tanimlamalarini duzelt
4. **App icon boyut kontrolu** -- 5.4MB cok buyuk, optimize edilmeli (1024x1024 PNG, ~200KB yeterli)
5. **Error boundary** -- Crash durumunda beyaz ekran yerine hata mesaji goster
6. **Analytics** -- Expo Analytics veya Firebase ile kullanim takibi
7. **Rate limiting** -- Uygulama icinde AI chat icin gunluk limit (maliyet kontrolu)

---

## E. Yayin Adimlari (Step-by-Step)

### Adim 1: Kod Duzeltmeleri (1-2 saat)
```
Bolum C.1'deki duzeltmeleri yap
npx tsc --noEmit  # 0 hata olmali
npx expo start    # Calistigindan emin ol
```

### Adim 2: Privacy Policy (30 dk)
```
Basit bir privacy policy sayfasi olustur ve deploy et
app.json'a URL'yi ekle
```

### Adim 3: EAS Build - Preview (test)
```
eas build --platform all --profile preview
```
Cihazda test et: onboarding, kelime ogrenme, quiz, chat, bildirimler.

### Adim 4: EAS Build - Production
```
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Adim 5: iOS - TestFlight
```
eas submit --platform ios
```
- App Store Connect'te app bilgilerini doldur
- Ekran goruntuleri yukle
- TestFlight'a gonder, 1-2 gun iceride test et

### Adim 6: Android - Internal Testing
```
eas submit --platform android
```
- Play Console'da internal testing track'e yukle
- Data Safety formunu doldur
- IARC derecelendirmesini tamamla

### Adim 7: Store'a Gonder
- iOS: TestFlight'tan App Review'a gonder (ortalama 24-48 saat)
- Android: Internal'dan Production'a terfi et (ortalama 1-3 gun)

---

## Tahmini Zaman Cizelgesi

| Adim | Sure |
|------|------|
| Kod duzeltmeleri | 1-2 saat |
| Privacy policy | 30 dakika |
| Store asset'leri (screenshot vs.) | 2-3 saat |
| EAS preview build + test | 1-2 saat |
| Production build | 30 dakika |
| Store submission | 1 saat |
| **Apple review suresi** | **1-3 gun** |
| **Google review suresi** | **1-3 gun** |
| **TOPLAM** | **~1 gun is + 1-3 gun bekleme** |

---

*Bu plan Efe tarafindan hazirlanmistir. Oncelik sirasi: C > D. Zorunlu adimlari tamamla, sonra submit et.*
