# One Word - v2.0.0 Degisiklik Raporu

Tarih: 2026-03-08
Hazirlayan: Efe (Bas Gelistirici)

---

## A. v1.0.0'dan v2.0.0'a Tum Degisiklikler (Kronolojik)

### Faz 1: Temel Altyapi
- **Proje olusturma**: Expo 54 + TypeScript + React Native 0.81.5
- **Onboarding sistemi**: Dil secimi, seviye secimi, kullanici adi (OnboardingScreen)
- **Ana ekran**: Gunluk kelime karti, anlam kesfetme, AI sohbet baslangici (HomeScreen)
- **AI Sohbet**: ChatScreen -- kelime bagli AI konusma pratigi
- **Icerik sistemi**: 11 dil icin JSON tabanli kelime veritabani (src/data/content/)
- **AsyncStorage**: Tum kullanici verisi lokal depolanma (storage.ts)

### Faz 2: Ogrenme Ozellikleri
- **Spaced Repetition (SRS)**: SM-2 algoritmasi tabanli tekrar zamanlama (srs.ts)
- **Review ekrani**: Tekrar gerektiren kelimelerin gozden gecirilmesi (ReviewScreen)
- **Quiz sistemi**: 4 farkli quiz tipi -- coktan secmeli, yazarak cevap, flashcard, eslestirme (QuizScreen, quiz.ts)
- **Gecmis ekrani**: Ogrenilen kelimelerin listesi, favori ve arama (HistoryScreen)
- **Haftalik Ozet**: Haftalik ilerleme raporu (WeeklySummaryScreen)

### Faz 3: Gamification
- **XP ve Seviye sistemi**: 50 seviyeli level up, gunluk XP hedefleri (xp.ts)
- **Rozet/Basarim sistemi**: Streak, kelime, quiz, ozel rozetler (badges.ts, BadgesScreen)
- **Liderlik tablosu**: Haftalik lig sistemi -- bronze, silver, gold, diamond (LeaderboardScreen, leaderboard.ts)
- **Gunluk gorevler**: 3 gorev/gun + bonus XP (storage.ts icerisinde)
- **Haftalik zorluklar**: Kategori temali haftalik hedefler (weeklyChallenge.ts, WeeklyChallengePanel)
- **Streak Freeze**: Streak koruma hakki (max 2)

### Faz 4: UX Yeniden Tasarimi (v2.0.0)
- **QuestsScreen**: Gunluk gorevler + haftalik zorluk + rozetler + journey tek ekranda
- **ProfileScreen**: Ayarlar + istatistikler + paylasim birlesti (SettingsScreen yerine)
- **PracticeScreen**: Senaryo secim ekrani (ana sayfadan ayrildi)
- **HomeScreen sadeletirildi**: Kompakt header + gamification bar + kelime karti + aksiyon butonlari
- **Tab yapisi degisti**: Home | Quests | History | Profile

### Faz 5: Ek Ozellikler
- **Kulturel baglam kartlari**: Kelime icerisinde kulturel bilgi (CulturalContextModal)
- **Grammar Nuggets**: Dilbilgisi kapsulleri (GrammarNuggets)
- **Canli kullanim ornekleri**: Film, sarki, haber, sosyal medyadan ornekler (RealWorldExamples)
- **Paylasim sistemi**: Hikaye sablonlari ve kelime karti paylasimi (ShareWordCard, ShareAchievementCard, shareTemplates.ts)
- **Bildirim sistemi**: Gunluk kelime, streak, quiz hatirlatmalari (notifications.ts)
- **Calm Mode**: Gamification ogelerini gizleme secenegi
- **Kategori ikonlari**: Kelime kategorilerine gore emoji haritasi (categoryIcons.ts)

### Faz 6: Yayina Alma Hazirliği (bugun)
- **Sentry entegrasyonu**: Hata izleme ve performans takibi (App.tsx)
- **EAS Build yapilandirmasi**: Development, preview, production profilleri (eas.json)
- **Kullanilmayan import temizligi**: Dogrulandi, App.tsx temiz

---

## B. Mevcut Ozellik Listesi

### Ekranlar (14 adet)

