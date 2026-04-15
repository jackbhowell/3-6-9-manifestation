import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { TimerCircle } from "@/components/TimerCircle";
import { useColors } from "@/hooks/useColors";

const TOTAL_SECONDS = 60;

async function playChime() {
}

export default function ReflectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useLocalSearchParams<{ session: string }>();

  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleComplete = useCallback(async () => {
    setIsComplete(true);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await playChime();
  }, []);

  useEffect(() => {
    if (!started) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, handleComplete]);

  function startTimer() {
    setStarted(true);
  }

  function handleDone() {
    router.replace("/(tabs)");
  }

  const sessionLabels: Record<string, string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
  };
  const sessionLabel = sessionLabels[session ?? ""] ?? "Session";

  const sessionMessages: Record<string, string> = {
    morning: "Let the energy settle. Breathe and receive.",
    afternoon: "Feel the alignment. Your words are taking shape.",
    evening: "Release the day. Your intention is heard.",
  };
  const message = sessionMessages[session ?? ""] ?? "Breathe and be present.";

  return (
    <GradientBackground
      colors={["#06030F", "#120A2B", "#0B0B24"]}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.sessionBadge, { color: colors.mutedForeground }]}>
            {sessionLabel.toUpperCase()} · REFLECTION
          </Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            {isComplete ? "Well done" : started ? "Breathe" : "Ready?"}
          </Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            {isComplete ? "Your session is complete." : message}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <TimerCircle timeLeft={timeLeft} totalTime={TOTAL_SECONDS} size={240} />
        </View>

        <View style={styles.footer}>
          {!started && !isComplete && (
            <Pressable
              onPress={startTimer}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                Start Timer
              </Text>
            </Pressable>
          )}

          {started && !isComplete && (
            <View style={styles.timerHint}>
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                Sit quietly until the timer ends
              </Text>
            </View>
          )}

          {isComplete && (
            <View style={styles.completeActions}>
              <View
                style={[
                  styles.completeBadge,
                  { backgroundColor: colors.secondary, borderColor: colors.primary },
                ]}
              >
                <Feather name="check-circle" size={24} color={colors.primary} />
                <Text style={[styles.completeBadgeText, { color: colors.primary }]}>
                  Session Complete
                </Text>
              </View>
              <Pressable
                onPress={handleDone}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Back to Home
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  sessionBadge: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    marginBottom: 4,
  },
  heading: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  footer: {
    width: "100%",
    gap: 16,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  timerHint: {
    alignItems: "center",
  },
  hintText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  completeActions: {
    width: "100%",
    gap: 16,
    alignItems: "center",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  completeBadgeText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
