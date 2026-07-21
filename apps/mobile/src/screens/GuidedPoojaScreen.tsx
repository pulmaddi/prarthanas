import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, shadow, fonts } from '../theme';
import { Button } from '../components/ui';
import { t, i18n } from '../i18n';
import { useAuth } from '../lib/auth';
import { useDeities, deityFileUrl } from '../lib/deities';
import { useWeekdayDeities } from '../lib/weekdayDeities';
import {
  useRitualItems,
  usePoojaSteps,
  ritualItemFileUrl,
  type RitualItem,
} from '../lib/ritualItems';

type Props = NativeStackScreenProps<RootStackParamList, 'GuidedPooja'>;

const GHOST = 72;
const RAIL_W = 78;

// Placeholder glyphs when a static item has no uploaded image yet.
const EMOJI: Record<string, string> = {
  wooden_platform: '🟫',
  wooden_plank: '🟫',
  sacred_cloth: '🟨',
  yellow_cloth: '🟨',
  kalash: '🏺',
  kalash_pot: '🏺',
  water: '💧',
  coin: '🪙',
  deity: '🕉️',
};
const glyph = (key: string) => EMOJI[key] ?? '🪔';

/** Image with graceful emoji fallback (missing upload / dynamic deity not set). */
function ItemVisual({
  url,
  emoji,
  size,
}: {
  url: string | null;
  emoji: string;
  size: number;
}) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: 8 }}
        resizeMode="contain"
        onError={() => setErr(true)}
      />
    );
  }
  return <Text style={{ fontSize: size * 0.7 }}>{emoji}</Text>;
}

