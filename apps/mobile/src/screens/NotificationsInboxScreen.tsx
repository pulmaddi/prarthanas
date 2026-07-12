import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { t } from '../i18n';

/**
 * Devotee notifications inbox — placeholder empty state for now. Real feed
 * (broadcasts from followed priests/gurus/temples) will be wired later.
 */
export default function NotificationsInboxScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <MaterialCommunityIcons name="bell-outline" size={56} color={colors.sandalDeep} />
        <Text style={styles.title}>{t('notify.empty')}</Text>
        <Text style={styles.hint}>{t('notify.hint')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 10,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 8 },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
});
