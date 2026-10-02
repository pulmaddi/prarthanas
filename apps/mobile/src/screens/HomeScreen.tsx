import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { useWeekdayDeities } from '../lib/weekdayDeities';
import { useHostDirectory, type PublicHost } from '../lib/hosts';
import { useBreakpoint } from '../lib/useBreakpoint';
import HostHomeSections from '../components/HostHomeSections';
import SectionHeader from '../components/SectionHeader';
import AdminDashboard from '../components/AdminDashboard';
import WebPageWrapper from '../components/WebPageWrapper';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

// ── Devotee home: 7-card grid ────────────────────────────────────────────────

type HostCategory = {
  filterType: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  accent: string;
};

const HOST_CATS: HostCategory[] = [
  { filterType: 'priest',       icon: 'account-tie',   title: 'My Priests',          accent: '#1B6B4A' },
  { filterType: 'guru',         icon: 'meditation',    title: 'My Spiritual Gurus',  accent: '#5E3D9A' },
  { filterType: 'temple_exec',  icon: 'town-hall',     title: 'My Temples',          accent: '#B85C00' },
  { filterType: 'astrologer',   icon: 'star-crescent', title: 'My Astrologers',      accent: '#1A5276' },
  { filterType: 'numerologist', icon: 'numeric',       title: 'My Numerologists',    accent: '#6C3483' },
];

function followedSummary(list: PublicHost[]): string {
  if (list.length === 0) return 'None selected';
  if (list.length === 1) return list[0].name || 'Selected';
  return `${list.length} selected`;
}

