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
  ALL_MANIFEST_SPARKS,
  ALL_SPARKS,
  MANIFEST_CATEGORIES,
} from "@/constants/affirmations";
import { useColors } from "@/hooks/useColors";

const SHAKE_THRESHOLD = 1.8;
const SHAKE_COOLDOWN_MS = 1200;

type LibraryMode = "affirmation" | "manifest";

function randomFrom(pool: string[], current: string): string {
  const filtered = pool.filter((s) => s !== current);
  if (filtered.length === 0) return pool[0];
  return filtered[Math.floor(Math.random() * filtered.length)];
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
  const [displayedSpark, setDisplayedSpark] = useState(spark);
  const wasRevealedRef = useRef(false);

  useEffect(() => {
    const wasRevealed = wasRevealedRef.current;
    wasRevealedRef.current = revealed;

    if (!revealed) {
      opacityAnim.setValue(0);
      setDisplayedSpark(spark);
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    if (!wasRevealed) {
      setDisplayedSpark(spark);
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setDisplayedSpark(spark);
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }
  }, [revealed, spark]);

  return (
    <View style={styles.ballSection}>
      <Pressable onPress={onShake} style={styles.ballPressable}>
        <Animated.View
          style={[
            styles.ballOuter,
            { transform: [{ scale: scaleAnim }], shadowColor: colors.tint },
          ]}
        >
          <LinearGradient
            colors={colors.crystalGradient}
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
                  {displayedSpark}
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

      <View style={styles.ballHintArea}>
        <Text style={[styles.shakeAgainHint, { color: colors.mutedForeground }]}>
          {revealed
            ? Platform.OS === "web"
              ? "Tap the ball for another spark"
              : "Shake again for another spark"
            : "Your crystal ball awaits"}
        </Text>
      </View>
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
                idx < category.items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
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

function ItemModal({
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
          style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.modalText, { color: colors.foreground }]}>
            "{text}"
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              onPress={handleCopy}
              style={[
                styles.modalBtn,
                {
                  backgroundColor: copied ? colors.success + "22" : colors.secondary,
                  borderColor: copied ? colors.success : colors.border,
                },
              ]}
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

  const [mode, setMode] = useState<LibraryMode>("affirmation");
  const [spark, setSpark] = useState(ALL_SPARKS[0]);
  const [revealed, setRevealed] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const lastShakeRef = useRef(0);

  const activePool = mode === "affirmation" ? ALL_SPARKS : ALL_MANIFEST_SPARKS;
  const activeCategories = mode === "affirmation" ? AFFIRMATION_CATEGORIES : MANIFEST_CATEGORIES;

  function handleModeChange(next: LibraryMode) {
    if (next === mode) return;
    setMode(next);
    setRevealed(false);
    setSpark(next === "affirmation" ? ALL_SPARKS[0] : ALL_MANIFEST_SPARKS[0]);
  }

  const triggerShake = useCallback(async () => {
    const now = Date.now();
    if (now - lastShakeRef.current < SHAKE_COOLDOWN_MS) return;
    lastShakeRef.current = now;

    const pool = mode === "affirmation" ? ALL_SPARKS : ALL_MANIFEST_SPARKS;
    const newSpark = randomFrom(pool, spark);
    setSpark(newSpark);
    setRevealed(true);

    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  }, [spark, mode]);

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
      <GradientBackground>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 80 : 20),
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 160),
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

          <View style={[styles.modeToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            {(["affirmation", "manifest"] as LibraryMode[]).map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => handleModeChange(m)}
                  style={[
                    styles.modePill,
                    active
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: "transparent" },
                  ]}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      { color: active ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {m === "affirmation" ? "Affirmation" : "Manifest"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {mode === "affirmation" ? "Affirmation Library" : "Manifest Library"}
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              {mode === "affirmation"
                ? "Tap a category to explore. Tap any line for the full view."
                : "Browse short intentions to manifest. Tap any for the full view."}
            </Text>
          </View>

          <View style={styles.categories}>
            {activeCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSelectItem={(text) => setSelectedItem(text)}
              />
            ))}
          </View>
        </ScrollView>

        <ItemModal
          text={selectedItem ?? ""}
          visible={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
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
    gap: 0,
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
    fontSize: 15,
    fontFamily: "DancingScript_700Bold",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.2,
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
  ballHintArea: {
    marginTop: 20,
    minHeight: 20,
    alignItems: "center",
  },
  shakeAgainHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modePill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  modePillText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
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
