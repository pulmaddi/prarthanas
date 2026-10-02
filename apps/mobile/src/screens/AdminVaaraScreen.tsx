import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { pickFile, uploadToDeities } from '../lib/storage';
import {
  useWeekdayDeities,
  clearWeekdayCache,
  type WeekdayDeity,
} from '../lib/weekdayDeities';
import { deityFileUrl } from '../lib/deities';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function EditForm({
  row,
  onDone,
}: {
  row: Partial<WeekdayDeity> & { day: number; day_name: string };
  onDone: () => void;
}) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState(row.deity_name ?? '');
  const [imagePath, setImagePath] = useState(row.image_path ?? null);
  const [audioPath, setAudioPath] = useState(row.audio_path ?? null);
  const [imageAsset, setImageAsset] = useState<any>(null);
  const [audioAsset, setAudioAsset] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const slug = row.day_name.toLowerCase();

  const save = async () => {
    setErr('');
    if (name.trim().length < 2) return setErr('Enter the deity name.');
    try {
      setBusy(true);
      let image_path = imagePath;
      let audio_path = audioPath;
      if (imageAsset) {
        const ext = (imageAsset.name?.split('.').pop() || 'png').toLowerCase();
        image_path = await uploadToDeities(`weekday/${slug}.${ext}`, imageAsset);
      }
      if (audioAsset) {
        const ext = (audioAsset.name?.split('.').pop() || 'mp3').toLowerCase();
        audio_path = await uploadToDeities(`weekday/${slug}-audio.${ext}`, audioAsset);
      }
      const { error } = await supabase.from('weekday_deities').upsert({
        day: row.day,
        day_name: row.day_name,
        deity_name: name.trim(),
        image_path,
        audio_path,
      });
      if (error) throw error;
      clearWeekdayCache();
      onDone();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const previewUri = imageAsset?.uri || deityFileUrl(imagePath) || '';

  return (
    <View style={styles.editForm}>
      <Text style={styles.editFormTitle}>
        {row.deity_name ? `Edit — ${row.day_name}` : `Add — ${row.day_name}`}
      </Text>

      <Text style={styles.fieldLabel}>Deity Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('admin.name')}
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
      />

      <Text style={styles.fieldLabel}>Deity Image</Text>
      <View style={styles.pickRow}>
        <View style={styles.preview}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImg} />
          ) : (
            <Text style={{ fontSize: 20 }}>🕉️</Text>
          )}
        </View>
        <View style={styles.pickCol}>
          <Button
            label={t('admin.pickImage')}
            variant="outline"
            onPress={async () => setImageAsset((await pickFile('image')) ?? null)}
          />
          <Text style={styles.fileNote} numberOfLines={1}>
            {imageAsset?.name || imagePath || t('admin.none')}
          </Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Stotra / Audio</Text>
      <View style={styles.pickRow}>
        <View style={styles.preview}>
          <Text style={{ fontSize: 20 }}>{audioAsset || audioPath ? '🔊' : '🎵'}</Text>
        </View>
        <View style={styles.pickCol}>
          <Button
            label={t('admin.pickAudio')}
            variant="outline"
            onPress={async () => setAudioAsset((await pickFile('audio')) ?? null)}
          />
          <Text style={styles.fileNote} numberOfLines={1}>
            {audioAsset?.name || audioPath || t('admin.none')}
          </Text>
        </View>
      </View>

      {!!err && <Text style={styles.errText}>{err}</Text>}

      <View style={styles.formActions}>
        <View style={{ flex: 1 }}>
          <Button label={busy ? '…' : t('admin.save')} onPress={save} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('admin.cancel')} variant="outline" onPress={onDone} />
        </View>
        {!!row.deity_name && (
          <View style={{ flex: 1 }}>
            <Button
              label={t('admin.preview')}
              variant="outline"
              onPress={() => nav.navigate('Pooja', { day: row.day })}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function DayRow({
  row,
  onEdit,
  onDeleted,
}: {
  row: WeekdayDeity;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const imgUri = deityFileUrl(row.image_path) || '';

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove deity for ${row.day_name}?`)) doDelete();
    } else {
      Alert.alert('Remove', `Remove deity for ${row.day_name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const doDelete = async () => {
    await supabase
      .from('weekday_deities')
      .update({ deity_name: null, image_path: null, audio_path: null })
      .eq('day', row.day);
    clearWeekdayCache();
    onDeleted();
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowThumb}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.rowImg} />
        ) : (
          <Text style={{ fontSize: 18 }}>🕉️</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowDay}>{row.day_name}</Text>
        <Text style={styles.rowDeity} numberOfLines={1}>
          {row.deity_name || <Text style={styles.rowEmpty}>Not set</Text>}
        </Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil" size={16} color={colors.maroon} />
        <Text style={styles.editLabel}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
        <MaterialCommunityIcons name="delete-outline" size={16} color={colors.live} />
        <Text style={styles.deleteLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Add form shown at top — includes a day picker limited to days with no deity set */
function AddForm({
  allRows,
  onDone,
}: {
  allRows: Array<Partial<WeekdayDeity> & { day: number; day_name: string }>;
  onDone: () => void;
}) {
  const emptyRows = allRows.filter((r) => !r.deity_name);
  const [selectedDay, setSelectedDay] = useState<number>(
    emptyRows.length > 0 ? emptyRows[0].day : -1,
  );

  // All 7 days already have a deity — nothing to add
  if (emptyRows.length === 0) {
    return (
      <View style={styles.allFilledBox}>
        <MaterialCommunityIcons name="check-circle-outline" size={36} color={colors.green} />
        <Text style={styles.allFilledTitle}>All days are configured</Text>
        <Text style={styles.allFilledSub}>
          Every weekday already has a deity assigned.{'\n'}
          Use the Edit or Delete buttons on a day to make changes.
        </Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={onDone}>
          <MaterialCommunityIcons name="arrow-left" size={16} color={colors.maroon} />
          <Text style={styles.goBackText}>Back to list</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedRow = allRows.find((r) => r.day === selectedDay) ?? emptyRows[0];

  return (
    <View>
      {/* Day picker chips — only empty days are shown */}
      <View style={styles.dayPickerWrap}>
        <Text style={styles.dayPickerLabel}>Select a day to configure</Text>
        <View style={styles.dayChips}>
          {emptyRows.map((r) => (
            <TouchableOpacity
              key={r.day}
              style={[styles.dayChip, selectedDay === r.day && styles.dayChipOn]}
              onPress={() => setSelectedDay(r.day)}
            >
              <Text style={[styles.dayChipText, selectedDay === r.day && styles.dayChipTextOn]}>
                {r.day_name.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* key forces remount when day changes so useState in EditForm resets */}
      <EditForm key={selectedDay} row={selectedRow} onDone={onDone} />
    </View>
  );
}

export default function AdminVaaraScreen() {
  const { isAdmin } = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { rows, reload } = useWeekdayDeities();
  useFocusEffect(useCallback(() => { reload(); }, []));
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const formOpen = showAddForm || editingDay !== null;

  const handleDone = () => {
    setEditingDay(null);
    setShowAddForm(false);
    clearWeekdayCache();
    reload();
  };

  // When a form is open, override the header back button so it returns to
  // the list view inside this screen instead of popping the whole screen.
  useEffect(() => {
    nav.setOptions({
      headerLeft: formOpen
        ? () => (
            <TouchableOpacity
              onPress={handleDone}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.maroon} />
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [formOpen]);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deny}>🔒 {t('admin.notAdmin')}</Text>
      </View>
    );
  }

  const allRows: Array<Partial<WeekdayDeity> & { day: number; day_name: string }> =
    DAYS.map((dayName, i) => {
      const found = rows?.find((r: WeekdayDeity) => r.day === i);
      return found ?? { day: i, day_name: dayName };
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      {formOpen ? (
        /* ── FORM VIEW: only the active form, no list ── */
        <>
          {showAddForm && <AddForm allRows={allRows} onDone={handleDone} />}
          {editingDay !== null && (() => {
            const row = allRows.find((r) => r.day === editingDay);
            return row ? <EditForm row={row} onDone={handleDone} /> : null;
          })()}
        </>
      ) : (
        /* ── LIST VIEW: button + all day rows ── */
        <>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add New Item</Text>
          </TouchableOpacity>

          <View style={styles.listBox}>
            {allRows.map((row) => (
              <DayRow
                key={row.day}
                row={row as WeekdayDeity}
                onEdit={() => setEditingDay(row.day)}
                onDeleted={handleDone}
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

  listBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0e6d6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowImg: { width: 44, height: 44 },
  rowDay: { fontSize: 13, fontWeight: '700', color: colors.maroon },
  rowDeity: { fontSize: 13, color: colors.ink, marginTop: 1 },
  rowEmpty: { color: colors.muted, fontStyle: 'italic' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editLabel: { fontSize: 13, fontWeight: '700', color: colors.maroon },
  deleteLabel: { fontSize: 13, fontWeight: '700', color: colors.live },

  allFilledBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  allFilledTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 4 },
  allFilledSub: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.maroon,
  },
  goBackText: { fontSize: 13, fontWeight: '700', color: colors.maroon },

  dayPickerWrap: { marginBottom: 10 },
  dayPickerLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  dayChipOn: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  dayChipText: { fontSize: 13, color: colors.ink },
  dayChipTextOn: { color: '#fff', fontWeight: '700' },

  editForm: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 14,
  },
  editFormTitle: { fontSize: 14, fontWeight: '700', color: colors.maroon, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 5, marginTop: 10 },

  input: {
    backgroundColor: colors.cream,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 4,
  },
  pickRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 4 },
  preview: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: { width: 52, height: 52 },
  pickCol: { flex: 1 },
  fileNote: { fontSize: 11, color: colors.muted, marginTop: 4 },
  errText: { color: colors.live, fontSize: 13, marginTop: 6, marginBottom: 4 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
