import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { useHostDirectory, type PublicHost } from '../lib/hosts';

// Types that support on-demand personal sessions (FR-57)
const SESSION_TYPES = new Set(['priest', 'astrologer', 'numerologist']);

type Props = NativeStackScreenProps<RootStackParamList, 'HostBrowse'>;

const TYPE_META: Record<string, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; accent: string }> = {
  priest:      { label: 'Priests',          icon: 'account-tie',  accent: '#1B6B4A' },
  guru:        { label: 'Spiritual Gurus',   icon: 'meditation',   accent: '#5E3D9A' },
  temple_exec: { label: 'Temples',           icon: 'town-hall',    accent: '#B85C00' },
  astrologer:  { label: 'Astrologers',       icon: 'star-crescent',accent: '#1A5276' },
  numerologist:{ label: 'Numerologists',     icon: 'numeric',      accent: '#6C3483' },
};

export default function HostBrowseScreen({ route }: Props) {
  const { filterType } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hosts, followed, follow, unfollow, reload } = useHostDirectory();
  const supportsSession = SESSION_TYPES.has(filterType);

  const meta = TYPE_META[filterType] ?? { label: filterType, icon: 'account' as any, accent: colors.maroon };
  const list = hosts.filter((h) => (h.host_types ?? []).includes(filterType));

  useEffect(() => {
    nav.setOptions({ title: `Choose ${meta.label}` });
  }, [filterType]);

  useFocusEffect(useCallback(() => { reload(); }, []));

  const showErr = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const HostRow = ({ h }: { h: PublicHost }) => {
    const isFollowed = followed.has(h.user_id);
    const [busy, setBusy] = useState(false);
    const initial = ((h.name ?? '?')[0] ?? '?').toUpperCase();

    const toggle = async () => {
      setBusy(true);
      const err = isFollowed ? await unfollow(h.user_id) : await follow(h.user_id);
      if (err) showErr(`Could not update: ${err}`);
      setBusy(false);
    };

    const isTemple = (h.host_types ?? []).includes('temple_exec');
    const displayName = isTemple ? (h.org_name || h.name || meta.label) : (h.name || meta.label);
    const displaySub = isTemple
      ? [h.location, h.city].filter(Boolean).join(', ')
      : h.city;

    const status = h.availability_status ?? 'offline';
    const statusDot = status === 'live' ? '🔴' : status === 'available' ? '🟢' : '⚫';
    const statusLabel = status === 'live' ? 'Live' : status === 'available' ? 'Available' : 'Offline';

    return (
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: meta.accent }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.name}>{displayName}</Text>
            {/* Show availability for all host types */}
            {status !== 'offline' && (
              <View style={[
                styles.statusPill,
                status === 'live' ? styles.statusPillLive : styles.statusPillAvail,
              ]}>
                <View style={[styles.statusDot, status === 'live' ? styles.dotLive : styles.dotAvail]} />
                <Text style={[styles.statusLabel, status === 'live' ? styles.statusLive : styles.statusAvail]}>
                  {statusLabel}
                </Text>
              </View>
            )}
          </View>
          {!!displaySub && <Text style={styles.city}>{displaySub}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {supportsSession && (status === 'available' || status === 'live') && (
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => nav.navigate('SessionRequest', {
                hostId: h.user_id,
                hostName: displayName,
                hostType: filterType,
              })}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calendar-plus" size={13} color={meta.accent} />
              <Text style={[styles.requestLabel, { color: meta.accent }]}>Request</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.followBtn, isFollowed && styles.followBtnOn, busy && { opacity: 0.5 }]}
            onPress={toggle}
            disabled={busy}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isFollowed ? 'check' : 'plus'}
              size={14}
              color={isFollowed ? colors.maroon : '#fff'}
            />
            <Text style={[styles.followLabel, isFollowed && styles.followLabelOn]}>
              {busy ? '…' : isFollowed ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const mine = list.filter((h) => followed.has(h.user_id));
  const others = list.filter((h) => !followed.has(h.user_id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      {list.length === 0 && (
        <Text style={styles.empty}>No {meta.label.toLowerCase()} available yet.</Text>
      )}

      {mine.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Following</Text>
          <View style={styles.listBox}>
            {mine.map((h) => <HostRow key={h.user_id} h={h} />)}
          </View>
        </>
      )}

      {others.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>{mine.length > 0 ? 'Others' : `All ${meta.label}`}</Text>
          <View style={styles.listBox}>
            {others.map((h) => <HostRow key={h.user_id} h={h} />)}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 16,
  },
  listBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  city: { fontSize: 12, color: colors.muted, marginTop: 1 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followBtnOn: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.maroon,
  },
  followLabel: { fontSize: 12, fontWeight: '700', color: '#fff' },
  followLabelOn: { color: colors.maroon },
  empty: { fontSize: 14, color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3,
  },
  statusPillLive:  { backgroundColor: '#FDE8E8' },
  statusPillAvail: { backgroundColor: '#E8F5E9' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotLive:  { backgroundColor: '#C0392B' },
  dotAvail: { backgroundColor: '#1B6B4A' },
  statusLabel: { fontSize: 10, fontWeight: '800' },
  statusLive:  { color: '#C0392B' },
  statusAvail: { color: '#1B6B4A' },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: colors.cream,
  },
  requestLabel: { fontSize: 11, fontWeight: '700' },
});
