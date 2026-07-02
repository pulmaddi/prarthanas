import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useRoomPresence, type Participant } from '../lib/roomPresence';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveRoom'>;

function roleLabelFromType(ht?: string | null): string {
  return ht === 'priest'
    ? t('roles.priest')
    : ht === 'guru'
      ? t('roles.guru')
      : ht === 'temple_exec'
        ? t('roles.templeExec')
        : t('roles.devotee');
}

const PALETTE: { key: string; emoji: string; label: string }[] = [
  { key: 'flowers', emoji: '🌸', label: t('pooja.flowers') },
  { key: 'kumkuma', emoji: '🔴', label: t('room.kumkuma') },
  { key: 'sandal', emoji: '🟡', label: t('room.sandal') },
  { key: 'saffron', emoji: '🟠', label: t('pooja.saffron') },
  { key: 'water', emoji: '💧', label: t('room.water') },
  { key: 'aarti', emoji: '🪔', label: t('pooja.aarti') },
];

let _oid = 0;
type Offer = { id: number; emoji: string; x: number };

function FloatingOffering({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }).start(
      ({ finished }) => finished && onDone(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 120] });
  const opacity = anim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.Text style={[styles.offering, { left: x, transform: [{ translateY }], opacity }]}>
      {emoji}
    </Animated.Text>
  );
}

function Avatar({ name, gold }: { name: string; gold?: boolean }) {
  const initial = (name.trim()[0] || '🙏').toUpperCase();
  return (
    <View style={[styles.avatar, gold && styles.avatarGold]}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

export default function LiveRoomScreen({ route, navigation }: Props) {
  const { meetingId, title, deityName, hostId } = route.params;
  const { profile, hostType, session } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 820;

  const me: Participant | null = session?.user.id
    ? {
        user_id: session.user.id,
        name: profile?.name?.trim() || t('profile.devotee'),
        role: roleLabelFromType(hostType),
      }
    : null;

  const participants = useRoomPresence(meetingId, me);
  const [organizer, setOrganizer] = useState<{ name: string; role: string } | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const canvasW = useRef(320);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from('hosts_public')
        .select('name,host_type')
        .eq('user_id', hostId)
        .maybeSingle();
      if (alive && data)
        setOrganizer({
          name: (data as any).name || t('room.organizer'),
          role: roleLabelFromType((data as any).host_type),
        });
    })();
    return () => {
      alive = false;
    };
  }, [hostId]);

  const offer = (emoji: string) => {
    const x = 16 + Math.random() * Math.max(40, canvasW.current - 56);
    const id = ++_oid;
    setOffers((o) => [...o, { id, emoji, x }]);
  };

  const others = participants.filter((p) => p.user_id !== hostId);

  const ParticipantsPanel = (
    <View style={[styles.panel, wide ? styles.panelSide : styles.panelBottom]}>
      <Text style={styles.panelTitle}>
        {t('room.participants')} ({participants.length || (organizer ? 1 : 0)})
      </Text>
      <ScrollView>
        {organizer && (
          <View style={styles.pRow}>
            <Avatar name={organizer.name} gold />
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{organizer.name}</Text>
              <Text style={styles.pRole}>{organizer.role}</Text>
            </View>
            <View style={styles.orgTag}>
              <Text style={styles.orgTagText}>{t('room.organizer')}</Text>
            </View>
          </View>
        )}
        {others.map((p) => (
          <View key={p.user_id} style={styles.pRow}>
            <Avatar name={p.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{p.name || t('profile.devotee')}</Text>
              <Text style={styles.pRole}>{p.role || t('roles.devotee')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>● {t('room.live')}</Text>
        </View>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityLabel={t('pooja.end')}
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, wide && styles.contentWide]}>
        {/* Deity whiteboard */}
        <View
          style={styles.canvas}
          onLayout={(e) => (canvasW.current = e.nativeEvent.layout.width)}
        >
          <View style={styles.medallion}>
            <Text style={styles.om}>🕉️</Text>
          </View>
          <Text style={styles.deityName}>{deityName || t('room.deityPlaceholder')}</Text>
          {offers.map((o) => (
            <FloatingOffering
              key={o.id}
              emoji={o.emoji}
              x={o.x}
              onDone={() => setOffers((cur) => cur.filter((c) => c.id !== o.id))}
            />
          ))}
        </View>

        {ParticipantsPanel}
      </View>

      {/* Offering palette */}
      <View style={styles.paletteWrap}>
        <Text style={styles.paletteHint}>{t('room.tapToOffer')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
          {PALETTE.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.palItem}
              activeOpacity={0.8}
              onPress={() => offer(item.emoji)}
            >
              <Text style={styles.palEmoji}>{item.emoji}</Text>
              <Text style={styles.palLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2A0A12' },
  topbar: {
    backgroundColor: colors.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  liveBadge: {
    backgroundColor: colors.live,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  topTitle: { flex: 1, color: colors.white, fontSize: 16, fontWeight: '700' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  contentWide: { flexDirection: 'row' },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A0F1B',
    margin: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  medallion: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(242,180,65,0.15)',
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  om: { fontSize: 84 },
  deityName: { color: colors.gold, fontSize: 18, fontWeight: '800', marginTop: 16 },
  offering: { position: 'absolute', top: 24, fontSize: 26 },
  // participants
  panel: { backgroundColor: colors.cream },
  panelSide: {
    width: 260,
    margin: spacing.md,
    marginLeft: 0,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  panelBottom: {
    maxHeight: 168,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGold: { backgroundColor: colors.saffron },
  avatarText: { color: colors.white, fontWeight: '700' },
  pName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  pRole: { fontSize: 11, color: colors.muted },
  orgTag: {
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orgTagText: { fontSize: 9, fontWeight: '800', color: colors.maroon },
  // palette
  paletteWrap: {
    backgroundColor: colors.maroon,
    paddingTop: 8,
    paddingBottom: 12,
  },
  paletteHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
  },
  palette: { paddingHorizontal: spacing.md, gap: 10, alignItems: 'center' },
  palItem: {
    width: 66,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    paddingVertical: 8,
  },
  palEmoji: { fontSize: 26 },
  palLabel: { color: colors.white, fontSize: 10, marginTop: 2 },
});
