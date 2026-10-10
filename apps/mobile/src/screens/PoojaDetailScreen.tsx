import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Pooja = {
  id: string;
  name: string;
  name_hi: string | null;
  name_te: string | null;
  category: string;
  deity_name: string | null;
  description: string | null;
  duration_mins: number;
  base_fee_paise: number;
  occasion_type: string | null;
  requires_sankalpa: boolean;
  is_online: boolean;
  required_items: string[] | null;
  notes_for_priest: string | null;
};

const CAT_COLORS: Record<string, string> = {
  personal: '#1A5276', festival: '#B85C00', occasion: '#1B6B4A',
  havan: '#7A0A14', regular: '#5E3D9A',
};

type Props = NativeStackScreenProps<RootStackParamList, 'PoojaDetail'>;

export default function PoojaDetailScreen({ route }: Props) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { poojaId, poojaName } = route.params;
  const [pooja, setPooja] = useState<Pooja | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('pooja_catalog')
      .select('*')
      .eq('id', poojaId)
      .single()
      .then(({ data }) => {
        setPooja(data as Pooja);
        setLoading(false);
      });
  }, [poojaId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.maroon} />
      </View>
    );
  }

  if (!pooja) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Pooja not found.</Text>
      </View>
    );
  }

  const accent = CAT_COLORS[pooja.category] ?? colors.maroon;
  const fmtFee = pooja.base_fee_paise === 0 ? 'Free' : `₹${Math.round(pooja.base_fee_paise / 100)}`;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Header */}
        <View style={[styles.header, { borderLeftColor: accent }]}>
          <Text style={styles.name}>{pooja.name}</Text>
          {!!pooja.name_hi && <Text style={styles.nameHi}>{pooja.name_hi}</Text>}
          {!!pooja.name_te && <Text style={styles.nameHi}>{pooja.name_te}</Text>}
        </View>

        {/* Key details */}
        <View style={styles.pillRow}>
          {!!pooja.deity_name && (
            <View style={[styles.pill, { backgroundColor: accent + '18' }]}>
              <Text style={[styles.pillText, { color: accent }]}>🕉️ {pooja.deity_name}</Text>
            </View>
          )}
          <View style={[styles.pill, { backgroundColor: '#C8860A18' }]}>
            <Text style={[styles.pillText, { color: '#C8860A' }]}>⏱ {pooja.duration_mins} min</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: accent + '18' }]}>
            <Text style={[styles.pillText, { color: accent }]}>{fmtFee}</Text>
          </View>
          {pooja.is_online && (
            <View style={[styles.pill, { backgroundColor: '#1B6B4A18' }]}>
              <Text style={[styles.pillText, { color: '#1B6B4A' }]}>📱 Online</Text>
            </View>
          )}
          {pooja.requires_sankalpa && (
            <View style={[styles.pill, { backgroundColor: '#7A0A1418' }]}>
              <Text style={[styles.pillText, { color: '#7A0A14' }]}>🙏 Sankalpa required</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {!!pooja.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Pooja</Text>
            <Text style={styles.sectionText}>{pooja.description}</Text>
          </View>
        )}

        {/* Required items */}
        {pooja.required_items && pooja.required_items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to Prepare</Text>
            {pooja.required_items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={15} color={accent} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes for priest */}
        {!!pooja.notes_for_priest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priest Notes</Text>
            <Text style={styles.sectionText}>{pooja.notes_for_priest}</Text>
          </View>
        )}

        {/* Occasion type */}
        {!!pooja.occasion_type && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Occasion Type</Text>
            <Text style={styles.sectionText}>{pooja.occasion_type}</Text>
          </View>
        )}
      </ScrollView>

      {/* Book Now footer */}
      <View style={styles.footer}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Price</Text>
          <Text style={[styles.feeAmount, { color: accent }]}>{fmtFee}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: accent }]}
          activeOpacity={0.82}
          onPress={() => nav.navigate('PoojaBooking', {
            poojaId: pooja.id,
            poojaName: pooja.name,
            amountPaise: pooja.base_fee_paise,
            deityName: pooja.deity_name ?? undefined,
          })}
        >
          <MaterialCommunityIcons name="calendar-check" size={16} color="#fff" />
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.muted, fontSize: 15 },
  body: { padding: 20, paddingBottom: 120 },
  header: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    marginBottom: 16,
  },
  name: { fontSize: 22, fontWeight: '900', color: colors.ink },
  nameHi: { fontSize: 14, color: colors.muted, marginTop: 4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionText: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  itemText: { fontSize: 14, color: colors.ink },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  feeRow: { flex: 1 },
  feeLabel: { fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '700' },
  feeAmount: { fontSize: 22, fontWeight: '900' },
  bookBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
