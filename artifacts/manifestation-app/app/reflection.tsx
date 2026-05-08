import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { TimerCircle } from "@/components/TimerCircle";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { BreathingType, CompletionSound, NatureSound } from "@/utils/storage";

const soundSources: Record<CompletionSound, number> = {
  chime:          require("@/assets/sounds/chime.wav"),
  bell:           require("@/assets/sounds/bell.wav"),
  "singing-bowl": require("@/assets/sounds/singing-bowl.wav"),
};

const NATURE_SOUNDS: Record<Exclude<NatureSound, "none">, number> = {
  rain:          require("@/assets/sounds/rain.wav"),
  ocean:         require("@/assets/sounds/ocean.wav"),
  forest:        require("@/assets/sounds/forest.wav"),
  wind:          require("@/assets/sounds/wind.wav"),
  "singing-bowl": require("@/assets/sounds/singing-bowl.wav"),
};

const TICK_SOUND = require("@/assets/sounds/ting.wav");

interface BreathPhase {
  label: string;
  duration: number;
  targetScale: number;
}

// Scale values tuned for the outer TimerCircle ring (240px)
const BREATHING_PATTERNS: Record<Exclude<BreathingType, "none">, BreathPhase[]> = {
  "4-4-4-4": [
    { label: "Inhale",  duration: 4, targetScale: 1.07 },
    { label: "Hold",    duration: 4, targetScale: 1.07 },
    { label: "Exhale",  duration: 4, targetScale: 0.93 },
    { label: "Hold",    duration: 4, targetScale: 0.93 },
  ],
  "4-7-8": [
    { label: "Inhale",  duration: 4, targetScale: 1.07 },
    { label: "Hold",    duration: 7, targetScale: 1.07 },
    { label: "Exhale",  duration: 8, targetScale: 0.93 },
  ],
  calm: [
    { label: "Inhale",  duration: 4, targetScale: 1.07 },
    { label: "Exhale",  duration: 6, targetScale: 0.93 },
  ],
};

const PATTERN_LABELS: Record<Exclude<BreathingType, "none">, string> = {
  "4-4-4-4": "Box  4 · 4 · 4 · 4",
  "4-7-8":   "4 · 7 · 8",
  calm:      "Calm  4 · 6",
};

