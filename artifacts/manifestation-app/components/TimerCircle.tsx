import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerCircleProps {
  timeLeft: number;
  totalTime: number;
  started: boolean;
  size?: number;
  breathScale?: Animated.Value;
  phaseLabel?: string;
  patternLabel?: string;
}

export function TimerCircle({
  timeLeft,
  totalTime,
  started,
  size = 240,
  breathScale,
  phaseLabel,
  patternLabel,
}: TimerCircleProps) {
  const colors = useColors();

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  const offsetAnim = useRef(new Animated.Value(0)).current;
  const sweepRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (started && !hasStarted.current) {
      hasStarted.current = true;
      if (sweepRef.current) sweepRef.current.stop();
      sweepRef.current = Animated.timing(offsetAnim, {
        toValue: circumference,
        duration: totalTime * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      sweepRef.current.start();
    }
    if (!started) {
      hasStarted.current = false;
      if (sweepRef.current) sweepRef.current.stop();
      offsetAnim.setValue(0);
    }
  }, [started, totalTime, circumference, offsetAnim]);

  // Gentle idle pulse — only used when no breathing pattern is driving the ring.
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (breathScale) return; // driven externally
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, breathScale]);

  // Use externally-driven breath scale if provided, else idle pulse.
  const ringScale = breathScale ?? pulseAnim;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const innerLabel = phaseLabel ? phaseLabel.toUpperCase() : "breathe";

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ scale: ringScale }] }]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={4}
            fill="transparent"
          />
          <G transform={`translate(${size}, 0) scale(-1, 1)`}>
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={6}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offsetAnim}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </G>
        </Svg>
      </Animated.View>

      <View style={[styles.inner, { width: size, height: size }]}>
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
            {innerLabel}
          </Text>
        </View>
      </View>

      {patternLabel ? (
        <View style={styles.patternRow}>
          <Text style={[styles.patternText, { color: colors.mutedForeground + "77" }]}>
            {patternLabel}
          </Text>
        </View>
      ) : null}
    </View>
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
  patternRow: {
    position: "absolute",
    bottom: -28,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  patternText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    textAlign: "center",
  },
});
