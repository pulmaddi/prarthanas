import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Card, Title, Muted, Button } from '../components/ui';
import SectionHeader from '../components/SectionHeader';
import { t } from '../i18n';
import { useHostContent, type MeetingType, type Recurrence } from '../lib/hostContent';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d?: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !day) return d;
  return `${day} ${MONTHS[m - 1] ?? ''} ${y}`;
}
function fmtTime(t24?: string): string {
  if (!t24) return '';
  const [h, m] = t24.split(':').map((n) => parseInt(n, 10));
  if (isNaN(h)) return t24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(isNaN(m) ? 0 : m).padStart(2, '0')} ${ampm}`;
}

function summarize(o: {
  recurrence: Recurrence;
  date: string;
  time: string;
  weekdays: number[];
}): string {
  const parts: string[] = [];
  if (o.recurrence === 'none') parts.push(o.date ? fmtDate(o.date) : t('host.repeatNone'));
  else if (o.recurrence === 'daily') parts.push(t('host.repeatDaily'));
  else if (o.recurrence === 'weekly')
    parts.push(
      t('host.repeatWeekly') +
        (o.weekdays.length ? ' · ' + o.weekdays.sort((a, b) => a - b).map((d) => DOW[d]).join(', ') : ''),
    );
  else if (o.recurrence === 'monthly') parts.push(t('host.repeatMonthly'));
  if (o.time) parts.push(fmtTime(o.time));
  if (o.recurrence !== 'none' && o.date) parts.push(`${t('host.from')} ${fmtDate(o.date)}`);
  return parts.join(' · ');
}

const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function MeetingsScreen() {
  const { meetings, createMeeting, deleteMeeting } = useHostContent();

  const [type, setType] = useState<MeetingType>('meeting');
  const [title, setTitle] = useState('');
  const [deity, setDeity] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleDay = (d: number) =>
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d]));

  const reset = () => {
    setType('meeting');
    setTitle('');
    setDeity('');
    setDate('');
    setTime('');
    setRecurrence('none');
    setWeekdays([]);
    setDescription('');
    setJoinUrl('');
  };

  const submit = async () => {
    if (!title.trim()) return Alert.alert(t('host.meetingTitle'), t('host.titleRequired'));
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date.trim()))
      return Alert.alert(t('host.date'), t('host.dateInvalid'));
    if (time && !/^\d{1,2}:\d{2}$/.test(time.trim()))
      return Alert.alert(t('host.time'), t('host.timeInvalid'));
    setBusy(true);
    try {
      await createMeeting({
        title: title.trim(),
        meeting_type: type,
        deity_name: type === 'special_pooja' && deity.trim() ? deity.trim() : undefined,
        start_date: date.trim() || undefined,
        start_time: time.trim() || undefined,
        recurrence,
        weekdays: recurrence === 'weekly' && weekdays.length ? weekdays.join(',') : undefined,
        when_text: summarize({ recurrence, date: date.trim(), time: time.trim(), weekdays }),
        description: description.trim() || undefined,
        join_url: joinUrl.trim() || undefined,
      });
      reset();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t('host.deleteMeeting'), t('host.deleteConfirm'), [
      { text: t('host.cancel'), style: 'cancel' },
      { text: t('host.delete'), style: 'destructive', onPress: () => deleteMeeting(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <MaterialCommunityIcons name="calendar-clock" size={22} color={colors.white} />
        <Text style={styles.topTitle}>{t('host.meetingsTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <SectionHeader icon="calendar-plus" title={t('host.scheduleTitle')} />
        <Card>
          {/* Type */}
          <Text style={styles.label}>{t('host.type')}</Text>
          <View style={styles.chipRow}>
            <Chip label={t('host.typeMeeting')} active={type === 'meeting'} onPress={() => setType('meeting')} />
            <Chip
              label={t('host.typePooja')}
              active={type === 'special_pooja'}
              onPress={() => setType('special_pooja')}
            />
          </View>

          <Text style={styles.label}>{t('host.meetingTitle')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'special_pooja' ? t('host.poojaTitlePh') : t('host.meetingTitlePh')}
            placeholderTextColor={colors.muted}
          />

          {type === 'special_pooja' && (
            <>
              <Text style={styles.label}>{t('host.deity')}</Text>
              <TextInput
                style={styles.input}
                value={deity}
                onChangeText={setDeity}
                placeholder={t('host.deityPh')}
                placeholderTextColor={colors.muted}
              />
            </>
          )}

          {/* Date + time */}
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('host.date')}</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder={t('host.datePh')}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('host.time')}</Text>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
                placeholder={t('host.timePh')}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Recurrence */}
          <Text style={styles.label}>{t('host.repeats')}</Text>
          <View style={styles.chipRow}>
            <Chip label={t('host.repeatNone')} active={recurrence === 'none'} onPress={() => setRecurrence('none')} />
            <Chip label={t('host.repeatDaily')} active={recurrence === 'daily'} onPress={() => setRecurrence('daily')} />
            <Chip label={t('host.repeatWeekly')} active={recurrence === 'weekly'} onPress={() => setRecurrence('weekly')} />
            <Chip label={t('host.repeatMonthly')} active={recurrence === 'monthly'} onPress={() => setRecurrence('monthly')} />
          </View>

          {recurrence === 'weekly' && (
            <>
              <Text style={styles.label}>{t('host.onDays')}</Text>
              <View style={styles.chipRow}>
                {DOW.map((d, i) => (
                  <Chip key={d} label={d} active={weekdays.includes(i)} onPress={() => toggleDay(i)} />
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>{t('host.joinLink')}</Text>
          <TextInput
            style={styles.input}
            value={joinUrl}
            onChangeText={setJoinUrl}
            placeholder={t('host.joinLinkPh')}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('host.description')}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('host.descriptionPh')}
            placeholderTextColor={colors.muted}
            multiline
          />

          <Button label={busy ? '…' : t('host.schedule')} onPress={submit} />
        </Card>

        <SectionHeader icon="calendar-check" title={t('host.upcomingMeetings')} />
        {meetings.length === 0 && <Muted style={{ marginTop: 2 }}>{t('host.noMeetings')}</Muted>}
        {meetings.map((m) => (
          <Card key={m.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Title>{m.title}</Title>
                  {m.meeting_type === 'special_pooja' && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('host.typePooja')}</Text>
                    </View>
                  )}
                </View>
                {!!m.deity_name && <Muted>🕉️ {m.deity_name}</Muted>}
                {!!m.when_text && <Muted>🕒 {m.when_text}</Muted>}
                {!!m.description && <Text style={styles.desc}>{m.description}</Text>}
                {!!m.join_url && <Text style={styles.link}>{m.join_url}</Text>}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(m.id)} hitSlop={8}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topbar: {
    backgroundColor: colors.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.lg,
  },
  topTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  body: { padding: spacing.lg, paddingBottom: 30 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  multiline: { height: 72, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chipText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    backgroundColor: colors.saffron,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  desc: { fontSize: 13, color: colors.ink, marginTop: 4 },
  link: { fontSize: 12, color: colors.saffron, marginTop: 4 },
});
