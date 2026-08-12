import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "../../constants/theme";

export const OfflineBanner = React.memo(function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Try @react-native-community/netinfo if present
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NetInfo = require("@react-native-community/netinfo");
      if (NetInfo && typeof NetInfo.addEventListener === "function") {
        unsubscribe = NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
          setIsOffline(state.isConnected === false);
        });
      }
    } catch {
      // Fallback for Web or environments without NetInfo
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        if (typeof navigator !== "undefined" && "onLine" in navigator) {
          setIsOffline(!navigator.onLine);
        }
        unsubscribe = () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
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
