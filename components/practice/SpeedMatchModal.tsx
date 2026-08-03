import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../store/slices/types";
import { useStore } from "../../store/useStore";
import { recordReviewToday } from "../../lib/reviewTracker";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { ProgressBar } from "../ui/ProgressBar";

interface MatchTile {
  id: string; // unique tile id
  cardId: string;
  text: string;
  subText?: string;
  type: "character" | "translation";
  matched: boolean;
}

export interface SpeedMatchModalProps {
  visible: boolean;
  onClose: () => void;
  cards: Card[];
}

export function SpeedMatchModal({ visible, onClose, cards }: SpeedMatchModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const addXP = useStore((s) => s.addXP);
  const unlockBadge = useStore((s) => s.unlockBadge);

  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [mismatchedTileId, setMismatchedTileId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate round of tiles with dynamic pair count scaling (Round 1: 4 pairs, Round 2: 5 pairs, Round 3+: 6 pairs)
  const generateRoundTiles = useCallback((availableCards: Card[], currentRound: number) => {
    if (availableCards.length < 2) return [];

    const pairsCount = Math.min(availableCards.length, Math.min(3 + currentRound, 6));
    const shuffledCards = [...availableCards].sort(() => 0.5 - Math.random());
    const selected = shuffledCards.slice(0, pairsCount);

    const roundTiles: MatchTile[] = [];
    selected.forEach((c) => {
      roundTiles.push({
        id: `char-${c.id}`,
        cardId: c.id,
        text: c.character,
        type: "character",
        matched: false,
      });
      roundTiles.push({
        id: `trans-${c.id}`,
        cardId: c.id,
        text: c.translation,
        subText: c.pinyin ? `(${c.pinyin})` : undefined,
        type: "translation",
        matched: false,
      });
    });

    return roundTiles.sort(() => 0.5 - Math.random());
  }, []);

  const startGame = useCallback(() => {
    setTimeLeft(60);
    setScore(0);
    setMatchedPairs(0);
    setRoundNumber(1);
    setIsGameOver(false);
    setSelectedTileId(null);
    setMismatchedTileId(null);
    setTiles(generateRoundTiles(cards, 1));
    setIsPlaying(true);
  }, [cards, generateRoundTiles]);

  useEffect(() => {
    if (visible && cards.length >= 2) {
      startGame();
    }
  }, [visible, cards, startGame]);

  // Timer Countdown
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      setIsGameOver(true);
      const earnedXP = matchedPairs * 2 + 15;
      addXP(earnedXP);
      if (matchedPairs >= 25) {
        unlockBadge("speed_25");
        unlockBadge("speed_15");
      } else if (matchedPairs >= 15) {
        unlockBadge("speed_15");
      }
      triggerHaptic("success");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft, matchedPairs, addXP, unlockBadge]);

  const handleTilePress = (tile: MatchTile) => {
    if (!isPlaying || tile.matched || tile.id === selectedTileId) return;

    if (selectedTileId === null) {
      setSelectedTileId(tile.id);
      triggerHaptic("selection");
      return;
    }

    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) return;

    // Check Match
    if (firstTile.cardId === tile.cardId && firstTile.type !== tile.type) {
      // MATCH SUCCESS!
      triggerHaptic("success");
      recordReviewToday().catch(() => {});
      setMatchedPairs((prev) => prev + 1);
      setScore((prev) => prev + 20);

      const updatedTiles = tiles.map((t) =>
        t.cardId === tile.cardId ? { ...t, matched: true } : t
      );
      setTiles(updatedTiles);
      setSelectedTileId(null);

      // Check if all tiles in current round matched
      const remainingUnmatched = updatedTiles.filter((t) => !t.matched);
      if (remainingUnmatched.length === 0) {
        const nextRound = roundNumber + 1;
        setRoundNumber(nextRound);
        setTimeout(() => {
          setTiles(generateRoundTiles(cards, nextRound));
        }, 300);
      }
    } else {
      // MISMATCH!
      triggerHaptic("error");
      setMismatchedTileId(tile.id);
      setTimeout(() => {
        setSelectedTileId(null);
        setMismatchedTileId(null);
      }, 400);
    }
  };

  const timerProgress = timeLeft / 60;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>

          <View style={styles.timerBox}>
            <Ionicons name="stopwatch" size={18} color={timeLeft < 10 ? Colors.duolingo.red : Colors.duolingo.yellow} />
            <ProgressBar progress={timerProgress} height={12} fillColor={timeLeft < 10 ? Colors.duolingo.red : Colors.duolingo.yellow} style={{ flex: 1 }} />
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>

          <View style={styles.scoreBox}>
            <Ionicons name="star" size={15} color={Colors.duolingo.yellow} />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        {/* Tiles Grid */}
        {!isGameOver ? (
          <View style={styles.gridContainer}>
            {tiles.map((tile) => {
              const isSelected = selectedTileId === tile.id;
              const isMismatched = mismatchedTileId === tile.id || (mismatchedTileId !== null && isSelected);

              if (tile.matched) {
                return <View key={tile.id} style={styles.tilePlaceholder} />;
              }

              return (
                <TouchableOpacity
                  key={tile.id}
                  activeOpacity={0.8}
                  style={[
                    styles.tileBase,
                    isSelected && styles.tileSelected,
                    isMismatched && styles.tileMismatched,
                  ]}
                  onPress={() => handleTilePress(tile)}
                >
                  <Text
                    style={[
                      styles.tileText,
                      tile.type === "character" ? styles.tileTextChar : styles.tileTextTrans,
                      isSelected && { color: "#FFFFFF" },
                    ]}
                    numberOfLines={2}
                  >
                    {tile.text}
                  </Text>
                  {tile.subText && (
                    <Text style={styles.tileSubText}>{tile.subText}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Game Over Drawer with Adaptive Evaluation Message */
          <View style={styles.gameOverCard}>
            <View style={styles.gameOverIconCircle}>
              <Ionicons
                name={matchedPairs >= 15 ? "trophy" : matchedPairs >= 5 ? "stopwatch" : "alert-circle"}
                size={44}
                color={matchedPairs >= 15 ? Colors.duolingo.yellow : matchedPairs >= 5 ? Colors.duolingo.blue : Colors.duolingo.red}
              />
            </View>

            <Text style={styles.gameOverTitle}>
              {matchedPairs >= 15
                ? "BẬC THẦY TỐC ĐỘ!"
                : matchedPairs >= 5
                  ? "KẾT QUẢ TỐT!"
                  : "CẦN LUYỆN TẬP THÊM!"}
            </Text>

            <Text style={styles.gameOverSub}>
              {matchedPairs >= 15
                ? `Bạn đã ghép xuất sắc ${matchedPairs} cặp từ trong 60 giây!`
                : matchedPairs >= 5
                  ? `Bạn đã ghép thành công ${matchedPairs} cặp từ!`
                  : `Bạn chỉ ghép được ${matchedPairs} cặp từ. Hãy thử lại để rèn phản xạ nhanh hơn nhé!`}
            </Text>

            <View style={styles.xpRewardBox}>
              <Ionicons name="sparkles" size={18} color={Colors.duolingo.yellow} />
              <Text style={styles.xpRewardText}>+{matchedPairs * 2 + 15} XP Thưởng</Text>
            </View>

            <DuolingoButton title="CHƠI LẠI" variant="primary" size="lg" onPress={startGame} style={{ marginTop: Spacing.md }} />
            <DuolingoButton title="THOÁT" variant="ghost" size="md" onPress={onClose} style={{ marginTop: Spacing.xs }} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.duolingo.bg, paddingHorizontal: Spacing.pageMargin },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: Spacing.md },
  closeBtn: { padding: 4 },
  timerBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  timerText: { fontSize: 13, fontWeight: "800", color: Colors.duolingo.yellow, width: 34, textAlign: "right" },
  scoreBox: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.duolingo.cardBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.duolingo.cardBorder },
  scoreText: { fontSize: 14, fontWeight: "800", color: Colors.duolingo.yellow },

  titleSection: { marginBottom: Spacing.md, alignItems: "center" },
  titleText: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },
  subTitleText: { fontSize: 13, fontWeight: "600", color: Colors.duolingo.textMuted, marginTop: 2, textAlign: "center" },

  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255, 200, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.duolingo.yellow,
    letterSpacing: 0.5,
  },

  gridContainer: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", alignContent: "center" },
  tileBase: {
    width: "47%",
    height: 90,
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderBottomWidth: 4,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  tilePlaceholder: { width: "47%", height: 90, opacity: 0 },
  tileSelected: { backgroundColor: Colors.duolingo.blue, borderBottomColor: Colors.duolingo.blueDark },
  tileMismatched: { backgroundColor: Colors.duolingo.red, borderBottomColor: Colors.duolingo.redDark },
  tileText: { textAlign: "center", fontWeight: "800" },
  tileTextChar: { fontSize: 24, color: "#FFFFFF" },
  tileTextTrans: { fontSize: 14, color: Colors.duolingo.textMuted },
  tileSubText: { fontSize: 11, color: Colors.duolingo.blue, marginTop: 2, fontWeight: "700" },

  gameOverCard: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.lg },
  gameOverIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.duolingo.cardBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  gameOverTitle: { fontSize: 28, fontWeight: "800", color: Colors.text.white },
  gameOverSub: { fontSize: 15, color: Colors.duolingo.textMuted, marginTop: 6, textAlign: "center", lineHeight: 22 },
  xpRewardBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.duolingo.yellowDim, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radii.full, marginVertical: Spacing.lg },
  xpRewardText: { fontSize: 18, fontWeight: "800", color: Colors.duolingo.yellow },
});
