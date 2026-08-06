import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStudySession } from "../../src/ui/hooks/useStudySession";
import { Colors, Spacing, Radii } from "../../constants/theme";
import { FlashcardView } from "../../components/study/FlashcardView";
import { QuizCardView } from "../../components/study/QuizCardView";
import { SessionDoneScreen } from "../../components/study/SessionDoneScreen";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { DuolingoButton } from "../../components/ui/DuolingoButton";

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();

  const {
    stage,
    session,
    deck,
    deckCards,
    isCardLoading,
    targetCards,
    previewIndex,
    repairIndex,
    progress,
    currentPreviewCard,
    currentValidationQuestion,
    currentRepairQuestion,
    processReview,
    handleNextPreview,
    handlePrevPreview,
    handleQuizAnswer,
    handleRepairAnswer,
    handleExitSession,
  } = useStudySession(deckId || "");

  if (!isCardLoading && deckCards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons
          name="book-outline"
          size={48}
          color={Colors.duolingo.textMuted}
          style={{ marginBottom: 12 }}
        />
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginBottom: 6 }}>
          Bộ thẻ này chưa có từ vựng!
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: Colors.duolingo.textMuted,
            textAlign: "center",
            marginBottom: 20,
            paddingHorizontal: 32,
          }}
        >
          Vui lòng quay lại danh sách bộ thẻ và thêm thẻ từ vựng trước khi bắt đầu học.
        </Text>
        <DuolingoButton
          title="QUAY LẠI"
          variant="primary"
          size="md"
          onPress={() => router.back()}
          style={{ width: 160 }}
        />
      </View>
    );
  }

  if (isCardLoading || (!session && stage !== "done")) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.duolingo.green} />
      </View>
    );
  }

  if (stage === "done" || !session) {
    return (
      <SessionDoneScreen
        session={
          session || {
            deckId: deckId || "",
            queue: [],
            currentIndex: 0,
            correctCount: 0,
            reviewedCount: 0,
            startTime: new Date(),
          }
        }
        onDone={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <TouchableOpacity
          onPress={handleExitSession}
          style={styles.closeHeaderBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.deckHeaderTitle} numberOfLines={1}>
            {deck?.name || "HỌC TỪ VỰNG"}
          </Text>
          <ProgressBar
            progress={progress}
            height={14}
            fillColor={
              stage === "preview"
                ? Colors.duolingo.blue
                : stage === "repair"
                  ? Colors.duolingo.yellow
                  : Colors.duolingo.green
            }
          />
        </View>

        <View
          style={[
            styles.stageBadge,
            stage === "preview"
              ? styles.stageBadgePreview
              : stage === "repair"
                ? styles.stageBadgeRepair
                : styles.stageBadgeValidation,
          ]}
        >
          <Ionicons
            name={
              stage === "preview"
                ? "card-outline"
                : stage === "repair"
                  ? "flash"
                  : "checkmark-circle-outline"
            }
            size={13}
            color={
              stage === "preview"
                ? Colors.duolingo.blue
                : stage === "repair"
                  ? Colors.duolingo.yellow
                  : Colors.duolingo.green
            }
          />
          <Text
            style={[
              styles.stageBadgeText,
              {
                color:
                  stage === "preview"
                    ? Colors.duolingo.blue
                    : stage === "repair"
                      ? Colors.duolingo.yellow
                      : Colors.duolingo.green,
              },
            ]}
          >
            {stage === "preview" ? "NẠP TỪ" : stage === "repair" ? "CẮM CỜ" : "KIỂM TRA"}
          </Text>
        </View>
      </View>

      <View style={styles.stageContentContainer}>
        {stage === "preview" ? (
          currentPreviewCard ? (
            <FlashcardView
              key={`fc-${currentPreviewCard.id}-${previewIndex}`}
              card={currentPreviewCard}
              currentIndex={previewIndex}
              totalCards={targetCards.length}
              onNext={handleNextPreview}
              onPrev={handlePrevPreview}
              onRating={(rating) => {
                processReview(currentPreviewCard, rating);
              }}
            />
          ) : null
        ) : stage === "validation" ? (
          currentValidationQuestion ? (
            <QuizCardView
              key={`qz-${currentValidationQuestion.card.id}-${session.currentIndex}`}
              question={currentValidationQuestion}
              onAnswer={handleQuizAnswer}
            />
          ) : null
        ) : stage === "repair" ? (
          currentRepairQuestion ? (
            <QuizCardView
              key={`rp-${currentRepairQuestion.card.id}-${repairIndex}`}
              question={currentRepairQuestion}
              isFastRepairMode={true}
              onAnswer={handleRepairAnswer}
            />
          ) : null
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.duolingo.bg,
    gap: 8,
  },
  closeHeaderBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 4,
  },
  deckHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: "center",
  },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  stageBadgePreview: {
    backgroundColor: Colors.duolingo.blueDim,
  },
  stageBadgeValidation: {
    backgroundColor: Colors.duolingo.greenDim,
  },
  stageBadgeRepair: {
    backgroundColor: Colors.duolingo.yellowDim,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stageContentContainer: {
    flex: 1,
    overflow: "hidden",
  },
});
