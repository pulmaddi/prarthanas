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

export default function NotificationsScreen() {
  const { notifications, createNotification, deleteNotification } = useHostContent();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return Alert.alert(t('host.notifTitle'), t('host.titleRequired'));
    setBusy(true);
    try {
      await createNotification({ title: title.trim(), body: body.trim() || undefined });
      setTitle('');
      setBody('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t('host.deleteNotif'), t('host.deleteConfirm'), [
      { text: t('host.cancel'), style: 'cancel' },
      { text: t('host.delete'), style: 'destructive', onPress: () => deleteNotification(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <MaterialCommunityIcons name="bell-ring" size={22} color={colors.white} />
        <Text style={styles.topTitle}>{t('host.notificationsTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <SectionHeader icon="bell-plus" title={t('host.newNotification')} />
        <Card>
          <Text style={styles.label}>{t('host.notifTitle')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('host.notifTitlePh')}
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>{t('host.message')}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={body}
            onChangeText={setBody}
            placeholder={t('host.messagePh')}
            placeholderTextColor={colors.muted}
            multiline
          />
          <Muted style={{ marginTop: 6 }}>{t('host.notifHint')}</Muted>
          <Button label={busy ? '…' : t('host.send')} onPress={submit} />
        </Card>

        <SectionHeader icon="history" title={t('host.sentNotifications')} />
        {notifications.length === 0 && (
          <Muted style={{ marginTop: 2 }}>{t('host.noNotifications')}</Muted>
        )}
        {notifications.map((n) => (
          <Card key={n.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Title>{n.title}</Title>
                {!!n.body && <Text style={styles.desc}>{n.body}</Text>}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(n.id)} hitSlop={8}>
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
  multiline: { height: 96, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  desc: { fontSize: 13, color: colors.ink, marginTop: 4 },
});
