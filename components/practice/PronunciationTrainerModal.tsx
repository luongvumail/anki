import React, { useState, useEffect, useRef, useCallback } from "react";
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
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import {
  useAudioRecorder,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { CardEntity } from "../../src/domain/card/cardEntity";
import { useAppStore } from "../../src/ui/store/useAppStore";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { AudioButton } from "../ui/AudioButton";
import { ProgressBar } from "../ui/ProgressBar";

export interface PronunciationTrainerModalProps {
  visible: boolean;
  onClose: () => void;
  cards: CardEntity[];
}

export function PronunciationTrainerModal({
  visible,
  onClose,
  cards,
}: PronunciationTrainerModalProps) {
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<CardEntity[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [pronunciationTip, setPronunciationTip] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [isDone, setIsDone] = useState(false);
  const [userAudioUri, setUserAudioUri] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(300)).current;
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const userAudioPlayer = useAudioPlayer(userAudioUri);

  const resetState = useCallback(() => {
    setScore(null);
    setFeedback(null);
    setErrorDetail(null);
    setPronunciationTip(null);
    setRecognizedText("");
    setIsRecording(false);
    setAnalyzing(false);
    setUserAudioUri(null);
    drawerAnim.setValue(300);
  }, [drawerAnim]);

  const prevVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !prevVisibleRef.current && cards.length > 0) {
      const list = [...cards].sort(() => 0.5 - Math.random()).slice(0, 5);
      setShuffledCards(list);
      setCurrentIndex(0);
      setIsDone(false);
      resetState();
    }
    prevVisibleRef.current = visible;
  }, [visible, cards, resetState]);

  // Cleanup recorder when modal closes
  useEffect(() => {
    if (!visible) {
      try {
        audioRecorder.stop();
      } catch {
        // ignore if not recording
      }
    }
  }, [visible, audioRecorder]);

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

  // Helper to remove diacritics / tones from Pinyin string
  const stripDiacritics = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  // Generate tone & pronunciation tips based on Mandarin target pinyin
  const getToneTip = (pinyin?: string): string => {
    if (!pinyin) return "Đọc rõ ràng từng âm tiết và giữ khẩu hình mở chuẩn.";
    const lower = pinyin.toLowerCase();
    if (/[āēīōūǖ]/.test(lower)) {
      return "Thanh 1 (ngang): Giữ cao độ giọng kéo dài và ổn định, không hạ giọng.";
    }
    if (/[áéíóúǘ]/.test(lower)) {
      return "Thanh 2 (dấu sắc): Đọc vút giọng từ trung bình lên cao (giống khi thắc mắc 'Hả?').";
    }
    if (/[ǎěǐǒǔǚ]/.test(lower)) {
      return "Thanh 3 (dấu hỏi): Hạ giọng xuống thấp nhất rồi hơi vút nhẹ lên.";
    }
    if (/[àèìòùǜ]/.test(lower)) {
      return "Thanh 4 (dấu huyền nghiêng): Dứt khoát hạ giọng từ cao xuống thấp (như ra lệnh).";
    }
    return "Chú ý giữ chuẩn thanh điệu và bật hơi rõ ràng.";
  };

  // Evaluation Logic with Error Diagnosis & Tips
  const evaluateSpeech = useCallback(
    (spokenText: string, aiErrorDetail?: string, aiPronunciationTip?: string) => {
      setAnalyzing(false);
      setIsRecording(false);
      const currentCard = shuffledCards[currentIndex];
      if (!currentCard) return;

      const targetChar = currentCard.character.trim();
      const normalizedTarget = targetChar.replace(/\s+/g, "");
      const targetPinyinClean = stripDiacritics(currentCard.pinyin || "");

      // Clean spoken text: strip punctuation
      const cleanSpoken = spokenText
        .trim()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?！。，？"']/g, "");
      const normalizedSpoken = cleanSpoken.replace(/\s+/g, "");
      const spokenPinyinClean = stripDiacritics(cleanSpoken);

      setRecognizedText(cleanSpoken);

      let calcScore = 0;
      let msg = "";
      let finalErrorDetail: string | null = null;
      let finalTip: string | null = null;

      const fallbackToneTip = getToneTip(currentCard.pinyin);

      if (!cleanSpoken) {
        // Case 1: Silent / Unrecognized
        calcScore = 0;
        msg = "Không nhận diện được giọng nói. Vui lòng bấm loa nghe âm mẫu và đọc rõ vào Micro.";
        finalErrorDetail = "AI không nghe thấy giọng đọc hoặc âm thanh quá nhỏ/bị nhiễu.";
        finalTip = "Ghé sát Micro hơn, bấm nghe âm mẫu và phát âm to rõ ràng.";
        triggerHaptic("error");
      } else {
        const hasExactChar =
          normalizedSpoken.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedSpoken) ||
          cleanSpoken.includes(targetChar);

        const hasExactPinyin =
          targetPinyinClean.length > 0 &&
          (spokenPinyinClean === targetPinyinClean ||
            spokenPinyinClean.includes(targetPinyinClean) ||
            targetPinyinClean.includes(spokenPinyinClean));

        if (hasExactChar || hasExactPinyin) {
          // Case 2: Exact Match (Characters or Pinyin)
          calcScore = 95;
          msg = "Hoàn hảo! Bạn phát âm Pinyin & Thanh điệu chính xác.";
          finalErrorDetail = null;
          finalTip = aiPronunciationTip || fallbackToneTip;
          triggerHaptic("success");
        } else {
          // Check partial character overlap
          let matchedCharsCount = 0;
          for (const ch of normalizedTarget) {
            if (normalizedSpoken.includes(ch)) {
              matchedCharsCount++;
            }
          }

          const overlapRatio =
            normalizedTarget.length > 0 ? matchedCharsCount / normalizedTarget.length : 0;

          if (overlapRatio > 0) {
            // Case 3: Partial Match
            calcScore = Math.max(60, Math.min(85, Math.floor(overlapRatio * 100)));
            msg = `Gần chính xác! Âm nhận diện là "${cleanSpoken}".`;
            finalErrorDetail =
              aiErrorDetail ||
              `Chú ý cao độ thanh điệu hoặc phụ âm đầu. Từ chuẩn là "${targetChar}" (${currentCard.pinyin}).`;
            finalTip = aiPronunciationTip || fallbackToneTip;
            triggerHaptic("warning");
          } else {
            // Case 4: Wrong Word / Mispronounced Completely
            calcScore = 30;
            msg = `Chưa đúng! Âm nhận diện là "${cleanSpoken}".`;
            finalErrorDetail =
              aiErrorDetail ||
              `Âm đọc chưa khớp với từ "${targetChar}" (${currentCard.pinyin}). Hãy nghe âm chuẩn và thử lại!`;
            finalTip = aiPronunciationTip || fallbackToneTip;
            triggerHaptic("error");
          }
        }
      }

      setScore(calcScore);
      setFeedback(msg);
      setErrorDetail(finalErrorDetail);
      setPronunciationTip(finalTip);

      Animated.spring(drawerAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
    [shuffledCards, currentIndex, drawerAnim],
  );

  // Interface for Gemini JSON speech analysis
  interface GeminiSpeechResponse {
    transcript: string;
    errorDetail?: string;
    pronunciationTip?: string;
  }

  // Transcribe audio via Gemini API & get AI diagnosis
  const transcribeWithGemini = async (
    uri: string,
    targetChar: string,
    targetPinyin: string,
  ): Promise<GeminiSpeechResponse> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API key");

    const base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine correct MIME type for Gemini inlineData
    let mimeType = "audio/m4a";
    if (uri.endsWith(".mp4")) mimeType = "audio/mp4";
    else if (uri.endsWith(".wav")) mimeType = "audio/wav";
    else if (uri.endsWith(".aac")) mimeType = "audio/aac";
    else if (uri.endsWith(".caf")) mimeType = "audio/m4a"; // iOS CAF -> audio/m4a

    // Valid Gemini models with fallbacks
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3.5-flash",
    ];

    let lastErrText = "";

    const promptText = `You are an expert Chinese (Mandarin) pronunciation evaluator for Vietnamese learners.
Target Chinese word: "${targetChar}" (Pinyin: "${targetPinyin}").
Audio contains the user's spoken attempt.

Task:
1. Listen carefully to the audio.
2. Transcribe what the user said in Chinese characters or Pinyin into "transcript".
3. Evaluate if they pronounced "${targetChar}" (${targetPinyin}) accurately.
4. If there is a mistake (wrong tone, wrong consonant, missing aspiration, or wrong word), explain specifically in Vietnamese in "errorDetail" what they pronounced vs the target word.
5. Provide a short actionable tip in Vietnamese in "pronunciationTip" on how to pronounce "${targetChar}" (${targetPinyin}) correctly.
6. If the audio is silent or completely inaudible, set "transcript" to "".

Return ONLY a JSON object with this format (no markdown codeblock, no extra text):
{
  "transcript": "recognized text or empty string",
  "errorDetail": "explanation in Vietnamese if incorrect or empty if correct",
  "pronunciationTip": "short tip in Vietnamese on how to pronounce correctly"
}`;

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
                        mimeType,
                        data: base64Audio,
                      },
                    },
                    {
                      text: promptText,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
                maxOutputTokens: 256,
              },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          try {
            const cleaned = rawText
              .trim()
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/```\s*$/, "")
              .trim();
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1) {
              const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
              return {
                transcript: parsed.transcript ? String(parsed.transcript).trim() : "",
                errorDetail: parsed.errorDetail ? String(parsed.errorDetail).trim() : undefined,
                pronunciationTip: parsed.pronunciationTip ? String(parsed.pronunciationTip).trim() : undefined,
              };
            }
          } catch {
            // Fallback if JSON parse fails
          }
          return { transcript: rawText.trim() };
        }

        const errText = await response.text();
        lastErrText = errText;
        console.warn(`[Gemini Audio] Model ${modelName} failed status ${response.status}: ${errText.slice(0, 100)}`);
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

    // Critical for physical iOS devices: stop Speech TTS to release AVAudioSession playback lock
    Speech.stop();
    setSpeaking(false);

    try {
      // Request microphone permission via AudioModule
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setFeedback(
          "Cần cấp quyền microphone để thu âm. Vào Cài đặt → Quyền riêng tư → Microphone.",
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
      setFeedback("Không thể khởi động microphone. Kiểm tra quyền và thử lại.");
    }
  };

  const stopListening = async () => {
    triggerHaptic("selection");
    setIsRecording(false);
    setAnalyzing(true);

    try {
      await audioRecorder.stop();
      // Brief delay to allow audio file buffer to flush to disk completely
      await new Promise((resolve) => setTimeout(resolve, 100));

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

      // Check recorded file existence and size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || (fileInfo.size !== undefined && fileInfo.size < 200)) {
        console.warn("[stopListening] Recorded file is missing or too small:", fileInfo);
        evaluateSpeech("");
        return;
      }

      setUserAudioUri(uri);

      const currentCard = shuffledCards[currentIndex];
      const targetChar = currentCard?.character || "";
      const targetPinyin = currentCard?.pinyin || "";

      // Transcribe with AI giving context of target word
      const aiResult = await transcribeWithGemini(uri, targetChar, targetPinyin);
      evaluateSpeech(aiResult.transcript, aiResult.errorDetail, aiResult.pronunciationTip);
    } catch (err: any) {
      console.error("stopListening error:", err);
      setAnalyzing(false);
      if (err?.message === "QUOTA_EXCEEDED") {
        setFeedback(
          "Gemini API tạm thời hết lượt yêu cầu miễn phí (Limit 429). Bạn vui lòng thử lại sau ít phút.",
        );
      } else {
        setFeedback(`Lỗi xử lý âm thanh. Hãy thử đọc lại.`);
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
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
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
            {/* Main Character Display Card */}
            <View style={styles.cardTargetBox}>
              <Text style={styles.characterBig}>{currentCard.character}</Text>
              <Text style={styles.pinyinText}>{currentCard.pinyin}</Text>
              <Text style={styles.translationText}>{currentCard.translation}</Text>

              {/* TTS Listen Button */}
              <AudioButton
                onPress={() => playTTS(currentCard.character)}
                isPlaying={speaking}
                size="md"
                style={{ marginTop: Spacing.xs }}
              />
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
                  ? "AI đang chấm điểm phát âm..."
                  : isRecording
                    ? "ĐANG THU ÂM... BẤM LẠI NÚT ĐỂ AI CHẤM ĐIỂM"
                    : "Chạm nút Micro để bắt đầu đọc"}
              </Text>

              {isRecording && recognizedText ? (
                <View style={styles.liveSpeechBox}>
                  <Text style={styles.liveSpeechLabel}>ĐANG LẮNG NGHE:</Text>
                  <Text style={styles.liveSpeechText}>"{recognizedText}"</Text>
                </View>
              ) : null}

              {!isRecording && !analyzing && userAudioUri ? (
                <AudioButton
                  onPress={playUserRecording}
                  size="md"
                  color={Colors.duolingo.purple}
                  backgroundColor={Colors.duolingo.purpleDim}
                  style={{ marginTop: Spacing.sm }}
                />
              ) : null}
            </View>
          </ScrollView>
        ) : (
          /* Completion Card */
          <View style={styles.doneContainer}>
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
              <Text style={styles.scoreStarText}>{score}/100 ĐIỂM</Text>
              {score >= 60 && <Text style={styles.xpBonusBadge}>+{score >= 90 ? 20 : 10} XP</Text>}
            </View>

            {/* Target vs Recognized Speech Comparison Card */}
            <View style={styles.comparisonBox}>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>🎯 TỪ MẪU CHUẨN:</Text>
                <Text style={styles.compareTargetText}>
                  {currentCard.character}{" "}
                  {currentCard.pinyin ? (
                    <Text style={styles.comparePinyinText}>· {currentCard.pinyin}</Text>
                  ) : null}
                </Text>
                {currentCard.translation ? (
                  <Text style={styles.compareTranslationText}>Nghĩa: {currentCard.translation}</Text>
                ) : null}
              </View>

              <View style={[styles.compareItem, { marginTop: 6 }]}>
                <Text style={styles.compareLabel}>🎙️ BẠN ĐỌC:</Text>
                {recognizedText ? (
                  <Text style={styles.compareSpokenText}>"{recognizedText}"</Text>
                ) : (
                  <Text style={styles.compareSpokenMuted}>(Không nhận diện rõ âm thanh)</Text>
                )}
              </View>
            </View>

            {/* Main Evaluation Feedback */}
            <Text style={styles.feedbackMsg}>{feedback}</Text>

            {/* AI Error Diagnosis & Pronunciation Tip Card */}
            {(errorDetail || pronunciationTip) && (
              <View style={styles.diagnosisBox}>
                {errorDetail ? (
                  <View style={styles.diagRow}>
                    <Ionicons name="alert-circle-outline" size={18} color="#FFD166" style={{ marginTop: 2 }} />
                    <Text style={styles.diagText}>
                      <Text style={{ fontWeight: "800", color: "#FFD166" }}>Chẩn đoán: </Text>
                      {errorDetail}
                    </Text>
                  </View>
                ) : null}

                {pronunciationTip ? (
                  <View style={[styles.diagRow, errorDetail ? { marginTop: 6 } : null]}>
                    <Ionicons name="bulb-outline" size={18} color="#06D6A0" style={{ marginTop: 2 }} />
                    <Text style={styles.diagText}>
                      <Text style={{ fontWeight: "800", color: "#06D6A0" }}>Mẹo đọc: </Text>
                      {pronunciationTip}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Side-by-side Dual Audio Playback Compare Row */}
            <View style={styles.audioCompareRow}>
              <TouchableOpacity
                onPress={() => playTTS(currentCard.character)}
                style={styles.audioBtnTTS}
                activeOpacity={0.8}
              >
                <Ionicons name="volume-high" size={18} color="#FFFFFF" />
                <Text style={styles.audioBtnText}>NGHE ÂM CHUẨN</Text>
              </TouchableOpacity>

              {userAudioUri && (
                <TouchableOpacity
                  onPress={playUserRecording}
                  style={styles.audioBtnUser}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mic" size={18} color="#FFFFFF" />
                  <Text style={styles.audioBtnText}>GIỌNG BẠN ĐỌC</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: Spacing.md }}>
              <DuolingoButton
                title="ĐỌC LẠI"
                variant="secondary"
                size="lg"
                onPress={handleRetryWord}
                style={{ flex: 1 }}
              />
              <DuolingoButton
                title="TỪ TIẾP THEO"
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
    fontSize: 18,
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
  characterBig: { fontSize: 48, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  pinyinText: { fontSize: 20, fontWeight: "700", color: Colors.duolingo.blue, marginBottom: 2 },
  translationText: { fontSize: 16, fontWeight: "600", color: "rgba(255, 255, 255, 0.85)", marginBottom: Spacing.sm },
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

  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    marginVertical: 8,
  },
  waveBar: {
    width: 6,
    borderRadius: Radii.full,
  },

  drawerUserAudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.duolingo.purple,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    marginTop: 12,
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.purpleDark,
  },
  drawerUserAudioBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
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
  feedbackMsg: { fontSize: 14, color: "#FFFFFF", fontWeight: "700", lineHeight: 20, marginTop: 4 },

  comparisonBox: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: Radii.md,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  compareItem: { flexDirection: "column" },
  compareLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255, 255, 255, 0.7)", letterSpacing: 0.5 },
  compareTargetText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginTop: 1 },
  comparePinyinText: { fontSize: 16, fontWeight: "700", color: Colors.duolingo.blue },
  compareTranslationText: { fontSize: 13, color: "rgba(255, 255, 255, 0.8)", fontWeight: "600" },
  compareSpokenText: { fontSize: 16, fontWeight: "800", color: "#FFD166", marginTop: 1 },
  compareSpokenMuted: { fontSize: 13, fontStyle: "italic", color: "rgba(255, 255, 255, 0.6)", marginTop: 1 },

  diagnosisBox: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: Radii.md,
    padding: 10,
    marginTop: 6,
    borderLeftWidth: 4,
    borderLeftColor: Colors.duolingo.yellow,
  },
  diagRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  diagText: { flex: 1, fontSize: 13, color: "#FFFFFF", fontWeight: "600", lineHeight: 18 },

  audioCompareRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  audioBtnTTS: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.duolingo.blue,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  audioBtnUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.duolingo.purple,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.purpleDark,
  },
  audioBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  doneContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  doneTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  doneSub: { fontSize: 14, color: Colors.duolingo.textMuted, marginTop: 6, textAlign: "center" },
});
