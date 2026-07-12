import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { useDeities, deityFileUrl } from '../lib/deities';
import { useWeekdayDeities } from '../lib/weekdayDeities';

type Props = NativeStackScreenProps<RootStackParamList, 'GuidedPooja'>;

type ItemKey = 'deity' | 'platform' | 'cloth' | 'kalash' | 'water' | 'coin';

type Step =
  | { kind: 'ack'; text: string }
  | { kind: 'place'; item: ItemKey; text: string; hint: string }
  | { kind: 'end'; text: string };

const GHOST = 72;

// Left-rail palette. Placeholder emoji visuals for now (real art later).
const ITEMS: { key: ItemKey; emoji?: string }[] = [
  { key: 'deity' }, // uses the deity image
  { key: 'platform', emoji: '🟫' },
  { key: 'cloth', emoji: '🟨' },
  { key: 'kalash', emoji: '🏺' },
  { key: 'water', emoji: '💧' },
  { key: 'coin', emoji: '🪙' },
];

export default function GuidedPoojaScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { imageUrlForName } = useDeities();
  const { rows, today } = useWeekdayDeities();

  // Same deity resolution as the worship screen: Vaara → weekday deity,
  // otherwise the user's chosen Ishta Daiva.
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

  const STEPS: Step[] = useMemo(
    () => [
      { kind: 'ack', text: t('guidedPooja.step1') },
      {
        kind: 'place',
        item: 'platform',
        text: t('guidedPooja.step2'),
        hint: t('guidedPooja.step2Hint'),
      },
      { kind: 'end', text: t('guidedPooja.tbc') },
    ],
    [],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const [placed, setPlaced] = useState<Record<string, boolean>>({});

  // Only the current step's item is draggable; everything else stays disabled.
  const activePlaceItem: ItemKey | null =
    step.kind === 'place' && !placed[step.item] ? step.item : null;

  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const place = (item: ItemKey) => {
    setPlaced((p) => ({ ...p, [item]: true }));
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)); // action done → next
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => activePlaceItem != null,
        onMoveShouldSetPanResponder: () => activePlaceItem != null,
        onPanResponderGrant: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          setDragging(true);
          pan.setValue({ x: g.x0 - GHOST / 2, y: g.y0 - GHOST / 2 });
        },
        onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          pan.setValue({ x: g.moveX - GHOST / 2, y: g.moveY - GHOST / 2 });
        },
        onPanResponderRelease: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          setDragging(false);
          // Any real drag places it (it snaps to the centre); a tap does nothing.
          if (activePlaceItem && Math.hypot(g.dx, g.dy) > 8) place(activePlaceItem);
        },
        onPanResponderTerminate: () => setDragging(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePlaceItem],
  );

  const visual = (key: ItemKey, size: number) => {
    if (key === 'deity') {
      return deityImg ? (
        <Image
          source={{ uri: deityImg }}
          style={{ width: size, height: size, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: size * 0.7 }}>🕉️</Text>
      );
    }
    return <Text style={{ fontSize: size * 0.7 }}>{ITEMS.find((i) => i.key === key)?.emoji ?? '⬜'}</Text>;
  };

  return (
    <View style={styles.screen}>
      {/* Top bar: step badge + close */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.stepBadge}>
          {t('guidedPooja.step')} {Math.min(stepIndex + 1, STEPS.length)}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close"
          style={styles.close}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topRow}>
        {/* Left rail — ritual items palette */}
        <ScrollView
          style={styles.rail}
          contentContainerStyle={styles.railBody}
          showsVerticalScrollIndicator={false}
        >
          {ITEMS.map((it) => {
            const enabled = activePlaceItem === it.key;
            const isPlaced = !!placed[it.key];
            return (
              <View
                key={it.key}
                style={[
                  styles.item,
                  enabled && styles.itemOn,
                  !enabled && !isPlaced && styles.itemOff,
                ]}
                {...(enabled ? panResponder.panHandlers : {})}
              >
                <View style={styles.itemIcon}>{visual(it.key, 30)}</View>
                <Text
                  style={[styles.itemLabel, enabled && styles.itemLabelOn]}
                  numberOfLines={2}
                >
                  {t(`guidedPooja.items.${it.key}`)}
                </Text>
                {isPlaced && <Text style={styles.itemCheck}>✓</Text>}
              </View>
            );
          })}
        </ScrollView>

        {/* Stage — the altar working area */}
        <View style={styles.stage}>
          <View style={styles.dropZone}>
            {placed.platform ? (
              <View style={styles.platform}>
                <View style={styles.platformTop} />
              </View>
            ) : (
              <Text style={styles.dropHint}>{t('guidedPooja.dropHere')}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Instruction / message box */}
      <View style={[styles.msgBox, { paddingBottom: insets.bottom + 14 }]}>
        <Text style={styles.msgText}>{step.text}</Text>
        {step.kind === 'ack' && (
          <View style={styles.msgAction}>
            <Button label={t('guidedPooja.done')} onPress={() => setStepIndex((i) => i + 1)} />
          </View>
        )}
        {step.kind === 'place' && (
          <Text style={styles.msgHint}>← {step.hint}</Text>
        )}
        {step.kind === 'end' && (
          <View style={styles.msgAction}>
            <Button
              label={t('guidedPooja.backHome')}
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          </View>
        )}
      </View>

      {/* Floating drag ghost (follows finger / cursor) */}
      {dragging && activePlaceItem && (
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, { transform: pan.getTranslateTransform() }]}
        >
          {visual(activePlaceItem, 46)}
        </Animated.View>
      )}
    </View>
  );
}

const RAIL_W = 92;

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

  // Left rail
  rail: { width: RAIL_W, borderRightWidth: 1, borderRightColor: colors.line },
  railBody: { padding: 8, gap: 10 },
  item: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  itemOn: {
    borderColor: colors.saffron,
    backgroundColor: '#FFF3E6',
    ...shadow.glow,
  },
  itemOff: { opacity: 0.4 },
  itemIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: fonts.body,
  },
  itemLabelOn: { color: colors.maroon, fontFamily: fonts.semibold },
  itemCheck: {
    position: 'absolute',
    top: 4,
    right: 6,
    color: colors.green,
    fontWeight: '800',
    fontSize: 13,
  },

  // Stage
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  dropZone: {
    width: 220,
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.sandalDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropHint: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  // Placeholder wooden platform
  platform: {
    width: 180,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#8A5A2B',
    borderWidth: 2,
    borderColor: '#6E4420',
    ...shadow.card,
  },
  platformTop: {
    position: 'absolute',
    top: 5,
    left: 8,
    right: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Message box
  msgBox: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    gap: 12,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    fontFamily: fonts.body,
  },
  msgHint: { fontSize: 13, color: colors.saffron, fontFamily: fonts.semibold },
  msgAction: { marginTop: 2 },

  // Drag ghost
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
