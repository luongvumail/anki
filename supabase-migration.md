# supabase-migration.md
# Migrate Firebase → Supabase (Anki Mobile App)

## Overview

Thay thế **hoàn toàn** Firebase (Auth + Firestore) bằng Supabase (Auth + PostgreSQL).
Mục tiêu chính: giải quyết vấn đề **fetch toàn bộ cards** bằng SQL aggregate queries,
đồng thời đơn giản hóa codebase và không còn phụ thuộc vào Firebase ecosystem.

**Quyết định đã xác nhận:**
- ✅ Reset data OK — không cần migrate data cũ
- ✅ Full replace: xóa Firebase hoàn toàn, dùng Supabase 100%
- ✅ Tận dụng: aggregate queries + RLS + realtime subscriptions

---

## Project Type

**MOBILE** — React Native / Expo
Primary Agent: `mobile-developer`

---

## Success Criteria

- [ ] App login/logout hoạt động qua Supabase Auth
- [ ] CRUD decks và cards hoạt động đầy đủ
- [ ] `cardCount`, `dueCount`, `newCount` được tính bằng SQL, KHÔNG fetch cards
- [ ] Study session chỉ query due cards (`srs_next_review <= now()`)
- [ ] Stats screen load KHÔNG trigger fetchCards
- [ ] Row Level Security đảm bảo user chỉ đọc/ghi data của mình
- [ ] Firebase hoàn toàn bị xóa khỏi codebase (`firebase/` package removed)
- [ ] App build pass: `npx tsc --noEmit`

---

## Tech Stack

| Thành phần | Firebase (cũ) | Supabase (mới) | Lý do |
|---|---|---|---|
| Auth | Firebase Auth | Supabase Auth | Native RN SDK, dễ tích hợp |
| Database | Firestore (NoSQL) | PostgreSQL | Aggregate queries, COUNT/SUM thực sự |
| SDK client | `firebase/firestore` | `@supabase/supabase-js` | Đã support React Native |
| Security | Firestore Rules | Row Level Security (SQL) | Mạnh hơn, dễ đọc hơn |
| Realtime | `onSnapshot` | Supabase Realtime channels | Optional |

---

## File Structure — Thay đổi

```
store/slices/
├── firestoreHelpers.ts       → XÓA
├── cardSlice.ts              → THAY THẾ hoàn toàn
├── deckSlice.ts              → THAY THẾ hoàn toàn
├── userProgressSlice.ts      → CẬP NHẬT (bỏ Firebase imports)
├── authSlice.ts              → CẬP NHẬT (Supabase session)

lib/
├── firebase.ts               → XÓA
├── supabase.ts               → TẠO MỚI (thay thế firebase.ts)

supabase/                     → TẠO MỚI
├── schema.sql                → SQL schema + RLS policies
└── README.md
```

---

## SQL Schema Design

```sql
-- Bảng decks
CREATE TABLE decks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#6366F1',
  icon        TEXT NOT NULL DEFAULT 'albums',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Bảng cards (SRS state được lưu dưới dạng JSONB)
CREATE TABLE cards (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id          UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character        TEXT NOT NULL,
  traditional      TEXT,
  pinyin           TEXT NOT NULL,
  hanviet          TEXT,
  translation      TEXT NOT NULL,
  examples         JSONB DEFAULT '[]',
  radical          TEXT,
  stroke_count     INTEGER,
  hsk_level        INTEGER,
  tags             TEXT[] DEFAULT '{}',
  srs              JSONB NOT NULL DEFAULT '{"repetitions":0,"easeFactor":2.5,"interval":0}',
  srs_next_review  TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ
);

-- Bảng user_progress
CREATE TABLE user_progress (
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  xp                 INTEGER DEFAULT 0,
  unlocked_badge_ids TEXT[] DEFAULT '{}',
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- Index để query nhanh due cards
CREATE INDEX idx_cards_due ON cards(deck_id, srs_next_review);
CREATE INDEX idx_cards_user ON cards(user_id, deck_id);

-- View: deck + aggregate stats (giải quyết vấn đề performance chính)
CREATE VIEW deck_with_stats AS
SELECT
  d.*,
  COUNT(c.id)::int AS card_count,
  COUNT(c.id) FILTER (WHERE c.srs_next_review <= now())::int AS due_count,
  COUNT(c.id) FILTER (WHERE (c.srs->>'repetitions')::int = 0)::int AS new_count
FROM decks d
LEFT JOIN cards c ON c.deck_id = d.id
GROUP BY d.id;
```

---

## Row Level Security (RLS)

```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own decks" ON decks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own cards" ON cards USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own progress" ON user_progress USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## Task Breakdown

### PHASE 0 — Setup Supabase

#### Task P0-1: Tạo Supabase project và chạy SQL schema
- **Agent:** `mobile-developer`
- **Priority:** BLOCKER
- **Dependencies:** Không có
- **INPUT:** SQL schema ở trên
- **OUTPUT:** Supabase project tồn tại, tables + RLS + view được setup; lấy được URL và anon key
- **VERIFY:** Dashboard → Table Editor thấy đủ 3 tables + 1 view

**Steps:**
1. Tạo project tại supabase.com (Free tier)
2. Vào SQL Editor → paste và chạy schema.sql
3. Settings → API → copy `Project URL` và `anon public key`
4. Thêm vào `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

