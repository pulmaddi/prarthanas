// Devotee home feed: shows followed hosts who are live + upcoming meetings.
// Renders nothing when the user follows nobody or there is nothing to show.
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// Host types eligible to show instant/always-open rooms on devotee home
const INSTANT_HOST_TYPES = new Set(['priest', 'guru', 'astrologer', 'numerologist']);

type InstantRoom = {
  id: string;
  title: string;
  deity_name: string | null;
  host_id: string;
  host_name: string;
  host_types: string[];
};

type LiveHost = {
  user_id: string;
  name: string;
  host_types: string[];
  availability_status: 'live' | 'available' | 'offline';
  activeMeeting?: { id: string; title: string; deity_name: string | null };
};

type UpcomingMeeting = {
  id: string;
  title: string;
  deity_name: string | null;
  host_id: string;
  host_name: string;
  start_date: string | null;
  start_time: string | null;
  when_text: string | null;
};

const HOST_EMOJI: Record<string, string> = {
  priest: '🪔',
  guru: '🧘',
  temple_exec: '🛕',
  astrologer: '⭐',
  numerologist: '🔢',
};

function hostEmoji(types: string[]): string {
  for (const ty of types) if (HOST_EMOJI[ty]) return HOST_EMOJI[ty];
  return '🙏';
}

function formatWhen(
  date: string | null,
  time: string | null,
  whenText: string | null,
): string {
  if (whenText) return whenText;
  if (!date && !time) return 'Recurring';
  try {
    const d = new Date(`${date}T${time ?? '09:00'}`);
    if (isNaN(d.getTime())) return time ?? date ?? '';
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return time ?? date ?? '';
  }
}

