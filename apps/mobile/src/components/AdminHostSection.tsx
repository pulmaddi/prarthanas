// Shows up to 5 registered hosts of a given type with a "View All" link
// that opens AdminHostsManage filtered to that type. Used on the Admin home.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type HostRow = {
  user_id: string;
  name: string | null;
  city: string | null;
  org_name: string | null;
  host_types: string[];
};

type Props = {
  type: string;           // 'priest' | 'guru' | 'temple_exec'
  label: string;          // 'Priests' | 'Spiritual Gurus' | 'Temples'
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  emptyPrompt: string;    // shown when no records exist
};

function HostCard({ row, type }: { row: HostRow; type: string }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initial = ((row.name ?? row.org_name ?? '?')[0] ?? '?').toUpperCase();
  const displayName = row.name ?? row.org_name ?? '—';
  const sub = [row.org_name && type !== 'temple_exec' ? row.org_name : null, row.city]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => nav.navigate('AdminHostsManage', { filterType: type })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        {!!sub && <Text style={styles.sub} numberOfLines={1}>{sub}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

export default function AdminHostSection({ type, label, icon, emptyPrompt }: Props) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rows, setRows] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('host_accounts')
        .select('user_id, name, city, org_name, host_types')
        .contains('host_types', [type])
        .order('created_at', { ascending: false })
        .limit(5);
      setRows((data as HostRow[]) ?? []);
      setLoading(false);
    })();
  }, [type]);

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.maroon} />
        <Text style={styles.headerText}>{label}</Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => nav.navigate('AdminHostsManage', { filterType: type })}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color={colors.saffron} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.listBox}>
        {loading && (
          <ActivityIndicator size="small" color={colors.turmeric} style={{ marginVertical: 10 }} />
        )}

        {!loading && rows.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{emptyPrompt}</Text>
            <TouchableOpacity
              style={styles.onboardBtn}
              onPress={() => nav.navigate('AdminHosts')}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={14} color={colors.saffron} />
              <Text style={styles.onboardText}>Onboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {rows.map((row) => (
          <HostCard key={row.user_id} row={row} type={type} />
        ))}

        {/* Onboard new link */}
        {rows.length > 0 && (
          <TouchableOpacity
            style={styles.onboardRow}
            onPress={() => nav.navigate('AdminHosts')}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={15} color={colors.saffron} />
            <Text style={styles.onboardRowText}>Onboard a new {label.replace(/s$/, '').toLowerCase()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(233,115,31,0.1)',
    borderRadius: radius.pill,
  },
  viewAllText: { fontSize: 12, fontWeight: '700', color: colors.saffron },
  listBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 11, color: colors.muted },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  emptyText: { fontSize: 13, color: colors.muted, fontStyle: 'italic' },
  onboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(233,115,31,0.1)',
    borderRadius: radius.pill,
  },
  onboardText: { fontSize: 12, fontWeight: '700', color: colors.saffron },
  onboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  onboardRowText: { fontSize: 12, color: colors.saffron, fontWeight: '600' },
});
