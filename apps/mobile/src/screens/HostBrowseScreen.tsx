import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { useHostDirectory, type PublicHost } from '../lib/hosts';

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
  const { hosts, followed, follow, unfollow } = useHostDirectory();

  const meta = TYPE_META[filterType] ?? { label: filterType, icon: 'account' as any, accent: colors.maroon };
  const list = hosts.filter((h) => (h.host_types ?? []).includes(filterType));

  useEffect(() => {
    nav.setOptions({ title: `Choose ${meta.label}` });
  }, [filterType]);

  const HostRow = ({ h }: { h: PublicHost }) => {
    const isFollowed = followed.has(h.user_id);
    const initial = ((h.name ?? '?')[0] ?? '?').toUpperCase();
    return (
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: meta.accent }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{h.name || meta.label}</Text>
          {!!h.city && <Text style={styles.city}>{h.city}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.followBtn, isFollowed && styles.followBtnOn]}
          onPress={() => isFollowed ? unfollow(h.user_id) : follow(h.user_id)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isFollowed ? 'check' : 'plus'}
            size={14}
            color={isFollowed ? colors.maroon : '#fff'}
          />
          <Text style={[styles.followLabel, isFollowed && styles.followLabelOn]}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
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
});
