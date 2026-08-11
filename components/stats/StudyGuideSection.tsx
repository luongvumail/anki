import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "../../constants/theme";
import { SectionTitle } from "../ui/SectionTitle";
import { DuolingoCard } from "../ui/DuolingoCard";

export const StudyGuideSection = React.memo(() => {
  return (
    <>
      <SectionTitle>HƯỚNG DẪN SỬ DỤNG & QUY TRÌNH HỌC</SectionTitle>

      <View style={styles.guideListContainer}>
        {/* Step 1: SRS SM-2 Algorithm */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
              <Ionicons name="analytics" size={22} color={Colors.duolingo.purple} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>1. Thuật toán Trí nhớ Ngắt quãng (SRS SM-2)</Text>
              <Text style={styles.guideSub}>Tự động tính thời điểm tối ưu nhắc ôn bài</Text>
            </View>
          </View>
          <Text style={styles.guideDesc}>
            Bộ não con người sẽ quên tới 70% từ mới sau 24h. Thuật toán SRS SM-2 tự động tính toán thời gian phản xạ (ms) và số lần ôn tập để xếp lịch nhắc bài trước khi từ vựng bị quên, đưa từ vựng vào trí nhớ dài hạn vĩnh viễn.
          </Text>
        </DuolingoCard>

        {/* Step 2: 3-Stage Study Loop */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
              <Ionicons name="git-network" size={22} color={Colors.duolingo.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>2. Lộ trình Học 3 Giai đoạn Thông minh</Text>
              <Text style={styles.guideSub}>Nạp từ ➔ Kiểm tra Quiz ➔ Sửa lỗi Cắm cờ</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.blue }}>Giai đoạn 1 (Nạp từ):</Text> Lật thẻ Flashcard xem Hán tự, Pinyin, Phát âm, Dịch nghĩa & Bộ thủ.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>Giai đoạn 2 (Kiểm tra):</Text> Làm bài Quiz kiểm tra kiến thức đa dạng dạng bài.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>Giai đoạn 3 (Cắm cờ):</Text> Tự động lập vòng lặp sửa lỗi nhanh cho các câu làm sai hoặc làm chậm (&gt;4 giây).
              </Text>
            </View>
          </View>
        </DuolingoCard>

        {/* Step 3: Adaptive Quiz Types */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: "rgba(88, 204, 2, 0.15)" }]}>
              <Ionicons name="help-circle" size={22} color={Colors.duolingo.green} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>3. Chế độ Trắc nghiệm Thích ứng (Quiz)</Text>
              <Text style={styles.guideSub}>4 Dạng bài tập biến hóa theo độ thuộc từ</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>Chọn Nghĩa Tiếng Việt:</Text> Nhớ ý nghĩa cơ bản của từ vựng mới.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.blue }}>Chọn Pinyin:</Text> Chuẩn hóa phiên âm &amp; dấu thanh điệu.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>Nghe âm thanh chọn Hán tự:</Text> Rèn phản xạ thính giác.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>Điền câu Cloze ngữ cảnh:</Text> Ứng dụng từ vựng trong câu hoàn chỉnh.
              </Text>
            </View>
          </View>
        </DuolingoCard>

        {/* Step 4: Arcade Practice Hub */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)" }]}>
              <Ionicons name="game-controller" size={22} color={Colors.duolingo.yellow} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>4. Trung tâm Luyện tập Arcade</Text>
              <Text style={styles.guideSub}>Luyện phản xạ với 3 Mini-Games tự do</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>Ghép Từ Nhanh 60s:</Text> Thử thách ghép cặp Hán tự ↔ Nghĩa siêu tốc.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>Xếp Từ Thành Câu:</Text> Ghép câu ví dụ có kèm từ gây nhiễu rèn ngữ pháp.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={styles.gestureText}>
                <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>Phòng Luyện Phát Âm AI:</Text> Thu âm đọc Hán tự, AI chấm điểm Pinyin &amp; 4 thanh điệu.
              </Text>
            </View>
          </View>
        </DuolingoCard>

        {/* Step 5: AI Automatic Creation */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
              <Ionicons name="sparkles" size={22} color={Colors.duolingo.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>5. Nạp Từ Vựng Tự Động Bằng AI</Text>
              <Text style={styles.guideSub}>Trích xuất dữ liệu từ vựng thông minh</Text>
            </View>
          </View>
          <Text style={styles.guideDesc}>
            Nhập từ Hán hoặc câu văn Tiếng Trung ➔ AI tự động trích xuất Pinyin, Nghĩa Tiếng Việt, Phân tích Bộ thủ siêu ngắn gọn và tạo Câu ví dụ chuẩn ngữ cảnh trong 1 giây.
          </Text>
        </DuolingoCard>

        {/* Step 6: Rank Titles & Badges */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 150, 0, 0.15)" }]}>
              <Ionicons name="trophy" size={22} color="#FF9600" />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={styles.guideTitle}>6. Cấp Độ Hán Ngữ &amp; Bộ Huy Hiệu</Text>
              <Text style={styles.guideSub}>Thăng hạng danh hiệu thực chất &amp; mở khóa huy hiệu</Text>
            </View>
          </View>
          <Text style={styles.guideDesc}>
            Tích lũy XP qua bài học để thăng hạng qua 6 cấp danh hiệu Hán ngữ chuẩn (từ <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>初学者</Text> tới <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>汉字宗师</Text>) và chinh phục Bộ 14 Huy hiệu thành tích cá nhân.
          </Text>
        </DuolingoCard>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  guideListContainer: { gap: 12, marginBottom: Spacing.md },
  guideCard: { padding: Spacing.md },
  guideHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  guideIconTile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  guideHeaderText: { flex: 1 },
  guideTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  guideSub: { fontSize: 12, fontWeight: "600", color: Colors.duolingo.textMuted, marginTop: 2 },
  guideDesc: { fontSize: 13, color: Colors.duolingo.textMuted, lineHeight: 18, fontWeight: "500" },
  gestureGuideList: { gap: 8, marginTop: 4 },
  gestureRowItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  gestureText: { fontSize: 13, color: Colors.duolingo.textMuted, flex: 1 },
});
