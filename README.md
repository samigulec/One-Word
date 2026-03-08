# 🌍 One Word

<div align="center">

![One Word Logo](https://img.shields.io/badge/One%20Word-Learn%20Daily-667eea?style=for-the-badge&logo=duolingo&logoColor=white)

**Learn a new word every day. Build your vocabulary, one word at a time.**

[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#-features) • [Screenshots](#-screenshots) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎯 Daily Word Learning
- **One word per day** - Focus on quality over quantity
- **Level-based content** - Beginner, Intermediate, and Advanced words
- **Multi-language support** - Learn Spanish, English, and more!

### 🌐 Truly Global
- **11 UI languages** - English, Turkish, Spanish, German, French, Portuguese, Italian, Russian, Japanese, Korean, Chinese
- **Learn any language** - Choose your native language and target language
- **Localized translations** - Meanings shown in your native language

### 🗺️ Learning Journey
- **Visual roadmap** - Track your daily progress
- **Streak system** - Build consistency with day streaks
- **Milestones** - Celebrate achievements at 7, 14, 30, 60, and 100 days

### 💬 AI Practice Mode
- **Chat with AI tutor** - Practice using the word in context
- **Gentle corrections** - Learn from mistakes without frustration
- **Quick replies** - Get examples, meanings, and pronunciation help

### 🎨 Beautiful UX
- **Modern gradient design** - Eye-catching purple/blue theme
- **Smooth animations** - Delightful micro-interactions
- **Kawaii aesthetic** - Friendly and approachable design

---

## 📱 Screenshots

<div align="center">

| Onboarding | Home Screen | Journey Map |
|:---:|:---:|:---:|
| 👋 Welcome flow | 📚 Daily word card | 🗺️ Progress tracking |
| Select native language | See word + meaning | Visual day-by-day path |
| Choose target language | Practice with AI | Streak & milestones |
| Pick your level | Tap to reveal meaning | Motivational messages |

</div>

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo Go app on your phone

### Quick Start

```bash
# Clone the repository
git clone https://github.com/samigulec/Bi-kelime.git

# Navigate to project
cd Bi-kelime/DailyIdiomApp

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

1. Install **Expo Go** from App Store / Play Store
2. Scan the QR code from terminal
3. App will load on your device!

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development platform & tooling |
| **TypeScript** | Type-safe JavaScript |
| **AsyncStorage** | Local data persistence |
| **Expo Linear Gradient** | Beautiful gradient backgrounds |
| **Expo Haptics** | Tactile feedback |
| **React Native Animated** | Smooth UI animations |

---

## 📁 Project Structure

```
DailyIdiomApp/
├── App.tsx                 # Main app entry & navigation
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.tsx   # 3-step welcome flow
│   │   ├── HomeScreen.tsx         # Daily word display
│   │   ├── ChatScreen.tsx         # AI practice chat
│   │   └── JourneyScreen.tsx      # Progress roadmap
│   ├── data/
│   │   └── content/
│   │       ├── en_content.json    # English words (A1-C2)
│   │       └── es_content.json    # Spanish words (A1-C2)
│   ├── utils/
│   │   ├── translations.ts        # UI translations (11 languages)
│   │   ├── contentLoader.ts       # Level-based content loading
│   │   └── storage.ts             # AsyncStorage helpers
│   ├── services/
│   │   └── aiChat.ts              # AI tutor responses
│   └── types/
│       └── index.ts               # TypeScript definitions
└── assets/                        # App icons & images
```

---

## 🎮 How It Works

### 1️⃣ Onboarding (First Launch)
```
Step 1: "I speak..." → Select your native language
Step 2: "I want to learn..." → Choose target language  
Step 3: "My level is..." → Pick Beginner/Intermediate/Advanced
```

### 2️⃣ Daily Learning
- Open the app each day
- See your word of the day
- Tap "Show Meaning" to reveal translation
- Practice with AI to reinforce learning

### 3️⃣ Track Progress
- Tap the streak counter to see your journey
- Complete daily lessons to unlock new days
- Earn milestone badges as you progress

---

## 🌍 Supported Languages

### As Native Language (UI)
🇺🇸 English • 🇹🇷 Türkçe • 🇪🇸 Español • 🇩🇪 Deutsch • 🇫🇷 Français • 🇧🇷 Português • 🇮🇹 Italiano • 🇷🇺 Русский • 🇯🇵 日本語 • 🇰🇷 한국어 • 🇨🇳 中文

### As Target Language (Learning)
🇺🇸 English • 🇪🇸 Spanish *(more coming soon!)*

---

## 📊 Content Levels

| Level | Badge | Description | Example Words |
|-------|-------|-------------|---------------|
| 🌱 Beginner | A1 | Basic vocabulary | Hello, Thank you, Friend |
| 📚 Intermediate | B1 | Everyday topics | However, Develop, Despite |
| 🚀 Advanced | C1 | Complex expressions | Nevertheless, Elucidate |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add more words** - Expand the content files
2. **Add languages** - Create new `xx_content.json` files
3. **Improve translations** - Enhance UI translations
4. **Fix bugs** - Report or fix issues
5. **Suggest features** - Open a feature request

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/AmazingFeature

# Commit your changes
git commit -m 'Add some AmazingFeature'

# Push to the branch
git push origin feature/AmazingFeature

# Open a Pull Request
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by language learning apps like Duolingo
- Built with ❤️ using React Native & Expo
- Icons and emojis from native system fonts

---

<div align="center">

**Made with 💜 for language learners worldwide**

[⬆ Back to top](#-one-word)

</div>
