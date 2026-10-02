// Admin home dashboard — 5 management cards in a responsive grid.
// Mobile: 1 column. Desktop (≥ 640 px): 2 columns.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type CardConfig = {
  id: string;
  accent: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  countKey: string;          // key into the counts map
  manageLabel: string;
  manageScreen: keyof RootStackParamList;
  manageParams?: Record<string, unknown>;
};

const CARDS: CardConfig[] = [
  {
    id: 'vaara',
    accent: '#C8860A',
    icon: 'calendar-star',
    title: 'Vara Puja',
    description: 'Weekday deity assignments for Vara Puja',
    countKey: 'vaara',
    manageLabel: 'Manage Days',
    manageScreen: 'AdminVaara',
  },
  {
    id: 'ishta',
    accent: '#7A0A14',
    icon: 'candle',
    title: 'Ishta Daiva Puja',
    description: 'Ritual items for personal deity worship',
    countKey: 'ritualItems',
    manageLabel: 'Manage Items',
    manageScreen: 'AdminRitualItems',
  },
  {
    id: 'priests',
    accent: '#1B6B4A',
    icon: 'account-tie',
    title: 'Priests',
    description: 'Registered priests offering puja services',
    countKey: 'priests',
    manageLabel: 'Manage',
    manageScreen: 'AdminHostsManage',
    manageParams: { filterType: 'priest' },
  },
  {
    id: 'gurus',
    accent: '#5E3D9A',
    icon: 'meditation',
    title: 'Spiritual Gurus',
    description: 'Gurus and Swamijis conducting satsang',
    countKey: 'gurus',
    manageLabel: 'Manage',
    manageScreen: 'AdminHostsManage',
    manageParams: { filterType: 'guru' },
  },
  {
    id: 'temples',
    accent: '#B85C00',
    icon: 'town-hall',
    title: 'Temples',
    description: 'Registered temples and their events',
    countKey: 'temples',
    manageLabel: 'Manage',
    manageScreen: 'AdminHostsManage',
    manageParams: { filterType: 'temple_exec' },
  },
];

type Counts = Record<string, number | null>;

async function fetchCounts(): Promise<Counts> {
  if (!isSupabaseConfigured) return {};
  const [vaara, ritualItems, priests, gurus, temples] = await Promise.all([
    supabase.from('weekday_deities').select('*', { count: 'exact', head: true }),
    supabase.from('ritual_items').select('*', { count: 'exact', head: true }),
    supabase.from('host_accounts').select('*', { count: 'exact', head: true }).contains('host_types', ['priest']),
    supabase.from('host_accounts').select('*', { count: 'exact', head: true }).contains('host_types', ['guru']),
    supabase.from('host_accounts').select('*', { count: 'exact', head: true }).contains('host_types', ['temple_exec']),
  ]);
  return {
    vaara:       vaara.count ?? 0,
    ritualItems: ritualItems.count ?? 0,
    priests:     priests.count ?? 0,
    gurus:       gurus.count ?? 0,
    temples:     temples.count ?? 0,
  };
}

function countLabel(n: number | null | undefined, singular: string, plural?: string): string {
  if (n === null || n === undefined) return '…';
  if (n === 0) return 'None yet';
  return `${n} ${n === 1 ? singular : (plural ?? singular + 's')}`;
}

function DashCard({
  card,
  count,
  wide,
}: {
  card: CardConfig;
  count: number | null | undefined;
  wide: boolean;
}) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goManage = () =>
    nav.navigate(card.manageScreen as any, (card.manageParams ?? {}) as any);

  const singular =
    card.id === 'vaara' ? 'day' :
    card.id === 'ishta' ? 'item' :
    card.id === 'priests' ? 'priest' :
    card.id === 'gurus' ? 'guru' : 'temple';

  return (
    <View style={[styles.card, wide && styles.cardWide]}>
      {/* Coloured top accent bar */}
      <View style={[styles.accent, { backgroundColor: card.accent }]} />

      {/* Card body — tapping the header area navigates to the manage screen */}
      <View style={styles.cardBody}>
        {/* Icon + title row (tappable) */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={goManage}
          activeOpacity={0.75}
        >
          <View style={[styles.iconCircle, { backgroundColor: card.accent + '20' }]}>
            <MaterialCommunityIcons name={card.icon} size={26} color={card.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>
          </View>
          {/* Count badge */}
          <View style={[styles.countBadge, { backgroundColor: card.accent + '18' }]}>
            <Text style={[styles.countText, { color: card.accent }]}>
              {countLabel(count, singular)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Single primary action button */}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, { backgroundColor: card.accent }]}
          onPress={goManage}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="table-edit" size={14} color="#fff" />
          <Text style={styles.btnPrimaryText}>{card.manageLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    fetchCounts().then(setCounts);
  }, []);

  return (
    <View style={styles.root}>
      {/* Dashboard header */}
      <View style={styles.dashHeader}>
        <MaterialCommunityIcons name="shield-account" size={20} color={colors.maroon} />
        <Text style={styles.dashTitle}>Admin Dashboard</Text>
      </View>
      <Text style={styles.dashSub}>Manage all platform content from here.</Text>

      {/* Card grid — wraps to 2 columns on wide screens */}
      <View style={[styles.grid, wide && styles.gridWide]}>
        {CARDS.map((card) => (
          <DashCard
            key={card.id}
            card={card}
            count={counts[card.countKey] as number | null | undefined}
            wide={wide}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 32 },
  dashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    marginTop: 4,
  },
  dashTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 0.2,
  },
  dashSub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 20,
  },

  /* Grid */
  grid: { gap: 14 },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardWide: {
    // ~half width minus half the gap; use flex basis
    flex: 1,
    minWidth: 260,
    maxWidth: '49%' as any,
  },
  accent: { height: 5 },
  cardBody: { padding: 16 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 3,
  },
  cardDesc: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  countBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    minWidth: 56,
    alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '800' },

  divider: { height: 1, backgroundColor: colors.line, marginBottom: 12 },

  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  btnPrimary: {},
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
