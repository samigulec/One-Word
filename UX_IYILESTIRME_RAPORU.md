# One Word - UX Iyilestirme Arastirma Raporu

**Hazirlayan:** Efe (Bas Gelistirici)
**Tarih:** 8 Mart 2026
**Konu:** Ana Sayfa Kalabaliklik Problemi ve Cozum Onerileri

---

## Icindekiler

1. [Mevcut Sorunlarin Analizi](#1-mevcut-sorunlarin-analizi)
2. [Rakiplerin UX Analizi](#2-rakiplerin-ux-analizi)
3. [Somut Iyilestirme Onerileri](#3-somut-iyilestirme-onerileri)
4. [Oncelik Siralamasi](#4-oncelik-siralamasi)
5. [Ana Sayfa Yeniden Tasarim Onerisi](#5-ana-sayfa-yeniden-tasarim-onerisi)
6. [Kaynaklar](#6-kaynaklar)

---

## 1. Mevcut Sorunlarin Analizi

### 1.1. Mevcut Ana Sayfa Yapisi

Ana sayfamiz su anda 8 farkli bilesen iceriyor ve bunlarin hepsi tek bir ScrollView icerisinde dikey olarak siralanmis durumda:

```
+----------------------------------+
|  Header (greeting + level + streak) |
+----------------------------------+
|  XP Widget (seviye, XP, ilerleme,  |
|  gunluk XP, streak)               |
+----------------------------------+
|  Kelime Karti                      |
|  - emoji                           |
|  - kelime + telaffuz               |
|  - aksiyonlar (fav, ses, paylasim) |
|  - anlam                           |
|  - ornek cumle                     |
|  - grammar nuggets                 |
|  - real-world examples             |
+----------------------------------+
|  Gunluk Gorev Paneli (3 kart)     |
+----------------------------------+
|  Haftalik Zorluk Paneli           |
+----------------------------------+
|  Quiz Butonu                       |
+----------------------------------+
|  Pratik Yap Bolumu (6 senaryo)    |
+----------------------------------+
|  Bottom Tab Bar                    |
+----------------------------------+
```

### 1.2. Tespit Edilen Sorunlar

#### Sorun 1: Bilissel Asiri Yuk (Cognitive Overload)

Arastirmalar gosteriyor ki bilissel asiri yuk, kullanicinin ayni anda isleyebileceginden fazla bilgi ve secenekle karsilastiginda ortaya cikar. Bu durum daha yavas kararlar, daha fazla hata ve gorev terk etme oraninda artisa yol acar (Kaynak: garanord.md, customerthink.com). Bizim ana sayfamiz tam olarak bu sorunu yasatiyor:

- **8 farkli bilesen** ayni anda gorunuyor
- Kullanici ekrana baktiginda ne yapacagini bilemez
- Her bilesen kendi basina dikkat cekmeye calisiyor

#### Sorun 2: Bilgi Hiyerarsisi Eksikligi

Norman Nielsen Group'un arastirmasina gore, "Her ekranda tek bir birincil aksiyon olmali. Boyut, renk, kontrast ve bosluk kullanarak bu aksiyonu gorsel olarak one cikarmaliyiz. Ikincil aksiyonlar geri cekilmeli -- eger her sey esit derecede onemli gorunuyorsa, hicbir sey onemli hissettirmez." (Kaynak: nngroup.com)

Bizim ana sayfamizda:
- Kelime karti (ana icerik) ile XP widget'i esit gorsel agirlikta
- Gunluk gorevler ve haftalik zorluk ayni anda dikkat icin yarisiyor
- 6 pratik senaryo karti asiri yer kapliyor

#### Sorun 3: Kelime Karti Asiri Detayli

Kelime karti tek basina 7 alt bilesen iceriyor:
1. Emoji
2. Kelime + telaffuz
3. Aksiyon butonlari (favori, ses, paylasim)
4. Anlam
5. Ornek cumle
6. Grammar nuggets
7. Real-world examples

Bu, bir karttan cok bir sayfa gibi davranmasina neden oluyor. Kart tasariminin en temel kurali: "Her kart tek bir kavram sunmali" (Kaynak: mockplus.com, eleken.co).

#### Sorun 4: Dikey Kaydirma Yorgunlugu

Tum icerik tek bir dikey scroll icerisinde. Kullanicinin ana sayfanin en altindaki "Pratik Yap" bolumune ulasmasi icin uzun sureli kaydirma yapmasi gerekiyor. Bu, alt bileselerin kesfedilebilirligini (discoverability) ciddi olcude azaltiyor.

#### Sorun 5: HomeScreen.tsx = 1390 Satir

Teknik acidan da sorun buyuk. Tek bir dosyada 1390 satirlik kod, hem bakimi zorlastiriyor hem de performans sorunlarina yol acabiliyor. Bu, tasarim sorunlarinin kodda da yansidigini gosteriyor.

#### Sorun 6: Gamification Elemanlari Daginik

XP, streak, gunluk gorevler, haftalik zorluk ve rozetler farkli yerlere dagitilmis. Arastirmalar gosteriyor ki gamification elementlerinin basit tutulmasi gerekir: "Basit bir rozet veya streak sayaci, karmasik puan sistemlerinden genellikle daha etkilidir" (Kaynak: excited.agency, uxcam.com). Bizim uygulamamizda bu elementler cok daginik ve kalabalik.

---

## 2. Rakiplerin UX Analizi

### 2.1. Duolingo

**Ana Sayfa Yaklasimi: Tek Yol (Single Path)**

Duolingo 2022'de buyuk bir tasarim degisikligi yapti. Eski "agac" (tree) yapisini birakarak tek bir ogrenme yoluna (learning path) gecti (Kaynak: blog.duolingo.com).

```
+----------------------------------+
|  Header (streak + kalpler + XP)  |
+----------------------------------+
|                                  |
|     Ogrenme Yolu                 |
|     (dikey path ile dersler)     |
|                                  |
|     [O] Ders 1 (tamamlandi)     |
|        |                         |
|     [O] Ders 2 (tamamlandi)     |
|        |                         |
|     [>] Ders 3 (aktif)          |
|        |                         |
|     [ ] Ders 4 (kilitli)        |
|                                  |
+----------------------------------+
|  Bottom Bar (Home|Quest|Shop|    |
|  Profile|Leaderboard)            |
+----------------------------------+
```

**Onemli Tasarim Kararlari:**
- Ana ekranda sadece ogrenme yolu var, baska hicbir sey yok
- Streak ve XP bilgisi header'da minimal gosteriliyor (buyuk widget degil)
- Gunluk gorevler ayri bir tab'da (Quests)
- Liderlik tablosu ayri bir tab'da
- Magaza ayri bir tab'da

**Bize Dersi:** Ana ekranda tek bir sey yap -- onu iyi yap. Diger her seyi ayri ekranlara tasi.

### 2.2. Drops

**Ana Sayfa Yaklasimi: Minimalist ve Gorsel**

Drops, minimalist tasarimin dil ogrenme uygulamalarindaki en iyi orneklerinden biri (Kaynak: goodux.appcues.com, maenakajima.com).

```
+----------------------------------+
|  Basit header (dil secimi)       |
+----------------------------------+
|                                  |
|  [Kategori 1]  [Kategori 2]     |
|                                  |
|  [Kategori 3]  [Kategori 4]     |
|                                  |
|  [Kategori 5]  [Kategori 6]     |
|                                  |
+----------------------------------+
|  Buyuk "Basla" butonu            |
+----------------------------------+
```

**Onemli Tasarim Kararlari:**
- Renkli gradient arka planlar, beyaz yazi -- mukemmel kontrast
- Sade ve temiz arayuz, ilk kez kullananlar icin bile kolay
- Her seferinde tek bir kelimeye odaklanma
- 5 dakikalik seanslara bolunmus icerik
- Gorsel minimalizm ama etkili temsil

**Bize Dersi:** Az bilgi, cok gorsel. Her seferinde tek bir seye odaklan. Zaman sinirlamasi ile "bite-sized" ogrenme deneyimi sun.

### 2.3. Babbel

**Ana Sayfa Yaklasimi: Yapilandirilmis ve Yetiskin Odakli**

Babbel, temiz ve yetiskin odakli bir arayuz sunuyor (Kaynak: fluentu.com, speechify.com).

```
+----------------------------------+
|  Header (ilerleme ozeti)         |
+----------------------------------+
|  Devam Et (son birakilan ders)   |
+----------------------------------+
|  Kurs Ilerlemesi                 |
|  Unite 1: [=====>     ] %60     |
+----------------------------------+
|  Onerilen Dersler                |
+----------------------------------+
```

**Onemli Tasarim Kararlari:**
- Streak veya liderlik tablosu YOK
- 10-15 dakikalik yapilandirilmis dersler
- Acik dilbilgisi ogretimi
- Temiz, profesyonel gorunum

**Bize Dersi:** Her uygulamanin streak/XP/badge'e ihtiyaci yoktur. Bazen icerigin kendisi yeterlidir. Ama biz gamification'i kullaniyorsak, zarif olmali.

### 2.4. Memrise

**Ana Sayfa Yaklasimi: Icerik Oncelikli**

Memrise, basit ve temiz bir tasarimla kullaniciyi icerikteki ana hedefe yonlendiriyor (Kaynak: duolingoguides.com, testprepinsight.com).

```
+----------------------------------+
|  Header (streak + puan)         |
+----------------------------------+
|  Bugunku Icerik                  |
|  (video klip veya flashcard)    |
+----------------------------------+
|  Ogrenilecek Kelimeler           |
|  [=====>          ] 5/20        |
+----------------------------------+
|  Tekrar Et butonu                |
+----------------------------------+
```

**Onemli Tasarim Kararlari:**
- Gercek dil klipleri ve flashcard'lar
- Aralikli tekrar (spaced repetition) odakli
- Basit navigasyon
- Icerige odaklanma, gamification ikinci planda

**Bize Dersi:** Icerik her zaman birincil olmali. Gamification elementleri destekleyici rollerde kalmali, ana rolu oynamamali.

### 2.5. Karsilastirma Tablosu

| Ozellik | Duolingo | Drops | Babbel | Memrise | One Word (Mevcut) |
|---------|----------|-------|--------|---------|-------------------|
| Ana odak | Ogrenme yolu | Kategori secimi | Kurs ilerlemesi | Flashcard | Kelime karti + her sey |
| Gamification ana ekranda | Minimal (header) | Neredeyse yok | Yok | Minimal | ASIRI (XP widget, gorevler, haftalik) |
| Scroll gerekliligi | Az | Az | Orta | Az | COK FAZLA |
| Gorsel kalabalik | Dusuk | Cok dusuk | Dusuk | Dusuk | Yuksek |
| Tek odak noktasi var mi? | Evet (aktif ders) | Evet (basla butonu) | Evet (devam et) | Evet (bugunku icerik) | HAYIR |
| Bottom tab sayisi | 5 | 3-4 | 4 | 4 | 5 |

**Sonuc:** Basarili tum rakipler ana ekranda TEK BIR ODAK NOKTASI sunuyor. Bizim ana sayfamiz ise her seyi ayni anda gostermeye calisiyor.

---

## 3. Somut Iyilestirme Onerileri

### Oneri 1: Bilgi Katmanlandirmasi (Progressive Disclosure)

**Ne degismeli?**
Kelime kartindaki grammar nuggets, real-world examples ve cultural context bilgileri ana ekrandan kaldirilmali. Bunlar kullanicinin istegi uzerine acilmali.

**Neden?**
Progressive disclosure teknigi, bilissel yuku azaltmak icin bilgiyi asiri olarak gostermek yerine katmanlar halinde sunar. NN/g'nin arastirmasina gore: "Baslangicta kullanicilara sadece en onemli secenekleri gosterin. Daha genis, uzmanlasmis secenekleri sadece kullanici isterse aciklayin" (Kaynak: nngroup.com).

**Nasil? (Wireframe)**
```
ONCE (mevcut):                    SONRA (onerilen):
+------------------------+        +------------------------+
| Kelime Karti           |        | Kelime Karti           |
| - emoji                |        | - emoji + kelime       |
| - kelime               |        | - telaffuz butonu      |
| - telaffuz             |        | - "Anlamini Gor" (tap) |
| - aksiyonlar           |        | - aksiyonlar (kucuk)   |
| - anlam                |        +------------------------+
| - ornek cumle          |
| - grammar              |        Tap yapinca Bottom Sheet:
| - real-world           |        +------------------------+
| - cultural context     |        | Anlam                  |
+------------------------+        | Ornek cumle            |
                                  | [Grammar] [Ornekler]   |
                                  |  (tab'lar ile)         |
                                  +------------------------+
```

### Oneri 2: XP Widget'ini Kucultu ve Header'a Entegre Et

**Ne degismeli?**
Ayri bir XP widget'i yerine, gamification bilgileri header'a kompakt olarak entegre edilmeli.

**Neden?**
Duolingo'nun yaklasimi bunu en iyi gosteriyor: streak, XP ve kalp bilgileri header'da kucuk ikonlarla gosteriliyor. Ayri bir widget olarak bu kadar gorsel alan kaplamak, ana icerigi (kelime kartini) asagiya itiyor. Arastirmalar "Basit bir streak sayaci, karmasik puan sistemlerinden genellikle daha etkilidir" diyor (Kaynak: uxcam.com).

**Nasil? (Wireframe)**
```
ONCE:                              SONRA:
+----------------------------+     +----------------------------+
| Merhaba, Sami!     Lv.5   |     | Merhaba, Sami!             |
+----------------------------+     | Lv.5  [flame]7  XP:1250   |
| [====XP BAR=========]     |     +----------------------------+
| Gunluk: 35/50 XP          |     |                            |
| Streak: 7 gun             |     | (Direkt kelime karti)      |
| Toplam: 1250 XP           |     |                            |
+----------------------------+     +----------------------------+
|                            |
| (Kelime karti buradan      |     XP detaylari icin header'a
|  basliyor, cok asagida)    |     tap yapinca Bottom Sheet acilir
+----------------------------+
```

### Oneri 3: Gunluk Gorev ve Haftalik Zorluk Panellerini Birlestir

**Ne degismeli?**
Gunluk gorevler (3 kart) ve haftalik zorluk paneli ana ekrandan kaldirilip, header'daki bir ikona veya bottom tab'daki "Quests" sekmesine tasinmali.

**Neden?**
Duolingo bu konuda en iyi ornegi sunuyor: gorevler "Quests" adli ayri bir tab'da. Bu, ana ekrani sadelestirir ve kullaniciyi ana icerikteki kelimeye odaklandirir. Ayrica bilgi hiyerarsisi acisindan, gorevler ikincil bilgidir -- birincil bilgi ogrenilecek kelimedir.

**Nasil? (Wireframe)**
```
ONCE:                              SONRA:
+----------------------------+     Bottom Tab Bar:
| Gunluk Gorev 1    [x]     |     [Home] [Quests] [History] [Profile]
| Gunluk Gorev 2    [ ]     |
| Gunluk Gorev 3    [ ]     |     "Quests" tab'ina tiklaninca:
+----------------------------+     +----------------------------+
| Haftalik Zorluk            |     | Gunluk Gorevler            |
| [=====        ] 3/7       |     | [x] Kelime ogren           |
+----------------------------+     | [ ] Anlam kesifet          |
                                   | [ ] AI ile pratik yap      |
                                   +----------------------------+
                                   | Haftalik Zorluk            |
                                   | [=====        ] 3/7       |
                                   +----------------------------+
                                   | Rozetler                   |
                                   +----------------------------+
```

### Oneri 4: Pratik Yap Bolumunu (6 Senaryo) Ayri Ekrana Tasi

**Ne degismeli?**
6 senaryo kartini ana ekrandan cikartip, tek bir "Pratik Yap" butonu ile erisilen ayri bir ekrana tasimali.

**Neden?**
6 kart, ana ekranin en kalabalik bolumu. Her karttan tek bir kavram sunma kurali ihlal ediliyor. Ayrica kullanici zaten 6 senaryodan birini secmeden once tamamini goremez -- uzun kaydirma gerekir. Card-based tasarim en iyi pratiklerine gore: "UI kartlarini cok fazla buton ve icerikle doldurmaktan kacinin. Sadece en faydali bilgiyi gosterin" (Kaynak: mockplus.com).

**Nasil? (Wireframe)**
```
ONCE:                              SONRA:
+----------------------------+     +----------------------------+
| Senaryo 1  | Senaryo 2    |     |                            |
+----------------------------+     | [Pratik Yap]  (tek buton) |
| Senaryo 3  | Senaryo 4    |     |                            |
+----------------------------+     +----------------------------+
| Senaryo 5  | Senaryo 6    |
+----------------------------+     Butona tiklaninca ayri ekran:
                                   +----------------------------+
                                   | Pratik Senaryolari         |
                                   | [Kafe siparis] [Otel]     |
                                   | [Taksi]       [Restoran]  |
                                   | [Alisveris]   [Yol tarifi]|
                                   +----------------------------+
```

### Oneri 5: Swipe ile Kart Navigasyonu

**Ne degismeli?**
Kelime kartinin alt detaylari (anlam, ornek, grammar, real-world) dikey scroll yerine yatay swipe ile gecilebilir sekilde tasarlanmali.

**Neden?**
Gesture-based navigasyon, ekran alanini maksimize eder ve modern hissettirir (Kaynak: codebridge.tech, medium.com/@Alekseidesign). Kullanici doga akisinda bilgiyi kesfeder. "Swipe navigasyonun onemli bilesenleri: kaydirma kartlari, carousel, tab'li navigasyon ve gorsel galeri" seklinde tanimlanir.

**Nasil? (Wireframe)**
```
+----------------------------+
|        Kelime Karti         |
|    [emoji]  "Serendipity"   |
|    /seren'dipiti/  [ses]    |
+----------------------------+
|  [Anlam]  [Ornek]  [Grammar]  <- dot indicator
|                              |
|  < swipe left/right >       |
|                              |
|  "The occurrence of events  |
|   by chance in a happy way" |
+----------------------------+
     .  o  .  .               <- sayfa gostergesi
```

### Oneri 6: Bottom Sheet ile Detay Gosterimi

**Ne degismeli?**
Grammar nuggets, real-world examples ve cultural context gibi detayli icerikler bottom sheet (alt panel) icerisinde gosterilmeli.

**Neden?**
Bottom sheet, NN/g'nin tanimina gore "mobil cihazlar icin ozellikle uygun olan, gecici olarak onemli bilgiyi hazir tutan ama kapatilabilir olan kismi bir kaplama katmanidir" (Kaynak: nngroup.com). Bu pattern, ana ekrani sadelestirirken bilgiye erisimi korur. "Ekranin altinda (kullanicinin bas parmaklarinin oldugu yerde) konumlanarak ve yatay alani tam kullanarak, bottom sheet'ler sayfa-icinde-sayfa deneyimi sunar" (Kaynak: blog.logrocket.com).

**Nasil? (Wireframe)**
```
Normal ekran:
+----------------------------+
| Kelime Karti (basit)       |
| [Daha Fazla Bilgi v]      |
+----------------------------+

"Daha Fazla Bilgi" tiklaninca:
+----------------------------+
| Kelime Karti (soluk)       |
+----------------------------+
| ========================== |  <- drag handle
| Grammar Nuggets            |
|   - present perfect ile    |
|     kullanilir             |
|                            |
| Real-World Examples        |
|   - "What a serendipity!"  |
|                            |
| Cultural Context           |
|   - Horace Walpole 1754... |
| ========================== |
+----------------------------+
```

### Oneri 7: Kompakt Gamification Bar

**Ne degismeli?**
XP, streak ve seviye bilgilerini tek satira sigidir ve ilerleme cubugunu ince bir bar olarak goster.

**Neden?**
En basarili gamification uygulamalari elementleri basit ve zarif tutar. "Gamification'a basladiktan sonra, uygulamayi gittikce daha fazla oyunlastirma cazibesine direnmek zor olabilir. Bu nedenle sinirlari bilmek ve sadece gerekli elemanlari uygulamak onemlidir" (Kaynak: mockplus.com).

**Nasil? (Wireframe)**
```
+-------------------------------------------+
| [flame]7  |  Lv.5  [======>    ]  |  1250 XP |
+-------------------------------------------+
```

Tek satir, her sey icerde. Tap yapinca detayli XP ekranina gidir.

### Oneri 8: "Focus Mode" veya "Calm Mode" Iyilestirmesi

**Ne degismeli?**
Mevcut `calmMode` prop'u kullanilarak, gamification elementlerini tamamen gizleyen bir mod sunulmali. Bu modda sadece kelime karti ve "Pratik Yap" butonu gorunur.

**Neden?**
2025-2026 trendlerinde "kullanici-oncelikli tasarim, gereksiz her seyi kaldirmak, daha sakin ekranlar, daha odakli yerlesimler ve daha net gorsel hiyerarsi" one cikiyor (Kaynak: chopdawg.com, designstudiouiux.com). Bazi kullanicilar sadece kelimeyi ogrenmek ister, gamification istemez.

**Nasil? (Wireframe)**
```
Calm Mode ON:
+----------------------------+
| Merhaba, Sami!             |
+----------------------------+
|                            |
|    [emoji] "Serendipity"   |
|    /seren'dipiti/          |
|                            |
|    [Anlamini Gor]          |
|                            |
|    [Pratik Yap]            |
|                            |
+----------------------------+
| [Home]        [Settings]   |
+----------------------------+
```

---

## 4. Oncelik Siralamasi

Asagidaki tablo, her oneriyi etki (kullanici deneyimine katkisi), efor (gelistirme maliyeti) ve oncelik sirasina gore degerlendirmektedir:

| Sira | Oneri | Etki | Efor | Oncelik |
|------|-------|------|------|---------|
| 1 | **XP Widget'ini Header'a Entegre Et** | Cok Yuksek | Dusuk | P0 - Hemen |
| 2 | **Kelime Kartini Sadelestir (Progressive Disclosure)** | Cok Yuksek | Orta | P0 - Hemen |
| 3 | **Gunluk Gorev + Haftalik Zorluk ayri ekrana tasi** | Yuksek | Orta | P1 - Yakin |
| 4 | **Pratik Yap bolumunu ayri ekrana tasi** | Yuksek | Dusuk | P1 - Yakin |
| 5 | **Bottom Sheet ile detay gosterimi** | Orta | Orta | P2 - Planli |
| 6 | **Swipe ile kart navigasyonu** | Orta | Yuksek | P2 - Planli |
| 7 | **Kompakt Gamification Bar** | Orta | Dusuk | P1 - Yakin |
| 8 | **Calm Mode iyilestirmesi** | Dusuk-Orta | Dusuk | P3 - Gelecek |

### Neden Bu Sira?

**P0 (Hemen Yapilmali):**
- XP Widget'inin header'a tasinmasi, en az eforla en buyuk gorsel temizligi saglayacak degisiklik. Scroll olmadan ana icerigi (kelime kartini) hemen gorunur kilacak.
- Kelime kartinin sadeletirilmesi, kullanicinin ana gorevine (kelime ogrenme) odaklanmasini saglayacak.

**P1 (Yakin Vadede):**
- Gorev ve zorluk panellerinin tasimasi, ana ekrandan 2 buyuk bloku kaldirir.
- Pratik bolumunun tasimasi, 6 kartlik kalabaligi tek butona indirir.
- Kompakt gamification bar, gorsel gürultuyu azaltir.

**P2 (Planli):**
- Bottom sheet ve swipe, daha ileri duzey UX iyilestirmeleri. Temel sadelesme P0 ve P1 ile saglandiktan sonra uygulanmali.

**P3 (Gelecek):**
- Calm mode, kullanici tabaninin bir kismi icin faydali olacak ama oncelikli degil.

---

## 5. Ana Sayfa Yeniden Tasarim Onerisi

### 5.1. Ideal Yerlesim Plani

Tum onerilerin uygulanmasi durumunda yeni ana sayfa su sekilde gorunecektir:

```
+============================================+
|                                            |
|  Merhaba, Sami!                            |
|  [flame]7  Lv.5 [==>   ]  1250 XP  [bell] |
|                                            |
+============================================+
|                                            |
|              [cloud emoji]                 |
|                                            |
|           "Serendipity"                    |
|           /seren'dipiti/                   |
|                                            |
|    [ses]    [favori]    [paylas]            |
|                                            |
|         [Anlamini Gor]                     |
|                                            |
|  ..........................................  |
|  .  Swipe ile: Anlam | Ornek | Grammar  .  |
|  .                                      .  |
|  .  "The occurrence of events by chance .  |
|  .   in a happy way"                    .  |
|  .                                      .  |
|  .         o  .  .                      .  |
|  ..........................................  |
|                                            |
|         [Pratik Yap]                       |
|         [Quiz Coz]                         |
|                                            |
|  [Tekrar Bekleyen: 3 kelime >]             |
|                                            |
+============================================+
|  [Home]  [Quests]  [History]  [Profile]    |
+============================================+
```

### 5.2. Degisikliklerin Ozeti

| Eski | Yeni |
|------|------|
| Ayri XP widget (buyuk) | Header'da tek satir (kompakt) |
| Kelime karti (7 alt bilesen) | Kelime karti (3 alt bilesen + swipe) |
| Gunluk gorevler (ana ekranda) | "Quests" tab'inda |
| Haftalik zorluk (ana ekranda) | "Quests" tab'inda |
| 6 pratik senaryo karti | Tek "Pratik Yap" butonu |
| 5 tab (Home, History, Badges, Journey, Settings) | 4 tab (Home, Quests, History, Profile) |
| 1390 satirlik tek dosya | Modular bilesenler |
| Uzun scroll gerektiren layout | Scroll gerektirmeyen tek ekran |

### 5.3. Bottom Tab Bar Yeniden Yapilandirmasi

**Mevcut:** Home | History | Badges | Journey | Settings (5 tab)

**Onerilen:** Home | Quests | History | Profile (4 tab)

- **Home:** Kelime karti + pratik + quiz
- **Quests:** Gunluk gorevler + haftalik zorluk + rozetler + journey ilerleme
- **History:** Ogrenilen kelimeler + tekrar sistemi
- **Profile:** Ayarlar + istatistikler + seviye detayi + paylasim

**Neden 4 tab?**
- Badges ve Journey ayri tab olarak yeterli icerige sahip degil, Quests altinda birlestirilebilir
- Settings kendi basina bir tab olarak gereksiz, Profile altinda olabilir
- 4 tab, bas parmak ergonomisi acisindan ideal (Kaynak: elaris.software)
- "3 tiklama kurali": onemli bir ozellege ulasmak icin 3'ten fazla dokunma gerekiyorsa, hiyerarside cok derine gomulmustur (Kaynak: optimalworkshop.com)

### 5.4. Teknik Yapi Onerisi (Kod Yazilmayacak, Sadece Plan)

```
HomeScreen.tsx (~200 satir)
  |-- CompactHeader (greeting + gamification bar)
  |-- WordCard (emoji + kelime + telaffuz + aksiyonlar)
  |-- WordDetailSwiper (anlam | ornek | grammar - swipe)
  |-- ActionButtons (pratik yap + quiz)
  |-- ReviewReminder (tekrar hatirlatma)

QuestsScreen.tsx (~300 satir)
  |-- DailyTasks
  |-- WeeklyChallenge
  |-- BadgesProgress
  |-- JourneyMilestones

ProfileScreen.tsx (~200 satir)
  |-- UserStats (XP detay, seviye, streak gecmisi)
  |-- Settings
  |-- ShareAchievements
```

Bu yapiyla HomeScreen.tsx 1390 satirdan ~200 satira iner. Her bilesen kendi sorumlulugunu tasir (Single Responsibility Principle).

---

## 6. Kaynaklar

### Minimalist UX ve Mobil Tasarim
- [UI/UX Design Trends in Mobile Apps for 2025 - Chop Dawg](https://www.chopdawg.com/ui-ux-design-trends-in-mobile-apps-for-2025/)
- [12 Mobile App UI/UX Design Trends for 2026 - DesignStudio](https://www.designstudiouiux.com/blog/mobile-app-ui-ux-design-trends/)
- [Mobile App UI Design Guide - Droids on Roids](https://www.thedroidsonroids.com/blog/mobile-app-ui-design-guide)
- [Best UI Design Practices for Mobile Apps in 2026 - UIDesignz](https://uidesignz.com/blogs/mobile-ui-design-best-practices)
- [Mobile-First UX Design Best Practices 2026 - Trinergy Digital](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026)

### Dil Ogrenme Uygulamalari UX Analizi
- [The Science Behind Duolingo's Home Screen Redesign - Duolingo Blog](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- [Behind the Design: Duolingo - Apple Developer](https://developer.apple.com/news/?id=jhkvppla)
- [Drops' Effortless Visual Language Lessons - GoodUX](https://goodux.appcues.com/blog/drops-effortless-visual-language-lessons)
- [Drops Mobile App UX Analysis - Maena Kajima](https://www.maenakajima.com/drops-mobile-app)
- [Duolingo vs Babbel - FluentU](https://www.fluentu.com/blog/reviews/duolingo-vs-babbel/)
- [Memrise vs Duolingo - DuolingoGuides](https://duolingoguides.com/memrise-vs-duolingo/)

### Bilgi Hiyerarsisi ve Progressive Disclosure
- [Progressive Disclosure - Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/)
- [Progressive Disclosure for Mobile Apps - UX Planet](https://uxplanet.org/design-patterns-progressive-disclosure-for-mobile-apps-f41001a293ba)
- [Progressive Disclosure in UX - LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [What is Progressive Disclosure - UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/)
- [Information Architecture for Mobile Apps - Optimal Workshop](https://www.optimalworkshop.com/blog/designing-information-architecture-for-mobile-apps)
- [Visual Hierarchy and Information Architecture - Design+Code](https://designcode.io/mobbin-design-visual-hierarchy/)

### Card-Based UI ve Bottom Sheet
- [Card UI Design Best Practices - Eleken](https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners)
- [Card UI Design - Mockplus](https://www.mockplus.com/blog/post/card-ui-design)
- [Card-Based UI Design - Mobbin](https://mobbin.com/glossary/card)
- [Bottom Sheets: Definition and UX Guidelines - NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- [Bottom Sheets for Optimized UX - LogRocket](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/)
- [Bottom Sheet UI Design - Mobbin](https://mobbin.com/glossary/bottom-sheet)

### Gamification UX
- [Gamification in UX: How to Boost Engagement - Excited Agency](https://excited.agency/blog/gamification-ux)
- [Using UX Gamification - UXCam](https://uxcam.com/blog/gamification-examples-app-best-practices/)
- [Gamification in UI/UX: The Ultimate Guide - Mockplus](https://www.mockplus.com/blog/post/gamification-ui-ux-design-guide)
- [Streaks and Milestones for Gamification - Plotline](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)

### Gesture-Based Navigasyon
- [The Impact of Gestures on Mobile UX - Codebridge](https://www.codebridge.tech/articles/the-impact-of-gestures-on-mobile-user-experience)
- [Gesture-Based Navigation: The Future - Medium](https://medium.com/@Alekseidesign/gesture-based-navigation-the-future-of-mobile-interfaces-ae0759d24ad7)
- [Mobile App UX: Designing for Thumb Zones - Elaris](https://elaris.software/blog/mobile-ux-thumb-zones-2025/)
- [Mobile-First UX Patterns 2026 - TensorBlue](https://tensorblue.com/blog/mobile-first-ux-patterns-driving-engagement-design-strategies-for-2026)

### Bilissel Yuk ve Sadelestime
- [Cognitive Overload in Mobile Apps - Garanord](https://garanord.md/reducing-cognitive-overload-on-mobile-apps-ux-tips-for-small-screens/)
- [Cognitive Load and Mobile UX - CustomerThink](https://customerthink.com/cognitive-load-and-mobile-ux-design-how-to-make-a-user-less-overwhelmed/)
- [The Power of Simplified UIs in Mobile Apps - SennaLabs](https://sennalabs.com/blog/the-power-of-simplified-user-interfaces-in-mobile-apps)
- [UI/UX Tips to Reduce Cognitive Overload - ReloadUX](https://reloadux.com/blog/ux-tips-to-reduce-users-cognitive-overload/)

---

> **Sonuc:** Ana sayfamizin temel sorunu, "her seyi gostermek" yaklasimidir. Basarili rakiplerin hepsi tek bir seye odaklaniyor. Bizim icin bu odak "gunun kelimesi" olmalidir. Diger her sey ya header'a sikistirilmali, ya bottom sheet'e tasinmali, ya da ayri ekranlara alinmalidir. Bu degisiklikler hem kullanici deneyimini iyilestirecek hem de kod tabanini temizleyecektir.
