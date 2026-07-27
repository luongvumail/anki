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

  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [mismatchedTileId, setMismatchedTileId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate round of tiles (4 cards = 8 tiles)
  const generateRoundTiles = useCallback((availableCards: Card[]) => {
    if (availableCards.length < 2) return [];

    const shuffledCards = [...availableCards].sort(() => 0.5 - Math.random());
    const selected = shuffledCards.slice(0, 4);

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
    setIsGameOver(false);
    setSelectedTileId(null);
    setMismatchedTileId(null);
    setTiles(generateRoundTiles(cards));
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
      triggerHaptic("success");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft, matchedPairs, addXP]);

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
        setTimeout(() => {
          setTiles(generateRoundTiles(cards));
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
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>

          <View style={styles.timerBox}>
            <ProgressBar progress={timerProgress} height={14} fillColor={timeLeft < 10 ? Colors.duolingo.red : Colors.duolingo.yellow} />
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>

          <View style={styles.scoreBox}>
            <Ionicons name="trophy" size={16} color={Colors.duolingo.yellow} />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        {/* Game Title */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>🧩 GAME GHÉP TỪ NHANH</Text>
          <Text style={styles.subTitleText}>Ghép cặp Chữ Hán và Nghĩa tương ứng trước khi hết giờ!</Text>
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
          /* Game Over Drawer */
          <View style={styles.gameOverCard}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🎉</Text>
            <Text style={styles.gameOverTitle}>HẾT GIỜ!</Text>
            <Text style={styles.gameOverSub}>
              Bạn đã ghép thành công <Text style={{ color: Colors.duolingo.yellow, fontWeight: "800" }}>{matchedPairs} cặp từ</Text>!
            </Text>

            <View style={styles.xpRewardBox}>
              <Ionicons name="sparkles" size={24} color={Colors.duolingo.yellow} />
              <Text style={styles.xpRewardText}>+{matchedPairs * 2 + 15} XP Thưởng</Text>
            </View>

            <DuolingoButton title="CHƠI LẠI ↺" variant="primary" size="lg" onPress={startGame} style={{ marginTop: Spacing.md }} />
            <DuolingoButton title="THOÁT" variant="secondary" size="md" onPress={onClose} style={{ marginTop: Spacing.xs }} />
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
  timerBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginRight: 6 },
  timerText: { fontSize: 13, fontWeight: "800", color: Colors.duolingo.yellow, minWidth: 32 },
  scoreBox: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.duolingo.cardBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.duolingo.cardBorder },
  scoreText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },

  titleSection: { marginBottom: Spacing.md, alignItems: "center" },
  titleText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },
  subTitleText: { fontSize: 13, color: Colors.duolingo.textMuted, marginTop: 2, textAlign: "center" },

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
  gameOverTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF" },
  gameOverSub: { fontSize: 16, color: Colors.duolingo.textMuted, marginTop: 6, textAlign: "center" },
  xpRewardBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255, 200, 0, 0.15)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radii.full, marginVertical: Spacing.lg },
  xpRewardText: { fontSize: 18, fontWeight: "800", color: Colors.duolingo.yellow },
});
