# 汉字 Anki — Ứng dụng Học Từ Vựng Tiếng Trung Thông Minh

Ứng dụng học từ vựng tiếng Trung chuẩn kiến trúc **Clean Architecture** (4 Lớp), kết hợp thuật toán lặp lại ngắt quãng thế hệ mới **FSRS v5** (Free Spaced Repetition Scheduler), **AI Gemini 2.5** tự động trích xuất từ vựng, và hệ thống Gamification phong cách **Duolingo 3D**.

---

## ✨ Tính Năng Nổi Bật

| Tính năng | Mô tả |
| :--- | :--- |
| 📚 **Quản lý Bộ thẻ Thông minh** | Tạo, chỉnh sửa, xóa, đặt lại tiến độ bộ thẻ; tìm kiếm từ vựng siêu tốc theo Hán tự / Pinyin / Nghĩa Tiếng Việt. |
| 🤖 **Nạp thẻ Tự động bằng AI** | Nhập danh sách chữ Hán / câu văn ➔ Gemini AI tự động trích xuất Pinyin, Nghĩa Tiếng Việt, Phân tích Bộ thủ ngắn gọn, HSK & Câu ví dụ chuẩn ngữ cảnh. |
| 🧠 **Ôn tập FSRS v5** | Luồng học 3 giai đoạn: **Preview** (Nạp từ) ➔ **Quiz** (Trắc nghiệm thích ứng) ➔ **Repair** (Sửa lỗi cắm cờ). Thuật toán FSRS v5 tự động tính toán thời gian phản xạ (ms) để tối ưu độ bền trí nhớ ($S$) và độ khó ($D$). |
| 🔊 **Audio TTS Pre-caching** | Tiện ích làm nóng giọng đọc tiếng Trung (`audioCache`) triệt tiêu hoàn toàn độ trễ âm thanh khi chuyển thẻ hoặc làm bài trắc nghiệm nghe. |
| 🎮 **Trung tâm Luyện tập Arcade** | 3 Mini-games rèn phản xạ: **Ghép Từ Nhanh 60s**, **Xếp Từ Thành Câu**, và **Phòng Luyện Phát Âm AI**. |
| 🔥 **Streak & XP Gamification** | Chuỗi ngày học liên tục, điểm XP tích lũy, thăng cấp từ 初学者 đến 汉字宗师 và Bộ 14 Huy hiệu thành tích cá nhân. |
| 📊 **Thống kê & Hướng dẫn Chi tiết** | Biểu đồ hoạt động 7 ngày, tỷ lệ thuộc từ vựng (%) và Bảng hướng dẫn chi tiết quy trình học ngay tại màn hình Thống kê. |
| ⚡ **Hiệu năng 60fps & Offline-First** | Ảo hóa danh sách `FlatList` $O(1)$ constant-time layout calculation; tự động lưu bộ nhớ đệm `AsyncStorage` & đồng bộ Firestore Realtime khi có kết nối mạng. |

---

## 🏗️ Kiến Trúc — Clean Architecture 4 Lớp

```text
src/
├── domain/                      # 🧠 Business Logic Thuần (Zero external framework dependencies)
│   ├── card/                    # CardEntity, cardUtils, cardRepository.i.ts (Interface)
│   ├── deck/                    # DeckEntity, deckRepository.i.ts
│   ├── fsrs/                    # FSRS v5 Engine: fsrsEngine.ts, fsrsTypes.ts, fsrsConstants.ts
│   ├── study/                   # StudySessionEngine: Quản lý hàng đợi bài học & quy tắc rating
│   ├── streak/                  # streakCalculator.ts
│   └── user/                    # userProgress.ts (XP, Level, Badges)
│
├── application/                 # ⚙️ Application Use Cases (Orchestrate domain + infrastructure)
│   └── usecases/
│       ├── AddCard.ts           # AddCardUseCase: Thêm thẻ mới & khởi tạo trạng thái FSRS
│       ├── UpdateCard.ts        # UpdateCardUseCase: Cập nhật thông tin thẻ & timestamp
│       ├── DeleteCard.ts        # DeleteCardUseCase: Xóa thẻ an toàn
│       ├── ResetDeckProgress.ts # ResetDeckProgressUseCase: Đặt lại tiến độ FSRS toàn bộ thẻ
│       ├── GenerateRadical.ts   # GenerateRadicalUseCase: AI phân tích bộ thủ cho Hán tự
│       ├── GenerateCardBatch.ts # GenerateCardBatchUseCase: AI trích xuất mảng từ vựng hàng loạt
│       ├── GenerateAICards.ts   # GenerateAICardsUseCase: Sinh thẻ AI & lưu kho dữ liệu
│       ├── GenerateQuiz.ts      # GenerateQuizUseCase: Sinh trắc nghiệm 4 dạng bài tập
│       ├── ProcessCardReview.ts # ProcessCardReviewUseCase: Xử lý chấm điểm FSRS & điểm XP
│       └── SyncOfflineQueue.ts  # SyncOfflineQueueUseCase: Đồng bộ offline queue khi có mạng
│
├── infrastructure/              # 🔌 Infrastructure Adapters (Firebase, AI, AsyncStorage)
│   ├── ai/geminiService.ts      # Google Generative AI SDK (Gemini 2.5 Flash)
│   ├── firebase/firebaseApp.ts  # Firebase Init (App, Firestore v12, Auth v12)
│   └── persistence/
│       ├── firestoreRepo.ts     # Firestore Card & Deck Repositories (4-level collection fallback)
│       ├── localStorageRepo.ts  # AsyncStorage offline cache & queue persistence
│       └── reviewTrackerRepo.ts # Ghi nhận lịch sử ôn tập hàng ngày
│
└── ui/                          # 📱 Presentation State Management
    ├── hooks/useStudySession.ts # Hook quản lý giao diện phiên học
    ├── store/
    │   ├── useAppStore.ts       # Root Zustand store
    │   └── slices/              # cardSlice, deckSlice, progressSlice, uiSlice
    └── utils/
        ├── audioCache.ts        # TTS Speech Pre-warming Cache Engine
        ├── pinyinColor.ts       # Tô màu thanh điệu Pinyin
        └── errorHandler.ts
```

