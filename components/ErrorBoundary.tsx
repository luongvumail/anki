import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing } from "../constants/theme";
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
          <DuolingoMascot expression="sad" size={80} speechBubbleText="Ối! Đã có lỗi xảy ra..." />

          <Text style={styles.title}>ỨNG DỤNG GẶP SỰ CỐ TẠM THỜI</Text>
          <Text style={styles.message}>
            {this.state.error?.message ||
              "Đã xảy ra lỗi ngoài dự kiến. Bạn hãy thử tải lại trang nhé!"}
          </Text>

          <DuolingoButton
            title="THỬ LẠI TRANG"
            icon={<Ionicons name="refresh" size={18} color="#FFFFFF" />}
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
    backgroundColor: Colors.duolingo.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: Spacing.lg,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  btn: {
    minWidth: 200,
  },
});
