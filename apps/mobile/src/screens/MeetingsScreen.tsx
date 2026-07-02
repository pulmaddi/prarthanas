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
import { useHostContent } from '../lib/hostContent';

export default function MeetingsScreen() {
  const { meetings, createMeeting, deleteMeeting } = useHostContent();
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [description, setDescription] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return Alert.alert(t('host.meetingTitle'), t('host.titleRequired'));
    setBusy(true);
    try {
      await createMeeting({
        title: title.trim(),
        when_text: when.trim() || undefined,
        description: description.trim() || undefined,
        join_url: joinUrl.trim() || undefined,
      });
      setTitle('');
      setWhen('');
      setDescription('');
      setJoinUrl('');
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
        <SectionHeader icon="video-plus" title={t('host.newMeeting')} />
        <Card>
          <Text style={styles.label}>{t('host.meetingTitle')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('host.meetingTitlePh')}
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>{t('host.when')}</Text>
          <TextInput
            style={styles.input}
            value={when}
            onChangeText={setWhen}
            placeholder={t('host.whenPh')}
            placeholderTextColor={colors.muted}
          />
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
          <Button label={busy ? '…' : t('host.sendInvite')} onPress={submit} />
        </Card>

        <SectionHeader icon="calendar-check" title={t('host.upcomingMeetings')} />
        {meetings.length === 0 && <Muted style={{ marginTop: 2 }}>{t('host.noMeetings')}</Muted>}
        {meetings.map((m) => (
          <Card key={m.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Title>{m.title}</Title>
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
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 8, marginBottom: 4 },
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
  multiline: { height: 76, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  desc: { fontSize: 13, color: colors.ink, marginTop: 4 },
  link: { fontSize: 12, color: colors.saffron, marginTop: 4 },
});