| Ekran | Dosya | Aciklama |
|-------|-------|----------|
| HomeScreen | src/screens/HomeScreen.tsx | Ana ekran: gunluk kelime karti, XP/streak bar, hizli erisim butonlari |
| OnboardingScreen | src/screens/OnboardingScreen.tsx | Ilk acilis: dil secimi, seviye, kullanici adi |
| ChatScreen | src/screens/ChatScreen.tsx | AI sohbet pratigi, secilen kelime baglaminda konusma |
| QuestsScreen | src/screens/QuestsScreen.tsx | Gunluk gorevler, haftalik zorluk, rozetler, yolculuk |
| ProfileScreen | src/screens/ProfileScreen.tsx | Profil, ayarlar, istatistikler, paylasim, calm mode |
| PracticeScreen | src/screens/PracticeScreen.tsx | Senaryo secim ekrani, farkli konusma bağlamlari |
| HistoryScreen | src/screens/HistoryScreen.tsx | Ogrenilen kelime gecmisi, favori, arama, filtreleme |
| ReviewScreen | src/screens/ReviewScreen.tsx | SRS tabanli tekrar -- flashcard tarzinda gozden gecirme |
| QuizScreen | src/screens/QuizScreen.tsx | 4 farkli quiz tipi ile bilgi testi |
| WeeklySummaryScreen | src/screens/WeeklySummaryScreen.tsx | Haftalik ilerleme ozeti |
| LeaderboardScreen | src/screens/LeaderboardScreen.tsx | Haftalik liderlik tablosu, lig sistemi |
| BadgesScreen | src/screens/BadgesScreen.tsx | Rozet galerisi (eski, QuestsScreen icine tasinmis) |
| JourneyScreen | src/screens/JourneyScreen.tsx | Ogrenme yolculugu (eski, QuestsScreen icine tasinmis) |
| SettingsScreen | src/screens/SettingsScreen.tsx | Ayarlar (eski, ProfileScreen icine tasinmis) |

**Not:** BadgesScreen, JourneyScreen ve SettingsScreen dosyalari hala projede mevcut ancak App.tsx'ten import edilmiyorlar. Istenirse silinebilir.

### Bilesenler (7 adet)

| Bilesen | Dosya | Aciklama |
|---------|-------|----------|
| BadgeUnlockedModal | src/components/BadgeUnlockedModal.tsx | Rozet kazanildiginda animasyonlu modal |
| CulturalContextModal | src/components/CulturalContextModal.tsx | Kelime kulturel baglam bilgisi modali |
| GrammarNuggets | src/components/GrammarNuggets.tsx | Dilbilgisi kapsulu bileeni |
| RealWorldExamples | src/components/RealWorldExamples.tsx | Canli kullanim ornekleri (film, sarki, haber) |
| ShareAchievementCard | src/components/ShareAchievementCard.tsx | Basarim paylasim karti (screenshot icin) |
| ShareWordCard | src/components/ShareWordCard.tsx | Kelime paylasim karti (screenshot icin) |
| WeeklyChallengePanel | src/components/WeeklyChallengePanel.tsx | Haftalik zorluk ilerleme paneli |

### Utility Dosyalari (12 adet)

| Dosya | Aciklama |
|-------|----------|
| storage.ts | AsyncStorage CRUD islemleri, tum veri yonetimi |
| translations.ts | 11 dil icin UI ceviri sistemi |
| contentLoader.ts | JSON icerik dosyalarindan kelime yukleme |
| badges.ts | Rozet tanimlari ve kontrol fonksiyonlari |
| xp.ts | XP hesaplama, seviye sistemi (50 seviye) |
| srs.ts | SM-2 algoritmasi ile tekrar zamanlama |
| quiz.ts | Quiz soru uretici |
| leaderboard.ts | Liderlik tablosu veri uretimi |
| notifications.ts | Push bildirim zamanlama ve izin yonetimi |
| weeklyChallenge.ts | Haftalik zorluk sistemi |
| shareTemplates.ts | Paylasim hikaye sablonlari |
| categoryIcons.ts | Kategori bazli emoji haritasi |

---

## C. Teknik Durum

### TypeScript
- **Hata sayisi: 0** (tsc --noEmit basariyla gecti)
- Strict mode aktif
- Tum dosyalarda type hint kullanilmis

### Dosya Sayilari
- **Toplam kaynak dosya (src/):** 46
- **TypeScript/TSX dosya:** 35 (14 ekran + 7 bilesen + 1 servis + 1 tip + 12 util)
- **JSON veri dosyasi:** 11 (her dil icin ayri kelime veritabani)
- **Kok dizin dosyalari:** App.tsx, index.ts, app.json, eas.json, package.json, tsconfig.json

