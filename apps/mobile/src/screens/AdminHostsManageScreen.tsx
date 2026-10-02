import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, adminUpdateHostUser } from '../lib/supabase';

const TYPE_LABELS: Record<string, string> = {
  priest: 'Priests',
  guru: 'Spiritual Gurus',
  temple_exec: 'Temples',
  numerologist: 'Numerologists',
  astrologer: 'Astrologers',
};

const ONBOARD_LABEL: Record<string, string> = {
  priest: 'Onboard New Priest',
  guru: 'Onboard New Guru',
  temple_exec: 'Onboard New Temple',
  astrologer: 'Onboard New Astrologer',
  numerologist: 'Onboard New Numerologist',
};

const TYPES: { key: string; label: string }[] = [
  { key: 'priest', label: 'Priest' },
  { key: 'guru', label: 'Guru' },
  { key: 'temple_exec', label: 'Temple Exec' },
  { key: 'numerologist', label: 'Numerologist' },
  { key: 'astrologer', label: 'Astrologer' },
];

type HostRow = {
  user_id: string;
  host_types: string[];
  name: string | null;
  phone: string | null;
  city: string | null;
  location: string | null;
  org_name: string | null;
  email: string | null;
};

function HostEditForm({
  row,
  filterType,
  onDone,
  onChanged,
}: {
  row: HostRow;
  filterType?: string;
  onDone: () => void;
  onChanged: () => void;
}) {
  const isTemple = filterType === 'temple_exec';
  const hasLocation = isTemple || filterType === 'priest' || filterType === 'guru' || filterType === 'astrologer' || filterType === 'numerologist';

  const [name, setName] = useState(row.name ?? '');
  const [orgName, setOrgName] = useState(row.org_name ?? '');
  const [location, setLocation] = useState(row.location ?? '');
  const [types, setTypes] = useState<string[]>(row.host_types ?? []);
  const toggleType = (k: string) =>
    setTypes((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const [phone, setPhone] = useState(row.phone ?? '');
  const [city, setCity] = useState(row.city ?? '');
  const [email, setEmail] = useState(row.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    setMsg('');
    if (isTemple && orgName.trim().length < 2) return setErr('Enter the temple name.');
    if (name.trim().length < 2) return setErr('Enter a name.');
    if (types.length === 0) return setErr('Select at least one role.');
    if (password && password.length < 6) return setErr('Password must be at least 6 characters.');
    try {
      setBusy(true);
      await adminUpdateHostUser({
        user_id: row.user_id,
        name: name.trim(),
        host_types: types,
        phone: phone.trim(),
        city: city.trim(),
        location: location.trim(),
        org_name: orgName.trim(),
        email: email.trim() || undefined,
        password: password || undefined,
      });
      setMsg(t('hosts.updated'));
      onChanged();
      onDone();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.editForm}>
      <Text style={styles.editFormTitle}>Edit — {isTemple ? (row.org_name || row.name) : row.name || row.user_id}</Text>

      <Text style={styles.fieldLabel}>Role</Text>
      {filterType ? (
        <View style={styles.roleReadOnly}>
          <Text style={styles.roleReadOnlyText}>
            ✓ {TYPE_LABELS[filterType] ?? filterType}
          </Text>
        </View>
      ) : (
        <View style={styles.chips}>
          {TYPES.map((ty) => {
            const on = types.includes(ty.key);
            return (
              <TouchableOpacity
                key={ty.key}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggleType(ty.key)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {on ? '✓ ' : ''}{ty.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {isTemple && (
        <>
          <Text style={styles.fieldLabel}>Temple Name</Text>
          <TextInput
            style={styles.input}
            value={orgName}
            onChangeText={setOrgName}
            placeholder="e.g. Sri Venkateswara Temple"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
        </>
      )}

      <Text style={styles.fieldLabel}>{isTemple ? 'Contact Person Name' : t('hosts.name')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('hosts.name')}
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
      />

      {hasLocation && (
        <>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Area / Locality (e.g. Banjara Hills)"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
        </>
      )}

      <Text style={styles.fieldLabel}>{hasLocation ? 'City' : t('hosts.city')}</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="City"
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
      />

      <Text style={styles.fieldLabel}>{t('hosts.phone')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+91 …"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
      />

      <Text style={styles.fieldLabel}>{t('hosts.email')}</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="login@example.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>New Password <Text style={styles.optionalHint}>(leave blank to keep current)</Text></Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Min 6 characters"
        placeholderTextColor={colors.muted}
        secureTextEntry
      />

      {!!err && <Text style={styles.errText}>{err}</Text>}
      {!!msg && <Text style={styles.okText}>{msg}</Text>}

      <View style={styles.formActions}>
        <View style={{ flex: 1 }}>
          <Button label={busy ? '…' : t('hosts.save')} onPress={save} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('admin.cancel')} variant="outline" onPress={onDone} />
        </View>
      </View>
    </View>
  );
}

function HostListRow({
  row,
  onEdit,
  onDeleted,
}: {
  row: HostRow;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const initial = ((row.name ?? '?')[0] ?? '?').toUpperCase();

  const confirmDelete = () => {
    const doDelete = async () => {
      await supabase.from('host_accounts').delete().eq('user_id', row.user_id);
      onDeleted();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove host "${row.name}"?`)) doDelete();
    } else {
      Alert.alert('Remove', `Remove "${row.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{row.name || '—'}</Text>
        <Text style={styles.rowMeta}>
          {row.host_types.join(', ')}{row.city ? ` · ${row.city}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil" size={16} color={colors.maroon} />
        <Text style={styles.editLabel}>{t('admin.edit')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
        <MaterialCommunityIcons name="delete-outline" size={16} color={colors.live} />
        <Text style={styles.deleteLabel}>{t('admin.delete')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminHostsManageScreen() {
  const { isAdmin } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdminHostsManage'>>();
  const filterType = (route.params as any)?.filterType as string | undefined;
  const [rows, setRows] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const title = filterType ? TYPE_LABELS[filterType] ?? filterType : t('hosts.manageTitle');
  const onboardLabel = filterType
    ? (ONBOARD_LABEL[filterType] ?? 'Onboard New Host')
    : 'Onboard New Host';

  const load = async () => {
    let q = supabase
      .from('host_accounts')
      .select('user_id,host_types,name,phone,city,location,org_name')
      .order('created_at', { ascending: false });
    if (filterType) q = (q as any).contains('host_types', [filterType]);
    const { data: haData } = await q;
    const haRows = (haData as any[]) ?? [];

    // Fetch emails separately — no direct FK between host_accounts and profiles.
    const userIds = haRows.map((r: any) => r.user_id);
    const emailMap: Record<string, string | null> = {};
    if (userIds.length > 0) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('id,email')
        .in('id', userIds);
      ((profData as any[]) ?? []).forEach((p) => { emailMap[p.id] = p.email ?? null; });
    }

    setRows(haRows.map((r: any) => ({ ...r, email: emailMap[r.user_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType]);
  useFocusEffect(useCallback(() => { load(); }, [filterType]));

  // Sync navigator header title to match the filtered role (e.g. "Priests")
  useEffect(() => {
    nav.setOptions({ title });
  }, [title]);

  // When editing, override the back button so it returns to the list, not the previous screen
  useEffect(() => {
    nav.setOptions({
      headerLeft: editingId
        ? () => (
            <TouchableOpacity
              onPress={() => setEditingId(null)}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.maroon} />
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [editingId]);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deny}>🔒 {t('admin.notAdmin')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>{title}</Text>

      {editingId ? (
        /* ── EDIT VIEW: form only, no list ── */
        (() => {
          const row = rows.find((r) => r.user_id === editingId);
          return row ? (
            <HostEditForm
              row={row}
              filterType={filterType}
              onDone={() => setEditingId(null)}
              onChanged={load}
            />
          ) : null;
        })()
      ) : (
        /* ── LIST VIEW: onboard button + host list ── */
        <>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => nav.navigate('AdminHosts', filterType ? { filterType } : undefined)}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>{onboardLabel}</Text>
          </TouchableOpacity>

          <View style={styles.listBox}>
            {!loading && rows.length === 0 && (
              <Text style={styles.emptyNote}>{t('hosts.none')}</Text>
            )}
            {rows.map((r) => (
              <HostListRow
                key={r.user_id}
                row={r}
                onEdit={() => setEditingId(r.user_id)}
                onDeleted={load}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  deny: { color: colors.muted, fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.maroon, marginBottom: 12 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.maroon,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  editForm: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 16,
  },
  editFormTitle: { fontSize: 14, fontWeight: '700', color: colors.maroon, marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 10, marginBottom: 5 },

  input: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  two: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  roleReadOnly: {
    alignSelf: 'flex-start',
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 4,
  },
  roleReadOnlyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.cream,
  },
  chipOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { color: colors.ink, fontSize: 12 },
  chipTextOn: { color: colors.white },
  optionalHint: { color: colors.muted, fontSize: 11, fontWeight: '400' },
  errText: { color: colors.live, fontSize: 13, marginTop: 8 },
  okText: { color: colors.green, fontSize: 13, marginTop: 8, fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 14 },

  listBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  emptyNote: { fontSize: 13, color: colors.muted, fontStyle: 'italic', padding: 16 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 11, color: colors.muted, marginTop: 1 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editLabel: { fontSize: 13, fontWeight: '700', color: colors.maroon },
  deleteLabel: { fontSize: 13, fontWeight: '700', color: colors.live },
});
