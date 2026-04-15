import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface TimerCircleProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
}

export function TimerCircle({
  timeLeft,
  totalTime,
  size = 240,
}: TimerCircleProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const offset = circumference * (1 - progress);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Animated.View
      style={[
        { width: size, height: size, transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={4}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={6}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View
        style={[
          styles.inner,
          { width: size, height: size },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: size - 60,
              height: size - 60,
              borderRadius: (size - 60) / 2,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.timeText, { color: colors.foreground }]}>
            {timeDisplay}
          </Text>
          <Text style={[styles.breatheText, { color: colors.mutedForeground }]}>
            breathe
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 40,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
  },
  breatheText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
});
