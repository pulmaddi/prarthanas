import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'PoojaBooking'>;

export default function PoojaBookingScreen({ route }: Props) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { poojaId, poojaName, amountPaise, deityName } = route.params;
  const { session, profile } = useAuth();

  const [sankalpaNative, setSankalpaNative] = useState('');
  const [gotra, setGotra] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.name) setSankalpaNative(profile.name);
  }, [profile]);

  const fmtFee = amountPaise === 0 ? 'Free' : `₹${Math.round(amountPaise / 100)}`;

  const handleConfirm = async () => {
    if (!session?.user.id) {
      Alert.alert('Error', 'Please log in to book a pooja.');
      return;
    }
    if (!sankalpaNative.trim()) {
      Alert.alert('Required', 'Please enter the name for Sankalpa.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('pooja_bookings').insert({
        devotee_id: session.user.id,
        pooja_id: poojaId,
        pooja_name: poojaName,
        amount_paise: amountPaise,
        status: 'pending',
        payment_status: amountPaise === 0 ? 'paid' : 'paid', // dummy: mark paid
        devotee_name: profile?.name ?? '',
        devotee_phone: phone.trim() || null,
        sankalpa_name: sankalpaNative.trim(),
        sankalpa_gotra: gotra.trim() || null,
        notes: notes.trim() || null,
        preferred_date: preferredDate.trim() || null,
        preferred_time: preferredTime.trim() || null,
      });
      if (error) throw error;
      setConfirmed(true);
    } catch (e: any) {
      Alert.alert('Booking failed', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <View style={styles.successRoot}>
        <MaterialCommunityIcons name="check-circle" size={72} color="#1B6B4A" />
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSub}>
          Your booking for <Text style={{ fontWeight: '800' }}>{poojaName}</Text> has been placed.{'\n'}
          A priest or temple coordinator will accept it shortly.
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => nav.navigate('Main')}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.root} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Pooja summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryPooja}>{poojaName}</Text>
          {!!deityName && <Text style={styles.summaryDeity}>🕉️ {deityName}</Text>}
          <Text style={styles.summaryFee}>{fmtFee}</Text>
        </View>

        <Text style={styles.sectionLabel}>Sankalpa Details</Text>
        <Text style={styles.hint}>Sankalpa is the sacred intent; the priest will recite this name during the puja.</Text>

        <Text style={styles.fieldLabel}>Your name (for Sankalpa) *</Text>
        <TextInput
          style={styles.input}
          value={sankalpaNative}
          onChangeText={setSankalpaNative}
          placeholder="e.g. Ramesh Kumar"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.fieldLabel}>Gotra (family lineage)</Text>
        <TextInput
          style={styles.input}
          value={gotra}
          onChangeText={setGotra}
          placeholder="e.g. Kashyapa (optional)"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.sectionLabel}>Contact & Scheduling</Text>

        <Text style={styles.fieldLabel}>Your phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
        />

        <Text style={styles.fieldLabel}>Preferred date (e.g. 2026-11-01)</Text>
        <TextInput
          style={styles.input}
          value={preferredDate}
          onChangeText={setPreferredDate}
          placeholder="YYYY-MM-DD (optional)"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.fieldLabel}>Preferred time</Text>
        <TextInput
          style={styles.input}
          value={preferredTime}
          onChangeText={setPreferredTime}
          placeholder="e.g. 7:00 AM (optional)"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.fieldLabel}>Special notes for priest</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any specific requirements or dedication..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
        />

        {/* Dummy payment notice */}
        <View style={styles.paymentBox}>
          <MaterialCommunityIcons name="shield-check" size={18} color="#1B6B4A" />
          <Text style={styles.paymentText}>
            Payment of <Text style={{ fontWeight: '800' }}>{fmtFee}</Text> will be collected by the priest at the time of the puja.
          </Text>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirm Booking — {fmtFee}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 50 },
  summaryCard: {
    backgroundColor: colors.maroon,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryPooja: { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' },
  summaryDeity: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  summaryFee: { fontSize: 26, fontWeight: '900', color: colors.turmeric, marginTop: 6 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 20,
  },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 14, lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  paymentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1B6B4A12',
    borderRadius: radius.md,
    padding: 14,
    marginTop: 24,
  },
  paymentText: { flex: 1, fontSize: 13, color: '#1B6B4A', lineHeight: 19 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.maroon,
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: 20,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1B6B4A', marginTop: 20, marginBottom: 12 },
  successSub: { fontSize: 15, color: colors.ink, textAlign: 'center', lineHeight: 22 },
  doneBtn: {
    backgroundColor: colors.maroon,
    borderRadius: radius.md,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 32,
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
