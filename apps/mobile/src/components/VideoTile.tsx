// Native fallback for VideoTile — shows an avatar since @livekit/react-native
// needs a custom dev build. VideoTile.web.tsx handles web builds.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  track?: unknown;
  isLocal?: boolean;
  name: string;
  audioMuted?: boolean;
  style?: object;
};

export default function VideoTile({ name, audioMuted, style }: Props) {
  const initial = (name.trim()[0] || '?').toUpperCase();
  return (
    <View style={[styles.tile, style as any]}>
      <View style={styles.avatarWrap}>
        <Text style={styles.initial}>{initial}</Text>
      </View>
      <View style={styles.nameBar}>
        {audioMuted && <Text style={styles.mute}>🔇</Text>}
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.maroon,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.white, fontSize: 28, fontWeight: '800' },
  nameBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mute: { fontSize: 12 },
  name: { color: colors.white, fontSize: 11, fontWeight: '600', flex: 1 },
});
