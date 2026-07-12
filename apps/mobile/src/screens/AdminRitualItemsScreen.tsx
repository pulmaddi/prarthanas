import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearRitualItemsCache, ritualItemFileUrl, type RitualItem } from '../lib/ritualItems';

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

async function assetToBytes(asset: any): Promise<ArrayBuffer> {
  if (asset.file) return await asset.file.arrayBuffer(); // web
  const res = await fetch(asset.uri);
  return await res.arrayBuffer(); // native
}

type Source = 'static' | 'deity';

export default function AdminRitualItemsScreen() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<RitualItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [sort, setSort] = useState('100');
  const [source, setSource] = useState<Source>('static');
  const [active, setActive] = useState(true);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageAsset, setImageAsset] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadRows = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('ritual_items')
      .select('item_key,name,name_hi,name_te,image_source,image_path,sort_order,is_active')
      .order('sort_order', { ascending: true });
    if (!error && data) setRows(data as RitualItem[]);
  };
  useEffect(() => {
    loadRows();
  }, []);

  const reset = () => {
    setEditingKey(null);
    setName('');
    setNameHi('');
    setNameTe('');
    setKeyVal('');
    setSort('100');
    setSource('static');
    setActive(true);
    setImagePath(null);
    setImageAsset(null);
    setErr('');
    setMsg('');
  };

  const startEdit = (r: RitualItem) => {
    setEditingKey(r.item_key);
    setName(r.name);
    setNameHi(r.name_hi ?? '');
    setNameTe(r.name_te ?? '');
    setKeyVal(r.item_key);
    setSort(String(r.sort_order ?? 100));
    setSource(r.image_source);
    setActive(r.is_active);
    setImagePath(r.image_path);
    setImageAsset(null);
    setErr('');
    setMsg('');
  };

  const pickImage = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setImageAsset(res.assets[0]);
  };

  const onSave = async () => {
    setErr('');
    setMsg('');
    if (!isAdmin) return setErr(t('adminRitual.notAdmin'));
    const k = keyVal ? slugify(keyVal) : slugify(name);
    if (name.trim().length < 2 || !k) return setErr(t('adminRitual.nameRequired'));

    try {
      setBusy(true);
      let image_path = source === 'deity' ? null : imagePath;

      if (source === 'static' && imageAsset) {
        const ext = (imageAsset.name?.split('.').pop() || 'png').toLowerCase();
        const path = `${k}.${ext}`;
        const up = await supabase.storage
          .from('ritual-items')
          .upload(path, await assetToBytes(imageAsset), {
            contentType: imageAsset.mimeType || 'image/png',
            upsert: true,
          });
        if (up.error) throw up.error;
        image_path = path;
      }

      const { error } = await supabase.from('ritual_items').upsert(
        {
          item_key: k,
          name: name.trim(),
          name_hi: nameHi.trim() || null,
          name_te: nameTe.trim() || null,
          image_source: source,
          image_path,
          sort_order: parseInt(sort, 10) || 100,
          is_active: active,
        },
        { onConflict: 'item_key' },
      );
      if (error) throw error;

      clearRitualItemsCache();
      setMsg(t('adminRitual.saved'));
      reset();
      loadRows();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const del = async (key: string) => {
    setErr('');
    const { error } = await supabase.from('ritual_items').delete().eq('item_key', key);
    if (error) return setErr(error.message);
    clearRitualItemsCache();
    loadRows();
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deny}>🔒 {t('adminRitual.notAdmin')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h2}>{editingKey ? t('adminRitual.edit') : t('adminRitual.add')}</Text>

      <Text style={styles.label}>{t('adminRitual.name')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (!editingKey) setKeyVal(slugify(v));
        }}
        placeholder="Wooden Platform"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>{t('adminRitual.nameHi')}</Text>
      <TextInput
        style={styles.input}
        value={nameHi}
        onChangeText={setNameHi}
        placeholder="लकड़ी का पटरा"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>{t('adminRitual.nameTe')}</Text>
      <TextInput
        style={styles.input}
        value={nameTe}
        onChangeText={setNameTe}
        placeholder="చెక్క పీట"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>{t('admin.key')}</Text>
      <TextInput
        style={[styles.input, !!editingKey && styles.readonly]}
        value={keyVal}
        onChangeText={setKeyVal}
        editable={!editingKey}
        placeholder="wooden_platform"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>{t('admin.sort')}</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>{t('adminRitual.source')}</Text>
      <View style={styles.chips}>
        {(['static', 'deity'] as Source[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, source === s && styles.chipOn]}
            onPress={() => setSource(s)}
          >
            <Text style={[styles.chipText, source === s && styles.chipTextOn]}>
              {s === 'static' ? t('adminRitual.sourceStatic') : t('adminRitual.sourceDeity')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {source === 'deity' ? (
        <Text style={styles.note}>{t('adminRitual.deityNote')}</Text>
      ) : (
        <>
          <Text style={styles.label}>{t('admin.image')}</Text>
          <View style={styles.pickRow}>
            <View style={styles.previewWrap}>
              {imageAsset?.uri ? (
                <Image source={{ uri: imageAsset.uri }} style={styles.preview} />
              ) : imagePath ? (
                <Image source={{ uri: ritualItemFileUrl(imagePath) || '' }} style={styles.preview} />
              ) : (
                <Text style={{ fontSize: 22 }}>🧺</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Button label={t('admin.pickImage')} variant="outline" onPress={pickImage} />
              <Text style={styles.fileNote} numberOfLines={1}>
                {imageAsset?.name || imagePath || t('admin.none')}
              </Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.label}>{t('adminRitual.active')}</Text>
      <TouchableOpacity
        style={[styles.toggle, active && styles.toggleOn]}
        onPress={() => setActive((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, active && styles.toggleTextOn]}>
          {active ? `✓ ${t('adminRitual.activeOn')}` : t('adminRitual.activeOff')}
        </Text>
      </TouchableOpacity>

      {!!err && <Text style={styles.err}>{err}</Text>}
      {!!msg && <Text style={styles.ok}>{msg}</Text>}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <Button label={busy ? '…' : t('admin.save')} onPress={onSave} />
        </View>
        {!!editingKey && (
          <View style={{ flex: 1 }}>
            <Button label={t('admin.cancel')} variant="outline" onPress={reset} />
          </View>
        )}
      </View>

      <Text style={[styles.h2, { marginTop: 28 }]}>{t('adminRitual.catalog')}</Text>
      {rows.map((r) => (
        <View key={r.item_key} style={[styles.rowCard, !r.is_active && styles.rowInactive]}>
          <View style={styles.rowThumb}>
            {r.image_source === 'deity' ? (
              <Text style={{ fontSize: 18 }}>🕉️</Text>
            ) : r.image_path ? (
              <Image source={{ uri: ritualItemFileUrl(r.image_path) || '' }} style={styles.rowImg} />
            ) : (
              <Text style={{ fontSize: 18 }}>🧺</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{r.name}</Text>
            <Text style={styles.rowMeta}>
              #{r.sort_order} · {r.item_key} · {r.image_source}
              {!r.is_active ? ' · hidden' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => startEdit(r)} style={styles.act}>
            <Text style={styles.actEdit}>{t('admin.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => del(r.item_key)} style={styles.act}>
            <Text style={styles.actDel}>{t('admin.delete')}</Text>
          </TouchableOpacity>
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
  h2: { fontSize: 16, fontWeight: '700', color: colors.maroon, marginBottom: 6 },
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
  readonly: { backgroundColor: '#F4ECDF', color: colors.muted },
  note: { fontSize: 12, color: colors.muted, marginTop: 8, fontStyle: 'italic' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextOn: { color: colors.white },
  toggle: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  toggleOn: { backgroundColor: '#E9F5EE', borderColor: colors.green },
  toggleText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  toggleTextOn: { color: colors.green },
  pickRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { width: 60, height: 60 },
  fileNote: { fontSize: 11, color: colors.muted, marginTop: 4 },
  err: { color: colors.live, fontSize: 13, marginTop: 14 },
  ok: { color: colors.green, fontSize: 13, marginTop: 14, fontWeight: '600' },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 10,
  },
  rowInactive: { opacity: 0.55 },
  rowThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#f0e6d6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowImg: { width: 42, height: 42 },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 11, color: colors.muted },
  act: { paddingHorizontal: 8, paddingVertical: 6 },
  actEdit: { color: colors.maroon, fontWeight: '700', fontSize: 13 },
  actDel: { color: colors.live, fontWeight: '700', fontSize: 13 },
});
