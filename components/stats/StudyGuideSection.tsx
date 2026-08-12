import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Typography, Layout, Radii } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { SectionTitle } from "../ui/SectionTitle";
import { DuolingoCard } from "../ui/DuolingoCard";

export const StudyGuideSection = React.memo(() => {
  const { theme } = useTheme();

  return (
    <>
      <SectionTitle>HƯỚNG DẪN SỬ DỤNG & QUY TRÌNH HỌC</SectionTitle>

      <View style={styles.guideListContainer}>
        {/* Step 1: SRS SM-2 Algorithm */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.purpleDim }]}>
              <Ionicons name="analytics" size={Layout.iconLg} color={theme.purple} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>1. Thuật toán Trí nhớ Ngắt quãng (SRS SM-2)</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Tự động tính thời điểm tối ưu nhắc ôn bài</Text>
            </View>
          </View>
          <Text style={[styles.guideDesc, { color: theme.textMuted }]}>
            Bộ não con người sẽ quên tới 70% từ mới sau 24h. Thuật toán SRS SM-2 tự động tính toán thời gian phản xạ (ms) và số lần ôn tập để xếp lịch nhắc bài trước khi từ vựng bị quên, đưa từ vựng vào trí nhớ dài hạn vĩnh viễn.
          </Text>
        </DuolingoCard>

        {/* Step 2: 3-Stage Study Loop */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.blueDim }]}>
              <Ionicons name="git-network" size={Layout.iconLg} color={theme.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>2. Lộ trình Học 3 Giai đoạn Thông minh</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Nạp từ ➔ Kiểm tra Quiz ➔ Sửa lỗi Cắm cờ</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.blue }}>Giai đoạn 1 (Nạp từ):</Text> Lật thẻ Flashcard xem Hán tự, Pinyin, Phát âm, Dịch nghĩa & Bộ thủ.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.green }}>Giai đoạn 2 (Kiểm tra):</Text> Làm bài Quiz kiểm tra kiến thức đa dạng dạng bài.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.yellow }}>Giai đoạn 3 (Cắm cờ):</Text> Tự động lập vòng lặp sửa lỗi nhanh cho các câu làm sai hoặc làm chậm (&gt;4 giây).
              </Text>
            </View>
          </View>
        </DuolingoCard>

        {/* Step 3: Adaptive Quiz Types */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.greenDim }]}>
              <Ionicons name="help-circle" size={Layout.iconLg} color={theme.green} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>3. Chế độ Trắc nghiệm Thích ứng (Quiz)</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>4 Dạng bài tập biến hóa theo độ thuộc từ</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Chọn Nghĩa Tiếng Việt:</Text> Nhớ ý nghĩa cơ bản của từ vựng mới.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.blue }}>Chọn Pinyin:</Text> Chuẩn hóa phiên âm & dấu thanh điệu.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.purple }}>Nghe âm thanh chọn Hán tự:</Text> Rèn phản xạ thính giác.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.green }}>Điền câu Cloze ngữ cảnh:</Text> Ứng dụng từ vựng trong câu hoàn chỉnh.
              </Text>
            </View>
          </View>
        </DuolingoCard>

        {/* Step 4: Arcade Practice Hub */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.yellowDim }]}>
              <Ionicons name="game-controller" size={Layout.iconLg} color={theme.yellow} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>4. Trung tâm Luyện tập Arcade</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Luyện phản xạ với 3 Mini-Games tự do</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.yellow }}>Ghép Từ Nhanh 60s:</Text> Thử thách ghép cặp Hán tự ↔ Nghĩa siêu tốc.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.green }}>Xếp Từ Thành Câu:</Text> Ghép câu ví dụ có kèm từ gây nhiễu rèn ngữ pháp.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.purple }}>Phòng Luyện Phát Âm AI:</Text> Thu âm đọc Hán tự, AI chấm điểm Pinyin & 4 thanh điệu.
              </Text>
            </View>
          </View>
        </DuolingoCard>

        {/* Step 5: AI Automatic Creation */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.blueDim }]}>
              <Ionicons name="sparkles" size={Layout.iconLg} color={theme.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>5. Nạp Từ Vựng Tự Động Bằng AI</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Trích xuất dữ liệu từ vựng thông minh</Text>
            </View>
          </View>
          <Text style={[styles.guideDesc, { color: theme.textMuted }]}>
            Nhập từ Hán hoặc câu văn Tiếng Trung ➔ AI tự động trích xuất Pinyin, Nghĩa Tiếng Việt, Phân tích Bộ thủ siêu ngắn gọn và tạo Câu ví dụ chuẩn ngữ cảnh trong 1 giây.
          </Text>
        </DuolingoCard>

        {/* Step 6: Level & Badges */}
        <DuolingoCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.yellowDim }]}>
              <Ionicons name="trophy" size={Layout.iconLg} color={theme.yellow} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>6. Cấp Độ Hán Ngữ & Bộ Huy Hiệu</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Thăng hạng danh hiệu thực chất & mở khóa huy hiệu</Text>
            </View>
          </View>
          <Text style={[styles.guideDesc, { color: theme.textMuted }]}>
            Tích lũy XP qua bài học để thăng hạng qua 6 cấp danh hiệu Hán ngữ chuẩn (từ <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.yellow }}>初学者</Text> tới <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.purple }}>汉字宗师</Text>) và chinh phục Bộ 14 Huy hiệu thành tích cá nhân.
          </Text>
        </DuolingoCard>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  guideListContainer: { gap: Spacing.md, marginBottom: Spacing.md },
  guideCard: { padding: Spacing.md },
  guideHeaderRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.sm },
  guideIconTile: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  guideHeaderText: { flex: 1 },
  guideTitle: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold },
  guideSub: { fontSize: Typography.caption1.fontSize, fontWeight: Typography.weight.semibold, marginTop: 2 },
  guideDesc: { fontSize: Typography.caption.fontSize, lineHeight: 18, fontWeight: Typography.weight.medium },
  gestureGuideList: { gap: Spacing.sm, marginTop: Spacing.xs },
  gestureRowItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  gestureText: { fontSize: Typography.caption.fontSize, flex: 1 },
});
