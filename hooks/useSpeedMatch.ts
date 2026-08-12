import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card } from "../store/slices/types";
import { triggerHaptic } from "../constants/theme";
import { awardArcadeXP, ARCADE_XP_REWARDS } from "../lib/arcadeScoring";

export interface MatchTile {
  id: string;
  cardId: string;
  type: "hanzi" | "meaning";
  text: string;
  pinyin?: string;
  matched: boolean;
}

const STORAGE_KEY_HIGH_SCORE = "@anki_speed_match_high_score";

export function useSpeedMatch(visible: boolean, cards: Card[]) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevVisibleRef = useRef(false);

  // Load high score from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_HIGH_SCORE).then((val) => {
      if (val) setHighScore(parseInt(val, 10));
    });
  }, []);

  const generateTiles = useCallback((availableCards: Card[]) => {
    if (availableCards.length < 2) return [];
    const pool = [...availableCards].sort(() => 0.5 - Math.random()).slice(0, 6);

    const generated: MatchTile[] = [];
    pool.forEach((card) => {
      generated.push({
        id: `h_${card.id}`,
        cardId: card.id,
        type: "hanzi",
        text: card.character,
        pinyin: card.pinyin,
        matched: false,
      });
      generated.push({
        id: `m_${card.id}`,
        cardId: card.id,
        type: "meaning",
        text: card.translation,
        matched: false,
      });
    });

    return generated.sort(() => 0.5 - Math.random());
  }, []);

  const startGame = useCallback(() => {
    if (cards.length < 2) return;
    const newTiles = generateTiles(cards);
    setTiles(newTiles);
    setScore(0);
    setTimeLeft(60);
    setSelectedTile(null);
    setIsGameOver(false);
    setIsPlaying(true);
  }, [cards, generateTiles]);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      startGame();
    }
    if (!visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    prevVisibleRef.current = visible;
  }, [visible, startGame]);

  // 60-second Timer Loop
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
      setIsGameOver(true);
      triggerHaptic("heavy");

      if (score > highScore) {
        setHighScore(score);
        AsyncStorage.setItem(STORAGE_KEY_HIGH_SCORE, score.toString());
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, score, highScore]);

  const handleTilePress = useCallback(
    (tile: MatchTile) => {
      if (!isPlaying || tile.matched) return;
      triggerHaptic("selection");

      if (!selectedTile) {
        setSelectedTile(tile);
        return;
      }

      if (selectedTile.id === tile.id) {
        setSelectedTile(null);
        return;
      }

      // Check Match
      if (selectedTile.cardId === tile.cardId && selectedTile.type !== tile.type) {
        // MATCH SUCCESS!
        triggerHaptic("success");
        setScore((prev) => prev + ARCADE_XP_REWARDS.SPEED_MATCH_BASE);
        awardArcadeXP(ARCADE_XP_REWARDS.SPEED_MATCH_BASE);

        setTiles((prev) => {
          const updated = prev.map((t) =>
            t.cardId === tile.cardId ? { ...t, matched: true } : t
          );
          // Check if all tiles in current round are matched -> spawn new tiles!
          const remaining = updated.filter((t) => !t.matched);
          if (remaining.length === 0) {
            setTimeout(() => {
              setTiles(generateTiles(cards));
            }, 300);
          }
          return updated;
        });

        setSelectedTile(null);
      } else {
        // WRONG MATCH!
        triggerHaptic("error");
        setSelectedTile(null);
      }
    },
    [isPlaying, selectedTile, cards, generateTiles]
  );

  return {
    timeLeft,
    isPlaying,
    score,
    highScore,
    tiles,
    selectedTile,
    isGameOver,
    startGame,
    handleTilePress,
  };
}
