import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionRequest'>;

const SERVICE_TYPES: Record<string, string[]> = {
  priest: [
    'Satyanarayana Pooja',
    'Ganesh Pooja',
    'Lakshmi Pooja',
    'Griha Pravesh / House Warming',
    'Navagraha Pooja',
    'Vastu Pooja',
    'Wedding Rituals',
    'Naming Ceremony',
    'Other Pooja',
  ],
  astrologer: [
    'Birth Chart / Kundali Reading',
    'Marriage Compatibility',
    'Career & Finance Guidance',
    'Health & Well-being',
    'Muhurta (Auspicious timing)',
    'General Life Guidance',
  ],
  numerologist: [
    'Name Numerology',
    'Life Path Number Reading',
    'Business Name Analysis',
    'Lucky Number Consultation',
    'General Numerology Reading',
  ],
};

export default function SessionRequestScreen({ route }: Props) {
  const { hostId, hostName, hostType } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, profile } = useAuth();
  const uid = session?.user.id;

  const serviceOptions = SERVICE_TYPES[hostType] ?? ['General Consultation'];

  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState((profile as any)?.phone ?? '');
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showErr = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const submit = async () => {
    if (!uid) return showErr('Please sign in first.');
    if (!selectedService) return showErr('Please select a service type.');
    if (!phone.trim()) return showErr('Please enter your phone number.');
    if (!consented) return showErr('Please confirm that you consent to sharing your phone number.');

    setSubmitting(true);
    const { error } = await supabase.from('session_requests').insert({
      devotee_id: uid,
      host_id: hostId,
      service_type: selectedService,
      description: description.trim() || null,
      devotee_phone: phone.trim(),
      devotee_name: (profile as any)?.name ?? null,
      status: 'pending',
    });
    setSubmitting(false);

    if (error) return showErr(`Could not send request: ${error.message}`);

    if (Platform.OS === 'web') {
      window.alert(`Your request has been sent to ${hostName}. They will contact you shortly.`);
    } else {
      Alert.alert('Request Sent', `Your request has been sent to ${hostName}. They will contact you shortly.`);
    }
    nav.goBack();
  };

  const typeLabel: Record<string, string> = {
    priest: 'Priest',
    astrologer: 'Astrologer',
    numerologist: 'Numerologist',
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.hostCard}>
        <View style={[styles.avatar, { backgroundColor: colors.maroon }]}>
          <Text style={styles.avatarText}>{(hostName[0] ?? '?').toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.hostName}>{hostName}</Text>
          <Text style={styles.hostType}>{typeLabel[hostType] ?? hostType}</Text>
        </View>
      </View>

      {/* Service type picker */}
      <Text style={styles.label}>Type of Service *</Text>
      <View style={styles.chipGrid}>
        {serviceOptions.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedService === s && styles.chipSelected]}
            onPress={() => setSelectedService(s)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedService === s && styles.chipTextSelected]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Additional Details (optional)</Text>
      <TextInput
        style={styles.textarea}
        placeholder="E.g. family names, gotra, specific requirements, preferred language…"
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      {/* Phone */}
      <Text style={styles.label}>Your Phone Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="+91 98765 43210"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Consent */}
      <TouchableOpacity style={styles.consentRow} onPress={() => setConsented(!consented)} activeOpacity={0.8}>
        <View style={[styles.checkbox, consented && styles.checkboxChecked]}>
          {consented && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
        </View>
        <Text style={styles.consentText}>
          I agree to share my phone number with {hostName} for this session request only.
        </Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (!selectedService || !phone || !consented || submitting) && styles.submitBtnOff]}
        onPress={submit}
        disabled={!selectedService || !phone || !consented || submitting}
        activeOpacity={0.85}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <>
              <MaterialCommunityIcons name="send" size={16} color="#fff" />
              <Text style={styles.submitLabel}>Send Request</Text>
            </>
        }
      </TouchableOpacity>

      <Text style={styles.note}>
        The {typeLabel[hostType] ?? 'host'} will contact you via in-app chat or phone call to confirm the session.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 48 },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  hostName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  hostType: { fontSize: 12, color: colors.muted, marginTop: 2 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  chipSelected: { borderColor: colors.maroon, backgroundColor: colors.maroon },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 20,
  },
  textarea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 24 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.maroon },
  consentText: { fontSize: 13, color: colors.ink, flex: 1, lineHeight: 19 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginBottom: 16,
  },
  submitBtnOff: { opacity: 0.45 },
  submitLabel: { fontSize: 15, fontWeight: '800', color: '#fff' },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },
});
