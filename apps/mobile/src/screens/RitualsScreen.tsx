import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useBreakpoint } from '../lib/useBreakpoint';
import WebPageWrapper from '../components/WebPageWrapper';
import { t } from '../i18n';

type Props = BottomTabScreenProps<MainTabParamList, 'TodaysPuja'>;

const RITUALS = [
  { icon: '🪔', label: 'Aarti', sub: 'daily' },
  { icon: '🌸', label: 'Puja', sub: 'archana' },
  { icon: '🔥', label: 'Havan', sub: 'homam' },
  { icon: '🛕', label: 'Abhishekam', sub: '' },
  { icon: '📿', label: 'Japa', sub: 'chanting' },
  { icon: '🪷', label: 'Lakshmi Puja', sub: '' },
  { icon: '🐚', label: 'Satyanarayan', sub: '' },
  { icon: '🌺', label: 'Sankalp', sub: 'personal' },
  { icon: '✨', label: 'More', sub: '' },
];

export default function RitualsScreen(_props: Props) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDesktop } = useBreakpoint();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isDesktop && (
        <View style={styles.topbar}>
          <Text style={styles.title}>🪔 {t('tabs.todaysPuja')}</Text>
        </View>
      )}
      <WebPageWrapper>
        <ScrollView contentContainerStyle={[styles.body, isDesktop && styles.bodyDesktop]}>
          {isDesktop && <Text style={styles.pageTitle}>🪔 {t('tabs.todaysPuja')}</Text>}
          <Text style={styles.hint}>
            Book a guided ceremony — group or personal (with your sankalpa).
          </Text>
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {RITUALS.map((r) => (
              <TouchableOpacity
                key={r.label}
                style={[styles.tile, isDesktop && styles.tileDesktop]}
                onPress={() => nav.navigate('RitualBooking', { occasionId: r.label, title: r.label })}
              >
                <Text style={[styles.tileIcon, isDesktop && styles.tileIconDesktop]}>{r.icon}</Text>
                <Text style={[styles.tileLabel, isDesktop && styles.tileLabelDesktop]}>{r.label}</Text>
                {!!r.sub && <Text style={styles.tileSub}>{r.sub}</Text>}
              </TouchableOpacity>
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
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.maroon, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridDesktop: { gap: 16, justifyContent: 'flex-start' },
  tile: {
    width: '31%',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  tileDesktop: { width: 140, marginBottom: 0 },
  tileIcon: { fontSize: 26 },
  tileIconDesktop: { fontSize: 36 },
  tileLabel: { fontSize: 11, fontWeight: '600', color: '#5b4a38', marginTop: 6 },
  tileLabelDesktop: { fontSize: 13 },
  tileSub: { fontSize: 9, color: colors.muted },
});
