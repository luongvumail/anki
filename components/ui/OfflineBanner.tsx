import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "../../constants/theme";

export const OfflineBanner = React.memo(function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    // Basic connectivity state check
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="cloud-offline-outline" size={18} color="#FFFFFF" />
      <Text style={styles.bannerText}>Chế độ ngoại tuyến (Offline) — Đang lưu dữ liệu tại máy</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.duolingo.red,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: Spacing.pageMargin,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
