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
const heartbeatSource = require("@/assets/sounds/heartbeat.wav");

// ─── Heartbeat synthesizer (web only) ─────────────────────────────────────────
// Slow meditative heartbeat (~52 bpm) using Web Audio API.
// Each beat is a lub-dub pair: two short sine+harmonic pulses shaped with a
// fast attack and exponential decay so they thump clearly on laptop speakers.
// On native platforms, expo-audio plays the pre-generated heartbeat.wav instead.
function createHeartbeatScheduler(ctx: AudioContext) {
  const bpm = 52;
  const period = 60 / bpm; // ~1.15 s per beat
  const scheduleAhead = 0.4;
  const tickInterval = 100;

  let nextBeatTime = ctx.currentTime + 0.05;
  let stopped = false;

  // Build a shared master gain so we can fade in gently
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
  masterGain.connect(ctx.destination);

  function pulse(t: number, freq: number, gain: number, decay: number) {
    // Fundamental
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + decay + 0.01);

    // Octave harmonic — adds body audible on small speakers
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(gain * 0.45, t + 0.008);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.7);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(t);
    osc2.stop(t + decay);
  }

  function scheduleBeat(t: number) {
    pulse(t,          120, 0.32, 0.22); // lub — louder
    pulse(t + 0.24,   100, 0.22, 0.20); // dub — slightly softer, 240ms later
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
  // Native heartbeat player — always created so hook rules are satisfied,
  // but only used when Platform.OS !== 'web'
  const heartbeatPlayer = useAudioPlayer(heartbeatSource);
  const heartbeatCtxRef = useRef<AudioContext | null>(null);
  const stopHeartbeatRef = useRef<(() => void) | null>(null);

  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tear down heartbeat when component unmounts
  useEffect(() => {
    return () => {
      if (Platform.OS !== "web") {
        try {
          heartbeatPlayer.pause();
          heartbeatPlayer.loop = false;
          heartbeatPlayer.seekTo(0);
        } catch {}
      } else {
        stopHeartbeatRef.current?.();
        heartbeatCtxRef.current?.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (Platform.OS !== "web") {
      try {
        heartbeatPlayer.pause();
        heartbeatPlayer.loop = false;
        heartbeatPlayer.seekTo(0);
      } catch {}
    } else {
      stopHeartbeatRef.current?.();
      heartbeatCtxRef.current?.close().catch(() => {});
      heartbeatCtxRef.current = null;
    }
  }, [heartbeatPlayer]);

  const handleComplete = useCallback(async () => {
    stopHeartbeat();

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
  }, [player, stopHeartbeat]);

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
    if (Platform.OS !== "web") {
      // Native: use expo-audio to loop the pre-generated heartbeat file
      try {
        heartbeatPlayer.loop = true;
        heartbeatPlayer.seekTo(0);
        heartbeatPlayer.play();
      } catch {
        // Audio not supported — silently skip
      }
    } else {
      // Web: synthesize via Web Audio API
      try {
        if (typeof window !== "undefined") {
          const win = window as unknown as Record<string, unknown>;
          const AudioCtxCtor = (win.AudioContext ?? win.webkitAudioContext) as
            | (new () => AudioContext)
            | undefined;
          if (AudioCtxCtor) {
            const ctx = new AudioCtxCtor();
            // Chrome may suspend AudioContext even after user gesture — resume it
            if (ctx.state === "suspended") {
              ctx.resume().catch(() => {});
            }
            heartbeatCtxRef.current = ctx;
            stopHeartbeatRef.current = createHeartbeatScheduler(ctx);
          }
        }
      } catch {
        // Audio not supported — silently skip
      }
    }
    setStarted(true);
  }

  function handleDone() {
    stopHeartbeat();
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