---

#### Task P0-2: Cài Supabase SDK và xóa Firebase packages
- **Agent:** `mobile-developer`
- **Priority:** BLOCKER
- **Dependencies:** P0-1
- **INPUT:** `package.json` hiện tại
- **OUTPUT:** Supabase SDK được cài, Firebase packages bị xóa
- **VERIFY:** `npx tsc --noEmit` — không còn lỗi import Firebase

```bash
npx expo install @supabase/supabase-js
npm uninstall firebase
```

---

### PHASE 1 — Core Infrastructure

#### Task P1-1: Tạo `lib/supabase.ts` (thay thế `lib/firebase.ts`)
- **Agent:** `mobile-developer`
- **Priority:** P1
- **Dependencies:** P0-2
- **INPUT:** Supabase URL + Key từ `.env`
- **OUTPUT:** `lib/supabase.ts` export `supabase` client singleton với AsyncStorage persistence
- **VERIFY:** Import `supabase` → gọi `supabase.auth.getSession()` không lỗi

**Pattern:**
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } }
);
```

---

#### Task P1-2: Migrate Auth — `app/auth.tsx` + `authSlice.ts`
- **Agent:** `mobile-developer`
- **Priority:** P1
- **Dependencies:** P1-1
- **INPUT:** `app/auth.tsx`, `store/slices/authSlice.ts`
- **OUTPUT:** Login/logout/register qua Supabase Auth; `authSlice` lưu `session.user.id`
- **VERIFY:** Đăng nhập → `supabase.auth.getUser()` trả về user đúng

**Key changes:**
```typescript
// Cũ → Mới
signInWithEmailAndPassword(auth, email, password)
→ supabase.auth.signInWithPassword({ email, password })

signOut(auth)
→ supabase.auth.signOut()

onAuthStateChanged(auth, callback)
→ supabase.auth.onAuthStateChange((event, session) => callback(session?.user ?? null))
```

---

#### Task P1-3: Xóa `firestoreHelpers.ts`, tạo `supabaseHelpers.ts`
- **Agent:** `mobile-developer`
- **Priority:** P1
- **Dependencies:** P1-1
- **INPUT:** `store/slices/firestoreHelpers.ts`
- **OUTPUT:** `store/slices/supabaseHelpers.ts` — helper `getUserId()` dùng Supabase session
- **VERIFY:** `getUserId()` trả về đúng UUID khi đã đăng nhập

---

### PHASE 2 — Data Layer (Core)

#### Task P2-1: Migrate `deckSlice.ts` — Dùng `deck_with_stats` view
- **Agent:** `mobile-developer`
- **Priority:** P2 — **VẤN ĐỀ PERFORMANCE CHÍNH**
- **Dependencies:** P1-3
- **INPUT:** `store/slices/deckSlice.ts`
- **OUTPUT:** `fetchDecks()` query `deck_with_stats` view, KHÔNG còn pre-fetch cards
- **VERIFY:** App open → chỉ có 1 Supabase query tới `deck_with_stats`; deck list hiện đúng counts

**Key change:**
```typescript
// Cũ: fetch decks → sau đó fetch ALL cards của mỗi deck
Promise.all(decks.map((d) => get().fetchCards(d.id))); // XÓA HOÀN TOÀN

// Mới: 1 query lấy decks + counts từ view
const { data } = await supabase
  .from('deck_with_stats')
  .select('*')
  .eq('user_id', uid)
  .order('created_at', { ascending: false });
