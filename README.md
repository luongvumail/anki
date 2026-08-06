# 汉字 Anki — Ứng dụng học từ vựng tiếng Trung

Ứng dụng học từ vựng tiếng Trung thông minh, kết hợp thuật toán lặp lại ngắt quãng **FSRS** (Free Spaced Repetition Scheduler), **AI Gemini** để tự động nạp thẻ, và hệ thống gamification theo phong cách **Duolingo**. Xây dựng trên Expo SDK 57 với kiến trúc **Clean Architecture**.

---

## ✨ Tính Năng Chính

| Tính năng             | Mô tả                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| 📚 **Quản lý bộ thẻ** | Tạo, xóa, xem chi tiết bộ thẻ; tìm kiếm từ vựng theo chữ Hán / Pinyin / nghĩa                        |
| 🤖 **Nạp thẻ AI**     | Nhập chữ Hán → Gemini tự động điền Pinyin, nghĩa TV, HSK, bộ thủ, câu ví dụ. Lọc trùng tự động       |
| 🧠 **Ôn tập FSRS**    | Luồng học 3 giai đoạn: Preview → Quiz → Repair. Thuật toán FSRS tính interval, stability, difficulty |
| 🎮 **Mini-games**     | Speed Match (60s ghép cặp Hán↔nghĩa), Sentence Builder (xếp từ thành câu), Pronunciation Trainer     |
| 🔊 **TTS & Audio**    | Phát âm chuẩn Phổ thông (expo-audio + expo-speech), tô màu thanh điệu Pinyin                         |
| 🔥 **Streak & XP**    | Chuỗi ngày học liên tục, điểm XP, cấp bậc từ 初学者 đến 汉字宗师, bộ huy hiệu thành tích             |
| 📊 **Thống kê**       | Biểu đồ 7 ngày, tổng từ đã học, tỷ lệ thành thạo, lịch sử ôn tập                                     |
| ☁️ **Sync Firebase**  | Dữ liệu đồng bộ Firestore realtime. Offline queue tự động sync khi có mạng                           |

---

## 🏗️ Kiến Trúc — Clean Architecture

```
src/
├── domain/                      # Business logic thuần (không phụ thuộc framework)
│   ├── card/                    # CardEntity, cardUtils, cardRepository.i.ts (interface)
│   ├── deck/                    # DeckEntity, deckRepository.i.ts
│   ├── fsrs/                    # FSRS engine: fsrsEngine.ts, fsrsTypes.ts, fsrsConstants.ts
│   ├── streak/                  # streakCalculator.ts
│   └── user/                    # userProgress.ts (XP, level, badges)
│
├── application/                 # Use cases — orchestrate domain + infrastructure
│   └── usecases/
│       ├── GenerateAICards.ts   # Gọi Gemini → validate → lọc trùng → persist
│       ├── GenerateQuiz.ts      # Sinh quiz từ danh sách thẻ
│       ├── ProcessCardReview.ts # FSRS review → cập nhật card state
│       └── SyncOfflineQueue.ts  # Drain offline queue khi có mạng
│
├── infrastructure/              # Adapters: Firebase, AI, Notifications, AsyncStorage
│   ├── ai/geminiService.ts      # Google Generative AI SDK wrapper
│   ├── firebase/firebaseApp.ts  # Firebase init (App + Firestore + Auth)
│   ├── notifications/           # Expo Notifications service
│   └── persistence/
│       ├── firestoreRepo.ts     # Firestore CRUD (cards, decks)
│       ├── localStorageRepo.ts  # AsyncStorage offline queue
│       └── reviewTrackerRepo.ts # Lưu lịch sử ôn tập hàng ngày
│
└── ui/                          # React Native UI layer
    ├── hooks/useStudySession.ts  # Hook quản lý toàn bộ luồng ôn tập
    ├── store/
    │   ├── useAppStore.ts        # Zustand store root
    │   ├── slices/
    │   │   ├── cardSlice.ts
    │   │   ├── deckSlice.ts
    │   │   ├── progressSlice.ts
    │   │   └── uiSlice.ts
    │   └── types.ts
    └── utils/
        ├── pinyinColor.ts        # Tô màu thanh điệu
        └── errorHandler.ts
```

