import { Feather } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
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

const chimeSource = require("@/assets/sounds/chime.wav");

// ─── Heartbeat synthesizer ────────────────────────────────────────────────────
// Slow meditative heartbeat (~52 bpm) using Web Audio API.
// Two low sine pulses per beat (lub-dub), very quiet so it sits far back.
function createHeartbeatScheduler(ctx: AudioContext) {
  const bpm = 52;
  const period = 60 / bpm; // ~1.15 s per beat
  const scheduleAhead = 0.3; // look-ahead window in seconds
  const tickInterval = 120; // ms between scheduler ticks

  let nextBeatTime = ctx.currentTime + 0.1;
  let stopped = false;

  function scheduleBeat(t: number) {
    // lub — louder, slightly higher
    const lub = ctx.createOscillator();
    const lubGain = ctx.createGain();
    lub.type = "sine";
    lub.frequency.value = 72;
    lubGain.gain.setValueAtTime(0, t);
    lubGain.gain.linearRampToValueAtTime(0.065, t + 0.005);
    lubGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    lub.connect(lubGain);
    lubGain.connect(ctx.destination);
    lub.start(t);
    lub.stop(t + 0.2);

    // dub — softer, 220 ms after lub
    const dub = ctx.createOscillator();
    const dubGain = ctx.createGain();
    dub.type = "sine";
    dub.frequency.value = 60;
    dubGain.gain.setValueAtTime(0, t + 0.22);
    dubGain.gain.linearRampToValueAtTime(0.045, t + 0.225);
    dubGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    dub.connect(dubGain);
    dubGain.connect(ctx.destination);
    dub.start(t + 0.22);
    dub.stop(t + 0.4);
  }

  function tick() {
    if (stopped) return;
    while (nextBeatTime < ctx.currentTime + scheduleAhead) {
      scheduleBeat(nextBeatTime);
      nextBeatTime += period;
    }
    setTimeout(tick, tickInterval);
  }

  tick();
  return () => { stopped = true; };
}

export default function ReflectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useLocalSearchParams<{ session: string }>();

  const player = useAudioPlayer(chimeSource);
  const heartbeatCtxRef = useRef<AudioContext | null>(null);
  const stopHeartbeatRef = useRef<(() => void) | null>(null);

  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tear down heartbeat when component unmounts
  useEffect(() => {
    return () => {
      stopHeartbeatRef.current?.();
      heartbeatCtxRef.current?.close();
    };
  }, []);

  const handleComplete = useCallback(async () => {
    // Stop heartbeat
    stopHeartbeatRef.current?.();
    heartbeatCtxRef.current?.close().catch(() => {});
    heartbeatCtxRef.current = null;

    setIsComplete(true);

    // Play chime
    try {
      player.seekTo(0);
      player.play();
    } catch {
    }

    // Haptic on device
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
      }
    }
  }, [player]);

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
    // Start heartbeat
    try {
      if (typeof window !== "undefined") {
        const AudioCtx =
          (window as unknown as Record<string, unknown>).AudioContext as typeof AudioContext | undefined ??
          (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext | undefined;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          heartbeatCtxRef.current = ctx;
          stopHeartbeatRef.current = createHeartbeatScheduler(ctx);
        }
      }
    } catch {
    }
    setStarted(true);
  }

  function handleDone() {
    stopHeartbeatRef.current?.();
    heartbeatCtxRef.current?.close().catch(() => {});
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
          <TimerCircle
            timeLeft={timeLeft}
            totalTime={TOTAL_SECONDS}
            started={started}
            size={240}
          />
        </View>

        <View style={styles.footer}>
          {!started && !isComplete && (
            <View style={styles.preStartContent}>
              <Text style={[styles.eyesHint, { color: colors.mutedForeground }]}>
                Close your eyes once the timer begins
              </Text>
              <Pressable
                onPress={startTimer}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  Start Timer
                </Text>
              </Pressable>
            </View>
          )}

          {started && !isComplete && (
            <View style={styles.timerHint}>
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                Sit quietly, hold your intention in mind, and feel it as already real
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
  preStartContent: {
    width: "100%",
    gap: 14,
    alignItems: "center",
  },
  eyesHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.3,
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
