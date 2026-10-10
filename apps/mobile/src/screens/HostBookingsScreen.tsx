import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Booking = {
  id: string;
  pooja_name: string;
  status: string;
  payment_status: string;
  amount_paise: number;
  devotee_name: string | null;
  devotee_phone: string | null;
  sankalpa_name: string | null;
  sankalpa_gotra: string | null;
  notes: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  created_at: string;
  host_id: string | null;
};

export default function HostBookingsScreen() {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('pooja_bookings')
      .select('id,pooja_name,status,payment_status,amount_paise,devotee_name,devotee_phone,sankalpa_name,sankalpa_gotra,notes,preferred_date,preferred_time,created_at,host_id')
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, [session?.user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async (id: string) => {
    setActingOn(id);
    const { error } = await supabase
      .from('pooja_bookings')
      .update({ host_id: session?.user.id, status: 'accepted' })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    await load();
    setActingOn(null);
  };

  const decline = (id: string) => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setActingOn(id);
          const { error } = await supabase
            .from('pooja_bookings')
            .update({ status: 'declined' })
            .eq('id', id);
          if (error) Alert.alert('Error', error.message);
          await load();
          setActingOn(null);
        },
      },
    ]);
  };

  const complete = (id: string) => {
    Alert.alert('Mark Complete', 'Mark this pooja as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setActingOn(id);
          const { error } = await supabase
            .from('pooja_bookings')
            .update({ status: 'completed' })
            .eq('id', id);
          if (error) Alert.alert('Error', error.message);
          await load();
          setActingOn(null);
        },
      },
    ]);
  };

  const pending = bookings.filter((b) => b.status === 'pending' && b.host_id === null);
  const accepted = bookings.filter((b) => b.status === 'accepted' && b.host_id === session?.user.id);

  const fmtFee = (paise: number) => paise === 0 ? 'Free' : `₹${Math.round(paise / 100)}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const renderBooking = (b: Booking, mine: boolean) => (
    <View key={b.id} style={[styles.card, mine && styles.cardMine]}>
      {mine && (
        <View style={styles.acceptedBadge}>
          <Text style={styles.acceptedBadgeText}>Accepted by you</Text>
        </View>
      )}
      <Text style={styles.poojaName}>{b.pooja_name}</Text>
      <Text style={styles.feeText}>{fmtFee(b.amount_paise)}</Text>

      <View style={styles.detailGrid}>
        {!!b.devotee_name && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Devotee</Text>
            <Text style={styles.detailValue}>{b.devotee_name}</Text>
          </View>
        )}
        {!!b.sankalpa_name && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sankalpa Name</Text>
            <Text style={styles.detailValue}>{b.sankalpa_name}</Text>
          </View>
        )}
        {!!b.sankalpa_gotra && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Gotra</Text>
            <Text style={styles.detailValue}>{b.sankalpa_gotra}</Text>
          </View>
        )}
        {!!b.devotee_phone && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{b.devotee_phone}</Text>
          </View>
        )}
        {!!b.preferred_date && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Preferred Date</Text>
            <Text style={styles.detailValue}>{b.preferred_date}</Text>
          </View>
        )}
        {!!b.preferred_time && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Preferred Time</Text>
            <Text style={styles.detailValue}>{b.preferred_time}</Text>
          </View>
        )}
      </View>

      {!!b.notes && (
        <View style={styles.notes}>
          <Text style={styles.detailLabel}>Notes</Text>
          <Text style={styles.notesText}>{b.notes}</Text>
        </View>
      )}

      <Text style={styles.bookingDate}>Booked {fmtDate(b.created_at)}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        {b.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn, actingOn === b.id && styles.disabled]}
              onPress={() => accept(b.id)}
              disabled={actingOn === b.id}
              activeOpacity={0.82}
            >
              {actingOn === b.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn, actingOn === b.id && styles.disabled]}
              onPress={() => decline(b.id)}
              disabled={actingOn === b.id}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons name="close" size={14} color={colors.maroon} />
              <Text style={[styles.actionBtnText, { color: colors.maroon }]}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
        {b.status === 'accepted' && mine && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn, actingOn === b.id && styles.disabled]}
            onPress={() => complete(b.id)}
            disabled={actingOn === b.id}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons name="check-all" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.maroon} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        >
          {pending.length === 0 && accepted.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="calendar-remove-outline" size={56} color={colors.muted} />
              <Text style={styles.emptyTitle}>No new bookings</Text>
              <Text style={styles.emptySub}>New pooja booking requests will appear here.</Text>
            </View>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <Text style={styles.groupTitle}>🔔 New Requests ({pending.length})</Text>
                  {pending.map((b) => renderBooking(b, false))}
                </>
              )}
              {accepted.length > 0 && (
                <>
                  <Text style={styles.groupTitle}>✅ Your Accepted Bookings</Text>
                  {accepted.map((b) => renderBooking(b, true))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingBottom: 40 },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.maroon,
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardMine: {
    borderLeftWidth: 4,
    borderLeftColor: '#1B6B4A',
  },
  acceptedBadge: {
    backgroundColor: '#1B6B4A18',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  acceptedBadgeText: { fontSize: 11, color: '#1B6B4A', fontWeight: '700' },
  poojaName: { fontSize: 16, fontWeight: '900', color: colors.ink, marginBottom: 2 },
  feeText: { fontSize: 14, fontWeight: '700', color: colors.maroon, marginBottom: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  detailItem: { minWidth: 120 },
  detailLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailValue: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  notes: { marginBottom: 8 },
  notesText: { fontSize: 13, color: colors.ink, lineHeight: 18, marginTop: 2 },
  bookingDate: { fontSize: 11, color: colors.muted, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  acceptBtn: { backgroundColor: '#1B6B4A' },
  declineBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.maroon },
  completeBtn: { backgroundColor: colors.maroon },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.muted },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
