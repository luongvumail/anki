# Kế hoạch Tái cấu trúc Anki App: Thuật toán FSRS & Clean Architecture (Phương án B)

## 📌 Overview & Goals
Tái cấu trúc toàn bộ ứng dụng Anki (React Native / Expo SDK 57) từ thuật toán SM-2 cũ lên **FSRS v5 (Free Spaced Repetition Scheduler)**, đồng thời tái thiết kế kiến trúc từ dạng Slice monolithic sang **Clean Layered Architecture** để nâng cao chất lượng code, khả năng bảo mật, hỗ trợ Offline-first và hoàn thiện trải nghiệm người dùng Duolingo 3D Tactile.

## 🎯 Project Type & Agent Routing
- **Project Type:** MOBILE (Expo SDK 57 / React Native 0.86)
- **Primary Agent:** `@mobile-developer` / `@project-planner`
- **Supporting Skills:** `clean-code`, `architecture`, `mobile-design`, `database-design`, `lint-and-validate`

---

## 🏆 Success Criteria
1. **FSRS v5 Engine Core:** 100% thẻ mới & thẻ cũ hoạt động chính xác theo thuật toán FSRS v5 với 4 giá trị biến số ($S$, $D$, $R$, $State$).
2. **Clean Layered Architecture:** Phân tách rõ ràng 4 tầng: `domain/` (pure TS math), `application/` (use-cases), `infrastructure/` (Firestore & local storage), `ui/` (Expo screens & Duolingo 3D components).
3. **Data Security & Validation:** 100% dữ liệu từ Gemini AI, Firestore, và Local Storage được kiểm soát bằng `Zod` schemas. Bảo vệ API Key.
4. **Offline-First Sync:** Hỗ trợ lưu phiên học offline vào local queue và tự động đồng bộ lên Firebase khi trực tuyến.
5. **UI/UX Excellence:** Nút 3D đánh giá FSRS hiển thị thời gian dự kiến (`Again 10m`, `Hard 1.2d`, `Good 3.5d`, `Easy 8d`), thanh % Retrievability và phản hồi Haptic 60fps.

---

## 🛠️ Tech Stack & Architecture Decisions
- **FSRS Core:** Custom / `ts-fsrs` Lightweight Engine (Zero runtime dependencies in domain layer)
- **State & Local Storage:** Zustand v5 + `@react-native-async-storage/async-storage` (Offline Sync Queue)
- **Validation:** `zod` schema library
- **Database & Auth:** Firebase Firestore & Auth
- **AI Service:** Google Generative AI SDK (Gemini 2.5 Flash) với Zod Structured Output
- **Styling & Micro-animations:** Reanimated v4, Expo Haptics, Duolingo 3D Design Tokens

---

## 📁 Proposed Clean Architecture Directory Layout

```text
src/
├── domain/                      # Pure TypeScript Core (Zero Dependencies)
│   ├── fsrs/
│   │   ├── fsrsEngine.ts        # FSRS Math: Stability, Difficulty, Retrievability calculation
│   │   ├── fsrsTypes.ts         # CardState, FSRSParameters, Grade, ReviewLog
│   │   └── fsrsConstants.ts     # Default weights (w0..w18), retention targets (0.85-0.95)
│   ├── card/
│   │   ├── cardEntity.ts        # Core Card Domain Model
│   │   └── cardRepository.i.ts  # Interface repository pattern
│   └── streak/
│       └── streakCalculator.ts  # Streak & XP logic
│
├── application/                 # Use-Cases & Business Orchestration
│   ├── usecases/
│   │   ├── ProcessCardReview.ts # Apply FSRS grade, update card state & streak
│   │   ├── SyncOfflineQueue.ts  # Sync offline review logs to Cloud Firestore
│   │   └── GenerateAICards.ts   # Gemini AI prompt orchestration & Zod parsing
│   └── dto/
│       └── cardSchemas.ts       # Zod schemas for Card, AI response, Sync Payload
│
├── infrastructure/              # External Drivers & Data Repositories
│   ├── persistence/
│   │   ├── firestoreRepo.ts     # Firebase Firestore card & user progress adapter
│   │   └── localStorageRepo.ts  # Offline queue & local cache storage
│   ├── ai/
│   │   └── geminiService.ts     # Gemini API client with Zod schema validation
│   └── auth/
│       └── firebaseAuth.ts      # Authentication wrapper & security scope
│
└── ui/                          # Presentation Layer (Expo Router + React Native)
    ├── components/
    │   ├── fsrs/
    │   │   ├── RetrievabilityBadge.tsx # Visual % recall indicator
    │   │   └── FSRSRatingButtons.tsx   # Duolingo 3D buttons showing next intervals
    │   └── ui/                  # DuolingoButton, DuolingoCard, etc.
    ├── store/
    │   └── useAppStore.ts       # Refactored Zustand store wrapping Use-Cases
    └── screens/                 # Expo Router Screen Views (study, decks, stats)
```

---

## 📋 Task Breakdown

