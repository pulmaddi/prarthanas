import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
} from '@expo-google-fonts/mukta';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  createNavigationContainerRef,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';

import { colors, fonts } from './src/theme';
import { t, setLocale } from './src/i18n';
import { AuthProvider, useAuth } from './src/lib/auth';
import { setSessionFromUrl } from './src/lib/supabase';
import { LocaleContext, type Lang } from './src/lib/locale';
import type { RootStackParamList, MainTabParamList } from './src/navigation/types';
import { useBreakpoint } from './src/lib/useBreakpoint';
import WebSideNav from './src/components/WebSideNav';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import TermsScreen from './src/screens/TermsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import RitualsScreen from './src/screens/RitualsScreen';
import JoinCommunityScreen from './src/screens/JoinCommunityScreen';
import JoinMeetingScreen from './src/screens/JoinMeetingScreen';
import MeetingsScreen from './src/screens/MeetingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationsInboxScreen from './src/screens/NotificationsInboxScreen';
import RitualBookingScreen from './src/screens/RitualBookingScreen';
import LiveMeetingScreen from './src/screens/LiveMeetingScreen';
import HostProfileScreen from './src/screens/HostProfileScreen';
import SubscribeScreen from './src/screens/SubscribeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import MyIshtaDaivaScreen from './src/screens/MyIshtaDaivaScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AdminScreen from './src/screens/AdminScreen';
import AdminVaaraScreen from './src/screens/AdminVaaraScreen';
import AdminHostsScreen from './src/screens/AdminHostsScreen';
import AdminHostsManageScreen from './src/screens/AdminHostsManageScreen';
import AdminRitualItemsScreen from './src/screens/AdminRitualItemsScreen';
import PoojaScreen from './src/screens/PoojaScreen';
import GuidedPoojaScreen from './src/screens/GuidedPoojaScreen';
import LiveRoomScreen from './src/screens/LiveRoomScreen';

// Crisp vector tab icons from @expo/vector-icons (bundled with Expo).
// Footer tab icon: outline when inactive, solid when active — a cleaner, more
// elegant read than a single static glyph. Falls back to the outline if no
// solid variant is given.
const tabIcon =
  (
    outline: keyof typeof MaterialCommunityIcons.glyphMap,
    solid?: keyof typeof MaterialCommunityIcons.glyphMap,
  ) =>
  ({ color, focused }: { color: string; size: number; focused: boolean }) =>
    (
      <MaterialCommunityIcons
        name={focused && solid ? solid : outline}
        size={24}
        color={color}
      />
    );

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Ref so the OAuth deep-link handler can navigate once a session lands.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const mobileTabBarStyle = {
  backgroundColor: colors.maroon,
  borderTopColor: 'rgba(255,255,255,0.10)',
  borderTopWidth: 1,
  height: 66,
  paddingBottom: 8,
  paddingTop: 6,
  elevation: 12,
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowOffset: { width: 0, height: -2 },
  shadowRadius: 8,
};

function MainTabs() {
  const { isHost } = useAuth();
  const { isDesktop } = useBreakpoint();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const renderTabBar = (props: React.ComponentProps<typeof BottomTabBar>) => {
    if (isDesktop) return <WebSideNav {...props} rootNav={rootNav} />;
    return <BottomTabBar {...props} />;
  };

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      <Tab.Navigator
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.turmeric,
          tabBarInactiveTintColor: 'rgba(255,248,236,0.55)',
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontFamily: fonts.medium,
            marginTop: 3,
            letterSpacing: 0.2,
          },
          tabBarIconStyle: { marginTop: 4 },
          tabBarItemStyle: { paddingVertical: 4 },
          tabBarStyle: isDesktop ? { display: 'none' } : mobileTabBarStyle,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home-outline', 'home') }}
        />
        {isHost ? (
          <>
            <Tab.Screen
              name="Meetings"
              component={MeetingsScreen}
              options={{ title: t('tabs.meetings'), tabBarIcon: tabIcon('calendar-blank-outline', 'calendar') }}
            />
            <Tab.Screen
              name="MyNotifications"
              component={NotificationsScreen}
              options={{ title: t('tabs.myNotifications'), tabBarIcon: tabIcon('bullhorn-outline', 'bullhorn') }}
            />
          </>
        ) : (
          <>
            <Tab.Screen
              name="TodaysPuja"
              component={RitualsScreen}
              options={{ title: t('tabs.todaysPuja'), tabBarIcon: tabIcon('candle') }}
            />
            <Tab.Screen
              name="JoinCommunity"
              component={JoinCommunityScreen}
              options={{ title: t('tabs.joinCommunity'), tabBarIcon: tabIcon('account-group-outline', 'account-group') }}
            />
            <Tab.Screen
              name="JoinMeeting"
              component={JoinMeetingScreen}
              options={{ title: t('tabs.joinMeeting'), tabBarIcon: tabIcon('video-outline', 'video') }}
            />
            <Tab.Screen
              name="Notifications"
              component={NotificationsInboxScreen}
              options={{ title: t('tabs.notifications'), tabBarIcon: tabIcon('bell-outline', 'bell') }}
            />
          </>
        )}
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const changeLang = useCallback((l: Lang) => {
    setLocale(l);
    setLang(l);
  }, []);

  const [fontsLoaded] = useFonts({
    Marcellus_400Regular,
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
  });

  // Complete a native Google OAuth sign-in when the browser deep-links back.
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes('auth-callback')) return;
      try {
        const session = await setSessionFromUrl(url);
        if (session && navigationRef.isReady()) {
          navigationRef.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[auth] Google sign-in callback failed', e);
      }
    };
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <LocaleContext.Provider value={{ lang, changeLang }}>
      <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: { backgroundColor: colors.maroon },
            headerTintColor: colors.white,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
          <Stack.Screen name="RitualBooking" component={RitualBookingScreen} options={{ title: 'Book Ritual' }} />
          <Stack.Screen name="LiveMeeting" component={LiveMeetingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HostProfile" component={HostProfileScreen} options={{ title: '' }} />
          <Stack.Screen name="Subscribe" component={SubscribeScreen} options={{ title: 'Subscribe' }} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ title: t('profile.myProfile') }} />
          <Stack.Screen name="MyIshtaDaiva" component={MyIshtaDaivaScreen} options={{ title: t('profile.myIshtaDaiva') }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('profile.changePassword') }} />
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: t('profile.admin') }} />
          <Stack.Screen name="AdminVaara" component={AdminVaaraScreen} options={{ title: t('profile.adminVaara') }} />
          <Stack.Screen name="AdminHosts" component={AdminHostsScreen} options={{ title: t('profile.adminHosts') }} />
          <Stack.Screen name="AdminHostsManage" component={AdminHostsManageScreen} options={{ title: t('profile.adminHostsManage') }} />
          <Stack.Screen name="AdminRitualItems" component={AdminRitualItemsScreen} options={{ title: t('profile.adminRitual') }} />
          <Stack.Screen name="Pooja" component={PoojaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GuidedPooja" component={GuidedPoojaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveRoom" component={LiveRoomScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      </AuthProvider>
      </LocaleContext.Provider>
    </SafeAreaProvider>
  );
}
