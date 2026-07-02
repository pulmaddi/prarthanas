import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';

const LANG_LABEL: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
};

export default function ProfileScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, email, signOut } = useAuth();

  const name = profile?.name?.trim() || t('profile.devotee');
  const initial = (name[0] || '🙏').toUpperCase();

  const onLogout = async () => {
    await signOut();
    nav.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const MenuRow = ({
    icon,
    label,
    onPress,
    danger,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          {!!email && <Text style={styles.email}>{email}</Text>}
          <Text style={styles.lang}>
            🌐 {LANG_LABEL[profile?.language ?? 'en'] ?? 'English'}
          </Text>
        </View>

        <Text style={styles.section}>{t('profile.account')}</Text>
        <View style={styles.card}>
          <MenuRow
            icon="👤"
            label={t('profile.myProfile')}
            onPress={() => nav.navigate('MyProfile')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="🔑"
            label={t('profile.changePassword')}
            onPress={() => nav.navigate('ChangePassword')}
          />
          <View style={styles.divider} />
          <MenuRow icon="🔔" label={t('profile.notifications')} />
        </View>

        <Text style={styles.section}>{t('profile.about')}</Text>
        <View style={styles.card}>
          <MenuRow
            icon="📄"
            label={t('profile.terms')}
            onPress={() => nav.navigate('Terms')}
          />
        </View>

        <View style={[styles.card, { marginTop: 22 }]}>
          <MenuRow icon="🚪" label={t('profile.logout')} danger onPress={onLogout} />
        </View>

        <Text style={styles.version}>Ishta · v0.1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { alignItems: 'center', paddingVertical: spacing.md },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  name: { color: colors.ink, fontSize: 20, fontWeight: '700', marginTop: 12 },
  email: { color: colors.muted, fontSize: 13, marginTop: 2 },
  lang: { color: colors.muted, fontSize: 12, marginTop: 8 },
  body: { padding: spacing.lg, paddingBottom: 40 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 18 },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink },
  danger: { color: colors.live, fontWeight: '700' },
  chevron: { fontSize: 20, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 44 },
  version: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: 24 },
});