export default function GuidedPoojaScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { imageUrlForName } = useDeities();
  const { rows, today } = useWeekdayDeities();
  const { items } = useRitualItems();
  const { steps, loading } = usePoojaSteps('common');

  // Locale picker for DB-stored text (falls back to English).
  const L = (i18n.locale || 'en').slice(0, 2);
  const pick = (en: string, hi?: string | null, te?: string | null) =>
    (L === 'hi' ? hi || en : L === 'te' ? te || en : en) || '';

  // Deity resolution: Vaara → weekday deity, else the user's Ishta Daiva.
  const weekday =
    route.params?.day != null
      ? rows.find((r) => r.day === route.params!.day) ?? null
      : route.params?.vaara
        ? today()
        : null;
  const deityName =
    weekday?.deity_name || route.params?.deityName || profile?.ishta_daiva || '';
  const deityImg = weekday
    ? deityFileUrl(weekday.image_path)
    : imageUrlForName(deityName);

  const imgFor = (it: RitualItem): string | null =>
    it.image_source === 'deity' ? deityImg : ritualItemFileUrl(it.image_path);

  const [stepIndex, setStepIndex] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');

  const step = steps[stepIndex];
  const finished = steps.length > 0 && stepIndex >= steps.length;
  const activeKey =
    step?.action === 'place' && step.item_key && !placed.includes(step.item_key)
      ? step.item_key
      : null;
  const activeItem = items.find((i) => i.item_key === activeKey) || null;

  const advance = () => {
    setPrompt('');
    setStepIndex((i) => i + 1);
  };
  const place = (key: string) => {
    setPlaced((p) => (p.includes(key) ? p : [...p, key]));
    advance();
  };

  // Drag the enabled item; on release (after a real drag) it snaps to the altar.
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => activeKey != null,
        onMoveShouldSetPanResponder: () => activeKey != null,
        onPanResponderGrant: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          setDragging(true);
          pan.setValue({ x: g.x0 - GHOST / 2, y: g.y0 - GHOST / 2 });
        },
        onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          pan.setValue({ x: g.moveX - GHOST / 2, y: g.moveY - GHOST / 2 });
        },
        onPanResponderRelease: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          setDragging(false);
          if (activeKey && Math.hypot(g.dx, g.dy) > 8) place(activeKey);
        },
        onPanResponderTerminate: () => setDragging(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeKey],
  );

  const stepText = step ? pick(step.instruction, step.instruction_hi, step.instruction_te) : '';

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.stepBadge}>
          {steps.length
            ? `${t('guidedPooja.step')} ${Math.min(stepIndex + 1, steps.length)}/${steps.length}`
            : t('guidedPooja.step')}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.close} accessibilityLabel="Close">
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topRow}>
        {/* Left rail — ritual items palette (compact thumbnails) */}
        <ScrollView style={styles.rail} contentContainerStyle={styles.railBody} showsVerticalScrollIndicator={false}>
          {items.map((it) => {
            const enabled = activeKey === it.item_key;
            const isPlaced = placed.includes(it.item_key);
            return (
              <View
                key={it.item_key}
                style={[styles.item, enabled && styles.itemOn, !enabled && !isPlaced && styles.itemOff]}
                {...(enabled ? panResponder.panHandlers : {})}
              >
                <ItemVisual url={imgFor(it)} emoji={glyph(it.item_key)} size={34} />
                <Text style={[styles.itemLabel, enabled && styles.itemLabelOn]} numberOfLines={2}>
                  {pick(it.name, it.name_hi, it.name_te)}
                </Text>
                {isPlaced && <Text style={styles.itemCheck}>✓</Text>}
              </View>
            );
          })}
        </ScrollView>

        {/* Stage — the altar */}
        <View style={styles.stage}>
          <View style={styles.dropZone}>
            {placed.length === 0 ? (
              <Text style={styles.dropHint}>{t('guidedPooja.dropHere')}</Text>
            ) : (
              placed.map((key, idx) => {
                const it = items.find((i) => i.item_key === key);
                if (!it) return null;
                return (
                  <View key={key} style={[styles.placedWrap, { zIndex: idx }]} pointerEvents="none">
                    <ItemVisual url={imgFor(it)} emoji={glyph(key)} size={140} />
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      {/* Instruction / message box */}
      <View style={[styles.msgBox, { paddingBottom: insets.bottom + 14 }]}>
        {loading ? (
          <ActivityIndicator color={colors.maroon} />
        ) : steps.length === 0 ? (
          <Text style={styles.msgText}>{t('guidedPooja.noSteps')}</Text>
        ) : finished ? (
          <>
            <Text style={styles.msgText}>{t('guidedPooja.ready')}</Text>
            <View style={styles.endRow}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('guidedPooja.worship')}
                  onPress={() => navigation.replace('Pooja', route.params)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={t('guidedPooja.backHome')} variant="outline" onPress={() => navigation.goBack()} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.msgText}>{stepText}</Text>
            {step?.action === 'place' && <Text style={styles.msgHint}>← {t('guidedPooja.dragHint')}</Text>}
            {!!prompt && <Text style={styles.prompt}>{prompt}</Text>}
            <View style={styles.msgAction}>
              <Button
                label={t('guidedPooja.done')}
                onPress={() => {
                  if (step?.action === 'info') advance();
                  else setPrompt(stepText); // must perform the action first
                }}
              />
            </View>
          </>
        )}
      </View>

      {/* Drag ghost */}
      {dragging && activeItem && (
        <Animated.View pointerEvents="none" style={[styles.ghost, { transform: pan.getTranslateTransform() }]}>
          <ItemVisual url={imgFor(activeItem)} emoji={glyph(activeItem.item_key)} size={46} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 8,
  },
  stepBadge: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.maroon,
    backgroundColor: colors.sandalSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandalSoft,
  },
  closeIcon: { fontSize: 18, color: colors.maroon, fontWeight: '700' },

  topRow: { flex: 1, flexDirection: 'row' },

  rail: { width: RAIL_W, flexGrow: 0, flexShrink: 0, borderRightWidth: 1, borderRightColor: colors.line },
  railBody: { padding: 6, gap: 8 },
  item: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  itemOn: { borderColor: colors.saffron, backgroundColor: '#FFF3E6', ...shadow.glow },
  itemOff: { opacity: 0.4 },
  itemLabel: { fontSize: 9, color: colors.muted, textAlign: 'center', marginTop: 3, fontFamily: fonts.body },
  itemLabelOn: { color: colors.maroon, fontFamily: fonts.semibold },
  itemCheck: { position: 'absolute', top: 3, right: 5, color: colors.green, fontWeight: '800', fontSize: 12 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  dropZone: {
    width: 240,
    height: 240,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.sandalDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropHint: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  placedWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  msgBox: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    gap: 10,
  },
  msgText: { fontSize: 15, lineHeight: 22, color: colors.ink, fontFamily: fonts.body },
  msgHint: { fontSize: 13, color: colors.saffron, fontFamily: fonts.semibold },
  prompt: { fontSize: 13, color: colors.live, fontFamily: fonts.semibold },
  msgAction: { marginTop: 2 },
  endRow: { flexDirection: 'row', gap: 10, marginTop: 2 },

  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: GHOST,
    height: GHOST,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
});
