import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

type PoojaType = {
  id: string;
  name: string;
  name_hi: string | null;
  name_te: string | null;
  category: string;
  deity_name: string | null;
  description: string | null;
  duration_mins: number;
  base_fee_paise: number;
  occasion_type: string;
  requires_sankalpa: boolean;
  is_online: boolean;
  required_items: string | null;
  notes_for_priest: string | null;
  is_active: boolean;
  sort_order: number;
};

const BLANK: Omit<PoojaType, 'id'> = {
  name: '',
  name_hi: '',
  name_te: '',
  category: 'personal',
  deity_name: '',
  description: '',
  duration_mins: 60,
  base_fee_paise: 0,
  occasion_type: 'none',
  requires_sankalpa: true,
  is_online: true,
  required_items: '',
  notes_for_priest: '',
  is_active: true,
  sort_order: 100,
};

const CATEGORIES = ['personal', 'festival', 'occasion', 'havan', 'regular'];
const OCCASION_TYPES = [
  'none', 'house_warming', 'naming_ceremony', 'wedding',
  'birthday', 'death_anniversary', 'other',
];

const CAT_COLOR: Record<string, string> = {
  personal: '#1A5276',
  festival: '#B85C00',
  occasion: '#1B6B4A',
  havan:    '#7A0A14',
  regular:  '#5E3D9A',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const paise2rupees = (p: number) => (p / 100).toFixed(0);
const rupees2paise = (s: string) => Math.round(parseFloat(s || '0') * 100);

function showAlert(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
}

// ── Pill toggle ───────────────────────────────────────────────────────────────

function Pill({
  options, value, onChange, color,
}: { options: string[]; value: string; onChange: (v: string) => void; color?: string }) {
  return (
    <View style={ps.row}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[ps.pill, value === o && { backgroundColor: color ?? colors.maroon, borderColor: color ?? colors.maroon }]}
          onPress={() => onChange(o)}
          activeOpacity={0.8}
        >
          <Text style={[ps.pillText, value === o && ps.pillTextOn]}>
            {o.replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const ps = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pill: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill,
    paddingHorizontal: 11, paddingVertical: 5, backgroundColor: colors.white,
  },
  pillText: { fontSize: 12, color: colors.ink },
  pillTextOn: { color: '#fff', fontWeight: '700' },
});

// ── BoolToggle ────────────────────────────────────────────────────────────────

function BoolToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={bt.row} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={[bt.box, value && bt.boxOn]}>
        {value && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
      </View>
      <Text style={bt.label}>{label}</Text>
    </TouchableOpacity>
  );
}
const bt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.maroon },
  label: { fontSize: 14, color: colors.ink },
});

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fl.label}>{label}</Text>
      {children}
    </View>
  );
}
const fl = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
});

// ── Form (create / edit) ──────────────────────────────────────────────────────

