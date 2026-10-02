import React, { useState } from 'react';
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

export default function AdminVaaraScreen() {
  const { isAdmin } = useAuth();
  const { rows, reload } = useWeekdayDeities();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [addingDay, setAddingDay] = useState<number | null>(null);

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

  const handleDone = () => {
    setEditingDay(null);
    setAddingDay(null);
    clearWeekdayCache();
    reload?.();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      {/* Add New button at top */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          const firstEmpty = allRows.find((r) => !r.deity_name);
          if (firstEmpty) setAddingDay(firstEmpty.day);
        }}
        activeOpacity={0.82}
      >
        <MaterialCommunityIcons name="plus" size={18} color="#fff" />
        <Text style={styles.addBtnText}>Add New Item</Text>
      </TouchableOpacity>

      {/* Inline add form */}
      {addingDay !== null && (
        <EditForm row={allRows[addingDay]} onDone={handleDone} />
      )}

      {/* List of all weekday rows */}
      <View style={styles.listBox}>
        {allRows.map((row, i) => {
          if (editingDay === row.day) {
            return <EditForm key={row.day} row={row} onDone={handleDone} />;
          }
          return (
            <DayRow
              key={row.day}
              row={row as WeekdayDeity}
              onEdit={() => { setAddingDay(null); setEditingDay(row.day); }}
              onDeleted={handleDone}
            />
          );
        })}
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
