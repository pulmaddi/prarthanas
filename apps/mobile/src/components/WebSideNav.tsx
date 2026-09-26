import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';
import { useAuth } from '../lib/auth';

type Props = BottomTabBarProps & {
  rootNav: NativeStackNavigationProp<RootStackParamList>;
};

const ICONS: Record<string, [keyof typeof MaterialCommunityIcons.glyphMap, keyof typeof MaterialCommunityIcons.glyphMap]> = {
  Home:            ['home-outline',           'home'],
  TodaysPuja:      ['candle',                 'candle'],
  JoinCommunity:   ['account-group-outline',  'account-group'],
  JoinMeeting:     ['video-outline',          'video'],
  Notifications:   ['bell-outline',           'bell'],
  Meetings:        ['calendar-blank-outline', 'calendar'],
  MyNotifications: ['bullhorn-outline',       'bullhorn'],
};

// On web the tab navigator renders the tab bar below screens (column layout).
// We escape that by fixing the sidebar to the left viewport edge so it
// always spans full height regardless of where the tab bar wrapper sits.
const webFixed = Platform.OS === 'web'
  ? ({ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 } as any)
  : {};

const ADMIN_LINKS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; screen: keyof RootStackParamList }[] = [
  { icon: 'account-supervisor', label: 'Onboard Hosts', screen: 'AdminHosts' },
  { icon: 'format-list-bulleted', label: 'Manage Hosts', screen: 'AdminHostsManage' },
  { icon: 'calendar-star', label: 'Vaara Deities', screen: 'AdminVaara' },
  { icon: 'basket', label: 'Ritual Items', screen: 'AdminRitualItems' },
  { icon: 'shield-account', label: 'Admin Panel', screen: 'Admin' },
];

export default function WebSideNav({ state, descriptors, navigation, rootNav }: Props) {
  const { isAdmin } = useAuth();
  return (
    <View style={[styles.sidebar, webFixed]}>
      {/* Logo — pinned at top */}
      <View style={styles.logoWrap}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoSub}>Prarthanas</Text>
      </View>

      {/* Scrollable middle: nav tabs + admin links */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main nav items */}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key]?.options?.title ?? route.name;
          const [outline, solid] = ICONS[route.name] ?? ['circle-outline', 'circle'];
          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.item, focused && styles.itemActive]}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
            >
              <MaterialCommunityIcons
                name={focused ? solid : outline}
                size={20}
                color={focused ? colors.turmeric : 'rgba(255,248,236,0.6)'}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Admin section — only for admins, directly below nav items */}
        {isAdmin && (
          <>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>Admin</Text>
            {ADMIN_LINKS.map((link) => (
              <TouchableOpacity
                key={link.screen}
                style={styles.item}
                onPress={() => rootNav.navigate(link.screen as any)}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name={link.icon} size={18} color={colors.turmeric} />
                <Text style={[styles.label, styles.adminLinkText]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Profile — pinned at bottom */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <TouchableOpacity
          style={styles.item}
          onPress={() => rootNav.navigate('Profile')}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-circle-outline" size={20} color="rgba(255,248,236,0.6)" />
          <Text style={styles.label}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 232,
    backgroundColor: colors.maroon,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    paddingTop: 24,
    paddingBottom: 0,
    flexDirection: 'column',
  },
  logoWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
    gap: 4,
  },
  logo: { width: 110, height: 36 },
  logoSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,248,236,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 10, paddingBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  itemActive: { backgroundColor: 'rgba(242,169,0,0.13)' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,248,236,0.6)',
  },
  labelActive: { color: colors.turmeric },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.turmeric,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  adminLinkText: { color: 'rgba(255,248,236,0.85)', fontSize: 13 },
  footer: { paddingHorizontal: 10, paddingBottom: 16 },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
    marginHorizontal: 2,
  },
});