---

## 📱 Cấu Trúc Màn Hình

```
app/
├── (tabs)/
│   ├── index.tsx        # 🏠 Dashboard — ZigZag skill path, Active Deck Hero Card
│   ├── practice.tsx     # 🎮 Practice Hub — Speed Match, Sentence Builder, Pronunciation
│   └── stats.tsx        # 📊 Stats — streak, XP chart, badges gallery
├── auth.tsx             # 🔐 Đăng nhập / Đăng ký
├── deck/[id].tsx        # 📂 Chi tiết bộ thẻ, danh sách từ, tìm kiếm
├── study/[deckId].tsx   # 🧠 Luồng ôn tập FSRS (Preview → Quiz → Repair → Done)
├── card/[id].tsx        # 🃏 Chi tiết thẻ từ vựng
└── _layout.tsx          # Root layout, auth guard, splash screen

components/
├── add/      # AIAddCardModal, CardPreview, DeckPicker
├── home/     # ActiveDeckHeroCard, AccountModal, ZigZagSkillPath, WheelTimePicker
├── practice/ # SpeedMatchModal, SentenceBuilderModal, PronunciationTrainerModal
├── stats/    # BadgesGallery
├── study/    # FlashcardView, QuizCardView, SessionDoneScreen
└── ui/       # DuolingoButton, DuolingoCard, DuolingoHeader, FloatingAddButton,
              # SectionTitle, ProgressBar, AudioButton, DeckIcon, DuolingoMascot
```

---

## 🧠 Thuật Toán FSRS

**FSRS (Free Spaced Repetition Scheduler)** thay thế SuperMemo-2, chính xác hơn ~20%.

- **3 tham số bộ nhớ:** `stability` (độ bền nhớ), `difficulty` (độ khó thẻ), `retrievability` (xác suất nhớ được tại thời điểm ôn).
- **4 rating:** Again / Hard / Good / Easy → tính interval độc lập cho từng thẻ.
- **Luồng 3 giai đoạn:**
  1. **Preview** — xem thẻ mới, lật để thấy đáp án
  2. **Quiz** — trắc nghiệm 4 dạng (Meaning / Pinyin / Listening / Cloze)
  3. **Repair** — ôn lại những thẻ trả lời sai

---

## 🛠️ Tech Stack

| Layer      | Công nghệ                                              |
| ---------- | ------------------------------------------------------ |
| Framework  | React Native 0.86 + Expo SDK 57 (New Architecture)     |
| Routing    | Expo Router v4 (file-based)                            |
| State      | Zustand v5 (sliced store)                              |
| Database   | Firebase Firestore v12                                 |
| Auth       | Firebase Auth v12 (AsyncStorage persistence on mobile) |
| AI         | Google Generative AI SDK — Gemini 2.5 Flash            |
| Validation | Zod v4                                                 |
| Audio      | expo-audio + expo-speech                               |
| Animation  | react-native-reanimated v4                             |
| Styling    | StyleSheet API + Design Tokens (`constants/theme.ts`)  |
| Testing    | Vitest (unit tests cho domain + use cases)             |
| Linting    | ESLint 9 + Prettier                                    |

---

## 🚀 Khởi Chạy

### Yêu cầu

- Node.js ≥ 20
- Expo Go app (iOS/Android) hoặc iOS/Android Simulator

### Cài đặt

```bash
git clone <repo-url>
cd Anki
npm install
```

### Biến môi trường

Tạo file `.env.local` ở root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GEMINI_API_KEY=...
```

### Chạy

```bash
npm start          # Expo dev server — scan QR bằng Expo Go
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

### Test & Lint

```bash
npm test      # Vitest unit tests (domain + use cases)
npm run lint  # ESLint check toàn dự án
```

---

## 📋 Scripts

| Script            | Mô tả                         |
| ----------------- | ----------------------------- |
| `npm start`       | Expo dev server               |
| `npm run ios`     | Build & chạy iOS simulator    |
| `npm run android` | Build & chạy Android emulator |
| `npm test`        | Chạy Vitest unit tests        |
| `npm run lint`    | ESLint check                  |
