import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Typography, Layout } from "../constants/theme";
import { DuolingoButton } from "./ui/DuolingoButton";
import { DuolingoMascot } from "./ui/DuolingoMascot";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught ErrorBoundary error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <DuolingoMascot expression="sad" size={Layout.avatarXl} speechBubbleText="Ối! Đã có lỗi xảy ra..." />

          <Text style={styles.title}>ỨNG DỤNG GẶP SỰ CỐ TẠM THỜI</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "Đã xảy ra lỗi ngoài dự kiến. Bạn hãy thử tải lại trang nhé!"}
          </Text>

          <DuolingoButton
            title="THỬ LẠI TRANG"
            icon={<Ionicons name="refresh" size={Layout.iconMd} color="#FFFFFF" />}
            variant="primary"
            size="lg"
            onPress={this.handleReset}
            style={styles.btn}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131F24",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.titleMD.fontSize,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
    marginTop: Spacing.lg,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: Typography.caption.fontSize,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  btn: {
    minWidth: 200,
  },
});
