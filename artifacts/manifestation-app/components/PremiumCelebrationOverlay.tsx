import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApp } from "@/context/AppContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const NUM_PARTICLES = 18;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const PARTICLE_DATA = Array.from({ length: NUM_PARTICLES }, (_, i) => ({
  id: i,
  startX: randomBetween(0.05, 0.95) * SCREEN_W,
  startY: randomBetween(0.55, 0.95) * SCREEN_H,
  endY: randomBetween(-0.1, 0.3) * SCREEN_H,
  driftX: randomBetween(-60, 60),
  delay: randomBetween(0, 600),
  size: randomBetween(8, 18),
  opacity: randomBetween(0.5, 1),
  color: ["#A78BFA", "#F472B6", "#FCD34D", "#C4B5FD", "#FB7185", "#FBBF24"][
    Math.floor(Math.random() * 6)
  ],
}));

function Particle({
  data,
  trigger,
}: {
  data: (typeof PARTICLE_DATA)[0];
  trigger: boolean;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!trigger) return;
    translateY.setValue(0);
    translateX.setValue(0);
    opacity.setValue(0);
    scale.setValue(0.4);

    const duration = randomBetween(1400, 2400);
    Animated.sequence([
      Animated.delay(data.delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: data.opacity,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: data.endY - data.startY,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: data.driftX,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: data.startX,
          top: data.startY,
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: data.color,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

export function PremiumCelebrationOverlay() {
  const { justUnlocked, clearJustUnlocked } = useApp();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(1)).current;
  const orbGlowOpacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animating = useRef(false);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const stopPulse = useCallback(() => {
    if (pulseLoop.current) {
      pulseLoop.current.stop();
      pulseLoop.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    if (animating.current) return;
    animating.current = true;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    stopPulse();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animating.current = false;
      clearJustUnlocked();
    });
  }, [clearJustUnlocked, backdropOpacity, cardOpacity, cardScale, stopPulse]);

  useEffect(() => {
    if (!justUnlocked) return;

    backdropOpacity.setValue(0);
    cardScale.setValue(0.7);
    cardOpacity.setValue(0);
    orbPulse.setValue(1);
    orbGlowOpacity.setValue(0);
    animating.current = false;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1.12,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.current = loop;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(orbGlowOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        loop,
      ]),
    ]).start();

    dismissTimer.current = setTimeout(() => {
      dismiss();
    }, 3500);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      stopPulse();
    };
  }, [justUnlocked]);

  if (!justUnlocked) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </Pressable>

      {PARTICLE_DATA.map((p) => (
        <Particle key={p.id} data={p} trigger={justUnlocked} />
      ))}

      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#1A0533", "#0D0B24", "#0B0324"]}
          style={styles.card}
        >
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.orbGlow,
                { opacity: orbGlowOpacity, transform: [{ scale: orbPulse }] },
              ]}
            />
            <Animated.View style={{ transform: [{ scale: orbPulse }] }}>
              <LinearGradient
                colors={["#7C3AED", "#A78BFA", "#C4B5FD"]}
                style={styles.orb}
              >
                <Feather name="star" size={38} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.eyebrow}>PREMIUM UNLOCKED</Text>
          <Text style={styles.headline}>You're now Inspire!</Text>
          <Text style={styles.subtext}>
            A sacred space for affirmation sparks, manifestation prompts, and
            your personal crystal ball moment — all yours now.
          </Text>

          <View style={styles.perksRow}>
            {(["zap", "book-open", "droplet"] as const).map((icon, i) => (
              <View key={i} style={styles.perkPill}>
                <Feather name={icon} size={13} color="#A78BFA" />
              </View>
            ))}
          </View>

          <Text style={styles.tapHint}>Tap anywhere to continue</Text>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const CARD_WIDTH = Math.min(SCREEN_W - 48, 360);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 2, 14, 0.88)",
  },
  particle: {
    position: "absolute",
  },
  cardWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#7C3AED44",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  orbContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  orbGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7C3AED",
    opacity: 0.25,
  },
  orb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    color: "#A78BFA",
    marginTop: 4,
  },
  headline: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#F5F3FF",
    textAlign: "center",
    marginTop: -4,
  },
  subtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#A19DC8",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  perksRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  perkPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED22",
    borderWidth: 1,
    borderColor: "#7C3AED55",
    alignItems: "center",
    justifyContent: "center",
  },
  tapHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B648A",
    marginTop: 8,
  },
});
