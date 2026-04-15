import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { validateNotificationTimes } from "@/utils/notifications";

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
  const [saving, setSaving] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setMorning(settings.notificationTimes.morning);
      setAfternoon(settings.notificationTimes.afternoon);
      setEvening(settings.notificationTimes.evening);
      setNotifsEnabled(settings.notificationsEnabled !== false);
    }
  }, [settings]);

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

  function handleStartNewJourney() {
    if (Platform.OS === "web") {
      router.push("/onboarding");
      return;
    }
    Alert.alert(
      "Start New Journey",
      "Your current journey will be archived. You'll begin a fresh cycle from today. Are you ready?",
      [
        { text: "Not Yet", style: "cancel" },
        {
          text: "Begin New Journey",
          style: "default",
          onPress: () => router.push("/onboarding"),
        },
      ]
    );
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
              Reminders
            </Text>
          </View>

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

        <Pressable
          onPress={handleStartNewJourney}
          style={[
            styles.newJourneyBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={[styles.newJourneyText, { color: colors.primary }]}>
            Start a New Journey
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
  valid,
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
        styles.row,
        { borderBottomColor: colors.border },
        last ? { borderBottomWidth: 0 } : {},
      ]}
    >
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[
          styles.timeInput,
          {
            color: valid ? colors.foreground : colors.destructive,
            borderColor: valid ? colors.border : colors.destructive,
            backgroundColor: colors.secondary,
          },
        ]}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        placeholder="HH:MM"
        placeholderTextColor={colors.mutedForeground}
      />
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    width: 70,
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
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  newJourneyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  newJourneyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
