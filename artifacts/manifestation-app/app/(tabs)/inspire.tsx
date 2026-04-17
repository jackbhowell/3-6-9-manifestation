import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { PremiumGate } from "@/components/PremiumGate";
import {
  AFFIRMATION_CATEGORIES,
  AffirmationCategory,
  ALL_SPARKS,
} from "@/constants/affirmations";
import { useColors } from "@/hooks/useColors";

const SHAKE_THRESHOLD = 1.8;
const SHAKE_COOLDOWN_MS = 1200;

function randomSpark(current: string): string {
  const pool = ALL_SPARKS.filter((s) => s !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

function CrystalBall({
  onShake,
  spark,
  revealed,
}: {
  onShake: () => void;
  spark: string;
  revealed: boolean;
}) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (revealed) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0.92, duration: 120, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
    }
  }, [revealed, spark]);

  return (
    <View style={styles.ballSection}>
      <Pressable onPress={onShake} style={styles.ballPressable}>
        <Animated.View style={[styles.ballOuter, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={["#3B1F6E", "#6D28D9", "#A78BFA", "#C4B5FD"]}
            style={styles.ballGradient}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          >
            <View style={styles.ballInner}>
              <LinearGradient
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.05)"]}
                style={styles.ballShine}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {revealed ? (
                <Animated.Text
                  style={[styles.sparkText, { color: "#fff", opacity: opacityAnim }]}
                  numberOfLines={4}
                >
                  {spark}
                </Animated.Text>
              ) : (
                <View style={styles.ballIdle}>
                  <Text style={styles.ballEmoji}>✦</Text>
                  <Text style={[styles.ballHint, { color: "rgba(255,255,255,0.7)" }]}>
                    {Platform.OS === "web" ? "Tap to reveal" : "Shake or tap"}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
        <View style={[styles.ballGlow, { backgroundColor: colors.primary + "28" }]} />
        <View style={[styles.ballBase, { backgroundColor: colors.card, borderColor: colors.border }]} />
      </Pressable>

      {revealed && (
        <Text style={[styles.shakeAgainHint, { color: colors.mutedForeground }]}>
          {Platform.OS === "web" ? "Tap the ball for another spark" : "Shake again for another spark"}
        </Text>
      )}
      {!revealed && (
        <Text style={[styles.shakeAgainHint, { color: colors.mutedForeground }]}>
          Your crystal ball awaits
        </Text>
      )}
    </View>
  );
}

function CategoryCard({
  category,
  onSelectItem,
}: {
  category: AffirmationCategory;
  onSelectItem: (text: string) => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.catHeader}
      >
        <View style={[styles.catIconWrap, { backgroundColor: category.color + "22" }]}>
          <Feather
            name={category.icon as React.ComponentProps<typeof Feather>["name"]}
            size={18}
            color={category.color}
          />
        </View>
        <Text style={[styles.catLabel, { color: colors.foreground }]}>
          {category.label}
        </Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </Pressable>

      {expanded && (
        <View style={[styles.catItems, { borderTopColor: colors.border }]}>
          {category.items.map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => onSelectItem(item)}
              style={[
                styles.catItem,
                idx < category.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.catItemText, { color: colors.mutedForeground }]}>
                {item}
              </Text>
              <Feather name="chevron-right" size={14} color={category.color} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function AffirmationModal({
  text,
  visible,
  onClose,
}: {
  text: string;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.modalText, { color: colors.foreground }]}>
            "{text}"
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              onPress={handleCopy}
              style={[styles.modalBtn, { backgroundColor: copied ? colors.success + "22" : colors.secondary, borderColor: copied ? colors.success : colors.border }]}
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={16}
                color={copied ? colors.success : colors.foreground}
              />
              <Text style={[styles.modalBtnText, { color: copied ? colors.success : colors.foreground }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={[styles.modalBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
              <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>
                Dismiss
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function InspireScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [spark, setSpark] = useState(ALL_SPARKS[0]);
  const [revealed, setRevealed] = useState(false);
  const [selectedAffirmation, setSelectedAffirmation] = useState<string | null>(null);
  const lastShakeRef = useRef(0);

  const triggerShake = useCallback(async () => {
    const now = Date.now();
    if (now - lastShakeRef.current < SHAKE_COOLDOWN_MS) return;
    lastShakeRef.current = now;

    const newSpark = randomSpark(spark);
    setSpark(newSpark);
    setRevealed(true);

    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  }, [spark]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    Accelerometer.setUpdateInterval(100);
    let lastMag = 0;
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(mag - lastMag);
      lastMag = mag;
      if (delta > SHAKE_THRESHOLD) {
        triggerShake();
      }
    });

    return () => sub.remove();
  }, [triggerShake]);

  return (
    <PremiumGate>
      <GradientBackground colors={["#06030F", "#120A2B", "#0B0B24"]}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 80 : 20),
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 48 : 100),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              INSPIRE
            </Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Your Spark Space
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Browse ideas across life areas, or let the crystal ball surprise you.
            </Text>
          </View>

          <CrystalBall
            onShake={triggerShake}
            spark={spark}
            revealed={revealed}
          />

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Affirmation Library
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Tap a category to explore. Tap any line for the full view.
            </Text>
          </View>

          <View style={styles.categories}>
            {AFFIRMATION_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSelectItem={(text) => setSelectedAffirmation(text)}
              />
            ))}
          </View>
        </ScrollView>

        <AffirmationModal
          text={selectedAffirmation ?? ""}
          visible={selectedAffirmation !== null}
          onClose={() => setSelectedAffirmation(null)}
        />
      </GradientBackground>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 24,
  },
  headerRow: {
    gap: 6,
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  heading: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },
  ballSection: {
    alignItems: "center",
    gap: 14,
  },
  ballPressable: {
    alignItems: "center",
  },
  ballOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  ballGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ballInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  ballShine: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.6,
  },
  ballIdle: {
    alignItems: "center",
    gap: 8,
  },
  ballEmoji: {
    fontSize: 32,
    color: "rgba(255,255,255,0.85)",
  },
  ballHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  sparkText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  ballGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    zIndex: -1,
  },
  ballBase: {
    width: 60,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
    opacity: 0.5,
  },
  shakeAgainHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  categories: {
    gap: 10,
  },
  catCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  catItems: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  catItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 10,
  },
  catItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    gap: 24,
  },
  modalText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 28,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
