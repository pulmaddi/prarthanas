import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const TYPES: { key: string; label: string }[] = [
  { key: 'priest', label: 'Priest' },
  { key: 'guru', label: 'Guru' },
  { key: 'temple_exec', label: 'Temple Exec' },
];

type HostRow = {
  user_id: string;
  host_type: string;
  name: string | null;
  phone: string | null;
  city: string | null;
};

function HostEditRow({ row, onChanged }: { row: HostRow; onChanged: () => void }) {
  const [name, setName] = useState(row.name ?? '');
  const [hostType, setHostType] = useState(row.host_type);
  const [phone, setPhone] = useState(row.phone ?? '');
  const [city, setCity] = useState(row.city ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    setMsg('');
    if (name.trim().length < 2) return setErr('Enter a name.');
    try {
      setBusy(true);
      const { error } = await supabase
        .from('host_accounts')
        .update({
          name: name.trim(),
          host_type: hostType,
          phone: phone.trim() || null,
          city: city.trim() || null,
        })
        .eq('user_id', row.user_id);
      if (error) throw error;
      setMsg(t('hosts.updated'));
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    // eslint-disable-next-line no-alert
    if (typeof confirm === 'function' && !confirm(t('hosts.removeConfirm'))) return;
    setErr('');
    const { error } = await supabase.from('host_accounts').delete().eq('user_id', row.user_id);
    if (error) return setErr(error.message);
    onChanged();
  };

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('hosts.name')}
        placeholderTextColor={colors.muted}
      />
      <View style={styles.chips}>
        {TYPES.map((ty) => (
          <TouchableOpacity
            key={ty.key}
            style={[styles.chip, hostType === ty.key && styles.chipOn]}
            onPress={() => setHostType(ty.key)}
          >
            <Text style={[styles.chipText, hostType === ty.key && styles.chipTextOn]}>
              {ty.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.two}>
        <TextInput
          style={[styles.input, styles.half]}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('hosts.phone')}
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, styles.half]}
          value={city}
          onChangeText={setCity}
          placeholder={t('hosts.city')}
          placeholderTextColor={colors.muted}
        />
      </View>
      {!!err && <Text style={styles.err}>{err}</Text>}
      {!!msg && <Text style={styles.ok}>{msg}</Text>}
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label={busy ? '…' : t('hosts.save')} onPress={save} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('hosts.remove')} variant="outline" onPress={remove} />
        </View>
      </View>
    </View>
  );
}

export default function AdminHostsManageScreen() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('host_accounts')
      .select('user_id,host_type,name,phone,city')
      .order('created_at', { ascending: false });
    setRows((data as HostRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

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
      <Text style={styles.hint}>{t('hosts.manageTitle')}</Text>
      {!loading && rows.length === 0 && <Text style={styles.hint}>{t('hosts.none')}</Text>}
      {rows.map((r) => (
        <HostEditRow key={r.user_id} row={r} onChanged={load} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  deny: { color: colors.muted, fontSize: 15 },
  hint: { fontSize: 13, color: colors.muted, marginBottom: 10 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 8,
  },
  two: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 8 },
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
  err: { color: colors.live, fontSize: 13, marginBottom: 4 },
  ok: { color: colors.green, fontSize: 13, marginBottom: 4, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
