import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { Card, Title, Muted, Button } from './ui';
import SectionHeader from './SectionHeader';
import { t } from '../i18n';
import type { PublicHost } from '../lib/hosts';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Props = {
  title: string;
  icon: IconName;
  hosts: PublicHost[];
  followed: Set<string>;
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
  prompt: string;
  emptyText: string;
  fallbackName: string;
};

export default function HostFollowSection({
  title,
  icon,
  hosts,
  followed,
  onFollow,
  onUnfollow,
  prompt,
  emptyText,
  fallbackName,
}: Props) {
  const mine = hosts.filter((h) => followed.has(h.user_id));
  const top = hosts.filter((h) => !followed.has(h.user_id)).slice(0, 3);

  const HostCard = ({ h, following }: { h: PublicHost; following: boolean }) => (
    <Card>
      <View style={styles.row}>
        <View style={styles.thumb}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Title>{h.name || fallbackName}</Title>
          {!!h.city && <Muted>{h.city}</Muted>}
        </View>
      </View>
      <Button
        label={following ? t('home.following') : t('home.follow')}
        variant={following ? 'outline' : 'primary'}
        onPress={() => (following ? onUnfollow(h.user_id) : onFollow(h.user_id))}
      />
    </Card>
  );

  return (
    <>
      <SectionHeader icon={icon} title={title} />
      {mine.length > 0 ? (
        mine.map((h) => <HostCard key={h.user_id} h={h} following />)
      ) : (
        <>
          <Muted style={{ marginTop: 2 }}>{prompt}</Muted>
          {top.length === 0 && <Muted style={{ marginTop: 8 }}>{emptyText}</Muted>}
          {top.map((h) => (
            <HostCard key={h.user_id} h={h} following={false} />
          ))}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