```

---

#### Task P2-2: Migrate `cardSlice.ts` — Paginated fetch + Due-only query
- **Agent:** `mobile-developer`
- **Priority:** P2
- **Dependencies:** P2-1
- **INPUT:** `store/slices/cardSlice.ts`
- **OUTPUT:** `fetchCards()` paginated; `fetchDueCards()` mới chỉ lấy due cards; CRUD hoạt động
- **VERIFY:** Deck detail hiện 20 cards/page; `fetchMoreCards()` load thêm đúng

**Key changes:**
```typescript
// fetchCards — paginated cho deck detail screen
const { data } = await supabase
  .from('cards')
  .select('*')
  .eq('deck_id', deckId)
  .order('created_at', { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

// gradeCard — cập nhật cả srs JSONB lẫn srs_next_review column
await supabase.from('cards').update({
  srs: newSRS,
  srs_next_review: newSRS.nextReview, // denormalized index column
  last_reviewed_at: new Date().toISOString(),
}).eq('id', cardId);
```

---

#### Task P2-3: Migrate `sessionSlice.ts` — Study session query due cards trực tiếp
- **Agent:** `mobile-developer`
- **Priority:** P2
- **Dependencies:** P2-2
- **INPUT:** `store/slices/sessionSlice.ts`
- **OUTPUT:** `startSession()` query due cards từ Supabase, không load toàn bộ cards trước
- **VERIFY:** Study session chỉ chứa due cards; grading cập nhật SRS đúng

```typescript
// Cũ: fetch all → filter client-side
const cards = await get().fetchCards(deckId); // FETCH ALL
const dueCards = cards.filter(c => isDue(c.srs));

// Mới: server-side filter
const { data: dueCards } = await supabase
  .from('cards')
  .select('*')
  .eq('deck_id', deckId)
  .lte('srs_next_review', new Date().toISOString());
```

---

#### Task P2-4: Migrate `userProgressSlice.ts`
- **Agent:** `mobile-developer`
- **Priority:** P2
- **Dependencies:** P1-2
- **INPUT:** `store/slices/userProgressSlice.ts`
- **OUTPUT:** XP và badges persist qua Supabase `user_progress` table; AsyncStorage vẫn là cache
- **VERIFY:** XP tăng sau study → close app → reopen → XP vẫn đúng

```typescript
// Cũ
await getDoc(userProgressRef(uid))
await setDoc(userProgressRef(uid), { xp, ... }, { merge: true })

// Mới
await supabase.from('user_progress').select().eq('user_id', uid).single()
await supabase.from('user_progress').upsert({ user_id: uid, xp, ... })
```

---

### PHASE 3 — Cleanup & Optimization

#### Task P3-1: Fix `useStats.ts` — Tính stats từ store, không fetch cards
- **Agent:** `mobile-developer`
- **Priority:** P3
- **Dependencies:** P2-1
- **INPUT:** `hooks/useStats.ts`
- **OUTPUT:** Stats screen tính `totalCards`, `dueCount`, `newCount` từ `decks[]` trong store
- **VERIFY:** Stats screen load không tạo bất kỳ Supabase call nào tới `cards` table

```typescript
// Cũ: fetch toàn bộ cards của mọi deck
await Promise.all(currentDecks.map((d) => fetchCards(d.id)));

// Mới: aggregate từ deck_with_stats đã có trong store
const totalCards = decks.reduce((sum, d) => sum + (d.card_count || 0), 0);
const totalDue   = decks.reduce((sum, d) => sum + (d.due_count || 0), 0);
const totalNew   = decks.reduce((sum, d) => sum + (d.new_count || 0), 0);
```

---

#### Task P3-2: Xóa Firebase hoàn toàn khỏi codebase
- **Agent:** `mobile-developer`
- **Priority:** P3
- **Dependencies:** P2-1, P2-2, P2-3, P2-4
- **INPUT:** Toàn bộ codebase
- **OUTPUT:** Không còn `import ... from 'firebase/...'`; `lib/firebase.ts` và `firestoreHelpers.ts` bị xóa
- **VERIFY:** `grep -r "from 'firebase" . --include="*.ts" --include="*.tsx"` → empty

---

#### Task P3-3: Cập nhật `.env.example` và `README.md`
- **Agent:** `mobile-developer`
- **Priority:** P3
- **Dependencies:** P3-2
- **INPUT:** `.env.example`, `README.md`
- **OUTPUT:** Docs phản ánh Supabase setup thay vì Firebase
- **VERIFY:** Developer mới có thể setup chỉ bằng đọc README

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RLS policy sai → data của user khác | Trung bình | Cao | Test với 2 accounts khác nhau |
| `srs_next_review` không sync với `srs` JSONB | Trung bình | Cao | Update cả hai fields trong mọi gradeCard() |
| Auth session không persist trên RN | Thấp | Cao | Đã handled bằng AsyncStorage trong Supabase client |
| Supabase free tier limits (500MB DB) | Thấp | Thấp | Vocabulary app ít data |
| Expo build conflict với Supabase SDK | Thấp | Trung bình | Dùng `npx expo install`, không phải `npm install` |

---

## Performance Gains (Expected)

| Scenario | Firebase (hiện tại) | Supabase (sau migrate) |
|---|---|---|
| App open (3 decks × 100 cards) | **300+ document reads** | **1 query** → `deck_with_stats` view |
| Stats screen | **300+ document reads** | **0 extra queries** (từ store) |
| Start study session | fetch all cards → filter JS | query `srs_next_review <= now()` |
| Deck detail scroll | load 100 cards cùng lúc | paginated 20 cards/page |

---

## Phase X: Verification Checklist

```bash
# Type check
npx tsc --noEmit

# Không còn Firebase imports
grep -r "from 'firebase" . --include="*.ts" --include="*.tsx"
# → Phải trả về empty

# Lint
npm run lint
```

**Manual verification:**
- [ ] Đăng ký tài khoản mới → thành công
- [ ] Đăng nhập → decks load đúng với card_count, due_count, new_count
- [ ] Tạo/xóa deck → hoạt động
- [ ] Thêm card → deck count tăng (không refresh toàn bộ)
- [ ] Bắt đầu study session → chỉ hiện due cards
- [ ] Grade card → SRS state cập nhật; `srs_next_review` đúng
- [ ] Đăng xuất → đăng nhập lại → data vẫn còn
- [ ] Stats screen load nhanh, không có queries tới `cards` table
- [ ] Supabase Dashboard → kiểm tra RLS: user A không thể thấy data của user B
