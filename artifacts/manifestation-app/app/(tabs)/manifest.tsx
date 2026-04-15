import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ManifestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { manifestItems, addManifestItem, toggleManifestItem, deleteManifestItem } = useApp();
  const [inputText, setInputText] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const text = inputText.trim();
    if (!text) return;
    await addManifestItem(text);
    setInputText("");
    setAdding(false);
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async function handleToggle(id: string) {
    await toggleManifestItem(id);
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function handleDelete(id: string, text: string) {
    if (Platform.OS === "web") {
      deleteManifestItem(id);
      return;
    }
    Alert.alert("Remove", `Remove "${text}" from your list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteManifestItem(id),
      },
    ]);
  }

  const pending = manifestItems.filter((i) => !i.manifested);
  const manifested = manifestItems.filter((i) => i.manifested);

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
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            What I'm Calling In
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Set your intentions. Watch them arrive.
          </Text>
        </View>

        {adding ? (
          <View
            style={[
              styles.addCard,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Write what you wish to call in..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.addInput, { color: colors.foreground }]}
              autoFocus
              multiline
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <View style={styles.addActions}>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setInputText("");
                }}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: inputText.trim() ? colors.primary : colors.secondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.saveBtnText,
                    { color: inputText.trim() ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            style={[
              styles.newBtn,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={[styles.newBtnText, { color: colors.primary }]}>
              Add something to call in
            </Text>
          </Pressable>
        )}

        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              CALLING IN
            </Text>
            {pending.map((item) => (
              <ManifestRow
                key={item.id}
                item={item}
                colors={colors}
                onToggle={() => handleToggle(item.id)}
                onDelete={() => handleDelete(item.id, item.text)}
              />
            ))}
          </View>
        )}

        {manifested.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              RECEIVED ✦
            </Text>
            {manifested.map((item) => (
              <ManifestRow
                key={item.id}
                item={item}
                colors={colors}
                onToggle={() => handleToggle(item.id)}
                onDelete={() => handleDelete(item.id, item.text)}
              />
            ))}
          </View>
        )}

        {manifestItems.length === 0 && !adding && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.primary }]}>✦</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your list is open
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Add the things you are calling into your life. Hold each one with certainty, not hope.
            </Text>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function ManifestRow({
  item,
  colors,
  onToggle,
  onDelete,
}: {
  item: { id: string; text: string; manifested: boolean; manifestedAt?: string };
  colors: ReturnType<typeof useColors>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: item.manifested ? colors.secondary : colors.card,
          borderColor: item.manifested ? colors.primary : colors.border,
        },
      ]}
    >
      <Pressable onPress={onToggle} style={styles.checkArea}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: item.manifested ? colors.primary : colors.mutedForeground,
              backgroundColor: item.manifested ? colors.primary : "transparent",
            },
          ]}
        >
          {item.manifested && (
            <Feather name="check" size={13} color={colors.primaryForeground} />
          )}
        </View>
      </Pressable>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowText,
            {
              color: item.manifested ? colors.mutedForeground : colors.foreground,
              textDecorationLine: item.manifested ? "line-through" : "none",
            },
          ]}
        >
          {item.text}
        </Text>
        {item.manifested && item.manifestedAt && (
          <Text style={[styles.manifestedDate, { color: colors.mutedForeground }]}>
            Received {new Date(item.manifestedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
        <Feather name="x" size={16} color={colors.mutedForeground} />
      </Pressable>
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
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  newBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  addCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    minHeight: 60,
  },
  addActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  checkArea: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  manifestedDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    paddingTop: 2,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
});