function PoojaForm({
  initial,
  onClose,
  onSaved,
}: { initial: PoojaType | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Omit<PoojaType, 'id'>>(
    initial ? { ...initial } : { ...BLANK }
  );
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return showAlert('Required', 'Pooja name is required.');
    setBusy(true);

    const payload = {
      ...form,
      name: form.name.trim(),
      name_hi: form.name_hi?.trim() || null,
      name_te: form.name_te?.trim() || null,
      deity_name: form.deity_name?.trim() || null,
      description: form.description?.trim() || null,
      required_items: form.required_items?.trim() || null,
      notes_for_priest: form.notes_for_priest?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('pooja_catalog').update(payload).eq('id', initial!.id));
    } else {
      ({ error } = await supabase.from('pooja_catalog').insert(payload));
    }
    setBusy(false);

    if (error) return showAlert('Error', error.message);
    onSaved();
    onClose();
  };

  const inp = (value: string, onChange: (v: string) => void, opts?: object) => (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholderTextColor={colors.muted}
      {...opts}
    />
  );

  return (
    <ScrollView style={styles.formSheet} contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{isEdit ? 'Edit Pooja' : 'New Pooja'}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Names */}
      <Field label="Pooja Name (English) *">
        {inp(form.name, (v) => set('name', v), { placeholder: 'e.g. Satyanarayana Pooja' })}
      </Field>
      <Field label="Name in Hindi">
        {inp(form.name_hi ?? '', (v) => set('name_hi', v), { placeholder: 'हिंदी नाम' })}
      </Field>
      <Field label="Name in Telugu">
        {inp(form.name_te ?? '', (v) => set('name_te', v), { placeholder: 'తెలుగు పేరు' })}
      </Field>

      {/* Category */}
      <Field label="Category">
        <Pill options={CATEGORIES} value={form.category} onChange={(v) => set('category', v)} />
      </Field>

      {/* Deity */}
      <Field label="Deity">
        {inp(form.deity_name ?? '', (v) => set('deity_name', v), { placeholder: 'e.g. Vishnu, Ganesha, Shiva' })}
      </Field>

      {/* Description */}
      <Field label="Description">
        <TextInput
          style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
          value={form.description ?? ''}
          onChangeText={(v) => set('description', v)}
          multiline
          numberOfLines={3}
          placeholder="What this pooja is for / its significance…"
          placeholderTextColor={colors.muted}
        />
      </Field>

      {/* Duration + Fee */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Duration (minutes)">
            {inp(String(form.duration_mins), (v) => set('duration_mins', parseInt(v) || 60), { keyboardType: 'numeric' })}
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Base Fee (₹)">
            {inp(paise2rupees(form.base_fee_paise), (v) => set('base_fee_paise', rupees2paise(v)), { keyboardType: 'numeric', placeholder: '0 = negotiable' })}
          </Field>
        </View>
      </View>

      {/* Sort order */}
      <Field label="Display Order">
        {inp(String(form.sort_order), (v) => set('sort_order', parseInt(v) || 100), { keyboardType: 'numeric' })}
      </Field>

      {/* Occasion type */}
      <Field label="Occasion Type">
        <Pill options={OCCASION_TYPES} value={form.occasion_type} onChange={(v) => set('occasion_type', v)} color="#1B6B4A" />
      </Field>

      {/* Required items */}
      <Field label="Required Items (comma-separated)">
        <TextInput
          style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
          value={form.required_items ?? ''}
          onChangeText={(v) => set('required_items', v)}
          multiline
          placeholder="e.g. Coconut, flowers, incense, lamp"
          placeholderTextColor={colors.muted}
        />
      </Field>

      {/* Notes for priest */}
      <Field label="Notes for Priest (internal)">
        <TextInput
          style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
          value={form.notes_for_priest ?? ''}
          onChangeText={(v) => set('notes_for_priest', v)}
          multiline
          placeholder="Internal guidance for performing priests…"
          placeholderTextColor={colors.muted}
        />
      </Field>

      {/* Bool flags */}
      <BoolToggle label="Requires Sankalpa (devotee provides name/gotra)" value={form.requires_sankalpa} onChange={(v) => set('requires_sankalpa', v)} />
      <BoolToggle label="Available Online (via video call)" value={form.is_online} onChange={(v) => set('is_online', v)} />
      <BoolToggle label="Active (visible for booking)" value={form.is_active} onChange={(v) => set('is_active', v)} />

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, busy && { opacity: 0.5 }]}
        onPress={save}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Pooja'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── View modal ────────────────────────────────────────────────────────────────

