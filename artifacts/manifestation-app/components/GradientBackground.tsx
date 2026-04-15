import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
}

export function GradientBackground({
  children,
  style,
  colors: customColors,
}: GradientBackgroundProps) {
  const c = useColors();
  const gradientColors = customColors ?? [
    c.gradientStart,
    c.gradientMid,
    c.gradientEnd,
  ];

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