function DevoteeCardGrid({
  profile,
  today,
  followedOf,
  rootNav,
  isDesktop,
}: {
  profile: any;
  today: () => any;
  followedOf: (ty: string) => PublicHost[];
  rootNav: NativeStackNavigationProp<RootStackParamList>;
  isDesktop: boolean;
}) {
  return (
    <View style={dcStyles.grid}>
      {/* ── Puja cards ── */}
      <TouchableOpacity
        style={[dcStyles.card, { borderTopColor: '#7A0A14' }]}
        activeOpacity={0.82}
        onPress={() =>
          profile?.ishta_daiva
            ? rootNav.navigate('Pooja', { deityName: profile.ishta_daiva })
            : rootNav.navigate('MyIshtaDaiva')
        }
      >
        <View style={[dcStyles.iconCircle, { backgroundColor: '#7A0A14' + '22' }]}>
          <MaterialCommunityIcons name="hands-pray" size={20} color="#7A0A14" />
        </View>
        <Text style={dcStyles.cardTitle}>Ishta Daiva Puja</Text>
        <Text style={dcStyles.cardSub} numberOfLines={1}>
          {profile?.ishta_daiva || 'Tap to choose your deity'}
        </Text>
        <View style={[dcStyles.actionRow]}>
          <Text style={[dcStyles.actionText, { color: '#7A0A14' }]}>
            {profile?.ishta_daiva ? 'Begin Puja →' : 'Choose Deity →'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[dcStyles.card, { borderTopColor: '#C8860A' }]}
        activeOpacity={0.82}
        onPress={() => rootNav.navigate('Pooja', { vaara: true })}
      >
        <View style={[dcStyles.iconCircle, { backgroundColor: '#C8860A' + '22' }]}>
          <MaterialCommunityIcons name="calendar-star" size={20} color="#C8860A" />
        </View>
        <Text style={dcStyles.cardTitle}>Vara Puja</Text>
        <Text style={dcStyles.cardSub} numberOfLines={1}>
          Today: {today().deity_name || '—'}
        </Text>
        <View style={dcStyles.actionRow}>
          <Text style={[dcStyles.actionText, { color: '#C8860A' }]}>Begin Puja →</Text>
        </View>
      </TouchableOpacity>

      {/* ── Host category cards ── */}
      {HOST_CATS.map((cat) => {
        const mine = followedOf(cat.filterType);
        const hasFollowed = mine.length > 0;
        return (
          <TouchableOpacity
            key={cat.filterType}
            style={[dcStyles.card, { borderTopColor: cat.accent }]}
            activeOpacity={0.82}
            onPress={() => rootNav.navigate('HostBrowse', { filterType: cat.filterType })}
          >
            <View style={[dcStyles.iconCircle, { backgroundColor: cat.accent + '22' }]}>
              <MaterialCommunityIcons name={cat.icon} size={20} color={cat.accent} />
            </View>
            <Text style={dcStyles.cardTitle}>{cat.title}</Text>
            <Text
              style={[dcStyles.cardSub, !hasFollowed && dcStyles.cardSubMuted]}
              numberOfLines={1}
            >
              {followedSummary(mine)}
            </Text>
            <View style={dcStyles.actionRow}>
              <Text style={[dcStyles.actionText, { color: cat.accent }]}>
                {hasFollowed ? 'Browse & Manage →' : 'Browse & Choose →'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const dcStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    // 3-per-row: (100% - 2 gaps of 10) / 3. Using flex basis trick.
    flexBasis: '31%',
    flexGrow: 1,
    maxWidth: '32.5%' as any,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.ink, marginBottom: 3 },
  cardSub: { fontSize: 11, color: colors.ink, marginBottom: 8 },
  cardSubMuted: { color: colors.muted, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row' },
  actionText: { fontSize: 10, fontWeight: '700' },
});

export default function HomeScreen({ navigation }: Props) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, isAdmin, hostTypes, isHost, signOut } = useAuth();
  const { isDesktop } = useBreakpoint();
  const { today } = useWeekdayDeities();
  const { hosts, followed, reload: reloadHosts } = useHostDirectory();
  useFocusEffect(useCallback(() => { reloadHosts(); }, [reloadHosts]));
  const byType = (ty: string) => hosts.filter((h) => (h.host_types ?? []).includes(ty));
  const followedOf = (ty: string) => byType(ty).filter((h) => followed.has(h.user_id));
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

  const handleLogout = async () => {
    await signOut();
    rootNav.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* On desktop the sidebar carries identity; hide the mobile topbar */}
      {!isDesktop && <View style={styles.topbar}>
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
        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => rootNav.navigate('Profile')}
            accessibilityLabel={t('tabs.profile')}
          >
            <Text style={{ color: colors.white, fontWeight: '700' }}>{initial}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Sign out"
          >
            <MaterialCommunityIcons name="logout" size={18} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
      </View>}
      {/* Desktop greeting bar */}
      {isDesktop && (
        <View style={styles.desktopGreet}>
          <MaterialCommunityIcons name="hands-pray" size={18} color={colors.turmeric} />
          <Text style={styles.desktopGreetText}>{t('namaste')}, {firstName}</Text>
          <View style={styles.rolePill}><Text style={styles.roleText}>{roleLabel}</Text></View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.desktopLogoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Sign out"
          >
            <MaterialCommunityIcons name="logout" size={16} color={colors.muted} />
            <Text style={styles.desktopLogoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}

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

      <WebPageWrapper>
        <ScrollView style={styles.scrollFill} contentContainerStyle={[styles.body, isDesktop && styles.bodyDesktop]}>
          {isAdmin ? (
            /* ── Admin home: full dashboard, no devotee-only rituals ── */
            <AdminDashboard />
          ) : isHost ? (
            /* ── Host home: host-specific meeting sections ── */
            <>
              <SectionHeader icon="candle" title={t('home.dailyRituals')} />
              <View style={styles.idpWrap}>
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
                  <Text style={styles.idpLabel} numberOfLines={2}>{t('home.ishtaDaivaPooja')}</Text>
                  <Text style={styles.idpSub} numberOfLines={1}>
                    {profile?.ishta_daiva || t('home.chooseIshta')}
                  </Text>
                </View>
                <View style={styles.idpItem}>
                  <TouchableOpacity
                    style={styles.idpBtn}
                    activeOpacity={0.8}
                    onPress={() => rootNav.navigate('Pooja', { vaara: true })}
                  >
                    <Image
                      source={require('../../assets/WeekdayPooja.png')}
                      style={styles.idpIcon}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text style={styles.idpLabel} numberOfLines={2}>{t('home.weekdayPooja')}</Text>
                  <Text style={styles.idpSub} numberOfLines={1}>
                    {t('home.today')}: {today().deity_name}
                  </Text>
                </View>
              </View>
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
            </>
          ) : (
            /* ── Devotee home: card grid ── */
            <DevoteeCardGrid
              profile={profile}
              today={today}
              followedOf={followedOf}
              rootNav={rootNav}
              isDesktop={isDesktop}
            />
          )}
        </ScrollView>
      </WebPageWrapper>
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
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  desktopLogoutText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  adminSections: { marginTop: 8, paddingBottom: 16 },
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
  scrollFill: { flex: 1 },
  body: { padding: spacing.lg, paddingBottom: 30, flexGrow: 1 },
  bodyDesktop: { padding: 32, paddingBottom: 48, flexGrow: 1 },
  desktopGreet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: colors.ivory,
    borderBottomWidth: 1,
    borderBottomColor: colors.sandal,
  },
  desktopGreetText: { fontSize: 15, fontWeight: '600', color: colors.maroon },
  hostGrid: {},
  hostGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  hostGridCol: { flex: 1, minWidth: 280 },
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
