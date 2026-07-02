import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';
import { Card, Title, Muted, Button } from './ui';
import SectionHeader from './SectionHeader';
import { t } from '../i18n';
import { useHostContent, type Meeting } from '../lib/hostContent';

/**
 * Host home blocks shown below Daily Rituals for Priest / Guru / Temple Exec:
 * recent Meeting Invites + Notification Messages, each with a quick action to
 * the full management tab.
 */
export default function HostHomeSections({
  onOpenMeetings,
  onOpenNotifications,
  onOpenRoom,
}: {
  onOpenMeetings: () => void;
  onOpenNotifications: () => void;
  onOpenRoom: (m: Meeting) => void;
}) {
  const { meetings, notifications, reload } = useHostContent();

  // Home stays mounted as a tab; refetch whenever it regains focus so newly
  // scheduled meetings / sent notifications appear without an app restart.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <>
      <SectionHeader icon="calendar-clock" title={t('host.meetingInvites')} />
      {meetings.length === 0 ? (
        <Muted style={{ marginTop: 2 }}>{t('host.noMeetingsHome')}</Muted>
      ) : (
        meetings.slice(0, 3).map((m) => (
          <TouchableOpacity key={m.id} activeOpacity={0.85} onPress={() => onOpenRoom(m)}>
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Title>{m.title}</Title>
                  {!!m.when_text && <Muted>🕒 {m.when_text}</Muted>}
                </View>
                <View style={styles.open}>
                  <MaterialCommunityIcons name="video" size={16} color={colors.green} />
                  <Text style={styles.openText}>{t('room.open')}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
      <Button label={`＋ ${t('host.scheduleMeeting')}`} onPress={onOpenMeetings} />

      <SectionHeader icon="bell-ring" title={t('host.notificationMessages')} />
      {notifications.length === 0 ? (
        <Muted style={{ marginTop: 2 }}>{t('host.noNotificationsHome')}</Muted>
      ) : (
        notifications.slice(0, 3).map((n) => (
          <Card key={n.id}>
            <Title>{n.title}</Title>
            {!!n.body && (
              <Text style={styles.body} numberOfLines={2}>
                {n.body}
              </Text>
            )}
          </Card>
        ))
      )}
      <Button
        label={`＋ ${t('host.newNotification')}`}
        onPress={onOpenNotifications}
        variant="green"
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 13, color: colors.ink, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  open: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openText: { color: colors.green, fontWeight: '700', fontSize: 12 },
});
