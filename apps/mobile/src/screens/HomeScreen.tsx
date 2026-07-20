import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Card, Title, Muted, Button } from '../components/ui';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { useWeekdayDeities } from '../lib/weekdayDeities';
import { useHostDirectory } from '../lib/hosts';
import HostFollowSection from '../components/HostFollowSection';
import HostHomeSections from '../components/HostHomeSections';
import SectionHeader from '../components/SectionHeader';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, isAdmin, hostTypes, isHost } = useAuth();
  const { today } = useWeekdayDeities();
  const { priests, gurus, temples, followed, follow, unfollow } = useHostDirectory();
  const [menuOpen, setMenuOpen] = useState(false);
  const fullName = profile?.name?.trim() || t('profile.devotee');
  const firstName = fullName.split(' ')[0];
  const initial = (firstName[0] || '🙏').toUpperCase();
  const HOST_LABEL: Record<string, string> = {
    priest: t('roles.priest'),
    guru: t('roles.guru'),
    temple_exec: t('roles.templeExec'),
    numerologist: t('roles.numerologist'),
    astrologer: t('roles.astrologer'),
  };
  const roleLabel = isAdmin
    ? t('roles.admin')
    : hostTypes.length
      ? hostTypes.map((h) => HOST_LABEL[h] ?? h).join(' · ')
      : t('roles.devotee');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <View style={styles.topLeft}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.hamburger}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel={t('profile.adminSection')}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.greetRow}>
              <MaterialCommunityIcons name="hands-pray" size={18} color={colors.gold} />
              <Text style={styles.greet} numberOfLines={1}>
                {t('namaste')}, {firstName}
              </Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            </View>
            {!!profile?.city && <Text style={styles.loc}>📍 {profile.city}</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => rootNav.navigate('Profile')}
          accessibilityLabel={t('tabs.profile')}
        >
          <Text style={{ color: colors.white, fontWeight: '700' }}>{initial}</Text>
        </TouchableOpacity>
      </View>

      {/* Left admin drawer */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.drawerRow}>
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>🛠️ {t('profile.adminSection')}</Text>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setMenuOpen(false);
                rootNav.navigate('Admin');
              }}
            >
              <Text style={styles.drawerItemText}>👤 {t('profile.admin')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setMenuOpen(false);
                rootNav.navigate('AdminVaara');
              }}
            >
              <Text style={styles.drawerItemText}>📅 {t('profile.adminVaara')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setMenuOpen(false);
                rootNav.navigate('AdminRitualItems');
              }}
            >
              <Text style={styles.drawerItemText}>🧺 {t('profile.adminRitual')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setMenuOpen(false);
                rootNav.navigate('AdminHosts');
              }}
            >
              <Text style={styles.drawerItemText}>🧑‍🏫 {t('profile.adminHosts')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setMenuOpen(false);
                rootNav.navigate('AdminHostsManage');
              }}
            >
              <Text style={styles.drawerItemText}>🗂️ {t('profile.adminHostsManage')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Daily Rituals — pooja shortcuts (compact icons, no background) */}
        <SectionHeader icon="candle" title={t('home.dailyRituals')} />
        <View style={styles.idpWrap}>
          {/* Ishta Daiva Pooja */}
          <View style={styles.idpItem}>
            <TouchableOpacity
              style={styles.idpBtn}
              activeOpacity={0.8}
              onPress={() =>
                profile?.ishta_daiva
                  ? rootNav.navigate('GuidedPooja')
                  : rootNav.navigate('MyIshtaDaiva')
              }
            >
              <Image
                source={require('../../assets/IsthaDaivaPooja.png')}
                style={styles.idpIcon}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.idpLabel} numberOfLines={2}>
              {t('home.ishtaDaivaPooja')}
            </Text>
          </View>

          {/* Weekday Pooja — opens today's deity */}
          <View style={styles.idpItem}>
            <TouchableOpacity
              style={styles.idpBtn}
              activeOpacity={0.8}
              onPress={() => rootNav.navigate('GuidedPooja', { vaara: true })}
            >
              <Image
                source={require('../../assets/WeekdayPooja.png')}
                style={styles.idpIcon}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.idpLabel} numberOfLines={2}>
              {t('home.weekdayPooja')}
            </Text>
            <Text style={styles.idpSub} numberOfLines={1}>
              {t('home.today')}: {today().deity_name}
            </Text>
          </View>
        </View>

        {isHost ? (
          /* Host (Priest / Guru / Temple Exec): meeting invites + notifications */
          <HostHomeSections
            onOpenMeetings={() => navigation.navigate('Meetings')}
            onOpenNotifications={() => navigation.navigate('MyNotifications')}
            onOpenRoom={(m) =>
              rootNav.navigate('LiveRoom', {
                meetingId: m.id,
                title: m.title,
                deityName: m.deity_name ?? undefined,
                hostId: m.host_id,
              })
            }
          />
        ) : (
          <>
            {/* My Priests */}
            <HostFollowSection
              title={t('home.myPriests')}
              icon="account-tie"
              hosts={priests}
              followed={followed}
              onFollow={follow}
              onUnfollow={unfollow}
              prompt={t('home.followPriestPrompt')}
              emptyText={t('home.noPriests')}
              fallbackName="Priest"
            />

            {/* My Spiritual Guru */}
            <HostFollowSection
              title={t('home.mySpiritualGuru')}
              icon="meditation"
              hosts={gurus}
              followed={followed}
              onFollow={follow}
              onUnfollow={unfollow}
              prompt={t('home.followGuruPrompt')}
              emptyText={t('home.noGurus')}
              fallbackName="Guru"
            />

            {/* My Temple */}
            <HostFollowSection
              title={t('home.myTemple')}
              icon="town-hall"
              hosts={temples}
              followed={followed}
              onFollow={follow}
              onUnfollow={unfollow}
              prompt={t('home.followTemplePrompt')}
              emptyText={t('home.noTemples')}
              fallbackName="Temple"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    backgroundColor: colors.maroon,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  hamburger: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: { color: colors.white, fontSize: 20, fontWeight: '700' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  greet: { color: colors.white, fontSize: 15, fontWeight: '600' },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  roleText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  loc: { color: colors.cream, fontSize: 11, opacity: 0.85, marginTop: 2 },
  drawerRow: { flex: 1, flexDirection: 'row' },
  drawer: {
    width: 280,
    backgroundColor: colors.cream,
    paddingTop: 54,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  drawerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  drawerItemText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg, paddingBottom: 30 },
  section: { fontSize: 15, fontWeight: '700', color: colors.ink },
  idpWrap: { flexDirection: 'row', gap: 18, marginTop: 4, marginBottom: 10 },
  idpItem: { width: 92, alignItems: 'center' },
  idpBtn: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  idpIcon: { width: 84, height: 84 },
  idpLabel: {
    width: 92,
    fontSize: 12,
    fontWeight: '400',
    color: colors.maroon,
    marginTop: 6,
    textAlign: 'center',
  },
  idpSub: { fontSize: 10, color: colors.muted, marginTop: 2, textAlign: 'center' },
  sectionHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
  seeAll: { fontSize: 12, color: colors.saffron, fontWeight: '600' },
  // cards
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 20 },
});
