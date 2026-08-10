import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { container } from "../../infrastructure/container.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { DuolingoButton } from "./DuolingoButton.js";
import { Icon } from "./Icon.js";

export interface SpeedMatchGameProps {
  deckId: string;
  onFinish: (score: number) => void;
}

export interface MatchTile {
  id: string;
  cardId: string;
  text: string;
  type: "KANJI" | "MEANING";
}

export const SpeedMatchGame: React.FC<SpeedMatchGameProps> = ({ deckId, onFinish }) => {
  const { theme: activeTheme } = useTheme();
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null);
  const [matchedCardIds, setMatchedCardIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  useEffect(() => {
    container.cardRepo.getByDeckId(deckId).then((cards) => {
      if (cards.length === 0) return;

      const selected = cards.slice(0, 6);
      const generatedTiles: MatchTile[] = [];

      selected.forEach((c) => {
        generatedTiles.push({ id: `k_${c.id}`, cardId: c.id, text: c.kanji, type: "KANJI" });
        generatedTiles.push({ id: `m_${c.id}`, cardId: c.id, text: c.meaning, type: "MEANING" });
      });

      // Shuffle tiles
      setTiles(generatedTiles.sort(() => 0.5 - Math.random()));
    });
  }, [deckId]);

  // 60-second timer countdown
  useEffect(() => {
    if (isGameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isGameOver]);

  const handleSelectTile = (tile: MatchTile) => {
    if (matchedCardIds.has(tile.cardId)) return;

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }

    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    // Check if match
    if (selectedTile.cardId === tile.cardId && selectedTile.type !== tile.type) {
      setMatchedCardIds((prev) => new Set([...prev, tile.cardId]));
      setScore((prev) => prev + 10);
      setSelectedTile(null);

      if (matchedCardIds.size + 1 >= Math.floor(tiles.length / 2)) {
        setIsGameOver(true);
      }
    } else {
      setSelectedTile(null);
    }
  };

  if (isGameOver) {
    return (
      <View style={styles.doneContainer}>
        <Icon name="timer" size={64} color={theme.colors.primary} />
        <Text style={styles.doneTitle}>HẾT GIỜ! TRẬN ĐẤU KẾT THÚC</Text>
        <Text style={styles.doneScore}>Điểm số của bạn: {score} Điểm</Text>
        <DuolingoButton
          title="HOÀN THÀNH GAME"
          variant="primary"
          onPress={() => onFinish(score)}
          accessibilityLabel="Hoàn thành game Nối từ nhanh"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onFinish(score)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
          accessibilityLabel="Thoát trò chơi ghép từ"
        >
          <Icon name="back" size={20} color={activeTheme.colors.textPrimary} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: activeTheme.colors.textPrimary }}>
            Thoát
          </Text>
        </Pressable>

        <View style={styles.statBox}>
          <Icon name="timer" color={theme.colors.danger} />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="trophy" color={theme.colors.primary} />
          <Text style={styles.scoreText}>Điểm: {score}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>GHÉP CHỮ HÁN VỚI NGHĨA TƯƠNG ỨNG</Text>

      {/* Matching Grid */}
      <View style={styles.grid}>
        {tiles.map((tile) => {
          const isMatched = matchedCardIds.has(tile.cardId);
          const isSelected = selectedTile?.id === tile.id;

          return (
            <Pressable
              key={tile.id}
              onPress={() => handleSelectTile(tile)}
              disabled={isMatched}
              accessibilityLabel={`Thẻ ${tile.text}`}
              style={[
                styles.tile,
                {
                  backgroundColor: isMatched
                    ? activeTheme.colors.cardBg
                    : isSelected
                      ? activeTheme.colors.secondary
                      : activeTheme.colors.cardBg,
                  borderColor: isSelected ? activeTheme.colors.secondaryShadow : activeTheme.colors.cardBorder,
                  opacity: isMatched ? 0.35 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.tileText,
                  {
                    color: isMatched
                      ? activeTheme.colors.textLight
                      : isSelected
                        ? activeTheme.colors.white
                        : activeTheme.colors.textPrimary,
                    fontSize: tile.type === "KANJI" ? theme.fontSize.xxl : theme.fontSize.base,
                  },
                ]}
              >
                {tile.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  doneContainer: {
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  doneTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  doneScore: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  timerText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.danger,
  },
  scoreText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  tile: {
    width: "47%",
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  tileText: {
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },
});
