import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Card, Title, Muted, Button, LiveBadge } from '../components/ui';
import { useBreakpoint } from '../lib/useBreakpoint';
import WebPageWrapper from '../components/WebPageWrapper';
import { t } from '../i18n';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Meeting = {
  id: string;
  title: string;
  deity_name: string | null;
  host_id: string;
  start_date: string | null;
  start_time: string | null;
  host_name?: string;
};

function formatTime(date: string | null, time: string | null): string {
  if (!date && !time) return '';
  const d = date ? new Date(`${date}T${time ?? '00:00'}`) : null;
  if (!d || isNaN(d.getTime())) return time ?? date ?? '';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function JoinMeetingScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDesktop } = useBreakpoint();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        setMeetings([]);
        return;
      }
      const { data, error: fetchErr } = await supabase
        .from('host_meetings')
        .select('id, title, deity_name, host_id, start_date, start_time')
        .eq('is_public', true)
        .order('start_date', { ascending: true, nullsFirst: false })
        .limit(30);

      if (fetchErr) throw fetchErr;

      const rows = (data ?? []) as Meeting[];

      // Enrich with host names from hosts_public (best-effort).
      if (rows.length > 0) {
        const hostIds = [...new Set(rows.map((r) => r.host_id))];
        const { data: hosts } = await supabase
          .from('hosts_public')
          .select('user_id, name')
          .in('user_id', hostIds);

        const nameMap: Record<string, string> = {};
        (hosts ?? []).forEach((h: any) => { nameMap[h.user_id] = h.name; });
        rows.forEach((r) => { r.host_name = nameMap[r.host_id] ?? undefined; });
      }

      setMeetings(rows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not load meetings.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const join = (meeting: Meeting) =>
    nav.navigate('LiveRoom', {
      meetingId: meeting.id,
      title: meeting.title,
      deityName: meeting.deity_name ?? undefined,
      hostId: meeting.host_id,
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isDesktop && (
        <View style={styles.topbar}>
          <Text style={styles.title}>🎥 {t('joinMeeting.title')}</Text>
        </View>
      )}
      <WebPageWrapper>
        <ScrollView
          contentContainerStyle={[styles.body, isDesktop && styles.bodyDesktop]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.turmeric} />
          }
        >
          {isDesktop && <Text style={styles.pageTitle}>🎥 {t('joinMeeting.title')}</Text>}

          <Text style={styles.section}>{t('joinMeeting.liveNow')}</Text>

          {loading && (
            <Text style={styles.loadingText}>Loading meetings…</Text>
          )}

          {!!error && (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Button label="Retry" onPress={() => load()} />
            </Card>
          )}

          {!loading && !error && meetings.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>🕉️  No meetings scheduled right now.</Text>
              <Muted>Pull down to refresh.</Muted>
            </Card>
          )}

          {!loading && meetings.length > 0 && (
            <View style={isDesktop && styles.liveGrid}>
              {meetings.map((m) => (
                <Card key={m.id} style={[styles.liveCard, isDesktop && styles.liveCardDesktop]}>
                  <View style={styles.row}>
                    <View style={styles.thumb}>
                      <Text style={{ fontSize: 20 }}>🪔</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <LiveBadge />
                      <Title>{m.title}</Title>
                      {!!m.deity_name && <Muted>{m.deity_name}</Muted>}
                      {!!m.host_name && <Muted>By {m.host_name}</Muted>}
                      {(!!m.start_date || !!m.start_time) && (
                        <Muted>{formatTime(m.start_date, m.start_time)}</Muted>
                      )}
                    </View>
                  </View>
                  <Button label={t('common.join')} onPress={() => join(m)} />
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </WebPageWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topbar: { backgroundColor: colors.maroon, padding: spacing.lg },
  title: { color: colors.white, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg },
  bodyDesktop: { padding: 32 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.maroon, marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 10, marginBottom: 4 },
  liveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  liveCardDesktop: { flex: 1, minWidth: 280 },
  liveCard: { backgroundColor: '#FFF7EF', borderColor: '#F0D3AD' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: colors.muted, fontSize: 14, marginVertical: 16, textAlign: 'center' },
  errorCard: { backgroundColor: '#FFF0F0' },
  errorText: { color: colors.live, fontSize: 14, marginBottom: 8 },
  emptyCard: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyText: { fontSize: 15, color: colors.ink, textAlign: 'center' },
});
