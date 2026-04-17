import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const PERKS = [
  { icon: "zap" as const, text: "Crystal ball shake for instant affirmation sparks" },
  { icon: "book-open" as const, text: "Curated affirmation library across 5 life areas" },
  { icon: "droplet" as const, text: "Premium colour themes (Rose Gold, Forest & more)" },
];

interface PremiumGateProps {
  children: React.ReactNode;
}

export function PremiumGate({ children }: PremiumGateProps) {
  const { isPremium, unlockPremium } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (isPremium) return <>{children}</>;

  return (
    <LinearGradient
      colors={["#06030F", "#120A2B", "#0B0B24"]}
      style={StyleSheet.absoluteFill}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orbWrap}>
          <LinearGradient
            colors={["#7C3AED", "#A78BFA", "#C4B5FD"]}
            style={styles.orb}
          >
            <Feather name="star" size={40} color="#fff" />
          </LinearGradient>
          <View style={[styles.orbGlow, { backgroundColor: colors.primary + "30" }]} />
        </View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          PREMIUM FEATURE
        </Text>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Unlock Inspire
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          A sacred space for affirmation ideas, manifestation prompts, and a
          crystal ball moment — all in one place.
        </Text>

        <View style={[styles.perksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {PERKS.map((p, i) => (
            <View
              key={i}
              style={[
                styles.perkRow,
                i < PERKS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.perkIconWrap, { backgroundColor: colors.primary + "22" }]}>
                <Feather name={p.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.perkText, { color: colors.foreground }]}>
                {p.text}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={unlockPremium}
          style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="unlock" size={18} color={colors.primaryForeground} />
          <Text style={[styles.unlockBtnText, { color: colors.primaryForeground }]}>
            Unlock Inspire — £2.99
          </Text>
        </Pressable>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          One-time purchase · No subscription
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 20,
  },
  orbWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  orbGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  headline: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: -4,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 300,
  },
  perksCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  perkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    marginTop: 4,
    elevation: 4,
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  unlockBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
});
