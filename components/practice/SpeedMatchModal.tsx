import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../store/slices/types";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { useSpeedMatch, MatchTile } from "../../hooks/useSpeedMatch";

export interface SpeedMatchModalProps {
  visible: boolean;
  onClose: () => void;
  cards: Card[];
}

export function SpeedMatchModal({
  visible,
  onClose,
  cards,
}: SpeedMatchModalProps) {
  const insets = useSafeAreaInsets();
  const {
    timeLeft,
    score,
    highScore,
    tiles,
    selectedTile,
    isGameOver,
    startGame,
    handleTilePress,
  } = useSpeedMatch(visible, cards);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic("selection");
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>GHÉP TỪ NHANH 60S</Text>
            <Text style={styles.headerSub}>Thử thách phản xạ từ vựng siêu tốc</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="timer-outline" size={18} color={Colors.duolingo.yellow} />
            <Text style={styles.statVal}>{timeLeft}s</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="star" size={18} color={Colors.duolingo.green} />
            <Text style={styles.statVal}>{score} XP</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="trophy" size={18} color={Colors.duolingo.purple} />
            <Text style={styles.statVal}>Kỷ lục: {highScore}</Text>
          </View>
        </View>

        {isGameOver ? (
          /* Game Over Screen */
          <View style={styles.gameOverContainer}>
            <View style={styles.doneIconCircle}>
              <Ionicons name="trophy" size={54} color={Colors.duolingo.yellow} />
            </View>
            <Text style={styles.doneTitle}>HẾT GIỜ (60S)!</Text>
            <Text style={styles.scoreBigText}>+ {score} XP Tích Lũy</Text>
            {score >= highScore && score > 0 ? (
              <Text style={styles.highScoreText}>🎉 Kỷ lục mới xuất sắc nhất!</Text>
            ) : null}

            <DuolingoButton
              title="CHƠI LẠI (60S)"
              variant="primary"
              size="lg"
              onPress={startGame}
              style={{ marginTop: Spacing.xl, width: "100%" }}
            />

            <DuolingoButton
              title="THOÁT"
              variant="secondary"
              size="lg"
              onPress={onClose}
              style={{ marginTop: 10, width: "100%" }}
            />
          </View>
        ) : (
          /* Active Matching Board Grid */
          <View style={styles.boardGrid}>
            {tiles.map((tile: MatchTile) => {
              if (tile.matched) {
                return <View key={tile.id} style={styles.matchedTilePlaceholder} />;
              }

              const isSelected = selectedTile?.id === tile.id;

              return (
                <TouchableOpacity
                  key={tile.id}
                  style={[
                    styles.tile,
                    isSelected && styles.tileSelected,
                    tile.type === "hanzi" && styles.tileHanzi,
                  ]}
                  onPress={() => handleTilePress(tile)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tileText,
                      isSelected && styles.tileTextSelected,
                      tile.type === "hanzi" && styles.tileTextHanzi,
                    ]}
                    numberOfLines={2}
                  >
                    {tile.text}
                  </Text>
                  {tile.pinyin ? <Text style={styles.tilePinyin}>{tile.pinyin}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: 10,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.pageMargin,
    marginBottom: 20,
    marginTop: 6,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.duolingo.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text.white,
  },
  boardGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    alignContent: "flex-start",
    gap: 10,
  },
  tile: {
    width: "48%",
    height: 90,
    backgroundColor: Colors.duolingo.cardBg,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  tileHanzi: {
    borderColor: Colors.duolingo.blue,
    backgroundColor: Colors.duolingo.bgSoftDark,
  },
  tileSelected: {
    backgroundColor: Colors.duolingo.yellow,
    borderColor: Colors.duolingo.yellow,
  },
  matchedTilePlaceholder: {
    width: "48%",
    height: 90,
    opacity: 0,
  },
  tileText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text.white,
    textAlign: "center",
  },
  tileTextHanzi: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.duolingo.blue,
  },
  tileTextSelected: {
    color: "#000000",
  },
  tilePinyin: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  gameOverContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  doneIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.duolingo.yellowDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.text.white,
  },
  scoreBigText: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.duolingo.yellow,
    marginTop: 8,
  },
  highScoreText: {
    fontSize: 14,
    color: Colors.duolingo.green,
    fontWeight: "800",
    marginTop: 8,
  },
});
