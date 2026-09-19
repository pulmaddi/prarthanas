import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { Card, Title, Muted, Button } from '../components/ui';
import { useBreakpoint } from '../lib/useBreakpoint';
import WebPageWrapper from '../components/WebPageWrapper';
import { t } from '../i18n';

const COMMUNITIES = [
  { id: '1', icon: '🛕', name: 'Sri Venkateswara Temple', type: 'Temple · Telugu · Hyderabad', followers: '12,480' },
  { id: '2', icon: '🧘', name: 'Swami Anand', type: 'Guru · Hindi · Rishikesh', followers: '8,210' },
  { id: '3', icon: '👥', name: 'Bhakti Mandali', type: 'Group · Telugu · Vijayawada', followers: '3,540' },
  { id: '4', icon: '🛕', name: 'ISKCON Bengaluru', type: 'Temple · English/Hindi', followers: '21,900' },
  { id: '5', icon: '🪷', name: 'Lalitha Sahasranama Group', type: 'Group · Telugu', followers: '1,120' },
];

export default function JoinCommunityScreen() {
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const { isDesktop } = useBreakpoint();
  const toggle = (id: string) => setFollowed((s) => ({ ...s, [id]: !s[id] }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isDesktop && (
        <View style={styles.topbar}>
          <Text style={styles.title}>👥 {t('joinCommunity.title')}</Text>
        </View>
      )}
      <WebPageWrapper>
        <ScrollView contentContainerStyle={[styles.body, isDesktop && styles.bodyDesktop]}>
          {isDesktop && <Text style={styles.pageTitle}>👥 {t('joinCommunity.title')}</Text>}
          <TextInput
            style={styles.search}
            placeholder={t('joinCommunity.search')}
            placeholderTextColor={colors.muted}
          />
          <Muted style={{ marginTop: 4 }}>{t('joinCommunity.subtitle')}</Muted>
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {COMMUNITIES.map((c) => (
              <View key={c.id} style={isDesktop && styles.gridCol}>
                <Card>
                  <View style={styles.row}>
                    <View style={styles.thumb}>
                      <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Title>{c.name}</Title>
                      <Muted>{c.type}</Muted>
                      <Muted>⭐ {c.followers} {t('joinCommunity.followers')}</Muted>
                    </View>
                  </View>
                  <Button
                    label={followed[c.id] ? t('joinCommunity.following') : t('joinCommunity.follow')}
                    variant={followed[c.id] ? 'outline' : 'primary'}
                    onPress={() => toggle(c.id)}
                  />
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>
      </WebPageWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topbar: { backgroundColor: colors.maroon, padding: spacing.lg },
  title: { color: colors.white, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.lg },
  bodyDesktop: { padding: 32 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.maroon, marginBottom: 12 },
  grid: {},
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  gridCol: { flex: 1, minWidth: 280 },
  search: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 13,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
