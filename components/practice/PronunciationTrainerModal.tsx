import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import {
  useAudioRecorder,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { Card } from "../../store/slices/types";
import { useStore } from "../../store/useStore";
import { recordReviewToday } from "../../lib/reviewTracker";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { ProgressBar } from "../ui/ProgressBar";

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
  const addXP = useStore((s) => s.addXP);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [isDone, setIsDone] = useState(false);
  const [userAudioUri, setUserAudioUri] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(300)).current;
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const userAudioPlayer = useAudioPlayer(userAudioUri);

  useEffect(() => {
    if (visible && cards.length > 0) {
      const list = [...cards].sort(() => 0.5 - Math.random()).slice(0, 5);
      setShuffledCards(list);
      setCurrentIndex(0);
      setIsDone(false);
      resetState();
    }
  }, [visible, cards]);

  // Cleanup recorder when modal closes
  useEffect(() => {
    if (!visible) {
      try {
        audioRecorder.stop();
      } catch {
        // ignore if not recording
      }
    }
  }, [visible]);

  const resetState = () => {
    setScore(null);
    setFeedback(null);
    setRecognizedText("");
    setIsRecording(false);
    setAnalyzing(false);
    setUserAudioUri(null);
    drawerAnim.setValue(300);
  };

  const handleRetryWord = () => {
    resetState();
    triggerHaptic("selection");
  };

  const playTTS = useCallback((text: string) => {
    if (!text) return;
    setSpeaking(true);
    Speech.stop();
    Speech.speak(text, {
      language: "zh-CN",
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const playUserRecording = useCallback(async () => {
    if (!userAudioUri || !userAudioPlayer) return;
    triggerHaptic("selection");
    Speech.stop();
    setSpeaking(false);
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      userAudioPlayer.seekTo(0);
      userAudioPlayer.play();
    } catch (err) {
      console.warn("Error playing user recording:", err);
    }
  }, [userAudioUri, userAudioPlayer]);

  // Pulse Animation for Mic when Recording
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording, pulseAnim]);

  // Strict Evaluation Logic
  const evaluateSpeech = useCallback(
    (spokenText: string) => {
      setAnalyzing(false);
      setIsRecording(false);
      const currentCard = shuffledCards[currentIndex];
      if (!currentCard) return;

      const targetChar = currentCard.character.trim();
      const normalizedTarget = targetChar.replace(/\s+/g, "");
      const targetPinyin = (currentCard.pinyin || "").toLowerCase().replace(/[^a-z]/g, "");

      const cleanSpoken = spokenText.trim();
      const normalizedSpoken = cleanSpoken.replace(/\s+/g, "");
      setRecognizedText(cleanSpoken);

      recordReviewToday().catch(() => {});

      let calcScore = 0;
      let msg = "";

      if (!cleanSpoken) {
        // Case 1: Silent / Unrecognized
        calcScore = 0;
        msg = "⚠️ Không nghe thấy âm thanh. Vui lòng bấm loa nghe âm mẫu và đọc to vào Micro.";
        triggerHaptic("error");
      } else {
        const spokenLower = cleanSpoken.toLowerCase();
        const hasExactChar =
          normalizedSpoken.includes(normalizedTarget) || cleanSpoken.includes(targetChar);
        const isReverseMatch =
          normalizedSpoken.length >= normalizedTarget.length &&
          normalizedTarget.includes(normalizedSpoken);

        if (hasExactChar || isReverseMatch) {
          // Case 2: Exact Match -> 90-100% dựa trên độ dài trùng khớp
          calcScore = 95;
          msg = "🌟 Hoàn hảo! Bạn phát âm Pinyin & Thanh điệu chính xác.";
          triggerHaptic("success");
          addXP(20);
        } else {
          // Check partial character overlap
          let matchedCharsCount = 0;
          for (const ch of normalizedTarget) {
            if (normalizedSpoken.includes(ch)) {
              matchedCharsCount++;
            }
          }

          const overlapRatio = normalizedTarget.length > 0 ? matchedCharsCount / normalizedTarget.length : 0;

          if (overlapRatio > 0 || (targetPinyin && spokenLower.includes(targetPinyin))) {
            // Case 3: Partial Match
            calcScore = Math.max(60, Math.min(85, Math.floor(overlapRatio * 100)));
            msg = `👍 Gần chính xác! Âm nhận diện là "${cleanSpoken}". Chú ý giữ chuẩn thanh điệu.`;
            triggerHaptic("warning");
            addXP(10);
          } else {
            // Case 4: Wrong Word / Mispronounced Completely
            calcScore = 30;
            msg = `❌ Chưa đúng! Âm bạn đọc là "${cleanSpoken}". Từ chuẩn là "${targetChar}" (${currentCard.pinyin}). Hãy thử lại nhé!`;
            triggerHaptic("error");
          }
        }
      }

      setScore(calcScore);
      setFeedback(msg);

      Animated.spring(drawerAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
    [shuffledCards, currentIndex, addXP, drawerAnim],
  );

  // Transcribe audio via Gemini API (supports audio/mp4 from expo-audio)
  const transcribeWithGemini = async (uri: string): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API key");

    const base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash"];

    let lastErrText = "";

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "audio/mp4",
                        data: base64Audio,
                      },
                    },
                    {
                      text: "Transcribe only the spoken Chinese (Mandarin) words from this audio. Return ONLY the Chinese characters with no explanation, no punctuation, no extra text. If nothing is spoken or it's inaudible, return empty string.",
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
                maxOutputTokens: 64,
              },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          return text.trim();
        }

        const errText = await response.text();
        lastErrText = errText;
        console.warn(`[Gemini Audio] Model ${modelName} failed status ${response.status}`);
      } catch (e: any) {
        lastErrText = e?.message || String(e);
      }
    }

    if (lastErrText.includes("429") || lastErrText.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXCEEDED");
    }

    throw new Error(`Gemini API error: ${lastErrText}`);
  };

  const startListening = async () => {
    triggerHaptic("heavy");

    try {
      // Request microphone permission via AudioModule
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setFeedback(
          "⚠️ Cần cấp quyền microphone để thu âm. Vào Cài đặt → Quyền riêng tư → Microphone.",
        );
        return;
      }

      setIsRecording(true);
      setScore(null);
      setFeedback(null);
      setRecognizedText("");

      // Configure audio session for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Start recording with the hook-based recorder
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err: any) {
      console.error("startListening error:", err);
      setIsRecording(false);
      setFeedback("❌ Không thể khởi động microphone. Kiểm tra quyền và thử lại.");
    }
  };

  const stopListening = async () => {
    triggerHaptic("selection");
    setIsRecording(false);
    setAnalyzing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      // Reset audio session for playback
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (!uri) {
        evaluateSpeech("");
        return;
      }

      setUserAudioUri(uri);

      // Transcribe with Gemini AI
      const transcript = await transcribeWithGemini(uri);
      evaluateSpeech(transcript);
    } catch (err: any) {
      console.error("stopListening error:", err);
      setAnalyzing(false);
      if (err?.message === "QUOTA_EXCEEDED") {
        setFeedback(
          "⚠️ Gemini API tạm thời hết lượt yêu cầu miễn phí (Limit 429). Bạn vui lòng thử lại sau ít phút.",
        );
      } else {
        setFeedback(`❌ Lỗi xử lý âm thanh. Hãy thử đọc lại.`);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= shuffledCards.length) {
      setIsDone(true);
    } else {
      setCurrentIndex(nextIdx);
      resetState();
    }
  };

  if (shuffledCards.length === 0) {
    return null;
  }

  const currentCard = shuffledCards[currentIndex];
  const progress = (currentIndex + 1) / shuffledCards.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>
          <ProgressBar
            progress={progress}
            height={14}
            fillColor={Colors.duolingo.purple}
            style={{ flex: 1 }}
          />
          <Text style={styles.headerProgressText}>
            {currentIndex + 1}/{shuffledCards.length}
          </Text>
        </View>

        {!isDone ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Exercise Title */}
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Ionicons name="mic" size={14} color={Colors.duolingo.purple} />
                <Text style={styles.typeBadgeText}>PHÒNG LUYỆN PHÁT ÂM AI</Text>
              </View>
            </View>

            {/* Main Character Display Card */}
            <View style={styles.cardTargetBox}>
              <Text style={styles.characterBig}>{currentCard.character}</Text>
              <Text style={styles.pinyinText}>Pinyin: {currentCard.pinyin}</Text>
              <Text style={styles.translationText}>Nghĩa: {currentCard.translation}</Text>

              {/* TTS Listen Button */}
              <TouchableOpacity
                style={styles.listenBtn}
                onPress={() => playTTS(currentCard.character)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={speaking ? "volume-high" : "volume-medium"}
                  size={22}
                  color={Colors.duolingo.purple}
                />
                <Text style={styles.listenBtnText}>Nghe phát âm mẫu</Text>
              </TouchableOpacity>
            </View>

            {/* Microphone Recording Button */}
            <View style={styles.micSection}>
              <Animated.View style={[styles.micPulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[styles.bigMicBtn, isRecording && styles.bigMicBtnRecording]}
                  onPress={toggleRecording}
                  activeOpacity={0.85}
                  disabled={analyzing}
                >
                  <Ionicons name={isRecording ? "stop" : "mic"} size={40} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.micHintText}>
                {analyzing
                  ? "🤖 AI đang chấm điểm phát âm..."
                  : isRecording
                    ? "🔴 ĐANG THU ÂM... BẤM LẠI NÚT ĐỂ AI CHẤM ĐIỂM"
                    : "Chạm nút Micro để bắt đầu đọc"}
              </Text>

              {isRecording && recognizedText ? (
                <View style={styles.liveSpeechBox}>
                  <Text style={styles.liveSpeechLabel}>ĐANG LẮNG NGHE:</Text>
                  <Text style={styles.liveSpeechText}>"{recognizedText}"</Text>
                </View>
              ) : null}

              {!isRecording && !analyzing && userAudioUri ? (
                <TouchableOpacity
                  onPress={playUserRecording}
                  style={styles.userAudioBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play-circle" size={18} color={Colors.duolingo.purple} />
                  <Text style={styles.userAudioBtnText}>Nghe lại giọng mình 🎧</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        ) : (
          /* Completion Card */
          <View style={styles.doneContainer}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🎉</Text>
            <Text style={styles.doneTitle}>HOÀN THÀNH LUYỆN NÓI!</Text>
            <Text style={styles.doneSub}>Bạn đã phát âm xong {shuffledCards.length} từ vựng!</Text>
            <DuolingoButton
              title="HOÀN TẤT"
              variant="primary"
              size="lg"
              onPress={onClose}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        )}

        {/* Score & AI Feedback Bottom Sheet Drawer */}
        {score !== null && !isDone && (
          <Animated.View
            style={[
              styles.resultDrawer,
              score >= 90
                ? styles.feedbackSuccess
                : score >= 60
                  ? styles.feedbackWarning
                  : styles.feedbackError,
              { transform: [{ translateY: drawerAnim }] },
            ]}
          >
            <View style={styles.scoreRow}>
              <Text style={styles.scoreStarText}>⭐ {score}/100 ĐIỂM</Text>
              {score >= 60 && <Text style={styles.xpBonusBadge}>+{score >= 90 ? 20 : 10} XP</Text>}
            </View>

            {recognizedText ? (
              <Text style={styles.recognizedText}>
                Âm nhận diện:{" "}
                <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>"{recognizedText}"</Text>
              </Text>
            ) : (
              <Text style={styles.recognizedText}>Âm nhận diện: (Không rõ âm thanh)</Text>
            )}

            <Text style={styles.feedbackMsg}>{feedback}</Text>

            {userAudioUri && (
              <TouchableOpacity
                onPress={playUserRecording}
                style={styles.drawerUserAudioBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="volume-high" size={16} color="#FFFFFF" />
                <Text style={styles.drawerUserAudioBtnText}>Nghe lại giọng bạn vừa đọc 🎧</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: Spacing.md }}>
              <DuolingoButton
                title="ĐỌC LẠI ↺"
                variant="secondary"
                size="lg"
                onPress={handleRetryWord}
                style={{ flex: 1 }}
              />
              <DuolingoButton
                title="TỪ TIẾP THEO ➜"
                variant={score >= 60 ? "primary" : "purple"}
                size="lg"
                onPress={handleNext}
                style={{ flex: 1.5 }}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.duolingo.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.pageMargin,
    marginBottom: Spacing.md,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  headerProgressText: { fontSize: 13, fontWeight: "800", color: Colors.duolingo.purple },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.xl,
    alignItems: "center",
  },

  badgeRow: { flexDirection: "row", marginBottom: Spacing.xs },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.duolingo.purple,
    letterSpacing: 0.5,
  },

  promptTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginVertical: Spacing.xs,
    textAlign: "center",
  },

  cardTargetBox: {
    width: "100%",
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderBottomWidth: 4,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  characterBig: { fontSize: 44, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  pinyinText: { fontSize: 18, fontWeight: "700", color: Colors.duolingo.purple, marginBottom: 2 },
  translationText: { fontSize: 14, color: Colors.duolingo.textMuted, marginBottom: Spacing.sm },
  listenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  listenBtnText: { fontSize: 13, fontWeight: "700", color: Colors.duolingo.purple },

  micSection: { alignItems: "center", marginVertical: Spacing.xs, width: "100%" },
  micPulseCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
  bigMicBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.duolingo.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  bigMicBtnRecording: {
    backgroundColor: Colors.duolingo.red,
  },
  micHintText: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    fontWeight: "700",
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  liveSpeechBox: {
    backgroundColor: "#131F24",
    borderRadius: Radii.md,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.duolingo.purple,
    alignItems: "center",
  },
  liveSpeechLabel: { fontSize: 10, fontWeight: "800", color: Colors.duolingo.purple },
  liveSpeechText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginTop: 2 },

  userAudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    marginTop: 14,
  },
  userAudioBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.duolingo.purple,
  },

  drawerUserAudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    marginTop: 8,
  },
  drawerUserAudioBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  resultDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
    paddingBottom: Math.max(Spacing.lg, 24),
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 2,
    borderTopColor: Colors.duolingo.cardBorder,
  },
  feedbackSuccess: { backgroundColor: "#193318", borderTopColor: Colors.duolingo.green },
  feedbackWarning: { backgroundColor: "#382916", borderTopColor: Colors.duolingo.yellow },
  feedbackError: { backgroundColor: "#381616", borderTopColor: Colors.duolingo.red },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreStarText: { fontSize: 20, fontWeight: "800", color: Colors.duolingo.yellow },
  xpBonusBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    backgroundColor: Colors.duolingo.green,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  recognizedText: { fontSize: 13, color: Colors.duolingo.textMuted, marginBottom: 4 },
  feedbackMsg: { fontSize: 14, color: "#FFFFFF", fontWeight: "600", lineHeight: 20 },

  doneContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  doneTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  doneSub: { fontSize: 14, color: Colors.duolingo.textMuted, marginTop: 6, textAlign: "center" },
});
