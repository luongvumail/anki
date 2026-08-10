import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { UserProfile } from "../../../infrastructure/auth/authService.js";
import { theme } from "../../theme/theme.js";
import { useTheme } from "../../theme/ThemeContext.js";
import { DuolingoButton } from "../DuolingoButton.js";
import { DuolingoCard } from "../DuolingoCard.js";
import { StatusBadge } from "../StatusBadge.js";

export interface UserProfileCardProps {
  user: UserProfile;
  onLogout: () => void;
  onChangePasswordClick: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onLogout,
  onChangePasswordClick,
}) => {
  const { theme: currentTheme } = useTheme();

  return (
    <DuolingoCard accessibilityLabel="Thông tin tài khoản">
      <View style={styles.profileRow}>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: currentTheme.colors.textPrimary }]}>
            {user.displayName}
          </Text>
          <Text style={[styles.profileEmail, { color: currentTheme.colors.textSecondary }]}>
            {user.isGuest ? "Tài khoản Khách (Chưa đăng ký)" : user.email}
          </Text>
        </View>
        <StatusBadge
          variant={user.isGuest ? "warning" : "learned"}
          label={user.isGuest ? "KHÁCH" : "ĐÃ XÁC THỰC"}
        />
      </View>
      <View style={styles.profileBtnWrapper}>
        <DuolingoButton
          title={user.isGuest ? "ĐĂNG NHẬP / ĐĂNG KÝ" : "ĐĂNG XUẤT"}
          variant={user.isGuest ? "primary" : "secondary"}
          onPress={onLogout}
        />

        {!user.isGuest && (
          <Pressable onPress={onChangePasswordClick} style={styles.changePassBtn}>
            <Text style={styles.changePassText}>ĐỔI MẬT KHẢU TÀI KHOẢN</Text>
          </Pressable>
        )}
      </View>
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  profileEmail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  profileBtnWrapper: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  changePassBtn: {
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  changePassText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
});
