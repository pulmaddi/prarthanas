import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearRitualItemsCache, ritualItemFileUrl, type RitualItem } from '../lib/ritualItems';

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

async function assetToBytes(asset: any): Promise<ArrayBuffer> {
  if (asset.file) return await asset.file.arrayBuffer();
  const res = await fetch(asset.uri);
  return await res.arrayBuffer();
}

type Source = 'static' | 'deity';

function ItemForm({
  editing,
  onDone,
  onSaved,
}: {
  editing: RitualItem | null;
  onDone: () => void;
  onSaved: () => void;
}) {
  const { isAdmin } = useAuth();
  const [name, setName] = useState(editing?.name ?? '');
  const [nameHi, setNameHi] = useState(editing?.name_hi ?? '');
  const [nameTe, setNameTe] = useState(editing?.name_te ?? '');
  const [keyVal, setKeyVal] = useState(editing?.item_key ?? '');
  const [sort, setSort] = useState(String(editing?.sort_order ?? 100));
  const [source, setSource] = useState<Source>(editing?.image_source ?? 'static');
  const [active, setActive] = useState(editing?.is_active ?? true);
  const [imagePath, setImagePath] = useState<string | null>(editing?.image_path ?? null);
  const [imageAsset, setImageAsset] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
      onSaved();
      onDone();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.editForm}>
      <Text style={styles.editFormTitle}>
        {editing ? `Edit — ${editing.name}` : 'Add New Item'}
      </Text>

      <Text style={styles.fieldLabel}>{t('adminRitual.name')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (!editing) setKeyVal(slugify(v));
        }}
        placeholder="Wooden Platform"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.fieldLabel}>{t('adminRitual.nameHi')}</Text>
      <TextInput
        style={styles.input}
        value={nameHi}
        onChangeText={setNameHi}
        placeholder="लकड़ी का पटरा"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.fieldLabel}>{t('adminRitual.nameTe')}</Text>
      <TextInput
        style={styles.input}
        value={nameTe}
        onChangeText={setNameTe}
        placeholder="చెక్క పీట"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.fieldLabel}>{t('admin.key')}</Text>
      <TextInput
        style={[styles.input, !!editing && styles.readonly]}
        value={keyVal}
        onChangeText={setKeyVal}
        editable={!editing}
        placeholder="wooden_platform"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />

      <Text style={styles.fieldLabel}>{t('admin.sort')}</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
      />

      <Text style={styles.fieldLabel}>{t('adminRitual.source')}</Text>
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
          <Text style={styles.fieldLabel}>{t('admin.image')}</Text>
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

      <Text style={styles.fieldLabel}>{t('adminRitual.active')}</Text>
      <TouchableOpacity
        style={[styles.toggle, active && styles.toggleOn]}
        onPress={() => setActive((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, active && styles.toggleTextOn]}>
          {active ? `✓ ${t('adminRitual.activeOn')}` : t('adminRitual.activeOff')}
        </Text>
      </TouchableOpacity>

      {!!err && <Text style={styles.errText}>{err}</Text>}

      <View style={styles.formActions}>
        <View style={{ flex: 1 }}>
          <Button label={busy ? '…' : t('admin.save')} onPress={onSave} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('admin.cancel')} variant="outline" onPress={onDone} />
        </View>
      </View>
    </View>
  );
}

export default function AdminRitualItemsScreen() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<RitualItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RitualItem | null>(null);

  const loadRows = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('ritual_items')
      .select('item_key,name,name_hi,name_te,image_source,image_path,sort_order,is_active')
      .order('sort_order', { ascending: true });
    if (!error && data) setRows(data as RitualItem[]);
  };

  useEffect(() => { loadRows(); }, []);

  const del = async (item: RitualItem) => {
    const doDelete = async () => {
      const { error } = await supabase.from('ritual_items').delete().eq('item_key', item.item_key);
      if (!error) { clearRitualItemsCache(); loadRows(); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${item.name}"?`)) doDelete();
    } else {
      Alert.alert('Delete', `Delete "${item.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deny}>🔒 {t('adminRitual.notAdmin')}</Text>
      </View>
    );
  }

  const formVisible = showForm || !!editingItem;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      {/* Add New Item button at top */}
      {!formVisible && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditingItem(null); setShowForm(true); }}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add New Item</Text>
        </TouchableOpacity>
      )}

      {/* Form (add or edit) */}
      {formVisible && (
        <ItemForm
          editing={editingItem}
          onDone={() => { setShowForm(false); setEditingItem(null); }}
          onSaved={loadRows}
        />
      )}

      {/* Catalog list */}
      <View style={styles.listBox}>
        {rows.length === 0 && (
          <Text style={styles.emptyNote}>No items yet. Tap "Add New Item" to create one.</Text>
        )}
        {rows.map((r) => (
          <View key={r.item_key} style={[styles.row, !r.is_active && styles.rowInactive]}>
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
                #{r.sort_order} · {r.item_key}{!r.is_active ? ' · hidden' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { setShowForm(false); setEditingItem(r); }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={colors.maroon} />
              <Text style={styles.editLabel}>{t('admin.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => del(r)}>
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.live} />
              <Text style={styles.deleteLabel}>{t('admin.delete')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  deny: { color: colors.muted, fontSize: 15 },

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
  chips: { flexDirection: 'row', gap: 8, marginBottom: 4 },
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
  errText: { color: colors.live, fontSize: 13, marginTop: 10 },
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
  rowInactive: { opacity: 0.5 },
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
