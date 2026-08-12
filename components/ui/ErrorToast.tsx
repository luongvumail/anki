import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radii, Spacing, triggerHaptic } from "../../constants/theme";

export interface ErrorToastProps {
  visible: boolean;
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorToast = React.memo(function ErrorToast({
  visible,
  message,
  onRetry,
  onDismiss,
}: ErrorToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      triggerHaptic("error");
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="alert-circle" size={22} color={Colors.duolingo.red} />
      <Text style={styles.messageText} numberOfLines={2}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>THỬ LẠI</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
        <Ionicons name="close" size={18} color={Colors.duolingo.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    left: Spacing.pageMargin,
    right: Spacing.pageMargin,
    zIndex: 1000,
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.duolingo.red,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: 10,
    shadowColor: Colors.duolingo.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.white,
  },
  retryBtn: {
    backgroundColor: Colors.duolingo.red,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  retryText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  closeBtn: {
    padding: 4,
  },
});
