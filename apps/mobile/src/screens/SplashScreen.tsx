import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, shadow } from '../theme';
import { t } from '../i18n';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    let cancelled = false;
    const route = async () => {
      // If already signed in, skip straight to the app.
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) return navigation.replace('Main');
      }
      if (!cancelled) navigation.replace('Welcome');
    };
    const id = setTimeout(route, 1200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCard}>
        <Image
          source={require('../../assets/logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.tag}>{t('tagline')}</Text>
      <Text style={styles.langs}>English · हिन्दी · తెలుగు</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 26,
    ...shadow.card,
  },
  logo: { width: 200, height: 200 },
  tag: { color: colors.cream, fontSize: 13, marginTop: 16, opacity: 0.9 },
  langs: { color: colors.cream, fontSize: 11, position: 'absolute', bottom: 40, opacity: 0.8 },
});