### Desteklenen Diller (11 adet)
English, Turkish, Spanish, German, French, Portuguese, Italian, Russian, Japanese, Korean, Chinese

### Kullanilan Kutuphaneler

**Production:**
| Kutuphane | Versiyon | Amac |
|-----------|---------|------|
| expo | ~54.0.31 | Uygulama platformu |
| react | 19.1.0 | UI framework |
| react-native | 0.81.5 | Mobil runtime |
| @sentry/react-native | ~7.2.0 | Hata izleme |
| @react-native-async-storage/async-storage | ^2.2.0 | Lokal veri depolama |
| expo-linear-gradient | ^15.0.8 | Gradient arka planlar |
| expo-notifications | ^0.32.16 | Push bildirimler |
| expo-haptics | ^15.0.8 | Dokunsal geri bildirim |
| expo-speech | ^14.0.8 | Metin okuma (TTS) |
| expo-sharing | ^55.0.11 | Icerik paylasimi |
| expo-file-system | ^55.0.10 | Dosya islemleri |
| expo-font | ^14.0.10 | Ozel font yukleme |
| expo-device | ^8.0.10 | Cihaz bilgisi |
| expo-status-bar | ~3.0.9 | Durum cubugu kontrolu |
| react-native-safe-area-context | ^5.6.2 | Guvenli alan yonetimi |
| react-native-svg | ^15.15.1 | SVG render |
| react-native-view-shot | ^4.0.3 | Ekran goruntusu alma |
| react-native-web | ~0.21.0 | Web destegi |
| @expo/ngrok | ^4.1.3 | Tunel erisimi |

**Dev:**
| Kutuphane | Versiyon | Amac |
|-----------|---------|------|
| typescript | ~5.9.2 | Tip sistemi |
| @types/react | ~19.1.0 | React tip tanimlari |

---

## D. Yayina Alma Checklist

### Tamamlanan Maddeler
- [x] TypeScript strict mode -- 0 hata
- [x] Sentry entegrasyonu (App.tsx'e eklendi)
- [x] EAS Build profilleri (development, preview, production)
- [x] 11 dil icin kelime veritabani
- [x] Tum ekranlar bagli ve calisir durumda
- [x] Kullanilmayan importlar temizlendi (App.tsx temiz)
- [x] Gamification sistemi (XP, seviye, rozet, liderlik)
- [x] SRS tekrar sistemi
- [x] Quiz sistemi (4 tip)
- [x] Bildirim sistemi
- [x] Paylasim ozelligi
- [x] Calm Mode
- [x] Kulturel baglam kartlari
- [x] Grammar Nuggets
- [x] Canli kullanim ornekleri
- [x] Privacy Policy hazir (PRIVACY_POLICY.md)
- [x] App Store listing hazir (APP_STORE_LISTING.md)
- [x] app.json yapilandirmasi (bundle ID, version, icon, splash)
- [x] @sentry/react-native plugin app.json'a eklenmis

### Kullanicinin Yapmasi Gereken Maddeler
- [ ] Sentry DSN degerini gercek degerle degistir (App.tsx satir 12)
- [ ] eas.json icindeki Apple kimlik bilgilerini doldur (appleId, ascAppId, appleTeamId)
- [ ] eas.json icindeki Google Play service account key dosyasini ekle (google-services.json)
- [ ] `eas build --profile production --platform ios` komutu ile iOS build al
- [ ] `eas build --profile production --platform android` komutu ile Android build al
- [ ] App Store Connect'te uygulama olustur ve ekran goruntuleri yukle
- [ ] Google Play Console'da uygulama olustur ve ekran goruntuleri yukle
- [ ] `eas submit --platform ios` ile App Store'a gonder
- [ ] `eas submit --platform android` ile Google Play'e gonder
- [ ] Eski ekran dosyalari silinebilir (BadgesScreen.tsx, JourneyScreen.tsx, SettingsScreen.tsx)
- [ ] Icon ve splash screen gorsellerini son haline getir
- [ ] Production'da AI sohbet icin API key yapilandirmasi

---

*Bu rapor Efe tarafindan 2026-03-08 tarihinde hazirlanmistir.*
