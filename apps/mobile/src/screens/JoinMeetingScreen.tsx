import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Card, Title, Muted, Button, LiveBadge } from '../components/ui';
import { useBreakpoint } from '../lib/useBreakpoint';
import WebPageWrapper from '../components/WebPageWrapper';
import { t } from '../i18n';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Meeting = {
  id: string;
  title: string;
  deity_name: string | null;
  host_id: string;
  start_date: string | null;
  start_time: string | null;
  when_text: string | null;
  host_name?: string;
  host_status?: string;
  host_types?: string[];
};

const HOST_EMOJI: Record<string, string> = {
  priest: '🪔', guru: '🧘', temple_exec: '🛕',
  astrologer: '⭐', numerologist: '🔢',
};
function hostEmoji(types?: string[]): string {
  for (const ty of (types ?? [])) if (HOST_EMOJI[ty]) return HOST_EMOJI[ty];
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

export default function JoinMeetingScreen() {
  const { session } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDesktop } = useBreakpoint();

  const [liveMeetings, setLiveMeetings] = useState<Meeting[]>([]);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowingAnyone, setIsFollowingAnyone] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      if (!isSupabaseConfigured || !session?.user.id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 1. Get followed host IDs
      const { data: followRows } = await supabase
        .from('follows')
        .select('host_id')
        .eq('follower_id', session.user.id);

      const hostIds = (followRows ?? []).map((r: any) => r.host_id as string);
      if (hostIds.length === 0) {
        setIsFollowingAnyone(false);
        setLiveMeetings([]);
        setUpcoming([]);
        return;
      }
      setIsFollowingAnyone(true);

      // 2. Get host details (name, types, availability_status)
      const { data: hostRows } = await supabase
        .from('hosts_public')
        .select('user_id, name, host_types, availability_status')
        .in('user_id', hostIds);

      const hostMap: Record<string, any> = {};
      (hostRows ?? []).forEach((h: any) => { hostMap[h.user_id] = h; });

      // 3. Get meetings from those hosts
      const today = new Date().toISOString().slice(0, 10);
      const { data: meetingRows, error: fetchErr } = await supabase
        .from('host_meetings')
        .select('id, title, deity_name, host_id, start_date, start_time, when_text')
        .in('host_id', hostIds)
        .or(`start_date.gte.${today},start_date.is.null`)
        .order('start_date', { ascending: true, nullsFirst: false })
        .limit(40);

      if (fetchErr) throw fetchErr;

      const enriched: Meeting[] = (meetingRows ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        deity_name: m.deity_name,
        host_id: m.host_id,
        start_date: m.start_date,
        start_time: m.start_time,
        when_text: m.when_text,
        host_name: hostMap[m.host_id]?.name ?? 'Host',
        host_status: hostMap[m.host_id]?.availability_status ?? 'offline',
        host_types: hostMap[m.host_id]?.host_types ?? [],
      }));

      // Split: Live = host is currently live/available, Upcoming = rest
      const live = enriched.filter((m) => m.host_status === 'live' || m.host_status === 'available');
      const upcomingList = enriched.filter((m) => m.host_status !== 'live' && m.host_status !== 'available');

      setLiveMeetings(live);
      setUpcoming(upcomingList);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load meetings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const join = (m: Meeting) =>
    nav.navigate('LiveRoom', {
      meetingId: m.id,
      title: m.title,
      deityName: m.deity_name ?? undefined,
      hostId: m.host_id,
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isDesktop && (
        <View style={styles.topbar}>
          <Text style={styles.topTitle}>🎥 {t('joinMeeting.title')}</Text>
        </View>
      )}
      <WebPageWrapper>
        <ScrollView
          contentContainerStyle={[styles.body, isDesktop && styles.bodyDesktop]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.turmeric}
            />
          }
        >
          {isDesktop && <Text style={styles.pageTitle}>🎥 {t('joinMeeting.title')}</Text>}

          {loading && (
            <View style={styles.centred}>
              <ActivityIndicator size="large" color={colors.maroon} />
              <Text style={styles.loadText}>Loading meetings…</Text>
            </View>
          )}

          {!!error && !loading && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Button label="Retry" onPress={() => load()} />
            </Card>
          )}

          {!loading && !error && !isFollowingAnyone && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🙏</Text>
              <Title>No hosts followed yet</Title>
              <Muted style={{ textAlign: 'center' }}>
                Follow a priest, guru, temple, astrologer or numerologist from the Home screen to see their live and scheduled meetings here.
              </Muted>
            </Card>
          )}

          {!loading && !error && isFollowingAnyone && (
            <>
              {/* ── Live Now ── */}
              <View style={styles.sectionRow}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionLabel}>Live Now</Text>
              </View>

              {liveMeetings.length === 0 ? (
                <Muted style={styles.emptyLine}>None of the hosts you follow are live right now.</Muted>
              ) : (
                <View style={isDesktop ? styles.liveGrid : undefined}>
                  {liveMeetings.map((m) => (
                    <Card key={m.id} style={[styles.liveCard, isDesktop && styles.liveCardDesktop]}>
                      <View style={styles.row}>
                        <View style={styles.thumb}>
                          <Text style={styles.thumbEmoji}>{hostEmoji(m.host_types)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <LiveBadge />
                          <Title>{m.title}</Title>
                          {!!m.host_name && <Muted>By {m.host_name}</Muted>}
                          {!!m.deity_name && <Muted>🕉️ {m.deity_name}</Muted>}
                        </View>
                      </View>
                      <TouchableOpacity style={styles.joinBtn} onPress={() => join(m)}>
                        <MaterialCommunityIcons name="video" size={15} color={colors.white} />
                        <Text style={styles.joinBtnText}>{t('common.join')}</Text>
                      </TouchableOpacity>
                    </Card>
                  ))}
                </View>
              )}

              {/* ── Upcoming ── */}
              <View style={[styles.sectionRow, { marginTop: 20 }]}>
                <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.maroon} />
                <Text style={styles.sectionLabel}>Upcoming Meetings</Text>
              </View>

              {upcoming.length === 0 ? (
                <Muted style={styles.emptyLine}>No upcoming meetings from the hosts you follow.</Muted>
              ) : (
                <View style={isDesktop ? styles.liveGrid : undefined}>
                  {upcoming.map((m) => (
                    <Card key={m.id} style={isDesktop ? styles.liveCardDesktop : undefined}>
                      <View style={styles.row}>
                        <View style={[styles.thumb, styles.thumbUpcoming]}>
                          <Text style={styles.thumbEmoji}>{hostEmoji(m.host_types)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Title>{m.title}</Title>
                          {!!m.host_name && <Muted>By {m.host_name}</Muted>}
                          {!!m.deity_name && <Muted>🕉️ {m.deity_name}</Muted>}
                          <Muted>
                            🕒 {formatWhen(m.start_date, m.start_time, m.when_text)}
                          </Muted>
                        </View>
                      </View>
                      <TouchableOpacity style={[styles.joinBtn, styles.joinBtnUpcoming]} onPress={() => join(m)}>
                        <MaterialCommunityIcons name="video" size={15} color={colors.white} />
                        <Text style={styles.joinBtnText}>{t('common.join')}</Text>
                      </TouchableOpacity>
                    </Card>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </WebPageWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topbar: { backgroundColor: colors.maroon, padding: spacing.lg },
  topTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg },
  bodyDesktop: { padding: 32 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.maroon, marginBottom: 16 },

  centred: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadText: { color: colors.muted, fontSize: 14 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#E74C3C' },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: colors.ink,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emptyLine: { marginBottom: 8, fontStyle: 'italic' },

  liveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  liveCard: { backgroundColor: '#FFF7EF', borderColor: '#F0D3AD' },
  liveCardDesktop: { flex: 1, minWidth: 280 },

  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumb: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbUpcoming: { backgroundColor: '#E8EAF6' },
  thumbEmoji: { fontSize: 20 },

  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.maroon,
    borderRadius: radius.sm, paddingVertical: 9,
    marginTop: 10,
  },
  joinBtnUpcoming: { backgroundColor: '#1A5276' },
  joinBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  errorCard: { backgroundColor: '#FFF0F0' },
  errorText: { color: colors.live, fontSize: 14, marginBottom: 8 },

  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 36 },
});
