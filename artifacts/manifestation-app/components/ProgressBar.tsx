import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  color?: string;
}

export function ProgressBar({ label, current, total, color }: ProgressBarProps) {
  const colors = useColors();
  const animWidth = useRef(new Animated.Value(0)).current;
  const progress = total > 0 ? current / total : 0;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress, animWidth]);

  const barColor = color ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {current}/{total}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: animWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