### Phase 1: Core Domain & FSRS Engine Implementation
- [x] **Task 1.1: Build FSRS Engine Core Math Module**
  - **Agent:** `@mobile-developer`
  - **Skills:** `clean-code`, `architecture`
  - **INPUT:** Request for FSRS v5 algorithm implementation
  - **OUTPUT:** `src/domain/fsrs/fsrsEngine.ts` & `src/domain/fsrs/fsrsTypes.ts`
  - **VERIFY:** Unit tests for FSRS calculations (Again, Hard, Good, Easy stability & retrievability formulas).

- [x] **Task 1.2: Define Domain Entities & Zod Boundary Schemas**
  - **Agent:** `@mobile-developer`
  - **Skills:** `clean-code`, `lint-and-validate`
  - **INPUT:** Current Card & Deck types
  - **OUTPUT:** `src/domain/card/cardEntity.ts` & `src/application/dto/cardSchemas.ts`
  - **VERIFY:** Run `npx tsc --noEmit` clean validation.

### Phase 2: Application Use-Cases & Repository Layer
- [x] **Task 2.1: Implement FSRS Review Process Use-Case**
  - **Agent:** `@mobile-developer`
  - **Skills:** `clean-code`, `database-design`
  - **INPUT:** FSRS Engine & Card Entity
  - **OUTPUT:** `src/application/usecases/ProcessCardReview.ts`
  - **VERIFY:** Unit test simulating a 10-card review session updating intervals & stability.

- [x] **Task 2.2: Implement Local Storage & Offline Sync Queue**
  - **Agent:** `@mobile-developer`
  - **Skills:** `clean-code`
  - **INPUT:** AsyncStorage interface
  - **OUTPUT:** `src/infrastructure/persistence/localStorageRepo.ts` & `SyncOfflineQueue.ts`
  - **VERIFY:** Test storing review logs offline and executing sync.

- [x] **Task 2.3: Upgrade Gemini AI Integration with Zod Validation**
  - **Agent:** `@mobile-developer`
  - **Skills:** `clean-code`, `api-patterns`
  - **INPUT:** Existing `lib/gemini.ts`
  - **OUTPUT:** `src/infrastructure/ai/geminiService.ts` with structured Zod response parsing.
  - **VERIFY:** Test AI prompt parsing against strict JSON schema.

### Phase 3: Zustand Store & Firebase Infrastructure Adaptation
- [x] **Task 3.1: Refactor Firestore Repository & Migration Helper**
  - **Agent:** `@mobile-developer`
  - **Skills:** `database-design`
  - **INPUT:** Legacy Firestore card document format
  - **OUTPUT:** `src/infrastructure/persistence/firestoreRepo.ts` with backward compatibility for SM-2 cards.
  - **VERIFY:** Migration helper converts SM-2 `easeFactor` & `interval` into initial FSRS $S$ & $D$.

- [x] **Task 3.2: Rebuild Zustand Store Slices with Clean Use-Cases**
  - **Agent:** `@mobile-developer`
  - **Skills:** `clean-code`
  - **INPUT:** Use-cases & repositories
  - **OUTPUT:** Clean Zustand Store (`src/ui/store/useAppStore.ts`).
  - **VERIFY:** Integrated state updates trigger zero re-render waterfalls.

### Phase 4: UI/UX & Duolingo 3D Component Refinement
- [x] **Task 4.1: Build FSRSRatingButtons Component with Dynamic Intervals**
  - **Agent:** `@mobile-developer`
  - **Skills:** `mobile-design`, `frontend-design`
  - **INPUT:** Active FSRS card state
  - **OUTPUT:** `src/ui/components/fsrs/FSRSRatingButtons.tsx` (Duolingo 3D style with next interval labels).
  - **VERIFY:** Render verification & haptic feedback test.

- [x] **Task 4.2: Build Retrievability Indicator Component**
  - **Agent:** `@mobile-developer`
  - **Skills:** `mobile-design`
  - **INPUT:** FSRS Stability & elapsed days
  - **OUTPUT:** `src/ui/components/fsrs/RetrievabilityBadge.tsx` displaying % memory retention.
  - **VERIFY:** Visual inspection on card review screen.

- [x] **Task 4.3: Refactor Study Screen to use New FSRS Architecture**
  - **Agent:** `@mobile-developer`
  - **Skills:** `mobile-design`, `clean-code`
  - **INPUT:** Expo Router study screen (`app/study/[deckId].tsx`)
  - **OUTPUT:** Updated study screen wiring FSRS engine, RetrievabilityBadge, and FSRSRatingButtons.
  - **VERIFY:** End-to-end review flow test.

---

## 🔍 Phase X: Final Verification Plan
- [x] **Step 1: Typecheck & Linting:** Run `npm run typecheck` & `npm run lint`
- [x] **Step 2: Security Audit:** Verify no API keys exposed in repository, security rules scoped by `userId`.
- [x] **Step 3: FSRS Mathematical Accuracy Check:** Verify $S$ increases on Good/Easy and drops on Again according to FSRS v5 formula.
- [x] **Step 4: Build Verification:** Run `npx expo export -p web` or `npm run start` without build errors.
