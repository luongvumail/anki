-- ================================================
-- ANKI APP - SUPABASE DATABASE SCHEMA
-- Sau khi tạo Supabase project, dán toàn bộ script này
-- vào Supabase Dashboard -> SQL Editor -> Run
-- ================================================

-- 1. Bảng Decks (Bộ thẻ)
CREATE TABLE IF NOT EXISTS public.decks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#6366F1',
  icon        TEXT NOT NULL DEFAULT 'albums',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Bảng Cards (Thẻ từ vựng)
CREATE TABLE IF NOT EXISTS public.cards (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id          UUID REFERENCES public.decks(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character        TEXT NOT NULL,
  traditional      TEXT,
  pinyin           TEXT NOT NULL,
  hanviet          TEXT,
  translation      TEXT NOT NULL,
  examples         JSONB DEFAULT '[]'::jsonb,
  radical          TEXT,
  stroke_count     INTEGER,
  hsk_level        INTEGER,
  tags             TEXT[] DEFAULT '{}',
  srs              JSONB NOT NULL DEFAULT '{"repetitions":0,"interval":0,"easeFactor":2.5,"stability":0.4025,"difficulty":5.0,"state":0}'::jsonb,
  srs_next_review  TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_reviewed_at TIMESTAMPTZ
);

-- 3. Bảng User Progress (Tiến trình người dùng: XP & Badges)
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  xp                 INTEGER DEFAULT 0 NOT NULL,
  unlocked_badge_ids TEXT[] DEFAULT '{}' NOT NULL,
  updated_at         TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index tối ưu hóa truy vấn thẻ ôn tập & tìm kiếm
CREATE INDEX IF NOT EXISTS idx_cards_due ON public.cards(deck_id, srs_next_review);
CREATE INDEX IF NOT EXISTS idx_cards_user ON public.cards(user_id, deck_id);

-- 4. View deck_with_stats (Tự động đếm card_count, due_count, new_count bằng SQL)
-- Giải quyết triệt để vấn đề fetch toàn bộ thẻ để đếm
CREATE OR REPLACE VIEW public.deck_with_stats AS
SELECT
  d.id,
  d.user_id,
  d.name,
  d.description,
  d.color,
  d.icon,
  d.created_at,
  d.updated_at,
  COALESCE(COUNT(c.id), 0)::int AS card_count,
  COALESCE(COUNT(c.id) FILTER (WHERE c.srs_next_review <= now()), 0)::int AS due_count,
  COALESCE(COUNT(c.id) FILTER (WHERE (c.srs->>'state')::int = 0), 0)::int AS new_count
FROM public.decks d
LEFT JOIN public.cards c ON c.deck_id = d.id
GROUP BY d.id;

-- 5. Row Level Security (RLS) - Bảo mật người dùng
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policy cho decks
DROP POLICY IF EXISTS "Users can manage own decks" ON public.decks;
CREATE POLICY "Users can manage own decks"
  ON public.decks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy cho cards
DROP POLICY IF EXISTS "Users can manage own cards" ON public.cards;
CREATE POLICY "Users can manage own cards"
  ON public.cards
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy cho user_progress
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress"
  ON public.user_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
