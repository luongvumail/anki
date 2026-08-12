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
import { Spacing, Radii, Typography, Layout, BorderWidths, triggerHaptic } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
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
  const { theme } = useTheme();
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
      <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.lg), backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic("selection");
              onClose();
            }}
          >
            <Ionicons name="close" size={Layout.iconLg} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>GHÉP TỪ NHANH 60S</Text>
            <Text style={[styles.headerSub, { color: theme.textMuted }]}>Thử thách phản xạ từ vựng siêu tốc</Text>
          </View>

          <View style={{ width: Layout.avatarMd }} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="timer-outline" size={Layout.iconMd} color={theme.yellow} />
            <Text style={[styles.statVal, { color: theme.textPrimary }]}>{timeLeft}s</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="star" size={Layout.iconMd} color={theme.green} />
            <Text style={[styles.statVal, { color: theme.textPrimary }]}>{score} XP</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="trophy" size={Layout.iconMd} color={theme.purple} />
            <Text style={[styles.statVal, { color: theme.textPrimary }]}>Kỷ lục: {highScore}</Text>
          </View>
        </View>

        {isGameOver ? (
          /* Game Over Screen */
          <View style={styles.gameOverContainer}>
            <View style={[styles.doneIconCircle, { backgroundColor: theme.green }]}>
              <Ionicons name="trophy" size={48} color="#FFFFFF" />
            </View>
            <Text style={[styles.doneTitle, { color: theme.textPrimary }]}>HOÀN THÀNH LỢT CHƠI!</Text>
            <Text style={[styles.scoreBigText, { color: theme.green }]}>+{score} XP</Text>
            <Text style={[styles.highScoreText, { color: theme.textMuted }]}>
              Kỷ lục cao nhất: {highScore} XP
            </Text>

            <DuolingoButton
              title="CHƠI LẠI"
              variant="primary"
              size="lg"
              onPress={startGame}
              style={{ marginTop: Spacing.xl, width: "100%" }}
            />
          </View>
        ) : (
          /* Playing Grid Board */
          <View style={styles.boardGrid}>
            {tiles.map((tile) => {
              if (tile.matched) {
                return <View key={tile.id} style={styles.matchedTilePlaceholder} />;
              }

              const isSelected = selectedTile?.id === tile.id;

              let bgColor = theme.cardBg;
              let borderColor = theme.cardBorder;

              if (isSelected) {
                bgColor = theme.blueDim;
                borderColor = theme.blue;
              }

              return (
                <TouchableOpacity
                  key={tile.id}
                  activeOpacity={0.8}
                  onPress={() => handleTilePress(tile)}
                  style={[
                    styles.tile,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.tileText, { color: theme.textPrimary }]}>{tile.text}</Text>
                  {tile.pinyin ? (
                    <Text style={[styles.tilePinyin, { color: theme.blue }]}>{tile.pinyin}</Text>
                  ) : null}
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.cellPadding,
  },
  closeBtn: {
    padding: Spacing.sm,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.callout.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  headerSub: {
    fontSize: Typography.caption1.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.pageMargin,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: BorderWidths.default,
  },
  statVal: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  boardGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    alignContent: "flex-start",
    gap: Spacing.cellPadding,
  },
  tile: {
    width: "48%",
    height: 90,
    borderWidth: BorderWidths.default,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
  },
  matchedTilePlaceholder: {
    width: "48%",
    height: 90,
    opacity: 0,
  },
  tileText: {
    fontSize: Typography.bodyMD.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
  },
  tilePinyin: {
    fontSize: Typography.caption1.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  doneTitle: {
    fontSize: Typography.titleLG.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  scoreBigText: {
    fontSize: Typography.title1.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: Spacing.sm,
  },
  highScoreText: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: Spacing.sm,
  },
});
