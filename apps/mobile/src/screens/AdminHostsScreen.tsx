import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, adminCreateHostUser } from '../lib/supabase';

const TYPES: { key: string; label: string }[] = [
  { key: 'priest', label: 'Priest' },
  { key: 'guru', label: 'Spiritual Guru' },
  { key: 'temple_exec', label: 'Temple Executive' },
];
const TYPE_LABEL: Record<string, string> = {
  priest: 'Priest',
  guru: 'Spiritual Guru',
  temple_exec: 'Temple Executive',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type HostRow = {
  user_id: string;
  host_type: string;
  name: string | null;
  org_name: string | null;
  city: string | null;
};

export default function AdminHostsScreen() {
  const { isAdmin } = useAuth();
  const [hostType, setHostType] = useState('priest');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [org, setOrg] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [rows, setRows] = useState<HostRow[]>([]);

  const loadRows = async () => {
    const { data } = await supabase
      .from('host_accounts')
      .select('user_id,host_type,name,org_name,city')
      .order('created_at', { ascending: false });
    if (data) setRows(data as HostRow[]);
  };
  useEffect(() => {
    loadRows();
  }, []);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setCity('');
    setOrg('');
  };

  const onCreate = async () => {
    setErr('');
    setCreated(null);
    if (name.trim().length < 2) return setErr('Please enter the full name.');
    if (!EMAIL_RE.test(email)) return setErr('Please enter a valid email (username).');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    try {
      setBusy(true);
      // 1) Create the auth user (throwaway client — admin session untouched).
      const userId = await adminCreateHostUser({ email: email.trim(), password, name: name.trim() });
      // 2) Record the host role (admin-gated by RLS).
      const { error } = await supabase.from('host_accounts').insert({
        user_id: userId,
        host_type: hostType,
        name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        org_name: org.trim() || null,
      });
      if (error) throw error;
      setCreated({ email: email.trim(), password });
      reset();
      loadRows();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not onboard this account.');
    } finally {
      setBusy(false);
    }
  };

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
      <Text style={styles.h2}>{t('hosts.onboardTitle')}</Text>
      <Text style={styles.hint}>{t('hosts.hint')}</Text>

      <Text style={styles.label}>{t('hosts.type')}</Text>
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.7}
        onPress={() => setTypeOpen(true)}
      >
        <Text style={styles.selectText}>{TYPE_LABEL[hostType]}</Text>
        <Text style={styles.selectChevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={typeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeOpen(false)}
      >
        <TouchableOpacity
          style={styles.ddBackdrop}
          activeOpacity={1}
          onPress={() => setTypeOpen(false)}
        >
          <View style={styles.ddSheet}>
            {TYPES.map((ty) => (
              <TouchableOpacity
                key={ty.key}
                style={styles.ddOption}
                onPress={() => {
                  setHostType(ty.key);
                  setTypeOpen(false);
                }}
              >
                <Text
                  style={[styles.ddOptionText, hostType === ty.key && styles.ddOptionOn]}
                >
                  {ty.label}
                </Text>
                {hostType === ty.key && <Text style={styles.ddCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {[
        { label: t('hosts.name'), v: name, set: setName, ph: 'Full name', cap: 'words' as const },
        { label: t('hosts.email'), v: email, set: setEmail, ph: 'login@example.com', cap: 'none' as const, kb: 'email-address' as const },
        { label: t('hosts.password'), v: password, set: setPassword, ph: 'Set a password', secure: true },
        { label: t('hosts.phone'), v: phone, set: setPhone, ph: '+91 …', kb: 'phone-pad' as const },
        { label: t('hosts.city'), v: city, set: setCity, ph: 'City' },
        { label: t('hosts.org'), v: org, set: setOrg, ph: 'Temple / Ashram / Org' },
      ].map((f) => (
        <View key={f.label} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={f.v}
            onChangeText={f.set}
            placeholder={f.ph}
            placeholderTextColor={colors.muted}
            secureTextEntry={f.secure}
            keyboardType={f.kb}
            autoCapitalize={f.cap ?? 'sentences'}
          />
        </View>
      ))}

      {!!err && <Text style={styles.err}>{err}</Text>}

      {created && (
        <View style={styles.created}>
          <Text style={styles.createdTitle}>✓ {t('hosts.createdTitle')}</Text>
          <Text style={styles.createdText}>{t('hosts.share')}</Text>
          <Text style={styles.cred}>👤 {created.email}</Text>
          <Text style={styles.cred}>🔑 {created.password}</Text>
        </View>
      )}

      <Button label={busy ? '…' : t('hosts.create')} onPress={onCreate} />

      <Text style={[styles.h2, { marginTop: 26 }]}>{t('hosts.existing')}</Text>
      {rows.length === 0 && <Text style={styles.hint}>{t('hosts.none')}</Text>}
      {rows.map((r) => (
        <View key={r.user_id} style={styles.rowCard}>
          <Text style={styles.rowName}>{r.name || '—'}</Text>
          <Text style={styles.rowMeta}>
            {TYPE_LABEL[r.host_type] ?? r.host_type}
            {r.org_name ? ` · ${r.org_name}` : ''}
            {r.city ? ` · ${r.city}` : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  deny: { color: colors.muted, fontSize: 15 },
  h2: { fontSize: 16, fontWeight: '700', color: colors.maroon },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 12, marginBottom: 5 },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
  field: {},
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectText: { fontSize: 15, color: colors.ink },
  selectChevron: { fontSize: 16, color: colors.muted },
  ddBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  ddSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  ddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ddOptionText: { fontSize: 15, color: colors.ink },
  ddOptionOn: { color: colors.maroon, fontWeight: '700' },
  ddCheck: { color: colors.maroon, fontWeight: '800', fontSize: 16 },
  err: { color: colors.live, fontSize: 13, marginTop: 12 },
  created: {
    backgroundColor: '#EAF7EE',
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 14,
  },
  createdTitle: { color: colors.green, fontWeight: '800', marginBottom: 4 },
  createdText: { color: colors.ink, fontSize: 13, marginBottom: 6 },
  cred: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  rowCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
