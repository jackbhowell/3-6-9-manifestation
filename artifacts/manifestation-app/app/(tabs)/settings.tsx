import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { TimePicker } from "@/components/TimePicker";
import { THEME_META, ThemeName } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { isUserCancelledError } from "@/lib/revenuecat";
import { useColors } from "@/hooks/useColors";
import { validateNotificationTimes } from "@/utils/notifications";
import {
  BreathingType,
  CompletionSound,
  NatureSound,
  ReflectionDuration,
} from "@/utils/storage";

const SOUND_OPTIONS: { key: CompletionSound; label: string; icon: string }[] = [
  { key: "chime",        label: "Chime",        icon: "triangle" },
  { key: "bell",         label: "Bell",          icon: "bell" },
  { key: "singing-bowl", label: "Singing Bowl",  icon: "disc" },
];

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

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const THEME_ORDER: ThemeName[] = [
  "indigo",
  "rose-gold",
  "forest",
  "celestial-gold",
  "silver",
  "white",
  "black",
  "blue",
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    settings,
    updateSettings,
    refreshProgress,
    isPremium,
    selectedTheme,
    setTheme,
    unlockPremium,
    restorePurchases,
    priceString,
    isPurchasing,
    isRestoring,
  } = useApp();
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [morning, setMorning] = useState(settings?.notificationTimes.morning ?? "08:00");
  const [afternoon, setAfternoon] = useState(settings?.notificationTimes.afternoon ?? "13:00");
  const [evening, setEvening] = useState(settings?.notificationTimes.evening ?? "21:00");
  const [notifsEnabled, setNotifsEnabled] = useState(
    settings?.notificationsEnabled !== false
  );
  const [completionSound, setCompletionSound] = useState<CompletionSound>(
    settings?.completionSound ?? "chime"
  );
  const [natureSound, setNatureSound] = useState<NatureSound>(
    settings?.natureSound ?? "none"
  );
  const [breathingType, setBreathingType] = useState<BreathingType>(
    settings?.breathingType ?? "none"
  );
  const [reflectionDuration, setReflectionDuration] = useState<ReflectionDuration>(
    settings?.reflectionDuration ?? 60
  );
  const [saving, setSaving] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [naturePreviewing, setNaturePreviewing] = useState<NatureSound | null>(null);

  const natureSoundRef = useRef<Audio.Sound | null>(null);

  const chimePlayer = useAudioPlayer(soundSources["chime"]);
  const bellPlayer = useAudioPlayer(soundSources["bell"]);
  const bowlPlayer = useAudioPlayer(soundSources["singing-bowl"]);
  const previewPlayers: Record<CompletionSound, ReturnType<typeof useAudioPlayer>> = {
    chime:          chimePlayer,
    bell:           bellPlayer,
    "singing-bowl": bowlPlayer,
  };

  useEffect(() => {
    if (settings) {
      setMorning(settings.notificationTimes.morning);
      setAfternoon(settings.notificationTimes.afternoon);
      setEvening(settings.notificationTimes.evening);
      setNotifsEnabled(settings.notificationsEnabled !== false);
      setCompletionSound(settings.completionSound ?? "chime");
    }
  }, [settings]);

  useEffect(() => {
    return () => {
      if (natureSoundRef.current) {
        natureSoundRef.current.stopAsync()
          .then(() => natureSoundRef.current?.unloadAsync())
          .catch(() => {});
      }
    };
  }, []);

  async function previewNatureSound(opt: NatureSound) {
    if (opt === "none") return;
    try {
      if (natureSoundRef.current) {
        await natureSoundRef.current.stopAsync();
        await natureSoundRef.current.unloadAsync();
        natureSoundRef.current = null;
      }
      setNaturePreviewing(opt);
      const { sound } = await Audio.Sound.createAsync(
        { uri: NATURE_SOUND_URIS[opt] },
        { shouldPlay: true, volume: 0.5 }
      );
      natureSoundRef.current = sound;
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
          if (natureSoundRef.current === sound) natureSoundRef.current = null;
        } catch {}
        setNaturePreviewing((prev) => (prev === opt ? null : prev));
      }, 4000);
    } catch {
      setNaturePreviewing(null);
    }
  }

  function handlePickSound(key: CompletionSound) {
    setCompletionSound(key);
    try {
      previewPlayers[key].seekTo(0);
      previewPlayers[key].play();
    } catch {
    }
  }

  async function handleSave() {
    if (!settings) return;
    const times = { morning, afternoon, evening };
    const errors = validateNotificationTimes(times);
    if (errors.length > 0) {
      setTimeError(errors.join(" "));
      return;
    }
    setTimeError(null);
    setSaving(true);
    const updated = {
      ...settings,
      notificationTimes: times,
      notificationsEnabled: notifsEnabled,
      completionSound,
      natureSound,
      breathingType,
      reflectionDuration,
    };
    await updateSettings(updated);
    await refreshProgress();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  if (!settings) return null;

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 120 : 110),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Tune your practice to your rhythm
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="bell" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Session Windows
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Each time marks when that session window opens. Morning closes when afternoon begins, afternoon closes when evening begins. You'll also receive a reminder notification at each time.
          </Text>

          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              Notifications
            </Text>
            <Switch
              value={notifsEnabled}
              onValueChange={setNotifsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.foreground}
            />
          </View>

          {notifsEnabled && (
            <>
              <TimeRow
                label="Morning"
                icon="sunrise"
                value={morning}
                onChange={setMorning}
                colors={colors}
                valid={TIME_RE.test(morning)}
              />
              <TimeRow
                label="Afternoon"
                icon="sun"
                value={afternoon}
                onChange={setAfternoon}
                colors={colors}
                valid={TIME_RE.test(afternoon)}
              />
              <TimeRow
                label="Evening"
                icon="moon"
                value={evening}
                onChange={setEvening}
                colors={colors}
                valid={TIME_RE.test(evening)}
                last
              />
            </>
          )}

          {timeError ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {timeError}
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="music" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Completion Sound
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Plays when your 60-second reflection timer ends. Tap to preview.
          </Text>
          <View style={styles.soundList}>
            {SOUND_OPTIONS.map((opt) => {
              const isSelected = completionSound === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handlePickSound(opt.key)}
                  style={[
                    styles.soundRow,
                    {
                      backgroundColor: isSelected ? colors.primary + "15" : colors.secondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.soundIconWrap,
                      { backgroundColor: isSelected ? colors.primary + "30" : colors.card },
                    ]}
                  >
                    <Feather
                      name={opt.icon as React.ComponentProps<typeof Feather>["name"]}
                      size={16}
                      color={isSelected ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[
                      styles.soundRowLabel,
                      { color: isSelected ? colors.foreground : colors.mutedForeground,
                        fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <View style={styles.soundRowRight}>
                    <Feather
                      name="play-circle"
                      size={18}
                      color={isSelected ? colors.primary : colors.mutedForeground + "88"}
                    />
                    {isSelected && (
                      <Feather name="check" size={16} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Breathwork & Reflection — premium */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="wind" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Breathwork {"&"} Reflection
            </Text>
            {isPremium && (
              <View style={[styles.premiumPill, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                <Text style={[styles.premiumPillText, { color: colors.primary }]}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Enhance your reflection sessions with ambient sounds and guided breathing.
          </Text>

          {/* Nature sound */}
          <Text style={[styles.settingGroupLabel, { color: colors.mutedForeground }]}>
            NATURE SOUND
          </Text>
          <View style={styles.chipRow}>
            {(["none", "rain", "ocean", "forest", "wind"] as NatureSound[]).map((opt) => {
              const labels: Record<NatureSound, string> = { none: "Off", rain: "Rain", ocean: "Ocean", forest: "Forest", wind: "Wind" };
              const locked = !isPremium && opt !== "none";
              const isPreviewing = naturePreviewing === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    if (!locked) {
                      setNatureSound(opt);
                      void previewNatureSound(opt);
                    }
                  }}
                  style={[
                    styles.settingChip,
                    {
                      borderColor: natureSound === opt ? colors.primary : colors.border,
                      backgroundColor: natureSound === opt ? colors.primary + "22" : colors.secondary,
                      opacity: locked ? 0.5 : 1,
                    },
                  ]}
                >
                  {locked ? (
                    <Feather name="lock" size={11} color={colors.mutedForeground} />
                  ) : opt !== "none" ? (
                    <Feather
                      name={isPreviewing ? "volume-2" : "play"}
                      size={11}
                      color={natureSound === opt ? colors.primary : colors.mutedForeground}
                    />
                  ) : null}
                  <Text style={[styles.settingChipText, {
                    color: natureSound === opt ? colors.primary : colors.mutedForeground,
                    fontFamily: natureSound === opt ? "Inter_600SemiBold" : "Inter_400Regular",
                  }]}>
                    {labels[opt]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Breathing guide */}
          <Text style={[styles.settingGroupLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
            BREATHING GUIDE
          </Text>
          <View style={styles.chipRow}>
            {(["none", "4-4-4-4", "4-7-8", "calm"] as BreathingType[]).map((opt) => {
              const labels: Record<BreathingType, string> = { none: "Off", "4-4-4-4": "Box (4-4-4-4)", "4-7-8": "4-7-8", calm: "Calm (4-6)" };
              const locked = !isPremium && opt !== "none";
              return (
                <Pressable
                  key={opt}
                  onPress={() => { if (!locked) setBreathingType(opt); }}
                  style={[
                    styles.settingChip,
                    {
                      borderColor: breathingType === opt ? colors.primary : colors.border,
                      backgroundColor: breathingType === opt ? colors.primary + "22" : colors.secondary,
                      opacity: locked ? 0.5 : 1,
                    },
                  ]}
                >
                  {locked && <Feather name="lock" size={11} color={colors.mutedForeground} />}
                  <Text style={[styles.settingChipText, {
                    color: breathingType === opt ? colors.primary : colors.mutedForeground,
                    fontFamily: breathingType === opt ? "Inter_600SemiBold" : "Inter_400Regular",
                  }]}>
                    {labels[opt]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reflection duration */}
          <Text style={[styles.settingGroupLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
            REFLECTION TIMER
          </Text>
          <View style={styles.chipRow}>
            {([30, 60, 120, 180, 300] as ReflectionDuration[]).map((secs) => {
              const labels: Record<number, string> = { 30: "30s", 60: "1 min", 120: "2 min", 180: "3 min", 300: "5 min" };
              return (
                <Pressable
                  key={secs}
                  onPress={() => setReflectionDuration(secs)}
                  style={[
                    styles.settingChip,
                    {
                      borderColor: reflectionDuration === secs ? colors.primary : colors.border,
                      backgroundColor: reflectionDuration === secs ? colors.primary + "22" : colors.secondary,
                    },
                  ]}
                >
                  <Text style={[styles.settingChipText, {
                    color: reflectionDuration === secs ? colors.primary : colors.mutedForeground,
                    fontFamily: reflectionDuration === secs ? "Inter_600SemiBold" : "Inter_400Regular",
                  }]}>
                    {labels[secs]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!isPremium && (
            <View style={[styles.unlockCard, { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 16 }]}>
              <Text style={[styles.unlockCardTitle, { color: colors.foreground }]}>
                Premium sounds {"&"} breathing require Inspire
              </Text>
              <Text style={[styles.unlockCardSub, { color: colors.mutedForeground }]}>
                One-time purchase · No subscription
              </Text>
              {purchaseError ? (
                <Text style={[styles.unlockCardError, { color: colors.destructive }]}>
                  {purchaseError}
                </Text>
              ) : null}
              <Pressable
                onPress={async () => {
                  setPurchaseError(null);
                  try {
                    await unlockPremium();
                  } catch (err: unknown) {
                    if (!isUserCancelledError(err)) {
                      const msg = err instanceof Error ? err.message : "Purchase failed. Please try again.";
                      setPurchaseError(msg);
                    }
                  }
                }}
                disabled={isPurchasing || isRestoring}
                style={[
                  styles.unlockCardBtn,
                  { backgroundColor: colors.primary, opacity: isPurchasing ? 0.7 : 1 },
                ]}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Feather name="unlock" size={15} color={colors.primaryForeground} />
                )}
                <Text style={[styles.unlockCardBtnText, { color: colors.primaryForeground }]}>
                  {isPurchasing
                    ? "Processing..."
                    : priceString
                    ? `Unlock — ${priceString}`
                    : "Unlock Premium"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="droplet" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Colour Theme
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Personalise the app's colours. Premium themes unlock with Inspire.
          </Text>
          <View style={styles.themeGrid}>
            {THEME_ORDER.map((name) => {
              const meta = THEME_META[name];
              const isActive = selectedTheme === name;
              const locked = name !== "indigo" && !isPremium;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    if (locked) return;
                    setTheme(name);
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync();
                    }
                  }}
                  style={[
                    styles.themeChip,
                    {
                      borderColor: isActive ? meta.swatch : colors.border,
                      backgroundColor: isActive
                        ? meta.swatch + "18"
                        : locked
                        ? colors.secondary + "80"
                        : colors.secondary,
                      opacity: locked ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themeSwatch,
                      {
                        backgroundColor: meta.swatch,
                        borderWidth: isActive ? 2 : 0,
                        borderColor: colors.foreground,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeChipLabel,
                      {
                        color: isActive ? colors.foreground : colors.mutedForeground,
                        fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {meta.label}
                  </Text>
                  {locked ? (
                    <Feather name="lock" size={13} color={colors.mutedForeground} />
                  ) : isActive ? (
                    <Feather name="check" size={14} color={meta.swatch} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
              <Feather name="check-circle" size={15} color={colors.primary} />
              <Text style={[styles.premiumBadgeText, { color: colors.primary }]}>
                Premium unlocked
              </Text>
            </View>
          ) : (
            <View style={[styles.unlockCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.unlockCardTitle, { color: colors.foreground }]}>
                Unlock all themes with Inspire
              </Text>
              <Text style={[styles.unlockCardSub, { color: colors.mutedForeground }]}>
                One-time purchase · No subscription
              </Text>
              {purchaseError ? (
                <Text style={[styles.unlockCardError, { color: colors.destructive }]}>
                  {purchaseError}
                </Text>
              ) : null}
              <Pressable
                onPress={async () => {
                  setPurchaseError(null);
                  try {
                    await unlockPremium();
                  } catch (err: unknown) {
                    if (!isUserCancelledError(err)) {
                      const msg = err instanceof Error ? err.message : "Purchase failed. Please try again.";
                      setPurchaseError(msg);
                    }
                  }
                }}
                disabled={isPurchasing || isRestoring}
                style={[
                  styles.unlockCardBtn,
                  { backgroundColor: colors.primary, opacity: isPurchasing ? 0.7 : 1 },
                ]}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Feather name="unlock" size={15} color={colors.primaryForeground} />
                )}
                <Text style={[styles.unlockCardBtnText, { color: colors.primaryForeground }]}>
                  {isPurchasing
                    ? "Processing..."
                    : priceString
                    ? `Unlock — ${priceString}`
                    : "Unlock Premium"}
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setPurchaseError(null);
                  try {
                    await restorePurchases();
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Restore failed. Please try again.";
                    setPurchaseError(msg);
                  }
                }}
                disabled={isPurchasing || isRestoring}
                style={styles.restoreBtn}
              >
                <Text style={[styles.restoreBtnText, { color: colors.mutedForeground }]}>
                  {isRestoring ? "Restoring..." : "Restore Purchase"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="info" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Current Journey
            </Text>
          </View>
          <View style={styles.infoRows}>
            <InfoRow label="Cycle" value={`${settings.cycleLength} days`} colors={colors} />
            <InfoRow
              label="Started"
              value={new Date(settings.startDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              colors={colors}
            />
            {settings.intention ? (
              <InfoRow label="Intention" value={settings.intention} colors={colors} italic />
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveBtn,
            { backgroundColor: saved ? colors.success : colors.primary },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {saved ? "Saved ✓" : saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

      </ScrollView>
    </GradientBackground>
  );
}

function TimeRow({
  label,
  icon,
  value,
  onChange,
  colors,
  last,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  valid: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.timeRowWrap,
        { borderBottomColor: colors.border },
        last ? { borderBottomWidth: 0 } : {},
      ]}
    >
      <View style={styles.timeRowLabel}>
        <Feather name={icon} size={15} color={colors.mutedForeground} />
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <TimePicker value={value} onChange={onChange} />
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
  italic,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  italic?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          { color: colors.foreground },
          italic ? { fontStyle: "italic" } : {},
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeRowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 8,
  },
  infoRows: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "right",
  },
  soundList: {
    gap: 8,
    marginTop: 4,
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  soundIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  soundRowLabel: {
    flex: 1,
    fontSize: 15,
  },
  soundRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  themeGrid: {
    gap: 8,
    marginTop: 4,
  },
  themeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  themeChipLabel: {
    flex: 1,
    fontSize: 15,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  unlockCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  unlockCardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  unlockCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  unlockCardError: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  unlockCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
  },
  unlockCardBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  restoreBtn: {
    alignSelf: "center",
    paddingVertical: 2,
  },
  restoreBtnText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  premiumPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: "auto",
  },
  premiumPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  settingGroupLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  settingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  settingChipText: {
    fontSize: 13,
  },
});
