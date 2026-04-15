import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { useColors } from "@/hooks/useColors";

interface Section {
  id: string;
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    id: "what",
    title: "What is 3-6-9?",
    body:
      "The 3-6-9 method is a manifestation practice rooted in the belief that focused, repeated intention creates energetic momentum. Each day you write your affirmation three times in the morning, six times in the afternoon, and nine times in the evening.\n\nThe repetition is deliberate. It isn't mere wishful thinking — it is a daily act of choosing, with your full attention, the reality you are moving toward.",
  },
  {
    id: "tesla",
    title: "Tesla's Numbers",
    body:
      'Nikola Tesla, the visionary inventor, believed that 3, 6, and 9 held the keys to the universe. "If you knew the magnificence of the three, six and nine," he is said to have written, "you would have a key to the universe."\n\nIn sacred geometry and numerology, 3 represents creation and expression. 6 represents harmony and balance. 9 represents completion and the highest vibration — the number that returns to itself in all multiplication.\n\nThese three numbers form a cycle within themselves. They are not arbitrary.',
  },
  {
    id: "why",
    title: "Why It Works",
    body:
      "The mind does not know the difference between what is vividly imagined and what is experienced. When you write your affirmation with presence and emotion, you are training your nervous system to feel the reality before it arrives.\n\nThe three sessions create an anchor across your entire day — morning plants the seed, afternoon waters it with attention, evening integrates it into your rest. Sleep becomes an incubator for the intention you've set.\n\nRepetition shifts belief. Belief changes perception. Perception changes what you notice, attract, and create.",
  },
  {
    id: "cycles",
    title: "33 or 45 Days",
    body:
      "A 33-day cycle corresponds to the age of enlightenment in many traditions and to the 33 vertebrae of the human spine — a path from root to crown, from earth to sky.\n\nA 45-day cycle follows the numerological path of 4+5=9, returning again to the number of completion. It gives more time for deep patterns to shift, and is often chosen when the intention feels larger or requires more unwinding.\n\nChoose the one that calls to you. There is no wrong answer — only the one that feels aligned.",
  },
  {
    id: "how",
    title: "How to Write",
    body:
      "Write each affirmation by hand if you can — there is power in the physical act of writing. Write in the present tense, as though it is already so. Not \"I want\" or \"I will\" — but \"I am,\" \"I have,\" \"I feel.\"\n\nBe specific without being rigid. Speak to the essence of what you want, not just the form. \"I am aligned with abundance and ease\" invites more than just a number.\n\nBefore each session, take three slow breaths. Feel into the reality of the affirmation. Write from that place — not from hoping, but from knowing.",
  },
  {
    id: "reflect",
    title: "The Reflection Moment",
    body:
      "After each evening session, you will be invited into a 60-second silence. This is not optional — it is perhaps the most important part.\n\nIn the stillness after writing, your subconscious mind is most open. The words you've just written have amplitude. Let them resonate. Let the feeling of having what you've declared wash through you.\n\nThis is where the signal is sent. Not in the wanting, but in the receiving.",
  },
];

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<string | null>(SECTIONS[0].id);

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
            The Practice
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Understanding the way of 3-6-9
          </Text>
        </View>

        <View
          style={[
            styles.quoteCard,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.quoteText, { color: colors.primary }]}>
            "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration."
          </Text>
          <Text style={[styles.quoteAttrib, { color: colors.mutedForeground }]}>
            — Nikola Tesla
          </Text>
        </View>

        <View style={styles.sections}>
          {SECTIONS.map((section) => {
            const isOpen = expanded === section.id;
            return (
              <Pressable
                key={section.id}
                onPress={() => setExpanded(isOpen ? null : section.id)}
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isOpen ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {section.title}
                  </Text>
                  <Text style={[styles.chevron, { color: colors.primary }]}>
                    {isOpen ? "−" : "+"}
                  </Text>
                </View>
                {isOpen && (
                  <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>
                    {section.body}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            ✦ ✦ ✦
          </Text>
          <Text style={[styles.footerBody, { color: colors.mutedForeground }]}>
            You are not waiting for the universe to respond. You are the universe, responding to itself.
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
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
  quoteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  quoteText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
    fontStyle: "italic",
    textAlign: "center",
  },
  quoteAttrib: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: 1,
  },
  sections: {
    gap: 10,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    paddingRight: 8,
  },
  chevron: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  sectionBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
  footer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 18,
    letterSpacing: 8,
  },
  footerBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 10,
  },
});
