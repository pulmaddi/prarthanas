import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
};

const CATEGORIES = ['All', 'personal', 'festival', 'occasion', 'havan', 'regular'];
const CAT_LABELS: Record<string, string> = {
  All: 'All', personal: 'Personal', festival: 'Festival',
  occasion: 'Occasion', havan: 'Havan', regular: 'Regular',
};
const CAT_COLORS: Record<string, string> = {
  personal: '#1A5276', festival: '#B85C00', occasion: '#1B6B4A',
  havan: '#7A0A14', regular: '#5E3D9A',
};

export default function PoojaListScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { data } = await supabase
      .from('pooja_catalog')
      .select('id,name,name_hi,name_te,category,deity_name,description,duration_mins,base_fee_paise,occasion_type,requires_sankalpa,is_online')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    setPoojas((data as Pooja[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = poojas.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.deity_name ?? '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const fmtFee = (paise: number) => paise === 0 ? 'Free' : `₹${Math.round(paise / 100)}`;

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search poojas, deity..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterPill, category === c && { backgroundColor: c === 'All' ? colors.maroon : CAT_COLORS[c] }]}
            onPress={() => setCategory(c)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, category === c && styles.filterTextActive]}>
              {CAT_LABELS[c]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pooja list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.maroon} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No poojas found.</Text>
          ) : (
            filtered.map((p) => {
              const accent = CAT_COLORS[p.category] ?? colors.maroon;
              return (
                <View key={p.id} style={[styles.card, { borderLeftColor: accent }]}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => nav.navigate('PoojaDetail', { poojaId: p.id, poojaName: p.name })}
                  >
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{p.name}</Text>
                        {!!p.name_hi && <Text style={styles.cardNameHi}>{p.name_hi}</Text>}
                        <View style={styles.metaRow}>
                          {!!p.deity_name && (
                            <Text style={styles.meta}>🕉️ {p.deity_name}</Text>
                          )}
                          <Text style={styles.meta}>⏱ {p.duration_mins} min</Text>
                          {p.is_online && <Text style={styles.metaOnline}>📱 Online</Text>}
                        </View>
                      </View>
                      <View style={[styles.feeTag, { backgroundColor: accent + '18' }]}>
                        <Text style={[styles.feeText, { color: accent }]}>{fmtFee(p.base_fee_paise)}</Text>
                      </View>
                    </View>
                    {!!p.description && (
                      <Text style={styles.desc} numberOfLines={2}>{p.description}</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.bookBtn, { backgroundColor: accent }]}
                    activeOpacity={0.82}
                    onPress={() => nav.navigate('PoojaBooking', {
                      poojaId: p.id,
                      poojaName: p.name,
                      amountPaise: p.base_fee_paise,
                      deityName: p.deity_name ?? undefined,
                    })}
                  >
                    <MaterialCommunityIcons name="calendar-check" size={15} color="#fff" />
                    <Text style={styles.bookBtnText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  filterRow: { flexGrow: 0, marginBottom: 10 },
  filterContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  filterPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  cardNameHi: { fontSize: 12, color: colors.muted, marginTop: 1 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 5, flexWrap: 'wrap' },
  meta: { fontSize: 11, color: colors.muted },
  metaOnline: { fontSize: 11, color: '#1B6B4A', fontWeight: '700' },
  feeTag: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  feeText: { fontSize: 14, fontWeight: '900' },
  desc: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
