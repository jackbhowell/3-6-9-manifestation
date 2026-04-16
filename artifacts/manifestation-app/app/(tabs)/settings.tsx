import { Feather } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { validateNotificationTimes } from "@/utils/notifications";
import { CompletionSound } from "@/utils/storage";

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

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, refreshProgress } = useApp();

  const [morning, setMorning] = useState(settings?.notificationTimes.morning ?? "08:00");
  const [afternoon, setAfternoon] = useState(settings?.notificationTimes.afternoon ?? "13:00");
  const [evening, setEvening] = useState(settings?.notificationTimes.evening ?? "21:00");
  const [notifsEnabled, setNotifsEnabled] = useState(
    settings?.notificationsEnabled !== false
  );
  const [completionSound, setCompletionSound] = useState<CompletionSound>(
    settings?.completionSound ?? "chime"
  );
  const [saving, setSaving] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 110),
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
            Choose the sound that plays when your reflection timer ends. Tap an option to preview it.
          </Text>
          <View style={styles.soundPicker}>
            {SOUND_OPTIONS.map((opt, idx) => {
              const isSelected = completionSound === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handlePickSound(opt.key)}
                  style={[
                    styles.soundOption,
                    {
                      backgroundColor: isSelected ? colors.primary + "22" : "transparent",
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRightWidth: idx < SOUND_OPTIONS.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <Feather
                    name={opt.icon as React.ComponentProps<typeof Feather>["name"]}
                    size={16}
                    color={isSelected ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.soundOptionLabel,
                      { color: isSelected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
  soundPicker: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  soundOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  soundOptionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
});