function PoojaDetail({ p, onClose }: { p: PoojaType; onClose: () => void }) {
  const fee = parseInt(paise2rupees(p.base_fee_paise));
  return (
    <ScrollView style={styles.formSheet} contentContainerStyle={styles.formBody}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{p.name}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Names */}
      {(p.name_hi || p.name_te) && (
        <View style={styles.detailSection}>
          {!!p.name_hi && <Text style={styles.detailAlt}>Hindi: {p.name_hi}</Text>}
          {!!p.name_te && <Text style={styles.detailAlt}>Telugu: {p.name_te}</Text>}
        </View>
      )}

      {/* Badges row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <View style={[styles.badge, { backgroundColor: CAT_COLOR[p.category] + '22', borderColor: CAT_COLOR[p.category] }]}>
          <Text style={[styles.badgeText, { color: CAT_COLOR[p.category] }]}>{p.category}</Text>
        </View>
        {!p.is_active && (
          <View style={[styles.badge, { backgroundColor: '#eee', borderColor: colors.muted }]}>
            <Text style={[styles.badgeText, { color: colors.muted }]}>Inactive</Text>
          </View>
        )}
        {p.is_online && (
          <View style={[styles.badge, { backgroundColor: '#EAF5EE', borderColor: '#1B6B4A' }]}>
            <Text style={[styles.badgeText, { color: '#1B6B4A' }]}>Online available</Text>
          </View>
        )}
      </View>

      <DetailRow icon="star" label="Deity" value={p.deity_name} />
      <DetailRow icon="clock-outline" label="Duration" value={`${p.duration_mins} min`} />
      <DetailRow icon="currency-inr" label="Base Fee" value={fee === 0 ? 'Negotiable / Free' : `₹${fee}`} />
      <DetailRow icon="calendar-star" label="Occasion" value={p.occasion_type !== 'none' ? p.occasion_type.replace('_', ' ') : '—'} />
      <DetailRow icon="file-sign" label="Requires Sankalpa" value={p.requires_sankalpa ? 'Yes' : 'No'} />

      {!!p.description && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailText}>{p.description}</Text>
        </View>
      )}

      {!!p.required_items && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Required Items</Text>
          {p.required_items.split(',').map((item, i) => (
            <Text key={i} style={styles.detailItem}>• {item.trim()}</Text>
          ))}
        </View>
      )}

      {!!p.notes_for_priest && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Notes for Priest</Text>
          <Text style={styles.detailText}>{p.notes_for_priest}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={15} color={colors.maroon} />
      <Text style={styles.detailKey}>{label}:</Text>
      <Text style={styles.detailVal}>{value}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdminPoojaTypesScreen() {
  const [poojas, setPoojas] = useState<PoojaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selected, setSelected] = useState<PoojaType | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('pooja_catalog')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    setPoojas((data as PoojaType[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deletePooja = async (p: PoojaType) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`Delete "${p.name}"? This cannot be undone.`)
      : await new Promise<boolean>((res) =>
          Alert.alert('Delete Pooja', `Delete "${p.name}"?`, [
            { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
            { text: 'Delete', style: 'destructive', onPress: () => res(true) },
          ])
        );
    if (!confirm) return;
    await supabase.from('pooja_catalog').delete().eq('id', p.id);
    load();
  };

  const toggleActive = async (p: PoojaType) => {
    await supabase.from('pooja_catalog').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  };

  const filtered = poojas.filter((p) => {
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.deity_name ?? '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  // ── Modals ──
  if (mode === 'create') {
    return (
      <PoojaForm
        initial={null}
        onClose={() => setMode('list')}
        onSaved={load}
      />
    );
  }
  if (mode === 'edit' && selected) {
    return (
      <PoojaForm
        initial={selected}
        onClose={() => { setMode('list'); setSelected(null); }}
        onSaved={load}
      />
    );
  }
  if (mode === 'view' && selected) {
    return (
      <PoojaDetail
        p={selected}
        onClose={() => { setMode('list'); setSelected(null); }}
      />
    );
  }

  // ── List ──
  return (
    <View style={styles.screen}>
      {/* Search + add */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search poojas…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setMode('create')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={{ gap: 6, paddingHorizontal: spacing.md }}>
        {['all', ...CATEGORIES].map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catChip, filterCat === c && { backgroundColor: CAT_COLOR[c] ?? colors.maroon, borderColor: CAT_COLOR[c] ?? colors.maroon }]}
            onPress={() => setFilterCat(c)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catChipText, filterCat === c && { color: '#fff', fontWeight: '700' }]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={styles.countLabel}>{filtered.length} of {poojas.length} poojas</Text>

      {loading
        ? <ActivityIndicator color={colors.maroon} style={{ marginTop: 40 }} size="large" />
        : (
          <ScrollView contentContainerStyle={styles.list}>
            {filtered.length === 0 && (
              <Text style={styles.empty}>No poojas found.</Text>
            )}
            {filtered.map((p) => (
              <View key={p.id} style={[styles.card, !p.is_active && styles.cardInactive]}>
                {/* Left accent */}
                <View style={[styles.catBar2, { backgroundColor: CAT_COLOR[p.category] ?? colors.maroon }]} />

                <View style={{ flex: 1 }}>
                  {/* Name row */}
                  <View style={styles.nameRow}>
                    <Text style={styles.poojaName}>{p.name}</Text>
                    {!p.is_active && (
                      <View style={styles.inactivePill}>
                        <Text style={styles.inactivePillText}>Inactive</Text>
                      </View>
                    )}
                  </View>

                  {/* Meta */}
                  <View style={styles.metaRow}>
                    {!!p.deity_name && (
                      <Text style={styles.meta}>🙏 {p.deity_name}</Text>
                    )}
                    <Text style={styles.meta}>⏱ {p.duration_mins}m</Text>
                    <Text style={styles.meta}>
                      {parseInt(paise2rupees(p.base_fee_paise)) === 0
                        ? '₹ Negotiable'
                        : `₹${paise2rupees(p.base_fee_paise)}`}
                    </Text>
                    {p.is_online && <Text style={styles.meta}>📹 Online</Text>}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => { setSelected(p); setMode('view'); }}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={15} color="#1A5276" />
                      <Text style={[styles.actionText, { color: '#1A5276' }]}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => { setSelected(p); setMode('edit'); }}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={15} color="#1B6B4A" />
                      <Text style={[styles.actionText, { color: '#1B6B4A' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleActive(p)}
                    >
                      <MaterialCommunityIcons
                        name={p.is_active ? 'toggle-switch' : 'toggle-switch-off-outline'}
                        size={15}
                        color={p.is_active ? '#1B6B4A' : colors.muted}
                      />
                      <Text style={[styles.actionText, { color: p.is_active ? '#1B6B4A' : colors.muted }]}>
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => deletePooja(p)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.maroon} />
                      <Text style={[styles.actionText, { color: colors.maroon }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )
      }
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topBar: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.md,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.maroon,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  catBar: { backgroundColor: colors.white, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  catChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.cream,
  },
  catChipText: { fontSize: 12, color: colors.ink, textTransform: 'capitalize' },
  countLabel: { fontSize: 11, color: colors.muted, paddingHorizontal: spacing.md, paddingTop: 8, paddingBottom: 4 },
  list: { padding: spacing.md, gap: 10, paddingBottom: 40 },
  empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInactive: { opacity: 0.65 },
  catBar2: { width: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 12 },
  poojaName: { fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 },
  inactivePill: { backgroundColor: '#eee', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  inactivePillText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 12, paddingTop: 4 },
  meta: { fontSize: 11, color: colors.muted },
  actions: {
    flexDirection: 'row',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  actionText: { fontSize: 11, fontWeight: '600' },

  // Form
  formSheet: { flex: 1, backgroundColor: colors.cream },
  formBody: { padding: spacing.lg, paddingBottom: 48 },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  saveBtn: {
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Detail view
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  detailText: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  detailAlt: { fontSize: 14, color: colors.muted, marginBottom: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  detailKey: { fontSize: 13, fontWeight: '600', color: colors.muted, width: 120 },
  detailVal: { fontSize: 13, color: colors.ink, flex: 1 },
  detailItem: { fontSize: 13, color: colors.ink, lineHeight: 22 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
