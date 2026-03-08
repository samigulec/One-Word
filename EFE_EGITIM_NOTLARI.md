# EFE - UX/UI EGITIM NOTLARI
## One Word Projesi Icin Derinlemesine Arastirma
### Tarih: 8 Mart 2026

---

## ICINDEKILER

1. [React Native UI/UX Best Practices](#1-react-native-uiux-best-practices)
2. [Modern Mobil UI Tasarim Trendleri](#2-modern-mobil-ui-tasarim-trendleri)
3. [Dil Ogrenme Uygulamalari UI Detaylari](#3-dil-ogrenme-uygulamalari-ui-detaylari)
4. [Kullanici Deneyimi Psikolojisi](#4-kullanici-deneyimi-psikolojisi)
5. [Performans Optimizasyonu](#5-performans-optimizasyonu)
6. [Accessibility (Erisilebilirlik)](#6-accessibility-erisilebilirlik)

---

## 1. REACT NATIVE UI/UX BEST PRACTICES

### 1.1 Reanimated 3 vs Animated API

#### Temel Prensipler

**Animated API (Built-in):**
- React Native ile birlikte gelir, ek kutuphane gerektirmez
- JS thread uzerinde calisir (useNativeDriver: true ile kismen native thread'e tasir)
- Basit animasyonlar icin yeterli (fade in/out, slide, scale)
- Sinirli: JS thread yogun olunca animasyonlar takiliyor (jank)

**Reanimated 3 (Tavsiye Edilen):**
- Worklet tabanli: JavaScript kodu dogrudan UI thread uzerinde calisir
- Bridge iletisimini tamamen ortadan kaldirir
- Karmasik animasyonlarda Animated API'ye gore 3 kata kadar daha hizli
- 60+ FPS, orta seviye cihazlarda bile akici
- Yeni hook'lar: useSharedValue, useAnimatedStyle, withTiming, withSpring, withDecay
- Layout animasyonlari icin entering/exiting prop'lari

#### One Word'e Nasil Uygulanabilir?

- Kart cevirme animasyonlari icin Reanimated 3 kullanmaliyiz (withTiming + rotateY)
- Dogru/yanlis cevap geri bildirimlerinde withSpring (bounce efekti)
- XP kazanma animasyonlarinda withTiming (progress bar dolumu)
- Sayfa gecislerinde layout animasyonlari (FadeIn, SlideInRight vs.)
- Streak animasyonlarinda withSequence (sirayla birden fazla animasyon)

#### Teknik Notlar

```
// Reanimated 3 temel pattern:
// 1. useSharedValue ile deger olustur (UI thread'de yasayan deger)
// 2. useAnimatedStyle ile stil bagla
// 3. withTiming/withSpring ile animasyonu tetikle
// 4. Animated.View ile sar

// Performans ipucu: useAnimatedStyle icinde sadece animasyona
// bagli degerleri hesapla, gereksiz is yapma.
// worklet fonksiyonlari 'worklet' direktifi ile isaretlenmeli.
```

#### Kaynaklar
- [Reanimated 3 Resmi Dokumantasyon](https://docs.swmansion.com/react-native-reanimated/)
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Reanimated 3 Ultimate Guide (DEV.to)](https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4)
- [Animated vs Reanimated Karsilastirma](https://medium.com/@yigithan10/choosing-between-animation-libraries-animated-vs-react-native-reanimated-12aedfc15092)
- [Advanced Animation Techniques 2025](https://viewlytics.ai/blog/react-native-advanced-animations-guide)

---

### 1.2 Bottom Sheet Implementasyonu (@gorhom/bottom-sheet)

#### Temel Prensipler

- **v5 kullanilmali** (Reanimated v3 + Gesture Handler v2 ile yazildi)
- TypeScript ile yazilmis, tip guvenligi sagliyor
- Snap point'ler ile birden fazla yukseklik destegi
- Gesture tabanli: surukleme, kaydirma, dokunma destegi
- Tam konfigurable: backdrop, handle, icerik hepsi ozellestirilebilir
- Performansi Reanimated 3 uzerine kurulu oldugu icin cok iyi

#### One Word'e Nasil Uygulanabilir?

- Kelime detay paneli icin bottom sheet (kelimeye tiklaninca asagidan yukari acilsin)
- Ayarlar menusunu bottom sheet olarak tasarlayabiliriz
- Quiz sonuc ekranini bottom sheet ile gosterebiliriz
- Profil secimleri (dil degistirme, zorluk secimi) icin kullanabiliriz
- Birden fazla bottom sheet yonetimi icin BottomSheetModalProvider kullanilabilir

#### Teknik Notlar

```
// Kurulum gereksinimleri:
// - react-native-reanimated (v3+)
// - react-native-gesture-handler (v2+)
// - @gorhom/bottom-sheet (v5)

// Snap points ornegi: snapPoints={['25%', '50%', '90%']}
// Backdrop: backdropComponent ile yari saydam arka plan
// Dynamic sizing: enableDynamicSizing prop'u ile icerige gore boyut

// Dikkat: Ogrenme egrisi biraz dik, ozellikle RN'ye yeni olanlar icin.
// Ama bir kez kurulunca cok guclu ve esnek.
```

#### Kaynaklar
- [Resmi Dokumantasyon](https://gorhom.dev/react-native-bottom-sheet/)
- [GitHub - gorhom/react-native-bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet)
- [Props Referansi](https://gorhom.dev/react-native-bottom-sheet/props)
- [Birden Fazla Bottom Sheet Yonetimi](https://paufau.medium.com/managing-multiple-bottom-sheets-in-react-native-e1e95c35a872)

---

### 1.3 Gesture Handler Kullanimi

#### Temel Prensipler

- React Native'in yerlesik Gesture Responder System'inin yerine gecen performansli alternatif
- Gesture tanima islemini UI thread'e tasiyor - JS thread yogun olsa bile gesture'lar aninda algilaniyor
- GestureHandlerRootView ile uygulamanin kokunu sarmak gerekiyor
- Gesture Handler v2 ile deklaratif API: Gesture.Pan(), Gesture.Pinch(), Gesture.Tap() vs.
- Reanimated ile entegrasyon: animasyonlar ve gesture'lar ayni thread'de

#### One Word'e Nasil Uygulanabilir?

- Flashcard'larda swipe gesture (saga kaydir = biliyorum, sola = bilmiyorum)
- Kart cevirme gesture (tap ile cevir)
- Pull-to-refresh ile yeni kelimeler yukleme
- Quiz'de drag-and-drop ile kelime eslestirme
- Long press ile kelime detaylarini gosterme

#### Teknik Notlar

```
// Gesture Handler v2 temel kullanim:
// 1. GestureHandlerRootView ile root'u sar
// 2. Gesture.Pan() / Gesture.Tap() / Gesture.LongPress() olustur
// 3. .onBegin(), .onUpdate(), .onEnd() callback'leri tanimla
// 4. GestureDetector component'i ile view'a bagla
// 5. Reanimated shared value'larla birlikte kullan

// Composed gestures: Gesture.Simultaneous(), Gesture.Exclusive(), Gesture.Race()
// ile birden fazla gesture'i birlestirebilirsin
```

#### Kaynaklar
- [Resmi Dokumantasyon](https://docs.swmansion.com/react-native-gesture-handler/docs/)
- [Expo Gesture Tutorial](https://docs.expo.dev/tutorial/gestures/)
- [2026 Kapsamli Tutorial](https://www.codesofphoenix.com/articles/expo/react-native-gesture-handler)

---

### 1.4 Skeleton Loading ve Shimmer Effects

#### Temel Prensipler

- Skeleton loader'lar icerik yuklenirken gorunen yer tutucu animasyonlar
- Spinner'lardan cok daha iyi UX - kullanici icerik yapisini onceden goruyor
- Uygulamanin daha hizli hissettirmesini sagliyor (algılanan performans)
- 200-500ms arasi animasyon suresi ideal

**Populer Kutuphaneler:**
1. **react-native-fast-shimmer** (Callstack) - Hafif, performansli, tamamen konfigurable
2. **Moti** - Reusable SkeletonText ve SkeletonCircle component'leri
3. **react-native-skeleton-placeholder** - Masked View + Linear Gradient tabanli
4. **react-native-dynamic-skeletons** - Dinamik ve ozellestirilebilir

#### One Word'e Nasil Uygulanabilir?

- Kelime listesi yuklenirken skeleton kartlar gosterelim
- Profil sayfasi yuklenirken avatar + isim skeleton'u
- Istatistik sayfasinda grafik/sayi alanlari icin skeleton
- Quiz baslangicinda soru yukleme sirasinda shimmer efekti

#### Teknik Notlar

```
// Best practices:
// 1. Component boyutlarini metin boyutlarina degil, layout boyutlarina gore ayarla
// 2. Liste icin birden fazla skeleton item render et, memo ile gereksiz
//    re-render'lari onle
// 3. Sadece gorunur component'lere skeleton animasyonu uygula
// 4. Reanimated useAnimatedStyle ile karmasik UI'larda performansli shimmer
// 5. Skeleton rengi dark theme icin #2a2a2a -> #3a3a3a arasi gradyan
```

#### Kaynaklar
- [Callstack - react-native-fast-shimmer](https://www.callstack.com/blog/performant-and-cross-platform-shimmers-in-react-native-apps)
- [Skeleton Loaders Guide (Medium)](https://medium.com/@andrew.chester/react-native-skeleton-loaders-elevate-your-apps-ux-with-shimmering-placeholders-5003b9507117)
- [DigitalOcean Skeleton Screens Tutorial](https://www.digitalocean.com/community/tutorials/react-skeleton-screens-react-and-react-native)

---

### 1.5 Haptic Feedback

#### Temel Prensipler

**iOS vs Android Farklari:**
- iOS: Taptic Engine + Core Haptics ile cok ince ayar yapilabilir
- Android: HapticFeedbackConstants + VibrationEffect ile daha sinirli

**Haptic Tipleri:**
1. **Clear (Net):** Buton basma, toggle switch - kisa ve temiz titresim
2. **Rich (Zengin):** Daha ifadeci, genis frekans bant genisligi
3. **Buzzy (Vibrasyon):** Bildirimler icin, uzun sureli titresim

**Kullanim Alanlari:**
- Durum degisiklikleri (toggle, checkbox)
- Form gonderimi onay/hata
- Scroll icerisinde snap noktalarinda
- Animasyonlarla senkronize

#### One Word'e Nasil Uygulanabilir?

- Dogru cevap: Haptics.notificationAsync(Success) - hafif basari titresimi
- Yanlis cevap: Haptics.notificationAsync(Error) - kisa hata titresimi
- Kart cevirme: Haptics.impactAsync(Light) - hafif dokunma hissi
- Streak tamamlama: Haptics.impactAsync(Heavy) - guclu tatmin edici titresim
- Secim degisiklikleri: Haptics.selectionAsync() - hafif secim geri bildirimi

#### Teknik Notlar (expo-haptics)

```
// Kurulum: npx expo install expo-haptics
// import * as Haptics from 'expo-haptics';

// Uc temel metod:
// 1. Haptics.impactAsync(style) - Light, Medium, Heavy
// 2. Haptics.notificationAsync(type) - Success, Warning, Error
// 3. Haptics.selectionAsync() - secim degisikligi

// ONEMLI: Az kullan! Fazla titresim rahatsiz edici.
// Tutarli ol: Ayni tur etkilesimde ayni haptic kullan.
// Gorsel + ses + haptic birlikte tasarla (multimodal geri bildirim)
// iOS Low Power Mode'da Taptic Engine calismiyor - kontrol et.
```

#### Kaynaklar
- [expo-haptics Dokumantasyonu](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [2025 Haptics Guide (Medium)](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)
- [Android Haptics Principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- [useHaptic Hook (Medium)](https://medium.com/timeless/implementing-haptic-feedback-in-react-native-writing-a-usehaptic-hook-6b8612675599)

---

## 2. MODERN MOBIL UI TASARIM TRENDLERI

### 2.1 Glassmorphism / Liquid Glass

#### Temel Prensipler

- Buzlu cam gorunumu: bulaniklastirma (blur), saydam arka plan, hafif golge
- Apple'in iOS/macOS'taki "Liquid Glass" tasarimi ile mainstream oldu (2025-2026)
- Modern GPU'lar ve rendering API'leri blur efektlerini mobilde hafif hale getirdi
- Katmanli derinlik hissi veriyor
- Premium ve temiz gorunum

**Uygulama Kurallari:**
- Amacli kullan: overlay, floating card, modal gibi elemanlarda
- Metin kontrastini guclu tut (blur arka plan ustunde okunabilirlik)
- Gercek cihazlarda farkli isik kosullarinda test et
- Her yerde kullanma - secici ol

#### One Word'e Nasil Uygulanabilir?

- Bottom sheet arka planinda glassmorphism efekti
- Modal/overlay ekranlarinda buzlu cam gorunumu
- Quiz sonuc kartinda glassmorphism
- Achievement badge'lerinde hafif glass efekti
- Dark theme ustunde cok iyi gorunuyor - bizim icin ideal

#### Teknik Notlar (React Native)

```
// Kutuphane secenekleri:
// 1. expo-blur: BlurView component'i, intensity (1-100) prop'u
// 2. @react-native-community/blur: Daha fazla kontrol
// 3. expo-glass-effect: Native iOS glass efekti (GlassView)

// expo-blur ornegi:
// <BlurView intensity={60} tint="dark" style={styles.glassCard}>
//   <Text>Icerik</Text>
// </BlurView>

// Android icin: BlurTargetView ile icerik sarmalanmali
// Animasyonlu intensity icin react-native-reanimated kullanilabilir
// Performance: Intensity degerini gereksiz yuksek tutma
```

#### Kaynaklar
- [React Native Glassmorphism (Medium)](https://mikael-ainalem.medium.com/react-native-glassmorphism-effect-deeb9951469c)
- [Liquid Glass UI Guide 2025](https://cygnis.co/blog/implementing-liquid-glass-ui-react-native/)
- [expo-blur Dokumantasyonu](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [expo-glass-effect Dokumantasyonu](https://docs.expo.dev/versions/latest/sdk/glass-effect/)

---

### 2.2 Neumorphism

#### Temel Prensipler

- Minimalizm + realizm karisimi: yumusak golgeler ve parlakliklar
- Arka plandan hafifce cikmis (extruded) gorunum
- Sakin, dokunsal arayuzler icin ideal
- Wellness ve minimalist uygulamalarda cok iyi calisiyor
- UYARI: Erisebilirlik sorunlari olabilir (dusuk kontrast)

#### One Word'e Nasil Uygulanabilir?

- Tamamen neumorphism degil ama secici elementlerde kullanabiliriz
- Buton tasarimlarinda hafif neumorphic golge
- Istatistik kartlarinda yumusak derinlik efekti
- Dark mode'da dikkatli olmali: golgeler daha az belirgin olur

---

### 2.3 Aurora UI

#### Temel Prensipler

- Kuzey Isiklari'ni taklit eden gradyan efektleri
- Yumusak, bulaniklasan renk gecisleri
- Sicak ve organik his
- Arka plan olarak kullanildiginda dikkat cekici ama yorucu degil

#### One Word'e Nasil Uygulanabilir?

- Onboarding ekranlarinin arka planinda aurora gradyanlari
- Basari/tebrik ekranlarinda aurora efekti
- Profil sayfasi ust bannerinda hafif aurora

---

### 2.4 Micro-Interactions ve Micro-Animations

#### Temel Prensipler

- 200-500ms arasi suren kucuk, amacli animasyonlar
- Kullaniciyi yonlendirme, geri bildirim verme, hata onleme amacli
- Dekorasyon degil, fonksiyonel olmali
- Aktivasyon oranlarini %47'ye kadar artirabilir

**2025-2026 Trendleri:**
- Skeleton loader'lar ve shimmer efektleri
- Animasyonlu buton yanıtlari (basari/hata)
- Form alanlarinda canli dogrulama animasyonlari
- Markali pull-to-refresh gesture'lari
- Scroll tetiklemeli animasyonlar
- Ses dalgasi geri bildirimi (voice-led interaction'lar icin)

**Best Practices:**
- Basit tut, kullaniciyi bunaltma
- Baglamsal ve amacli olsun
- Kisa olsun (500ms'yi gecme)
- Erisebilirlik: Hareketi durdurma/devre disi birakma secenegi sun
- Tutarli ol: Ayni tur aksiyonlarda ayni animasyon

#### One Word'e Nasil Uygulanabilir?

- Dogru cevap: Yesil checkmark + scale-up + haptic
- Yanlis cevap: Kirmizi X + shake + haptic
- XP kazanma: Sayi artisi animasyonu (counting up) + parlama efekti
- Streak gunu: Ates emoji bounce animasyonu
- Buton basma: Scale down (0.95) -> scale up (1.0) + hafif golge degisimi
- Progress bar: Smooth dolum animasyonu (withTiming)
- Liste item ekleme/cikarma: FadeIn/FadeOut layout animasyonu

---

### 2.5 Dark Mode Tasarim Kurallari

#### Temel Prensipler

**Renk Paleti:**
- Saf siyah (#000000) KULLANMA - goz yoruyor
- Koyu gri tonlari kullan: #121212 (arka plan), #1E1E1E (kart), #2C2C2C (yukseltilmis yuzey)
- Beyaz metin icin #FFFFFF yerine #E0E0E0 kullan (yumusak beyaz)
- Accent renkleri doygunlugu biraz dusur (parlak renkler dark'ta cok agresif)

**Tipografi:**
- Dark mode'da metin font agirligini biraz artir (daha kalin)
- Satirlar arasi boslugu artir
- Orta tonlarda metin rengi kullan (tam beyaz degil)

**Kontrast:**
- Normal metin icin en az 4.5:1 kontrast orani
- Buyuk metin icin en az 3:1
- Farkli cihazlarda test et (OLED vs LCD farkli gorunur)

**Yapilmamasi Gerekenler:**
- Acik temayi ters cevirme (invert) - bilinçli tasarla
- Goruntuleri otomatik ters cevirme
- Saf siyah arka plan + saf beyaz metin (halation efekti)

#### One Word'e Nasil Uygulanabilir?

- Arka plan: #0D0D0D veya #121212
- Kart arka plani: #1A1A2E (koyu lacivert ton - daha sofistike)
- Primary accent: Biraz desature edilmis mavi/mor
- Basari yesili: #4CAF50 yerine #66BB6A (daha yumusak)
- Hata kirmizisi: #F44336 yerine #EF5350 (daha yumusak)
- Metin: #E8E8E8 (primary), #A0A0A0 (secondary), #666666 (disabled)

#### Teknik Notlar (React Native Dark Mode)

```
// Yaklasim 1: useColorScheme() hook'u ile sistem tercihini oku
// Yaklasim 2: Context API ile tema yonetimi (ThemeProvider)
// Yaklasim 3: React Navigation theme prop'u

// Tavsiye: Sistem tercihini varsayilan yap, kullanici secimi ile override et
// Secimi AsyncStorage ile kalici yap
// NativeWind kullaniliyorsa: Otomatik dark mode destegi var

// Tema degistirme sirasinda animasyon ekle (smooth gecis)
```

#### Kaynaklar
- [Dark Mode Best Practices 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)
- [Dark Mode Done Right 2026 (Medium)](https://medium.com/@social_7132/dark-mode-done-right-best-practices-for-2026-c223a4b92417)
- [Kapsamli Dark Mode Rehberi](https://appinventiv.com/blog/guide-on-designing-dark-mode-for-mobile-app/)
- [LogRocket Dark Mode Guide](https://blog.logrocket.com/comprehensive-guide-dark-mode-react-native/)

---

### 2.6 Tipografi Kurallari (Mobil)

#### Temel Prensipler

**Font Boyutlari:**
- Body text: 16-18px (Apple HIG: 17pt standart)
- Baslik (H1): 28-34px
- Alt baslik (H2): 22-26px
- Kucuk metin: 12-14px
- Buton text: 16-18px (bold)

**Satir Yuksekligi (Line Height):**
- Body text: Font boyutu x 1.4-1.6 (ornek: 16px font -> 22-26px line height)
- Basliklar: Font boyutu x 1.2
- Alt basliklar: Font boyutu x 1.4

**Bosluklar:**
- Paragraf boslugu: Font boyutuna esit (16px font -> 16px margin-bottom)
- Baslik altindaki bosluk: Baslik font boyutunun 2 kati
- Karakter araligi (letter spacing): Yogun fontlarda %5-10 artir
- Satir uzunlugu: Mobilde 35-45 karakter ideal

**Font Secimi:**
- Sistem fontlari: SF Pro (iOS), Roboto (Android) - performans ve asinalik
- Humanist sans-serif: Calibri, Verdana - buyuk x-height, okunabilir
- Ozel font kullanacaksan: Inter, Poppins, Nunito iyi secenekler

#### One Word'e Nasil Uygulanabilir?

- Kelime karti: Kelime 28-32px bold, anlam 16-18px regular
- Quiz sorusu: 20-22px medium
- Buton text: 16px bold
- Istatistik sayilari: 32-40px bold (dikkat cekici)
- Aciklama metinleri: 14px regular, #A0A0A0 renk
- Tutarli tipografi skalasi olustur ve tum uygulamada kullan

#### Kaynaklar
- [Typography Best Practices 2026](https://www.adoc-studio.app/blog/typography-guide)
- [Mobile Font Size Guide](https://www.islamneddar.com/blog/mobile-development/mobile-font-size-guide-best-practice)
- [Toptal Mobile Typography](https://www.toptal.com/designers/typography/typography-for-mobile-apps)

---

## 3. DIL OGRENME UYGULAMALARI UI DETAYLARI

### 3.1 Duolingo'nun Animasyon Sistemi

#### Temel Prensipler

- Duolingo karakter animasyonlarinda **Rive** kullanıyor (video degil, gercek zamanli animasyon motoru)
- Rive native kod ile render eder (OpenGL/Metal) -> 60 FPS akici animasyon
- Karmasik animasyonlar kompakt .riv dosyalari olarak gelir (PNG klasorleri degil)
- State machine sistemi: Dogru cevap, yanlis cevap, bekleme, kutlama - hepsi ayni animasyon dosyasinda
- Ses ile senkron: Karakter konusma sirasinda agzini oynatir
- Idle davranislar: Kullanici bir sey yapmazken bile karakter canli gorunur

**Rive'in Avantajlari:**
- Dosya boyutu cok kucuk
- Interaktif: React state ile kontrol edilebilir
- Cross-platform: Ayni .riv dosyasi iOS + Android + Web
- Tasarimci-gelistirici is birligini kolaylastirir

#### One Word'e Nasil Uygulanabilir?

- Basit bir maskot/karakter tasarlayip Rive ile animasyonlu yapabiliriz
- Dogru/yanlis cevap animasyonlari icin Rive state machine
- Onboarding ekranlarinda animasyonlu rehber karakter
- Bos durum (empty state) ekranlarinda animasyonlu gorsel
- Kutlama ekranlarinda confetti + karakter animasyonu

#### Teknik Notlar (rive-react-native)

```
// Kurulum: npm install @rive-app/react-native react-native-nitro-modules
// React Native 0.70+ oneriliyor
// Yeni runtime Nitro ile guclendirilmis performans

// Rive tasarim sureci:
// 1. rive.app'te animasyon tasarla (veya tasarimciya yaptir)
// 2. State machine olustur (idle, correct, wrong, celebrate)
// 3. .riv dosyasini export et
// 4. React Native'de Rive component'i ile goster
// 5. State degisikliklerini React state ile tetikle

// React ile entegrasyon dogal hissediyor:
// Rive animasyonu halleder, React etkilesimi halleder
```

#### Kaynaklar
- [Rive React Native](https://rive.app/docs/runtimes/react-native)
- [Duolingo Rive Kullanimi (DEV.to)](https://dev.to/uianimation/how-duolingo-uses-rive-for-their-character-animation-and-how-you-can-build-a-similar-rive-mascot-5d19)
- [Rive Animation 2025 Guide](https://codercrafter.in/blogs/react-native/rive-animation-in-react-native-the-ultimate-2025-guide-for-developers)
- [rive-react-native GitHub](https://github.com/rive-app/rive-react-native)

---

### 3.2 Drops'un Minimalist UI Yaklasimi

#### Temel Prensipler

- Cok minimalist gorseller ama kelimeleri temsil edici ikonlar/illustrasyonlar
- Geleneksel flashcard yerine surukle-birak etkilesimleri
- Sevimli, sezgisel animasyonlar ezberlemsyi kolaylastiriyor
- Gorsel hafiza + mikro-ogrenme odakli
- Ses klipleri + gorsel eslestirme (dinleme becerisi testi)

**Tasarim Dersleri:**
- Estetik onemli ama islevsellik kurban edilmemeli
- Drops bazen estetige fazla odaklanip bazi islevleri bulmasi zor yapmis
- "Kullanici kontrolu ve ozgurlugu" ile "estetik ve minimalist tasarim" arasindaki denge onemli

#### One Word'e Nasil Uygulanabilir?

- Her kelime icin basit, temsili ikon/illustrasyon kullanabiliriz
- Minimalist renk paleti: 2-3 ana renk + accent
- Surukle-birak ile kelime eslestirme oyunu
- Animasyonlu gecisler ama abartisiz
- Temiz tipografi ile kelime odakli tasarim
- Drops'un hatasini yapma: Fonksiyonelliği kolay erisilebilir tut

---

### 3.3 Flashcard Tasarim Best Practices

#### Temel Prensipler

- Kart on yuzu: Kelime buyuk ve merkezi, temiz arka plan
- Kart arka yuzu: Anlam, ornek cumle, telaffuz
- 3D cevirme animasyonu (rotateY) kullaniciya fiziksel kart hissi verir
- Swipe gesture: Saga = biliyorum (yesil), Sola = bilmiyorum (kirmizi)
- Kart yiginlama (stack) gorunumu derinlik hissi verir
- Progress indicator: Kac kart kaldi gostergesi

#### One Word'e Nasil Uygulanabilir?

- Gunluk kelime karti: On yuz (Ingilizce kelime + telaffuz), arka yuz (Turkce anlam + ornek cumle)
- Swipe-to-learn mekanigi
- Kart yigini gorunumu (arkada hafif gorunen kartlar)
- Cevirme animasyonu: withTiming(rotateY, { duration: 400 })
- Renk kodlamasi: Bilinen (yesil kenar), bilinmeyen (kirmizi kenar), ogreniliyor (sari kenar)

---

### 3.4 Gamification Elementlerinin Gorsel Tasarimi

#### Temel Prensipler

**XP ve Level Sistemi:**
- XP kazanma aninda sayi artisi animasyonu (counting up)
- Level bar'da smooth progress animasyonu
- Level atlama aninda ozel kutlama animasyonu + haptic
- XP miktarini her aksiyondan sonra goster (+10 XP gibi floating text)

**Streak Sistemi:**
- Gunluk seri gosterimi (ates/alev ikonu standart)
- Seri kaybi uyarisi motivasyon artiriyor (Duolingo: %40-60 daha yuksek DAU)
- Seri tamamlama milestones (7 gun, 30 gun, 100 gun) ozel kutlamalar
- Seri dondurmasi: Kullanici kaybetme korkusunu azaltir

**Badge/Rozet Sistemi:**
- Her milestone icin benzersiz rozet (ilk 10 kelime, 100 kelime, 7 gun seri)
- Rozet kazanma animasyonu: Scale up + parlama + confetti
- Rozet vitrin sayfasi (koleksiyon motivasyonu)
- Kilitli rozetler: Hedef belirleme motivasyonu

**Progress Bar:**
- Dolum animasyonu: withTiming ile smooth gecis
- Renk degisimi: %25 kirmizi, %50 sari, %75 yesil, %100 altin
- Tamamlanma aninda parlama efekti
- Circular progress da kullanilabilir

#### One Word'e Nasil Uygulanabilir?

- Gunluk hedef: "Bugun 5 kelime ogrendin!" + progress ring
- XP sistemi: Her dogru cevap +10 XP, streak bonusu +5 XP
- Level sistemi: Her 100 XP = 1 level, level atlama kutlamasi
- Streak: Ates ikonu + gun sayisi, 7-30-100 gun milestones
- Rozetler: "Ilk Adim" (1. kelime), "Karsizimiz" (10 kelime), "Usta" (100 kelime)
- Haftalik ozet karti: Bu hafta ogrenilen kelime sayisi + grafik

#### Kaynaklar
- [Streaks & Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [14 App Gamification Examples](https://clevertap.com/blog/app-gamification-examples/)
- [12 Gamification Examples 2025](https://www.helpshift.com/blog/app-gamification-9-examples-of-mobile-apps-using-gamification/)
- [UI Design Meets Gamification (Medium)](https://medium.com/@incharaprasad/game-on-ui-design-meets-gamification-a27d3a6de6b1)

---

## 4. KULLANICI DENEYIMI PSIKOLOJISI

### 4.1 Renk Psikolojisi

#### Temel Prensipler

| Renk | Duygu/Anlam | Kullanim Alani |
|------|-------------|----------------|
| Mavi | Guven, sakinlik, profesyonellik | Ana tema, guvenilir alanlar |
| Yesil | Basari, sakinlik, dogallik | Dogru cevap, onay, ilerleme |
| Kirmizi | Aciliyet, hata, enerji | Yanlis cevap, uyari, CTA |
| Turuncu | Enerji, samimiyet, motivasyon | Gamification, streak, CTA |
| Sari | Iyimserlik, dikkat, netlik | Vurgulama, ipucu, uyari |
| Mor | Yaraticilik, premium, bilgelik | Premium ozellikler, basarimlar |

**Dark Mode'da Renk Kullanimi:**
- Parlak renkler dark arka planda daha agresif gorunur - doygunlugu %10-15 azalt
- Neon tonlari yerine pastel tonlari tercih et
- Accent renk olarak tek bir ana renk sec, tutarli kullan

#### One Word'e Nasil Uygulanabilir?

- Ana tema: Koyu lacivert/mor arka plan (bilgelik + premium his)
- Dogru cevap: Desature yesil (#66BB6A) + checkmark
- Yanlis cevap: Desature kirmizi (#EF5350) + shake
- XP/Streak: Sicak turuncu/amber (#FFB74D) - motivasyon
- Premium ozellikler: Altin/mor gradyan
- Interactive elemanlar: Parlak ama goz yormayan mavi (#64B5F6)

---

### 4.2 Kullanici Dikkatini Yonlendirme

#### Temel Prensipler

- **Gorsel Hiyerarsi:** Boyut, renk, kontrast ile onemli elemanlari one cikar
- **F-Pattern / Z-Pattern:** Kullanicilarin ekrani tarama seklini takip et
- **Beyaz Bosluk:** Onemli elemanlarin etrafinda yeterli bosluk birak
- **Animasyon ile Dikkat:** Hafif hareket dikkat ceker (ama abartma)
- **Renk ile Dikkat:** Tek bir accent renk ile CTA'yi vurgula
- **Progressive Disclosure:** Bilgiyi kademeli olarak goster, bunaltma

#### One Word'e Nasil Uygulanabilir?

- Gunun kelimesini ekranin merkezine, buyuk fontla yerleştir
- CTA butonu (Ogrenmeye Basla) tek parlak renkli eleman olsun
- Istatistikleri kucuk kartlarda, ikincil bilgi olarak goster
- Quiz'de soru merkezi, secenekler alt tarafta - gorsel hiyerarsi net

---

### 4.3 Motivasyon Teorileri ve Tasarima Etkisi

#### Self-Determination Theory (SDT)

Uc temel psikolojik ihtiyac:

1. **Otonomi (Autonomy):** Kullaniciya kontrol ver
   - Kendi ogrenme hizini secebilmeli
   - Tema/gorunum ozellestirme
   - Hedef belirleme ozgurlugu

2. **Yetkinlik (Competence):** Basari hissi ver
   - Zorluk seviyesini kademeli artir
   - Ilerleme gostergesi (progress bar)
   - Rozetler ve basarimlar

3. **Iliskililik (Relatedness):** Sosyal baglanti
   - Liderlik tablosu
   - Arkadaslarla karsilastirma
   - Topluluk hissi

#### Flow Theory (Csikszentmihalyi)

- **Flow durumu:** Zorluk seviyesi ile beceri seviyesi arasinda denge
- Cok kolay = sikici, Cok zor = hayal kirikligi
- Adaptif zorluk: Kullanicinin seviyesine gore zorluk ayarla
- Net hedefler + aninda geri bildirim + uygun zorluk = Flow

#### One Word'e Nasil Uygulanabilir?

- **Otonomi:** Gunluk kelime sayisini kullanici secsin (5, 10, 20)
- **Yetkinlik:** Her oturum sonunda "Bu oturumda X kelime ogrendin!" ozet ekrani
- **Iliskililik:** Ileride liderlik tablosu ve sosyal ozellikler eklenebilir
- **Flow:** Spaced repetition ile zorlugu otomatik ayarla
- **Aninda geri bildirim:** Her cevaptan sonra 300ms icinde gorsel + haptic geri bildirim

---

### 4.4 Onboarding Best Practices

#### Temel Prensipler

**Kritik Istatistik:**
- Kullanicilarin %77'si ilk 3 gunde uygulamayi terk ediyor
- Indirilen uygulamalarin %90'dan fazlasi ilk ay icinde terk ediliyor
- Iyi onboarding ile tutma orani %50'ye kadar artabiliyor
- Iyi onboarding flow'lari %80+ tamamlanma orani goruyor

**Best Practices:**

1. **Degeri hizli goster (<10 saniye):**
   - Kullaniciya "Bu uygulama ile ne kazanacaksin?" sorusunu hemen cevapla
   - One Word icin: Hemen bir kelime goster, ogrenme deneyimini yasatsin

2. **Kademeli ve interaktif onboarding:**
   - Her seyi bir anda gosterme, parcalara bol
   - Yaparak ogrenme: Tooltip, modal, vurgulanan UI elemanlari
   - LinkedIn modeli: Sindirilebilir asamalar

3. **Kisellestir:**
   - Seviye sorusu: "Ingilizce seviyen nedir?" (Baslangic/Orta/Ileri)
   - Hedef sorusu: "Gunluk hedefin nedir?" (5/10/20 kelime)
   - Dil tercihi

4. **Kayit surecinde surtunayi azalt:**
   - Deger gosterdikten SONRA kayit iste
   - Sosyal giris (Google/Apple) ile hizli kayit
   - Kayit olmadan bile temel ozellikleri kullanabilmeli

5. **Davranisi izle:**
   - Heatmap'ler ile kullanicilarin nerede takildigini gor
   - Onboarding adimlarinin tamamlanma oranlarini olc

#### One Word'e Nasil Uygulanabilir?

- Adim 1: Hosgeldin ekrani + degeri anlatan 1-2 cumle + animasyonlu gorsel
- Adim 2: Seviye secimi (Baslangic/Orta/Ileri)
- Adim 3: Gunluk hedef secimi (5/10/20 kelime)
- Adim 4: Hemen ilk kelimeyi goster (deger gosterimi)
- Adim 5: Kayit/Giris (Google/Apple ile hizli)
- Toplam: 5 adim, her biri tek ekran, atlanabilir

#### Kaynaklar
- [App Onboarding Guide 2026](https://uxcam.com/blog/10-apps-with-great-user-onboarding/)
- [Mobile App Onboarding 2026 (VWO)](https://vwo.com/blog/mobile-app-onboarding-guide/)
- [11 Onboarding Best Practices](https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/)
- [Onboarding Examples 2026](https://www.plotline.so/blog/mobile-app-onboarding-examples)

---

## 5. PERFORMANS OPTIMIZASYONU

### 5.1 FlatList vs ScrollView vs FlashList

#### Temel Prensipler

**ScrollView:**
- TUM child component'leri ayni anda render eder
- Kisa, sabit sayida item icin uygun
- Uzun listelerde performans sorunu: yavas scroll, yuksek bellek kullanimi
- Component state'ini korur (unmount etmez)

**FlatList:**
- Sadece gorunen item'leri render eder (virtualization)
- Kullanici scroll ettikce lazy loading yapar
- Uzun ve dinamik listeler icin uygun
- DEZAVANTAJ: Scroll disina cikan component'leri unmount edip yeniden olusturur (state kaybi)

**FlashList (Shopify) - 2025 TAVSIYE:**
- FlatList'in drop-in replacement'i (ayni API)
- v2 (2025): Tamamen yeniden yazildi, React Native New Architecture icin optimize
- Karmasik item component'lerinde bile 60 FPS
- Item boyut tahminlerine gerek yok (v2'de otomatik)
- Scroll sirasinda %50 daha az bos alan (v1'e gore)
- JS-only cozum, native bagimliligi yok (v2)
- UYARI: FlashList v2 sadece New Architecture ile calisiyor

#### One Word'e Nasil Uygulanabilir?

- Kelime listesi: FlashList kullan (potansiyel olarak yuzlerce kelime)
- Kisa sabit listeler (ayarlar menusunu, profil bilgileri): ScrollView yeterli
- Quiz secenekleri (4-5 item): ScrollView
- Istatistik gecmisi: FlashList
- FlashList v2'ye gecis: API FlatList ile ayni, birkac saniyede migration

#### Teknik Notlar

```
// FlashList kurulumu:
// npm install @shopify/flash-list

// FlatList -> FlashList migration:
// import { FlashList } from "@shopify/flash-list";
// <FlatList ... /> -> <FlashList estimatedItemSize={80} ... />
// estimatedItemSize v2'de zorunlu degil ama v1'de gerekli

// Performans ipuclari:
// 1. keyExtractor her zaman tanimla
// 2. renderItem'i memo ile sar
// 3. getItemType kullan (farkli item tipleri varsa)
// 4. removeClippedSubviews={true} (Android'de performans artisi)
```

#### Kaynaklar
- [FlashList Resmi Site](https://shopify.github.io/flash-list/)
- [FlashList v2 Duyurusu](https://shopify.engineering/flashlist-v2)
- [FlashList vs FlatList 2025 Karsilastirma](https://javascript.plainenglish.io/flashlist-vs-flatlist-2025-complete-performance-comparison-guide-for-react-native-developers-f89989547c29)
- [FlatList vs ScrollView Rehberi](https://bilalshafqat.com/react-native-flatlist-vs-scrollview/)

---

### 5.2 Lazy Loading ve Code Splitting

#### Temel Prensipler

- Sadece gerekli kisimlar yuklendiginde yukleme suresi azalir
- Bellek kullanimi duser, ag istekleri minimize olur
- React.lazy + Suspense ile component bazli lazy loading
- Route bazli code splitting: Her ekran ayri bundle

**Stratejiler:**
1. Route-based splitting: Her ekran ayri yuklenir
2. Component-based splitting: Agir component'ler lazy yuklenir
3. Data-based splitting: Buyuk veri setleri pagination ile yuklenir

#### One Word'e Nasil Uygulanabilir?

- Istatistik ekrani (grafik kutuphanesi agir olabilir) lazy load
- Profil ekrani lazy load
- Ayarlar ekrani lazy load
- Ana ekran (kelime karti) hemen yuklensin - kritik yol
- Ses dosyalari (telaffuz) sadece gerektiginde yuklensin

---

### 5.3 Image Optimization

#### Temel Prensipler

- **WebP/AVIF format:** PNG/JPG'den cok daha kucuk dosya boyutu
- **FastImage kullan:** Default Image component'i yerine react-native-fast-image
- **Responsive boyutlar:** Cihaz boyutuna gore uygun cozunurluk
- **Lazy loading:** Gorunmeyen gorseller yuklenmemeli
- **Explicit boyutlar:** Layout shift onlemek icin genislik/yukseklik belirt
- **Compress kalitesi:** %80-85 yeterli, gorunur kalite kaybi yok
- **Cache:** Gorselleri cache'le, tekrar indirme

#### One Word'e Nasil Uygulanabilir?

- Kelime illustrasyonlari: WebP formatinda, max 200KB
- Profil fotosu: Thumbnail + full size ayri
- Badge/rozet gorselleri: SVG (vektorel, boyut bagimsiz)
- Arka plan gorselleri: Dusuk cozunurluk + blur (glassmorphism icin)

---

### 5.4 Memory Management

#### Temel Prensipler

- JavaScript + native bellek ayri yonetilir, ikisini de izle
- Buyuk veri setlerini bellege yukleme - pagination kullan
- Kullanilmayan component'leri temizle (useEffect cleanup)
- Event listener'lari temizle
- Profiling araclari ile bellek buyume paternlerini tespit et

**Izlenmesi Gereken Metrikler:**
1. Cold start suresi (baslangictan ilk anlamli gosterime kadar)
2. Time to Interactive (TTI)
3. JS Thread mesgul suresi
4. Frame drops / FPS
5. Baslangic ve son bellek kullanimi

#### One Word'e Nasil Uygulanabilir?

- Kelime veritabanini parcali yukle (gunluk 5-20 kelime)
- Ses dosyalarini oynatildiktan sonra bellekten temizle
- Quiz oturumu bitince quiz verilerini temizle
- Uzun listelerde FlashList/FlatList ile virtualization

#### Kaynaklar
- [React Native Performance 2025](https://danielsarney.com/blog/react-native-performance-optimization-2025-making-mobile-apps-fast/)
- [Lazy Loading in React Native (DEV.to)](https://dev.to/amitkumar13/lazy-loading-in-react-native-boost-performance-and-optimize-resource-usage-1fmj)
- [Code Splitting Strategies (Medium)](https://medium.com/@ripenapps-technologies/code-splitting-lazy-loading-strategies-in-react-native-34172973c092)
- [Performance Optimization 2025](https://srptechs.com/blogs/boost-react-native/)

---

## 6. ACCESSIBILITY (ERISILEBILIRLIK)

### 6.1 Screen Reader Destegi (VoiceOver / TalkBack)

#### Temel Prensipler

**Temel Ozellikler:**
- `accessible={true}`: Elemani erisebilir olarak isaretler
- `accessibilityLabel`: Ekran okuyucu ne okuyacak (en onemli prop)
- `accessibilityRole`: Elemanin rolu (button, header, image, text vs.)
- `accessibilityHint`: Elemanla etkilesimde ne olacaginin aciklamasi
- `accessibilityState`: Elemanin durumu (disabled, selected, checked vs.)

**Best Practices:**
- Her etkilesimli elemana accessibilityLabel ekle
- Dekoratif gorsellere accessibilityElementsHidden={true}
- Focus sirasi mantikli olmali (sol-sag, yukari-asagi)
- Gercek ekran okuyucularla test et (otomatik araclar yeterli degil)

#### One Word'e Nasil Uygulanabilir?

- Kelime kartina: accessibilityLabel="Ingilizce kelime: {word}"
- Cevir butonuna: accessibilityLabel="Karti cevir", accessibilityHint="Kelimenin anlamini gormek icin cevir"
- Quiz seceneklerine: accessibilityRole="button", accessibilityLabel="Secenek: {option}"
- Progress bar: accessibilityRole="progressbar", accessibilityValue
- XP gostergesine: accessibilityLabel="Deneyim puani: {xp}"

---

### 6.2 Dokunma Hedefi Boyutu

#### Temel Prensipler

- Apple: Minimum 44x44 point dokunma alani
- Android: Minimum 48x48 dp dokunma alani
- Butonlar arasinda yeterli bosluk birak (en az 8px)
- Kucuk ikonlarin dokunma alanini padding ile genislet
- hitSlop prop'u ile gorunur boyutu degistirmeden dokunma alanini genislet

#### One Word'e Nasil Uygulanabilir?

- Tum butonlar min 44x44pt
- Quiz secenekleri: Genis dokunma alani, secenekler arasi 12px bosluk
- Kucuk ikonlar (ayarlar, geri, kapat): hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
- Tab bar ikonlari: 48x48 dokunma alani

---

### 6.3 Renk Kontrasti (WCAG)

#### Temel Prensipler

- **WCAG 2.1 AA Standardi:**
  - Normal metin: En az 4.5:1 kontrast orani
  - Buyuk metin (18px+ bold veya 24px+ regular): En az 3:1
  - Siyah-beyaz: Maksimum 21:1 kontrast orani

- Dark mode'da ozellikle dikkatli ol
- Monokrom ekranda da gorunur olmali
- Sinirli renk algisi olan kullanicilar icin renk disinda da ipucu ver (ikon, sekil, metin)
- Kontrast kontrol araclari: WebAIM Contrast Checker, Stark

#### One Word'e Nasil Uygulanabilir?

- Dogru/yanlis geri bildiriminde sadece renge guvenme: Ikon + renk + metin
- Dark mode arka plan (#121212) ustunde metin (#E0E0E0): ~13:1 kontrast (cok iyi)
- Disabled metin (#666666) arka plan (#121212) ustunde: ~3.5:1 (minimum karsilar)
- Tum renk kombinasyonlarini kontrast checker ile dogrula
- Renk koru kullanicilari icin: Desaturated yesil/kirmizi + farkli ikon sekilleri

---

### 6.4 Font Olceklendirme

#### Temel Prensipler

- Kullanicinin cihaz ayarlarindan font boyutunu degistirebilmesi lazim
- `allowFontScaling={true}` (varsayilan) ile sistem font buyutme destegi
- `maxFontSizeMultiplier` ile maximum buyumeyi sinirla (layout bozulmasin)
- Esnek layout'lar kur: Sabit yukseklik yerine minHeight/flexGrow kullan
- Buyutulmus fontlarla ekranin nasil gorunecegini test et

#### One Word'e Nasil Uygulanabilir?

- Tum Text component'lerinde allowFontScaling={true} koru
- Kelime kartinda maxFontSizeMultiplier={1.5} (karttan tasmasin)
- Butonlarda metin buyudugunde buton da buyusun (esnek layout)
- Font olceklendirme ile tum ekranlari test et (Accessibility Inspector)

#### Kaynaklar
- [React Native Accessibility Resmi Dokumantasyon](https://reactnative.dev/docs/accessibility)
- [React Native Accessibility 2025 Guide](https://www.accessibilitychecker.org/blog/react-native-accessibility/)
- [Callstack Accessibility Guide](https://www.callstack.com/blog/react-native-accessibility)
- [BrowserStack RN Accessibility](https://www.browserstack.com/guide/react-native-accessibility)

---

## SONUC VE ONCELIK SIRASI

### Aksam Gelistirme Icin Oncelik Listesi

1. **YUKSEK ONCELIK - Hemen Uygulanabilir:**
   - Reanimated 3 ile kart cevirme animasyonu
   - Dark mode renk paleti olusturma (yukarda belirlenen renkler)
   - Tipografi skalasi olusturma (tum font boyutlari, agırlıklar, satir yukseklikleri)
   - Haptic feedback entegrasyonu (expo-haptics)
   - Micro-interactions: Buton press efekti, dogru/yanlis animasyonu

2. **ORTA ONCELIK - Yakin Zamanda:**
   - Skeleton loading ekranlari
   - Bottom sheet implementasyonu (kelime detay paneli)
   - Gesture handler ile swipe mekanigi
   - FlashList entegrasyonu (kelime listeleri icin)
   - Glassmorphism efektleri (bottom sheet, modal)

3. **DUSUK ONCELIK - Ileride:**
   - Rive animasyonlari (maskot karakter)
   - Gamification gorsel tasarimi (XP bar, streak, badge)
   - Onboarding flow
   - Accessibility tam uyumluluk
   - Aurora UI arka plan efektleri

### Teknik Kutuphane Listesi (Kurulması Gerekenler)

```
# Animasyon
react-native-reanimated (v3+)
react-native-gesture-handler (v2+)

# UI Componentleri
@gorhom/bottom-sheet (v5)
@shopify/flash-list (v2)

# Efektler
expo-blur (glassmorphism)
expo-haptics (titresim)
react-native-fast-shimmer (skeleton loading)

# Gorseller
react-native-fast-image (performansli gorsel)
react-native-svg (ikonlar, badge'ler)

# Gelecekte
rive-react-native (karakter animasyonlari)
```

---

*Bu egitim notlari Efe tarafindan 8 Mart 2026 tarihinde hazirlanmistir.*
*Tum bilgiler guncel web kaynaklarindan derlenip One Word projesine uyarlanmistir.*
