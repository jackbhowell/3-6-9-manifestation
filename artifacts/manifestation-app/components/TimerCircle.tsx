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
}

export function TimerCircle({
  timeLeft,
  totalTime,
  started,
  size = 240,
}: TimerCircleProps) {
  const colors = useColors();

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  // Single continuous sweep — one animation over the full duration.
  // useNativeDriver: false is required for SVG strokeDashoffset.
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

  // Slow breathing pulse — native driver so it runs on the UI thread
  // independently of the SVG animation.
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.055,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
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
    <View style={{ width: size, height: size }}>
      {/* Pulse wrapper — native driver, isolated from the SVG layer */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseAnim }] }]}
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
          {/* Horizontal flip makes the ring drain clockwise */}
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
            breathe
          </Text>
        </View>
      </View>
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
});
