import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type SessionRequest = {
  id: string;
  devotee_id: string;
  devotee_name: string | null;
  devotee_phone: string | null;
  service_type: string;
  description: string | null;
  status: string;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#C8860A',
  accepted: '#1B6B4A',
  declined: colors.muted,
  meeting_started: colors.maroon,
  completed: '#5E3D9A',
};

export default function HostRequestsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const uid = session?.user.id;
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('session_requests')
      .select('id,devotee_id,devotee_name,devotee_phone,service_type,description,status,created_at')
      .eq('host_id', uid)
      .order('created_at', { ascending: false });
    setRequests((data as SessionRequest[]) ?? []);
    setLoading(false);
  }, [uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('session_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    load();
  };

  const confirmDecline = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Decline this request?')) updateStatus(id, 'declined');
    } else {
      Alert.alert('Decline Request', 'Are you sure you want to decline?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => updateStatus(id, 'declined') },
      ]);
    }
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const openChat = (req: SessionRequest) => {
    updateStatus(req.id, 'accepted');
    nav.navigate('DirectChat', {
      requestId: req.id,
      otherUserId: req.devotee_id,
      otherName: req.devotee_name ?? 'Devotee',
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.maroon} size="large" />
      </View>
    );
  }

  const active = requests.filter((r) => r.status !== 'declined' && r.status !== 'completed');
  const past = requests.filter((r) => r.status === 'declined' || r.status === 'completed');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      {requests.length === 0 && (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color={colors.muted} />
          <Text style={styles.empty}>No session requests yet.</Text>
          <Text style={styles.emptySub}>Set your status to "Available" so devotees can send requests.</Text>
        </View>
      )}

      {active.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Pending & Active</Text>
          {active.map((req) => (
            <View key={req.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(req.devotee_name?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.devoteeName}>{req.devotee_name ?? 'Devotee'}</Text>
                  <Text style={styles.time}>{formatTime(req.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[req.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[req.status] }]}>
                    {req.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Service */}
              <View style={styles.serviceRow}>
                <MaterialCommunityIcons name="hand-extended" size={14} color={colors.maroon} />
                <Text style={styles.serviceType}>{req.service_type}</Text>
              </View>
              {!!req.description && (
                <Text style={styles.description}>{req.description}</Text>
              )}

              {/* Phone */}
              {!!req.devotee_phone && (
                <TouchableOpacity
                  style={styles.phoneRow}
                  onPress={() => callPhone(req.devotee_phone!)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="phone" size={15} color="#1B6B4A" />
                  <Text style={styles.phoneText}>{req.devotee_phone}</Text>
                  <Text style={styles.callTap}>Tap to call</Text>
                </TouchableOpacity>
              )}

              {/* Actions */}
              {req.status === 'pending' || req.status === 'accepted' ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => openChat(req)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="chat" size={15} color="#fff" />
                    <Text style={styles.chatBtnText}>Open Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => confirmDecline(req.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : req.status === 'meeting_started' ? (
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => openChat(req)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="video" size={15} color="#fff" />
                  <Text style={styles.chatBtnText}>Back to Chat / Meeting</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </>
      )}

      {past.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Past Requests</Text>
          {past.map((req) => (
            <View key={req.id} style={[styles.card, styles.cardFaded]}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
                  <Text style={styles.avatarText}>{(req.devotee_name?.[0] ?? '?').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.devoteeName}>{req.devotee_name ?? 'Devotee'}</Text>
                  <Text style={styles.serviceType}>{req.service_type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[req.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[req.status] }]}>
                    {req.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  empty: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', maxWidth: 260, lineHeight: 19 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardFaded: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  devoteeName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  time: { fontSize: 11, color: colors.muted, marginTop: 1 },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceType: { fontSize: 13, fontWeight: '600', color: colors.maroon },
  description: { fontSize: 13, color: colors.ink, lineHeight: 19 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF5EE',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  phoneText: { fontSize: 14, fontWeight: '700', color: '#1B6B4A', flex: 1 },
  callTap: { fontSize: 11, color: '#1B6B4A', opacity: 0.7 },
  actions: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingVertical: 10,
  },
  chatBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  declineBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  declineBtnText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
});