---

## 📱 Cấu Trúc Màn Hình & Components

```text
app/
├── (tabs)/
│   ├── index.tsx        # 🏠 Dashboard — ZigZag skill path, Active Deck Hero Card
│   ├── decks.tsx        # 📂 Danh sách bộ thẻ & Tìm kiếm từ vựng
│   ├── practice.tsx     # 🎮 Arcade Practice Hub — Speed Match, Sentence Builder, Pronunciation
│   ├── stats.tsx        # 📊 Stats — Level banner, Biểu đồ 7 ngày, Badges, Hướng dẫn FSRS v5
│   └── profile.tsx      # 👤 Trang cá nhân & Tài khoản
├── auth.tsx             # 🔐 Đăng nhập / Đăng ký
├── deck/[id].tsx        # 📂 Chi tiết bộ thẻ & Danh sách 60fps
├── study/[deckId].tsx   # 🧠 Luồng ôn tập FSRS (Preview ➔ Quiz ➔ Repair ➔ Done)
├── card/[id].tsx        # 🃏 Chi tiết thẻ từ vựng & AI sinh bộ thủ
└── _layout.tsx          # Root layout, Auth Guard, Splash screen

components/
├── add/      # AIAddCardModal, CardPreview, DeckPicker
├── home/     # ZigZagSkillPath, ActiveDeckHeroCard, AccountModal
├── practice/ # SpeedMatchModal, SentenceBuilderModal, PronunciationTrainerModal
├── stats/    # BadgesGallery
├── study/    # FlashcardView, QuizCardView, SessionDoneScreen
└── ui/       # DuolingoButton, DuolingoCard, DuolingoHeader, FloatingAddButton,
              # SectionTitle, ProgressBar, AudioButton, FormField, DeckIcon
```

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
| :--- | :--- |
| **Framework** | React Native 0.86 + Expo SDK 57 (New Architecture) |
| **Routing** | Expo Router v4 (File-based routing) |
| **State Management** | Zustand v5 (Sliced store pattern) |
| **Database** | Firebase Firestore v12 (Realtime sync + 4-level fallback) |
| **Auth** | Firebase Auth v12 (AsyncStorage persistence) |
| **AI Integration** | Google Generative AI SDK — Gemini 2.5 Flash |
| **Audio & Speech** | expo-speech + `audioCache` TTS pre-caching |
| **Animation** | react-native-reanimated v4 |
| **Styling** | StyleSheet API + Design Tokens (`constants/theme.ts`) |
| **Testing** | Vitest (`npx test` — 47 unit tests) |
| **Type System** | TypeScript 5.9 (`npx tsc --noEmit` — 0 errors) |

---

## 🚀 Khởi Chạy Dự Án

### Yêu cầu môi trường
- Node.js ≥ 20
- Expo Go app (iOS/Android) hoặc iOS/Android Simulator

### Cài đặt dependencies
```bash
git clone <repo-url>
cd Anki
npm install
```

### Cấu hình biến môi trường
Tạo file `.env` hoặc `.env.local` tại thư mục root:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Chạy ứng dụng
```bash
npm start          # Expo dev server
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

### Kiểm tra Mã nguồn & Tests
```bash
npx tsc --noEmit   # Kiểm tra kiểu TypeScript (0 errors)
npm test           # Chạy toàn bộ 47 Unit Tests (Vitest)
```
