import React, { useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Typography, Spacing, Radii } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

const ITEM_HEIGHT = 36;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

interface WheelTimePickerProps {
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

export const WheelTimePicker = React.memo(function WheelTimePicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: WheelTimePickerProps) {
  const { theme } = useTheme();
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: hour * ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: minute * ITEM_HEIGHT, animated: false });
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHourScroll = useCallback(
    (y: number) => {
      const h = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(23, h));
      onHourChange(clamped);
    },
    [onHourChange],
  );

  const handleMinuteScroll = useCallback(
    (y: number) => {
      const m = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(59, m));
      onMinuteChange(clamped);
    },
    [onMinuteChange],
  );

  const formattedTime = `${hour < 10 ? "0" : ""}${hour}:${minute < 10 ? "0" : ""}${minute}`;

  return (
    <View style={styles.container}>
      <View style={styles.wheelPickerContainer}>
        {/* Hour Wheel */}
        <View style={styles.wheelColumn}>
          <Text style={[styles.wheelLabel, { color: theme.textMuted }]}>GIỜ</Text>
          <View style={[styles.wheelWrapper, { backgroundColor: theme.bgSoft }]}>
            <View
              style={[styles.wheelSelector, { backgroundColor: theme.blueDim }]}
              pointerEvents="none"
            />
            <ScrollView
              ref={hourScrollRef}
              style={styles.wheelScroll}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
              onMomentumScrollEnd={(e) => handleHourScroll(e.nativeEvent.contentOffset.y)}
              onScrollEndDrag={(e) => handleHourScroll(e.nativeEvent.contentOffset.y)}
            >
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={styles.wheelItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onHourChange(h);
                    hourScrollRef.current?.scrollTo({ y: h * ITEM_HEIGHT, animated: true });
                  }}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      { color: hour === h ? theme.blue : theme.textMuted },
                      hour === h && styles.wheelItemTextActive,
                    ]}
                  >
                    {h < 10 ? `0${h}` : `${h}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Text style={[styles.wheelColon, { color: theme.textMuted }]}>:</Text>

        {/* Minute Wheel */}
        <View style={styles.wheelColumn}>
          <Text style={[styles.wheelLabel, { color: theme.textMuted }]}>PHÚT</Text>
          <View style={[styles.wheelWrapper, { backgroundColor: theme.bgSoft }]}>
            <View
              style={[styles.wheelSelector, { backgroundColor: theme.blueDim }]}
              pointerEvents="none"
            />
            <ScrollView
              ref={minuteScrollRef}
              style={styles.wheelScroll}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
              onMomentumScrollEnd={(e) => handleMinuteScroll(e.nativeEvent.contentOffset.y)}
              onScrollEndDrag={(e) => handleMinuteScroll(e.nativeEvent.contentOffset.y)}
            >
              {MINUTES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={styles.wheelItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onMinuteChange(m);
                    minuteScrollRef.current?.scrollTo({ y: m * ITEM_HEIGHT, animated: true });
                  }}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      { color: minute === m ? theme.blue : theme.textMuted },
                      minute === m && styles.wheelItemTextActive,
                    ]}
                  >
                    {m < 10 ? `0${m}` : `${m}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.statusText, { color: theme.blue }]}>
          Nhắc học hàng ngày lúc {formattedTime}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  wheelPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: Spacing.xs,
  },
  wheelColumn: {
    alignItems: "center",
    flex: 1,
  },
  wheelLabel: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  wheelWrapper: {
    height: ITEM_HEIGHT * 3,
    width: "100%",
    overflow: "hidden",
    borderRadius: Radii.md,
    position: "relative",
  },
  wheelSelector: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: Radii.sm,
  },
  wheelScroll: {
    flex: 1,
    width: "100%",
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: {
    fontSize: 16,
    fontWeight: Typography.weight.medium,
    letterSpacing: 0.5,
  },
  wheelItemTextActive: {
    fontWeight: Typography.weight.extraBold,
    fontSize: 18,
  },
  wheelColon: {
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    paddingTop: 14,
    marginHorizontal: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.semibold,
  },
});
