import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../store/slices/types";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { AudioButton } from "../ui/AudioButton";
import { ProgressBar } from "../ui/ProgressBar";
import { getPinyinToneColor } from "../../lib/pinyinColor";
import { usePronunciationTrainer } from "../../hooks/usePronunciationTrainer";

export interface PronunciationTrainerModalProps {
  visible: boolean;
  onClose: () => void;
  cards: Card[];
}

export function PronunciationTrainerModal({
  visible,
  onClose,
  cards,
}: PronunciationTrainerModalProps) {
  const insets = useSafeAreaInsets();
  const {
    currentIndex,
    shuffledCards,
    isRecording,
    analyzing,
    speaking,
    score,
    feedback,
    errorDetail,
    pronunciationTip,
    recognizedText,
    isDone,
    userAudioUri,
    pulseAnim,
    drawerAnim,
    currentCard,
    playTTS,
    playUserRecording,
    handleStartRecording,
    handleStopRecording,
    handleNextWord,
    handleRetryWord,
  } = usePronunciationTrainer(visible, cards);

  if (!visible) return null;

  const progress = shuffledCards.length > 0 ? (currentIndex + 1) / shuffledCards.length : 0;

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
            <Text style={styles.headerTitle}>LUYỆN PHÁT ÂM AI</Text>
            <Text style={styles.headerSub}>Chấm điểm & Sửa lỗi Pinyin</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={8} fillColor={Colors.duolingo.purple} />
          <Text style={styles.progressText}>
            {shuffledCards.length > 0 ? `${currentIndex + 1}/${shuffledCards.length}` : "0/0"}
          </Text>
        </View>

        {isDone ? (
          /* Completion Screen */
          <View style={styles.doneContainer}>
            <View style={styles.doneIconCircle}>
              <Ionicons name="trophy" size={54} color={Colors.duolingo.yellow} />
            </View>
            <Text style={styles.doneTitle}>HOÀN THÀNH BÀI PHÁT ÂM!</Text>
            <Text style={styles.doneSub}>
              Bạn đã hoàn thành 5 từ vựng luyện giọng nói với AI. Thêm 100 XP tích lũy!
            </Text>
            <DuolingoButton
              title="HOÀN THÀNH"
              variant="primary"
              size="lg"
              onPress={() => {
                triggerHaptic("success");
                onClose();
              }}
              style={{ marginTop: Spacing.xl, width: "100%" }}
            />
          </View>
        ) : currentCard ? (
          /* Active Card Screen */
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Card Hero Box */}
              <View style={styles.heroCard}>
                <Text style={styles.heroChar}>{currentCard.character}</Text>
                <Text
                  style={[
                    styles.heroPinyin,
                    { color: getPinyinToneColor(currentCard.pinyin) },
                  ]}
                >
                  {currentCard.pinyin}
                </Text>
                <Text style={styles.heroMeaning}>{currentCard.translation}</Text>

                {/* Listen Model Speaker */}
                <View style={styles.speakerBox}>
                  <AudioButton
                    onPress={() => playTTS(currentCard.character)}
                    isPlaying={speaking}
                    size="md"
                  />
                  <Text style={styles.speakerLabel}>Bấm để nghe phát âm mẫu</Text>
                </View>
              </View>

              {/* Mic Action Section */}
              <View style={styles.micSection}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.micBtn,
                      isRecording && styles.micBtnActive,
                      analyzing && styles.micBtnAnalyzing,
                    ]}
                    onPress={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={analyzing}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : analyzing ? "sparkles" : "mic"}
                      size={36}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </Animated.View>

                <Text style={styles.micHint}>
                  {isRecording
                    ? "Đang thu âm... Bấm dừng khi đọc xong"
                    : analyzing
                      ? "AI đang phân tích giọng nói..."
                      : "Bấm Micro để bắt đầu đọc"}
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Drawer Result Feedback */}
            {score !== null && (
              <Animated.View
                style={[
                  styles.resultDrawer,
                  {
                    transform: [{ translateY: drawerAnim }],
                    paddingBottom: Math.max(insets.bottom + 10, 20),
                  },
                ]}
              >
                <View style={styles.resultHeader}>
                  <View
                    style={[
                      styles.scoreCircle,
                      {
                        backgroundColor:
                          score >= 90
                            ? Colors.duolingo.greenDim
                            : score >= 60
                              ? Colors.duolingo.yellowDim
                              : Colors.duolingo.redDim,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreText,
                        {
                          color:
                            score >= 90
                              ? Colors.duolingo.green
                              : score >= 60
                                ? Colors.duolingo.yellow
                                : Colors.duolingo.red,
                        },
                      ]}
                    >
                      {score}%
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedbackTitle}>{feedback}</Text>
                    {recognizedText ? (
                      <Text style={styles.recognizedText}>
                        Âm nhận diện: "<Text style={{ color: "#FFFFFF" }}>{recognizedText}</Text>"
                      </Text>
                    ) : null}
                  </View>
                </View>

                {errorDetail ? (
                  <View style={styles.detailBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.duolingo.yellow} />
                    <Text style={styles.detailText}>{errorDetail}</Text>
                  </View>
                ) : null}

                {pronunciationTip ? (
                  <View style={styles.tipBox}>
                    <Ionicons name="bulb" size={16} color={Colors.duolingo.purple} />
                    <Text style={styles.tipText}>{pronunciationTip}</Text>
                  </View>
                ) : null}

                {/* User Playback & Next Action Buttons */}
                <View style={styles.actionRow}>
                  {userAudioUri ? (
                    <TouchableOpacity style={styles.listenUserBtn} onPress={playUserRecording}>
                      <Ionicons name="play" size={16} color={Colors.duolingo.blue} />
                      <Text style={styles.listenUserText}>Nghe lại bản thu</Text>
                    </TouchableOpacity>
                  ) : null}

                  {score < 90 ? (
                    <DuolingoButton
                      title="ĐỌC LẠI"
                      variant="secondary"
                      size="md"
                      onPress={handleRetryWord}
                      style={{ flex: 1 }}
                    />
                  ) : null}

                  <DuolingoButton
                    title="TỪ TIẾP THEO"
                    variant="primary"
                    size="md"
                    onPress={handleNextWord}
                    style={{ flex: 1 }}
                  />
                </View>
              </Animated.View>
            )}
          </View>
        ) : null}
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Spacing.pageMargin,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
  },
  scrollBody: {
    paddingHorizontal: Spacing.pageMargin,
    alignItems: "center",
    paddingBottom: 20,
  },
  heroCard: {
    width: "100%",
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    padding: Spacing.xl,
    alignItems: "center",
    marginVertical: 10,
  },
  heroChar: {
    fontSize: 54,
    fontWeight: "900",
    color: Colors.text.white,
  },
  heroPinyin: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },
  heroMeaning: {
    fontSize: 15,
    color: Colors.duolingo.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  speakerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    backgroundColor: Colors.duolingo.bgSoftDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  speakerLabel: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    fontWeight: "600",
  },
  micSection: {
    alignItems: "center",
    marginTop: 30,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.duolingo.blue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.duolingo.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnActive: {
    backgroundColor: Colors.duolingo.red,
    shadowColor: Colors.duolingo.red,
  },
  micBtnAnalyzing: {
    backgroundColor: Colors.duolingo.purple,
    shadowColor: Colors.duolingo.purple,
  },
  micHint: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 14,
    fontWeight: "600",
  },
  resultDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.duolingo.cardBg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    padding: Spacing.md,
    gap: 12,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "900",
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.white,
  },
  recognizedText: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
  },
  detailBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.duolingo.yellowDim,
    padding: 10,
    borderRadius: Radii.md,
  },
  detailText: {
    fontSize: 12,
    color: Colors.duolingo.yellow,
    flex: 1,
    lineHeight: 16,
    fontWeight: "600",
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.duolingo.purpleDim,
    padding: 10,
    borderRadius: Radii.md,
  },
  tipText: {
    fontSize: 12,
    color: Colors.duolingo.purple,
    flex: 1,
    lineHeight: 16,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  listenUserBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.duolingo.blueDim,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  listenUserText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.duolingo.blue,
  },
  doneContainer: {
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
    fontSize: 20,
    fontWeight: "900",
    color: Colors.text.white,
    textAlign: "center",
  },
  doneSub: {
    fontSize: 14,
    color: Colors.duolingo.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
