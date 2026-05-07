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

const NATURE_SOUND_URIS: Record<Exclude<NatureSound, "none">, string> = {
  rain:   "https://cdn.pixabay.com/audio/2022/05/13/audio_257c68e83e.mp3",
  ocean:  "https://cdn.pixabay.com/audio/2022/03/15/audio_3e4e45440d.mp3",
  forest: "https://cdn.pixabay.com/audio/2024/03/15/audio_0b5d4a6e9e.mp3",
  wind:   "https://cdn.pixabay.com/audio/2022/12/04/audio_5c0f29db25.mp3",
};

interface BreathPhase {
  label: string;
  duration: number;
  targetScale: number;
}

const BREATHING_PATTERNS: Record<Exclude<BreathingType, "none">, BreathPhase[]> = {
  "4-4-4-4": [
    { label: "Inhale",  duration: 4, targetScale: 1.28 },
    { label: "Hold",    duration: 4, targetScale: 1.28 },
    { label: "Exhale",  duration: 4, targetScale: 0.72 },
    { label: "Hold",    duration: 4, targetScale: 0.72 },
  ],
  "4-7-8": [
    { label: "Inhale",  duration: 4, targetScale: 1.28 },
    { label: "Hold",    duration: 7, targetScale: 1.28 },
    { label: "Exhale",  duration: 8, targetScale: 0.72 },
  ],
  calm: [
    { label: "Inhale",  duration: 4, targetScale: 1.28 },
    { label: "Exhale",  duration: 6, targetScale: 0.72 },
  ],
};

function BreathingGuide({
  breathingType,
  active,
}: {
  breathingType: Exclude<BreathingType, "none">;
  active: boolean;
}) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phaseIndexRef = useRef(0);
  const cancelledRef = useRef(false);

  const phases = BREATHING_PATTERNS[breathingType];

  useEffect(() => {
    cancelledRef.current = false;
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    function runPhase() {
      if (cancelledRef.current) return;
      const idx = phaseIndexRef.current;
      const phase = phases[idx];
      if (!phase) return;

      Animated.timing(scaleAnim, {
        toValue: phase.targetScale,
        duration: phase.duration * 1000,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelledRef.current) return;
        const next = (idx + 1) % phases.length;
        phaseIndexRef.current = next;
        setPhaseIndex(next);
        runPhase();
      });
    }

    runPhase();

    return () => {
      cancelledRef.current = true;
      scaleAnim.stopAnimation();
    };
  }, [active, breathingType]);

  if (!active) return null;

  const currentPhase = phases[phaseIndex];

  return (
    <Animated.View style={[breathStyles.container, { opacity: opacityAnim }]}>
      <View style={breathStyles.circleWrap}>
        <Animated.View
          style={[
            breathStyles.circle,
            {
              borderColor: colors.primary + "60",
              backgroundColor: colors.primary + "0C",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
      </View>
      <Text style={[breathStyles.phaseLabel, { color: colors.mutedForeground }]}>
        {currentPhase ? currentPhase.label : ""}
      </Text>
    </Animated.View>
  );
}

const breathStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
  },
  circleWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
  },
  phaseLabel: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2.5,
  },
});

export default function ReflectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useLocalSearchParams<{ session: string }>();
  const { settings, isPremium } = useApp();

  const soundKey: CompletionSound = settings?.completionSound ?? "chime";
  const player = useAudioPlayer(soundSources[soundKey]);

  const totalSeconds = settings?.reflectionDuration ?? 60;
  const breathingType: BreathingType = settings?.breathingType ?? "none";
  const natureSoundKey: NatureSound = settings?.natureSound ?? "none";

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const natureSoundRef = useRef<Audio.Sound | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && settings?.reflectionDuration) {
      initializedRef.current = true;
      setTimeLeft(settings.reflectionDuration);
    }
  }, [settings?.reflectionDuration]);

  useEffect(() => {
    if (!isPremium || natureSoundKey === "none" || !started || isComplete) return;

    const uri = NATURE_SOUND_URIS[natureSoundKey as Exclude<NatureSound, "none">];
    if (!uri) return;

    let mounted = true;
    let soundObj: Audio.Sound | null = null;

    async function loadNatureSound() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, isLooping: true, volume: 0.3 }
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundObj = sound;
        natureSoundRef.current = sound;
      } catch {
        // Sound unavailable — silently ignore
      }
    }

    loadNatureSound();

    return () => {
      mounted = false;
      soundObj?.unloadAsync();
      natureSoundRef.current = null;
    };
  }, [isPremium, natureSoundKey, started, isComplete]);

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

  const showBreathing = isPremium && breathingType !== "none";

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
          />
          {showBreathing && (
            <BreathingGuide
              breathingType={breathingType as Exclude<BreathingType, "none">}
              active={started && !isComplete}
            />
          )}
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