export default function ReflectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useLocalSearchParams<{ session: string }>();
  const { settings, isPremium } = useApp();

  const soundKey: CompletionSound = settings?.completionSound ?? "chime";
  const player = useAudioPlayer(soundSources[soundKey]);

  const breathingType: BreathingType = settings?.breathingType ?? "none";
  const natureSoundKey: NatureSound = settings?.natureSound ?? "none";

  const [totalSeconds, setTotalSeconds] = useState<number>(settings?.reflectionDuration ?? 60);
  const [timeLeft, setTimeLeft] = useState<number>(settings?.reflectionDuration ?? 60);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const natureSoundRef = useRef<Audio.Sound | null>(null);

  // Breathing animation — drives the outer ring of TimerCircle
  const breathScaleAnim = useRef(new Animated.Value(1)).current;
  const [currentPhaseLabel, setCurrentPhaseLabel] = useState("");
  const breathCancelledRef = useRef(false);
  const breathPhaseIndexRef = useRef(0);

  // Tick sound — preloaded once
  const tickSoundRef = useRef<Audio.Sound | null>(null);
  useEffect(() => {
    let s: Audio.Sound;
    Audio.Sound.createAsync(TICK_SOUND, { volume: 0.25 })
      .then(({ sound }) => { s = sound; tickSoundRef.current = sound; })
      .catch(() => {});
    return () => { s?.unloadAsync().catch(() => {}); };
  }, []);

  async function playTick() {
    try {
      const s = tickSoundRef.current;
      if (s) {
        await s.setPositionAsync(0);
        await s.playAsync();
      }
    } catch {}
  }

  // Sync duration from settings before timer starts
  useEffect(() => {
    const dur = settings?.reflectionDuration ?? 60;
    if (!startedRef.current) {
      setTotalSeconds(dur);
      setTimeLeft(dur);
    }
  }, [settings?.reflectionDuration]);

  // Nature sound — seamless loop via position monitoring
  useEffect(() => {
    if (!isPremium || natureSoundKey === "none" || !started || isComplete) return;

    const source = NATURE_SOUNDS[natureSoundKey as Exclude<NatureSound, "none">];
    if (!source) return;

    let mounted = true;
    let soundObj: Audio.Sound | null = null;
    let seeking = false;

    async function loadNatureSound() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          source,
          { shouldPlay: true, isLooping: false, volume: 0.3 }
        );
        if (!mounted) { await sound.unloadAsync(); return; }
        soundObj = sound;
        natureSoundRef.current = sound;

        // Seamless loop: seek to 0 when within 200 ms of the end
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (!mounted || !status.isLoaded || seeking) return;
          const dur = (status as any).durationMillis as number | undefined ?? 0;
          const pos = (status as any).positionMillis as number | undefined ?? 0;
          if (dur > 0 && pos >= dur - 200) {
            seeking = true;
            try { await sound.setPositionAsync(0); } catch {}
            seeking = false;
          }
          if ((status as any).didJustFinish) {
            try {
              await sound.setPositionAsync(0);
              await sound.playAsync();
            } catch {}
          }
        });
      } catch {}
    }

    loadNatureSound();

    return () => {
      mounted = false;
      soundObj?.unloadAsync();
      natureSoundRef.current = null;
    };
  }, [isPremium, natureSoundKey, started, isComplete]);

  // Breathing state machine — drives outer ring + phase label + tick
  const showBreathing = isPremium && breathingType !== "none";

  useEffect(() => {
    if (!showBreathing || !started || isComplete) {
      breathCancelledRef.current = true;
      breathScaleAnim.stopAnimation();
      breathScaleAnim.setValue(1);
      setCurrentPhaseLabel("");
      return;
    }

    breathCancelledRef.current = false;
    breathPhaseIndexRef.current = 0;
    const phases = BREATHING_PATTERNS[breathingType as Exclude<BreathingType, "none">];

    function runPhase() {
      if (breathCancelledRef.current) return;
      const idx = breathPhaseIndexRef.current;
      const phase = phases[idx];
      if (!phase) return;

      setCurrentPhaseLabel(phase.label);
      playTick();
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      Animated.timing(breathScaleAnim, {
        toValue: phase.targetScale,
        duration: phase.duration * 1000,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || breathCancelledRef.current) return;
        breathPhaseIndexRef.current = (idx + 1) % phases.length;
        runPhase();
      });
    }

    runPhase();

    return () => {
      breathCancelledRef.current = true;
      breathScaleAnim.stopAnimation();
    };
  }, [showBreathing, started, isComplete, breathingType]);

  const handleComplete = useCallback(async () => {
    setIsComplete(true);
    try {
      await natureSoundRef.current?.stopAsync();
      await natureSoundRef.current?.unloadAsync();
      natureSoundRef.current = null;
    } catch {}
    try {
      player.seekTo(0);
      player.play();
    } catch {}
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
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
    startedRef.current = true;
    setStarted(true);
  }

  async function handleDone() {
    try {
      await natureSoundRef.current?.stopAsync();
      await natureSoundRef.current?.unloadAsync();
    } catch {}
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
    <GradientBackground colors={["#06030F", "#120A2B", "#0B0B24"]}>
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
            totalTime={totalSeconds}
            started={started}
            size={240}
            breathScale={showBreathing && started && !isComplete ? breathScaleAnim : undefined}
            phaseLabel={showBreathing && started && !isComplete ? currentPhaseLabel : undefined}
            patternLabel={showBreathing ? PATTERN_LABELS[breathingType as Exclude<BreathingType, "none">] : undefined}
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
              <Pressable onPress={handleDone} style={styles.skipBtn}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                  Skip reflection
                </Text>
              </Pressable>
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
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
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
    gap: 16,
  },
  hintText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  skipBtn: {
    opacity: 0.35,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
