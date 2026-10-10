import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { Card, Title, Muted, Button } from './ui';
import SectionHeader from './SectionHeader';
import { t } from '../i18n';
import { useHostContent, type Meeting } from '../lib/hostContent';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// Host types that support on-demand sessions
const SESSION_HOST_TYPES = new Set(['priest', 'astrologer', 'numerologist']);
// Host types that receive pooja booking requests
const BOOKING_HOST_TYPES = new Set(['priest', 'temple_exec']);

type AvailStatus = 'available' | 'live' | 'offline';

const STATUS_META: Record<AvailStatus, { dot: string; label: string; next: AvailStatus; color: string }> = {
  available: { dot: '🟢', label: 'Available', next: 'offline', color: '#1B6B4A' },
  live:      { dot: '🔴', label: 'Live',      next: 'offline', color: '#C0392B' },
  offline:   { dot: '⚫', label: 'Offline',   next: 'available', color: colors.muted },
};

export default function HostHomeSections({
  onOpenMeetings,
  onOpenNotifications,
  onOpenRoom,
}: {
  onOpenMeetings: () => void;
  onOpenNotifications: () => void;
  onOpenRoom: (m: Meeting) => void;
}) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { meetings, notifications, reload } = useHostContent();
  const { session, hostTypes } = useAuth();
  const uid = session?.user.id;

  const supportsSession = (hostTypes ?? []).some((t) => SESSION_HOST_TYPES.has(t));
  const supportsBookings = (hostTypes ?? []).some((t) => BOOKING_HOST_TYPES.has(t));

  const [availStatus, setAvailStatus] = useState<AvailStatus>('offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('host_accounts')
      .select('availability_status')
      .eq('user_id', uid)
      .single();
    if (data?.availability_status) setAvailStatus(data.availability_status as AvailStatus);
  }, [uid]);

  const loadPendingCount = useCallback(async () => {
    if (!uid || !supportsSession) return;
    const { count } = await supabase
      .from('session_requests')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', uid)
      .in('status', ['pending', 'accepted', 'meeting_started']);
    setPendingCount(count ?? 0);
  }, [uid, supportsSession]);

  const loadBookingCount = useCallback(async () => {
    if (!uid || !supportsBookings) return;
    const { count } = await supabase
      .from('pooja_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('host_id', null);
    setBookingCount(count ?? 0);
  }, [uid, supportsBookings]);

  useFocusEffect(useCallback(() => {
    reload();
    loadAvailability();
    loadPendingCount();
    loadBookingCount();
  }, [reload, loadAvailability, loadPendingCount, loadBookingCount]));

  const toggleStatus = async () => {
    if (!uid) return;
    setTogglingStatus(true);
    const next = availStatus === 'offline' ? 'available' : 'offline';
    await supabase
      .from('host_accounts')
      .update({ availability_status: next })
      .eq('user_id', uid);
    setAvailStatus(next);
    setTogglingStatus(false);
  };

  const meta = STATUS_META[availStatus];

  return (
    <>
      {/* Availability toggle — only for priest/astrologer/numerologist */}
      {supportsSession && (
        <View style={styles.availCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.availTitle}>Your Availability</Text>
            <Text style={[styles.availSub, { color: meta.color }]}>
              {meta.dot} {meta.label}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, { borderColor: meta.color }]}
            onPress={toggleStatus}
            disabled={togglingStatus}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, { color: meta.color }]}>
              {togglingStatus ? '…' : availStatus === 'offline' ? 'Go Available' : 'Go Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Session requests — only for priest/astrologer/numerologist */}
      {supportsSession && (
        <TouchableOpacity
          style={styles.requestsRow}
          onPress={() => nav.navigate('HostRequests')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="calendar-account" size={20} color={colors.maroon} />
          <Text style={styles.requestsLabel}>Session Requests</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

      {/* Pooja bookings — priest + temple coordinator */}
      {supportsBookings && (
        <TouchableOpacity
          style={styles.requestsRow}
          onPress={() => nav.navigate('HostBookings')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="fire" size={20} color="#C0392B" />
          <Text style={styles.requestsLabel}>Pooja Bookings</Text>
          {bookingCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#C0392B' }]}>
              <Text style={styles.badgeText}>{bookingCount}</Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

      <SectionHeader icon="calendar-clock" title={t('host.meetingInvites')} />
      {meetings.length === 0 ? (
        <Muted style={{ marginTop: 2 }}>{t('host.noMeetingsHome')}</Muted>
      ) : (
        meetings.slice(0, 3).map((m) => (
          <TouchableOpacity key={m.id} activeOpacity={0.85} onPress={() => onOpenRoom(m)}>
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Title>{m.title}</Title>
                  {!!m.when_text && <Muted>🕒 {m.when_text}</Muted>}
                </View>
                <View style={styles.open}>
                  <MaterialCommunityIcons name="video" size={16} color={colors.green} />
                  <Text style={styles.openText}>{t('room.open')}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
      <Button label={`＋ ${t('host.scheduleMeeting')}`} onPress={onOpenMeetings} />

      <SectionHeader icon="bell-ring" title={t('host.notificationMessages')} />
      {notifications.length === 0 ? (
        <Muted style={{ marginTop: 2 }}>{t('host.noNotificationsHome')}</Muted>
      ) : (
        notifications.slice(0, 3).map((n) => (
          <Card key={n.id}>
            <Title>{n.title}</Title>
            {!!n.body && (
              <Text style={styles.body} numberOfLines={2}>
                {n.body}
              </Text>
            )}
          </Card>
        ))
      )}
      <Button
        label={`＋ ${t('host.newNotification')}`}
        onPress={onOpenNotifications}
        variant="green"
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 13, color: colors.ink, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  open: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openText: { color: colors.green, fontWeight: '700', fontSize: 12 },
  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 10,
  },
  availTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  availSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  toggleBtn: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  toggleText: { fontSize: 12, fontWeight: '800' },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 14,
  },
  requestsLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  badge: {
    backgroundColor: colors.maroon,
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
