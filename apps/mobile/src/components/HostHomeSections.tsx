import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Card, Title, Muted, Button } from './ui';
import SectionHeader from './SectionHeader';
import { t } from '../i18n';
import { useHostContent } from '../lib/hostContent';

/**
 * Host home blocks shown below Daily Rituals for Priest / Guru / Temple Exec:
 * recent Meeting Invites + Notification Messages, each with a quick action to
 * the full management tab.
 */
export default function HostHomeSections({
  onOpenMeetings,
  onOpenNotifications,
}: {
  onOpenMeetings: () => void;
  onOpenNotifications: () => void;
}) {
  const { meetings, notifications } = useHostContent();

  return (
    <>
      <SectionHeader icon="calendar-clock" title={t('host.meetingInvites')} />
      {meetings.length === 0 ? (
        <Muted style={{ marginTop: 2 }}>{t('host.noMeetingsHome')}</Muted>
      ) : (
        meetings.slice(0, 3).map((m) => (
          <Card key={m.id}>
            <Title>{m.title}</Title>
            {!!m.when_text && <Muted>🕒 {m.when_text}</Muted>}
          </Card>
        ))
      )}
      <Button label={`＋ ${t('host.newMeeting')}`} onPress={onOpenMeetings} />

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
});
