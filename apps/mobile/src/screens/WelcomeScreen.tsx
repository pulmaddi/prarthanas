import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme';
import { Button } from '../components/ui';
import GoogleButton from '../components/GoogleButton';
import { t } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo + identity */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tag}>{t('tagline')}</Text>

        {/* Purpose of the app */}
        <Text style={styles.purpose}>{t('welcome.purpose')}</Text>

        <View style={styles.points}>
          {[
            ['📿', t('welcome.point1')],
            ['🪔', t('welcome.point2')],
            ['🛕', t('welcome.point3')],
          ].map(([icon, label]) => (
            <View key={label} style={styles.point}>
              <Text style={styles.pointIcon}>{icon}</Text>
              <Text style={styles.pointText}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.langs}>English · हिन्दी · తెలుగు</Text>
      </ScrollView>

      {/* Accept T&C + Register */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.termsRow}
          activeOpacity={0.8}
          onPress={() => setAccepted((v) => !v)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
            {accepted && <Text style={styles.check}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            {t('welcome.accept')}{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Terms')}
            >
              {t('welcome.terms')}
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={!accepted && styles.disabled}>
          <Button
            label={`🙏 ${t('welcome.registerNow')}`}
            onPress={() => accepted && navigation.navigate('Register')}
          />
        </View>

        <GoogleButton disabled={!accepted} />

        {!accepted && (
          <Text style={styles.hint}>{t('welcome.acceptHint')}</Text>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signin}>{t('welcome.haveAccount')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.maroon },
  scroll: { alignItems: 'center', paddingTop: 64, paddingHorizontal: spacing.xl, paddingBottom: 20 },
  logoBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 22,
    ...shadow.card,
  },
  logo: { width: 170, height: 170 },
  tag: { color: colors.cream, fontSize: 14, opacity: 0.9, marginTop: 16 },
  purpose: {
    color: colors.cream,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 22,
  },
  points: { alignSelf: 'stretch', marginTop: 22, gap: 12 },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    padding: 12,
  },
  pointIcon: { fontSize: 22 },
  pointText: { color: colors.white, fontSize: 14, flex: 1 },
  langs: { color: colors.cream, opacity: 0.8, fontSize: 12, marginTop: 22 },

  footer: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.saffron,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.saffron },
  check: { color: colors.white, fontWeight: '800', fontSize: 14 },
  termsText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 19 },
  link: { color: colors.saffron, fontWeight: '700', textDecorationLine: 'underline' },
  disabled: { opacity: 0.45 },
  hint: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 8 },
  signin: {
    textAlign: 'center',
    color: colors.maroon,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 16,
  },
});
