import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Card, Title, Muted, Button } from '../components/ui';
import { useBreakpoint } from '../lib/useBreakpoint';

type Props = NativeStackScreenProps<RootStackParamList, 'HostProfile'>;

export default function HostProfileScreen({ navigation }: Props) {
  const { isDesktop } = useBreakpoint();

  const upcomingCards = (
    <>
      <Card>
        <Title>Daily Suprabhatam</Title>
        <Muted>Tomorrow 5:30 AM · Free</Muted>
      </Card>
      <Card>
        <Title>Satyanarayan Puja</Title>
        <Muted>Fri 6:30 PM · ₹252</Muted>
      </Card>
    </>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.cover, isDesktop && styles.coverDesktop]} />
      <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
        {isDesktop ? (
          <View style={styles.desktopLayout}>
            <View style={styles.leftPanel}>
              <View style={[styles.avatar, styles.avatarDesktop]}>
                <Text style={{ fontSize: 40 }}>🛕</Text>
              </View>
              <Text style={styles.hostName}>Sri Venkateswara Temple</Text>
              <Text style={styles.hostMeta}>12,480 followers · Telugu · Hyderabad</Text>
              <Text style={styles.verified}>✔︎ Verified</Text>
              <View style={{ marginTop: 16, gap: 8 }}>
                <Button label="Follow" />
                <Button
                  label="Subscribe"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('Subscribe', {
                      hostId: 'demo',
                      hostName: 'Sri Venkateswara Temple',
                    })
                  }
                />
              </View>
            </View>
            <View style={styles.rightPanel}>
              <Text style={styles.section}>Upcoming</Text>
              {upcomingCards}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 24 }}>🛕</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Title style={{ fontSize: 15 }}>Sri Venkateswara Temple</Title>
                <Muted>12,480 followers · Telugu · Hyderabad ✔︎ Verified</Muted>
              </View>
            </View>

            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Follow" />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Subscribe"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('Subscribe', {
                      hostId: 'demo',
                      hostName: 'Sri Venkateswara Temple',
                    })
                  }
                />
              </View>
            </View>

            <Text style={styles.section}>Upcoming</Text>
            {upcomingCards}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  cover: { height: 90, backgroundColor: colors.maroon },
  coverDesktop: { height: 180 },
  body: { padding: spacing.lg, marginTop: -30 },
  bodyDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%', padding: 32, marginTop: -60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDesktop: { width: 100, height: 100, borderRadius: radius.lg, borderWidth: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 16, marginBottom: 4 },
  desktopLayout: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  leftPanel: { width: 220 },
  rightPanel: { flex: 1 },
  hostName: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 12 },
  hostMeta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  verified: { fontSize: 12, color: colors.green, fontWeight: '600', marginTop: 2 },
});
