import React, { useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const ITEM_HEIGHT = 48;
const VISIBLE = 3; // rows visible in the viewport (middle is selected)

interface NumberColumnProps {
  from: number;
  to: number;
  value: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
}

function NumberColumn({ from, to, value, onChange, format }: NumberColumnProps) {
  const colors = useColors();
  const items = Array.from({ length: to - from + 1 }, (_, i) => i + from);
  const scrollRef = useRef<ScrollView>(null);
  const didMount = useRef(false);

  const fmt = format ?? ((n: number) => n.toString().padStart(2, "0"));
  const selectedIdx = Math.max(0, value - from);

  // Scroll to current value on mount (no animation), and whenever value changes externally
  useEffect(() => {
    const anim = didMount.current;
    didMount.current = true;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIdx * ITEM_HEIGHT, animated: anim });
    }, anim ? 0 : 50);
  }, [selectedIdx]);

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    onChange(items[clamped]);
  }

  return (
    <View style={styles.columnWrap}>
      {/* Selection highlight behind the centre row */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionBar,
          {
            top: ITEM_HEIGHT,
            height: ITEM_HEIGHT,
            backgroundColor: colors.primary + "22",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.primary + "55",
          },
        ]}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        // Web: scrollEnd fires on mouse up too
        onScrollEndDrag={Platform.OS === "web" ? onScrollEnd : undefined}
        style={{ height: ITEM_HEIGHT * VISIBLE, width: 60 }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {items.map((n) => {
          const isSelected = n === value;
          return (
            <View key={n} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  {
                    color: isSelected ? colors.foreground : colors.mutedForeground + "88",
                    fontSize: isSelected ? 26 : 19,
                    fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {fmt(n)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface TimePickerProps {
  value: string; // "HH:MM"
  onChange: (v: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const colors = useColors();
  const [hStr, mStr] = value.split(":");
  const hours = Math.min(23, Math.max(0, parseInt(hStr ?? "0", 10) || 0));
  const minutes = Math.min(59, Math.max(0, parseInt(mStr ?? "0", 10) || 0));

  function setHours(h: number) {
    onChange(`${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
  }
  function setMinutes(m: number) {
    onChange(`${hours.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  }

  return (
    <View style={styles.row}>
      <NumberColumn from={0} to={23} value={hours} onChange={setHours} />
      <Text style={[styles.colon, { color: colors.primary }]}>:</Text>
      <NumberColumn from={0} to={59} value={minutes} onChange={setMinutes} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  columnWrap: {
    position: "relative",
    overflow: "hidden",
  },
  selectionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    letterSpacing: 1,
  },
  colon: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    paddingBottom: 2,
  },
});
