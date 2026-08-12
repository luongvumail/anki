import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../store/slices/types";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { AudioButton } from "../ui/AudioButton";
import { ProgressBar } from "../ui/ProgressBar";
import { useSentenceBuilder } from "../../hooks/useSentenceBuilder";

export interface SentenceBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  cards: Card[];
}

export function SentenceBuilderModal({
  visible,
  onClose,
  cards,
}: SentenceBuilderModalProps) {
  const insets = useSafeAreaInsets();
  const {
    questions,
    currentIndex,
    currentQuestion,
    wordBank,
    userSentence,
    isSubmitted,
    isCorrect,
    isDone,
    handleSelectWord,
    handleRemoveWord,
    handleCheck,
    handleNext,
    playTTS,
  } = useSentenceBuilder(visible, cards);

  if (!visible) return null;

  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

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
            <Text style={styles.headerTitle}>XẾP TỪ THÀNH CÂU</Text>
            <Text style={styles.headerSub}>Rèn luyện ngữ pháp &amp; phản xạ câu</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={8} fillColor={Colors.duolingo.green} />
          <Text style={styles.progressText}>
            {questions.length > 0 ? `${currentIndex + 1}/${questions.length}` : "0/0"}
          </Text>
        </View>

        {isDone ? (
          /* Completion Screen */
          <View style={styles.doneContainer}>
            <View style={styles.doneIconCircle}>
              <Ionicons name="trophy" size={54} color={Colors.duolingo.yellow} />
            </View>
            <Text style={styles.doneTitle}>XUẤT SẮC! HOÀN THÀNH BÀI XẾP CÂU</Text>
            <Text style={styles.doneSub}>
              Bạn đã xếp đúng các câu ví dụ mẫu. Thêm XP tích lũy vào tài khoản!
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
        ) : currentQuestion ? (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Vietnamese Meaning Prompt Box */}
              <View style={styles.promptCard}>
                <Text style={styles.promptTitle}>Dịch câu sau sang Tiếng Trung:</Text>
                <Text style={styles.promptVietnamese}>"{currentQuestion.vietnamese}"</Text>

                {currentQuestion.pinyin ? (
                  <Text style={styles.promptPinyin}>({currentQuestion.pinyin})</Text>
                ) : null}
              </View>

              {/* User Answer Drop Zone Area */}
              <View style={styles.userDropArea}>
                {userSentence.length === 0 ? (
                  <Text style={styles.dropPlaceholder}>Bấm các từ bên dưới để xếp câu tại đây...</Text>
                ) : (
                  <View style={styles.wordWrapRow}>
                    {userSentence.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.wordTileSelected}
                        onPress={() => handleRemoveWord(item)}
                        disabled={isSubmitted}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.wordTileTextSelected}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Available Word Bank */}
              <View style={styles.wordBankArea}>
                <Text style={styles.wordBankTitle}>Ngân hàng từ vựng:</Text>
                <View style={styles.wordWrapRow}>
                  {wordBank.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.wordTile}
                      onPress={() => handleSelectWord(item)}
                      disabled={isSubmitted}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.wordTileText}>{item.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Action Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
              {isSubmitted ? (
                <View style={styles.resultBox}>
                  <View style={styles.resultHeader}>
                    <Ionicons
                      name={isCorrect ? "checkmark-circle" : "close-circle"}
                      size={28}
                      color={isCorrect ? Colors.duolingo.green : Colors.duolingo.red}
                    />
                    <Text
                      style={[
                        styles.resultTitle,
                        { color: isCorrect ? Colors.duolingo.green : Colors.duolingo.red },
                      ]}
                    >
                      {isCorrect ? "Chính xác 100%!" : "Chưa chính xác!"}
                    </Text>
                    <AudioButton onPress={() => playTTS(currentQuestion.chinese)} size="sm" />
                  </View>
                  {!isCorrect ? (
                    <Text style={styles.correctAnswerText}>
                      Đáp án đúng: <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{currentQuestion.chinese}</Text>
                    </Text>
                  ) : null}

                  <DuolingoButton
                    title="CÂU TIẾP THEO"
                    variant={isCorrect ? "primary" : "secondary"}
                    size="lg"
                    onPress={handleNext}
                    style={{ marginTop: 12 }}
                  />
                </View>
              ) : (
                <DuolingoButton
                  title="KIỂM TRA ĐÁP ÁN"
                  variant="primary"
                  size="lg"
                  disabled={userSentence.length === 0}
                  onPress={handleCheck}
                />
              )}
            </View>
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
    paddingBottom: 20,
  },
  promptCard: {
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    padding: Spacing.md,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.duolingo.textMuted,
    textTransform: "uppercase",
  },
  promptVietnamese: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.white,
    marginTop: 6,
  },
  promptPinyin: {
    fontSize: 13,
    color: Colors.duolingo.blue,
    marginTop: 4,
    fontWeight: "600",
  },
  userDropArea: {
    minHeight: 110,
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    borderStyle: "dashed",
    padding: Spacing.md,
    justifyContent: "center",
    marginBottom: 16,
  },
  dropPlaceholder: {
    fontSize: 13,
    color: Colors.duolingo.disabledText,
    textAlign: "center",
    fontWeight: "500",
  },
  wordBankArea: {
    marginTop: 10,
  },
  wordBankTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.duolingo.textMuted,
    marginBottom: 10,
  },
  wordWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  wordTile: {
    backgroundColor: Colors.duolingo.cardBg,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  wordTileText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
  },
  wordTileSelected: {
    backgroundColor: Colors.duolingo.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  wordTileTextSelected: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footer: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: 12,
    backgroundColor: Colors.duolingo.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.duolingo.cardBorder,
  },
  resultBox: {
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  correctAnswerText: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 6,
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