export default function DevoteeFeed() {
  const { session } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [instantRooms, setInstantRooms] = useState<InstantRoom[]>([]);
  const [liveHosts, setLiveHosts] = useState<LiveHost[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Who does this devotee follow?
      const { data: followRows } = await supabase
        .from('follows')
        .select('host_id')
        .eq('follower_id', session.user.id);

      const hostIds = (followRows ?? []).map((r: any) => r.host_id as string);
      if (hostIds.length === 0) {
        setInstantRooms([]);
        setLiveHosts([]);
        setUpcoming([]);
        return;
      }

      // 2. Get followed host details (availability, name, types)
      const { data: hostRows } = await supabase
        .from('hosts_public')
        .select('user_id, name, host_types, availability_status')
        .in('user_id', hostIds);

      const hostMap: Record<string, any> = {};
      (hostRows ?? []).forEach((h: any) => { hostMap[h.user_id] = h; });

      // 3. Get meetings from followed hosts (today onwards, or recurring/null date)
      const today = new Date().toISOString().slice(0, 10);
      const { data: meetingRows } = await supabase
        .from('host_meetings')
        .select('id, title, deity_name, host_id, start_date, start_time, when_text')
        .in('host_id', hostIds)
        .or(`start_date.gte.${today},start_date.is.null`)
        .order('start_date', { ascending: true, nullsFirst: false })
        .limit(20);

      const allMeetings = meetingRows ?? [];

      // 4a. Instant rooms: no date + no time, from eligible host types
      const instant: InstantRoom[] = allMeetings
        .filter((m: any) => {
          if (m.start_date || m.start_time) return false;
          const types: string[] = hostMap[m.host_id]?.host_types ?? [];
          return types.some((t: string) => INSTANT_HOST_TYPES.has(t));
        })
        .map((m: any) => ({
          id: m.id,
          title: m.title,
          deity_name: m.deity_name,
          host_id: m.host_id,
          host_name: hostMap[m.host_id]?.name ?? 'Host',
          host_types: hostMap[m.host_id]?.host_types ?? [],
        }));

      // 4b. Map each host to their nearest dated upcoming meeting
      const meetingByHost: Record<string, any> = {};
      allMeetings
        .filter((m: any) => m.start_date || m.start_time)
        .forEach((m: any) => {
          if (!meetingByHost[m.host_id]) meetingByHost[m.host_id] = m;
        });

      // 4c. Live hosts (status = live or available) with their active dated meeting
      const live: LiveHost[] = (hostRows ?? [])
        .filter((h: any) => h.availability_status === 'live' || h.availability_status === 'available')
        .map((h: any) => ({
          user_id: h.user_id,
          name: h.name ?? 'Host',
          host_types: h.host_types ?? [],
          availability_status: h.availability_status,
          activeMeeting: meetingByHost[h.user_id] ?? undefined,
        }));

      // 4d. Upcoming dated meetings
      const up: UpcomingMeeting[] = allMeetings
        .filter((m: any) => m.start_date || m.start_time)
        .slice(0, 5)
        .map((m: any) => ({
          id: m.id,
          title: m.title,
          deity_name: m.deity_name,
          host_id: m.host_id,
          host_name: hostMap[m.host_id]?.name ?? 'Host',
          start_date: m.start_date,
          start_time: m.start_time,
          when_text: m.when_text,
        }));

      setInstantRooms(instant);
      setLiveHosts(live);
      setUpcoming(up);
    } catch (e) {
      // Silently swallow — feed is best-effort
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const join = (meetingId: string, title: string, hostId: string, deityName?: string) =>
    nav.navigate('LiveRoom', { meetingId, title, hostId, deityName });

  if (loading) {
    return (
      <View style={styles.loadRow}>
        <ActivityIndicator size="small" color={colors.maroon} />
        <Text style={styles.loadText}>Loading your feed…</Text>
      </View>
    );
  }

  if (instantRooms.length === 0 && liveHosts.length === 0 && upcoming.length === 0) return null;

  return (
    <View style={styles.feed}>
      {/* ── Available Now (instant / always-open rooms) ── */}
      {instantRooms.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#E67E22" />
            <Text style={[styles.sectionTitle, { color: '#E67E22' }]}>Available Now</Text>
          </View>
          {instantRooms.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.instantCard}
              onPress={() => join(r.id, r.title, r.host_id, r.deity_name ?? undefined)}
              activeOpacity={0.85}
            >
              <View style={styles.instantLeft}>
                <View style={styles.instantAvatar}>
                  <Text style={styles.liveEmoji}>{hostEmoji(r.host_types)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.instantTitle}>{r.title}</Text>
                  <Text style={styles.instantHost}>{r.host_name}</Text>
                  {!!r.deity_name && <Text style={styles.instantDeity}>🕉️ {r.deity_name}</Text>}
                </View>
              </View>
              <View style={styles.instantJoin}>
                <MaterialCommunityIcons name="video" size={14} color={colors.white} />
                <Text style={styles.joinBtnText}>Join</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* ── Live Now ── */}
      {liveHosts.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>Live Now</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.liveRow}
          >
            {liveHosts.map((h) => (
              <View key={h.user_id} style={styles.liveCard}>
                <View style={[
                  styles.liveAvatar,
                  h.availability_status === 'live' && styles.liveAvatarLive,
                ]}>
                  <Text style={styles.liveEmoji}>{hostEmoji(h.host_types)}</Text>
                </View>
                <Text style={styles.liveName} numberOfLines={1}>{h.name}</Text>
                <Text style={styles.liveStatus}>
                  {h.availability_status === 'live' ? '🔴 Live' : '🟢 Online'}
                </Text>
                {h.activeMeeting ? (
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() =>
                      join(
                        h.activeMeeting!.id,
                        h.activeMeeting!.title,
                        h.user_id,
                        h.activeMeeting!.deity_name ?? undefined,
                      )
                    }
                  >
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noMeetingText}>No active room</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Upcoming meetings ── */}
      {upcoming.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <MaterialCommunityIcons name="calendar-clock" size={13} color={colors.maroon} />
            <Text style={styles.sectionTitle}>Upcoming from people you follow</Text>
          </View>
          {upcoming.map((m) => (
            <View key={m.id} style={styles.upcomingCard}>
              <View style={styles.upcomingLeft}>
                <Text style={styles.upcomingTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={styles.upcomingMeta} numberOfLines={1}>
                  {m.host_name}
                  {(m.start_date || m.start_time || m.when_text)
                    ? ' · ' + formatWhen(m.start_date, m.start_time, m.when_text)
                    : ''}
                </Text>
                {!!m.deity_name && (
                  <Text style={styles.upcomingDeity} numberOfLines={1}>🕉️ {m.deity_name}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.joinBtnSm}
                onPress={() => join(m.id, m.title, m.host_id, m.deity_name ?? undefined)}
              >
                <MaterialCommunityIcons name="video" size={13} color={colors.white} />
                <Text style={styles.joinBtnSmText}>Join</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: { marginBottom: 14 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadText: { fontSize: 13, color: colors.muted },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, marginBottom: 8,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E74C3C',
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Live strip
  liveRow: { gap: 10, paddingBottom: 4 },
  liveCard: {
    width: 100,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  liveAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.line,
  },
  liveAvatarLive: { borderColor: '#E74C3C' },
  liveEmoji: { fontSize: 22 },
  liveName: { fontSize: 11, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  liveStatus: { fontSize: 10, color: colors.muted, textAlign: 'center' },
  joinBtn: {
    backgroundColor: colors.maroon,
    borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 5,
    marginTop: 2,
  },
  joinBtnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  noMeetingText: { fontSize: 10, color: colors.muted, textAlign: 'center', fontStyle: 'italic' },

  // Instant rooms
  instantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  instantLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  instantAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF3CD',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFE082',
  },
  instantTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  instantHost: { fontSize: 11, color: colors.muted, marginTop: 1 },
  instantDeity: { fontSize: 11, color: colors.muted },
  instantJoin: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E67E22',
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7,
  },

  // Upcoming list
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  upcomingLeft: { flex: 1 },
  upcomingTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  upcomingMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  upcomingDeity: { fontSize: 11, color: colors.muted, marginTop: 1 },
  joinBtnSm: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.maroon,
    borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  joinBtnSmText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
