import { useState, useEffect, useRef, useCallback } from "react";
import { Animated } from "react-native";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import {
  useAudioRecorder,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { Card } from "../store/slices/types";
import { triggerHaptic } from "../constants/theme";
import { APP_CONFIG } from "../constants/config";
import { awardArcadeXP, ARCADE_XP_REWARDS } from "../lib/arcadeScoring";

interface GeminiSpeechResponse {
  transcript: string;
  errorDetail?: string;
  pronunciationTip?: string;
}

function stripDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getToneTip(pinyin?: string): string {
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
}

export function usePronunciationTrainer(visible: boolean, cards: Card[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
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

  useEffect(() => {
    if (!visible) {
      try {
        audioRecorder.stop();
      } catch {
        // ignore if not recording
      }
    }
  }, [visible, audioRecorder]);

  // Pulse animation for recording
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
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording, pulseAnim]);

  const playTTS = useCallback((text: string) => {
    if (!text) return;
    setSpeaking(true);
    Speech.stop();
    Speech.speak(text, {
      language: "zh-CN",
      rate: APP_CONFIG.SPEECH_RATE,
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

  const evaluateSpeech = useCallback(
    (spokenText: string, aiErrorDetail?: string, aiPronunciationTip?: string) => {
      setAnalyzing(false);
      setIsRecording(false);
      const currentCard = shuffledCards[currentIndex];
      if (!currentCard) return;

      const targetChar = currentCard.character.trim();
      const normalizedTarget = targetChar.replace(/\s+/g, "");
      const targetPinyinClean = stripDiacritics(currentCard.pinyin || "");

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
          calcScore = 95;
          msg = "Hoàn hảo! Bạn phát âm Pinyin & Thanh điệu chính xác.";
          finalErrorDetail = null;
          finalTip = aiPronunciationTip || fallbackToneTip;
          triggerHaptic("success");
          awardArcadeXP(ARCADE_XP_REWARDS.PERFECT_PRONUNCIATION);
        } else {
          let matchedCharsCount = 0;
          for (const ch of normalizedTarget) {
            if (normalizedSpoken.includes(ch)) {
              matchedCharsCount++;
            }
          }

          const overlapRatio =
            normalizedTarget.length > 0 ? matchedCharsCount / normalizedTarget.length : 0;

          if (overlapRatio > 0) {
            calcScore = Math.max(60, Math.min(85, Math.floor(overlapRatio * 100)));
            msg = `Gần chính xác! Âm nhận diện là "${cleanSpoken}".`;
            finalErrorDetail =
              aiErrorDetail ||
              `Chú ý cao độ thanh điệu hoặc phụ âm đầu. Từ chuẩn là "${targetChar}" (${currentCard.pinyin}).`;
            finalTip = aiPronunciationTip || fallbackToneTip;
            triggerHaptic("warning");
            awardArcadeXP(ARCADE_XP_REWARDS.GOOD_PRONUNCIATION);
          } else {
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
    [shuffledCards, currentIndex, drawerAnim]
  );

  const transcribeAudioWithAI = useCallback(
    async (uri: string) => {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      const currentCard = shuffledCards[currentIndex];
      if (!apiKey || !currentCard) {
        evaluateSpeech("");
        return;
      }

      try {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const prompt = `Bạn là trợ lý AI chuyên gia phân tích và chấm điểm phát âm Tiếng Trung (Mandarin).
Từ vựng chuẩn mục tiêu là:
- Hán tự: "${currentCard.character}"
- Pinyin chuẩn: "${currentCard.pinyin}"
- Nghĩa Tiếng Việt: "${currentCard.translation}"

NHIỆM VỤ:
1. Nghe kỹ file âm thanh thu âm của người dùng.
2. Trích xuất chính xác văn bản Tiếng Trung hoặc Pinyin mà người dùng đã đọc (transcript).
3. Nếu người dùng đọc sai thanh điệu, sai âm đầu (initials) hoặc vận mẫu (finals), hãy chỉ rõ lỗi sai ngắn gọn trong "errorDetail".
4. Đưa ra 1 mẹo phát âm cực kỳ dễ hiểu bằng Tiếng Việt trong "pronunciationTip" giúp họ phát âm chuẩn từ "${currentCard.character}" (${currentCard.pinyin}).

TRẢ VỀ DUY NHẤT FORMAT JSON SAU (Không thêm text thừa):
{
  "transcript": "<văn bản hoặc pinyin AI nghe được từ thu âm>",
  "errorDetail": "<phân tích lỗi sai cụ thể nếu có>",
  "pronunciationTip": "<mẹo phát âm ngắn gọn bằng Tiếng Việt>"
}`;

        const requestBody = {
          contents: [
            {
              parts: [
                { inlineData: { mimeType: "audio/m4a", data: base64Audio } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          const parsed: GeminiSpeechResponse = JSON.parse(responseText);
          evaluateSpeech(parsed.transcript || "", parsed.errorDetail, parsed.pronunciationTip);
        } else {
          evaluateSpeech("");
        }
      } catch (err) {
        console.warn("[transcribeAudioWithAI] Failed:", err);
        evaluateSpeech("");
      }
    },
    [shuffledCards, currentIndex, evaluateSpeech]
  );

  const handleStartRecording = useCallback(async () => {
    try {
      Speech.stop();
      setSpeaking(false);
      resetState();
      triggerHaptic("medium");

      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setFeedback("Cần cấp quyền truy cập Micro để luyện phát âm.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      console.warn("Failed to start recording:", err);
      setIsRecording(false);
    }
  }, [audioRecorder, resetState]);

  const handleStopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      triggerHaptic("heavy");
      setIsRecording(false);
      setAnalyzing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setUserAudioUri(uri);

      if (uri) {
        await transcribeAudioWithAI(uri);
      } else {
        evaluateSpeech("");
      }
    } catch (err) {
      console.warn("Failed to stop recording:", err);
      evaluateSpeech("");
    }
  }, [audioRecorder, evaluateSpeech, isRecording, transcribeAudioWithAI]);

  const handleNextWord = useCallback(() => {
    triggerHaptic("selection");
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetState();
    } else {
      setIsDone(true);
    }
  }, [currentIndex, shuffledCards.length, resetState]);

  const handleRetryWord = useCallback(() => {
    resetState();
    triggerHaptic("selection");
  }, [resetState]);

  return {
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
    currentCard: shuffledCards[currentIndex],
    playTTS,
    playUserRecording,
    handleStartRecording,
    handleStopRecording,
    handleNextWord,
    handleRetryWord,
    resetState,
  };
}
