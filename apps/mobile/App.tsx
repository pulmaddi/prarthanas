import React, { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
} from '@expo-google-fonts/mukta';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors, fonts } from './src/theme';
import { t, setLocale } from './src/i18n';
import { AuthProvider, useAuth } from './src/lib/auth';
import { LocaleContext, type Lang } from './src/lib/locale';
import type { RootStackParamList, MainTabParamList } from './src/navigation/types';

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
import RitualBookingScreen from './src/screens/RitualBookingScreen';
import LiveMeetingScreen from './src/screens/LiveMeetingScreen';
import HostProfileScreen from './src/screens/HostProfileScreen';
import SubscribeScreen from './src/screens/SubscribeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AdminScreen from './src/screens/AdminScreen';
import AdminVaaraScreen from './src/screens/AdminVaaraScreen';
import AdminHostsScreen from './src/screens/AdminHostsScreen';
import AdminHostsManageScreen from './src/screens/AdminHostsManageScreen';
import PoojaScreen from './src/screens/PoojaScreen';
import LiveRoomScreen from './src/screens/LiveRoomScreen';

// Crisp vector tab icons from @expo/vector-icons (bundled with Expo).
const tabIcon =
  (name: keyof typeof MaterialCommunityIcons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) =>
    <MaterialCommunityIcons name={name} size={size ?? 24} color={color} />;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { hostType } = useAuth();
  const isHost = !!hostType;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.turmeric, // turmeric — high contrast on maroon
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.body },
        tabBarStyle: {
          backgroundColor: colors.maroon,
          borderTopColor: 'rgba(255,255,255,0.12)',
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home-variant') }}
      />
      {isHost ? (
        <>
          <Tab.Screen
            name="Meetings"
            component={MeetingsScreen}
            options={{ title: t('tabs.meetings'), tabBarIcon: tabIcon('calendar-clock') }}
          />
          <Tab.Screen
            name="MyNotifications"
            component={NotificationsScreen}
            options={{ title: t('tabs.myNotifications'), tabBarIcon: tabIcon('bell-ring') }}
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
            options={{ title: t('tabs.joinCommunity'), tabBarIcon: tabIcon('account-group') }}
          />
          <Tab.Screen
            name="JoinMeeting"
            component={JoinMeetingScreen}
            options={{ title: t('tabs.joinMeeting'), tabBarIcon: tabIcon('video') }}
          />
        </>
      )}
    </Tab.Navigator>
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
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <LocaleContext.Provider value={{ lang, changeLang }}>
      <AuthProvider>
      <NavigationContainer>
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
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('profile.changePassword') }} />
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: t('profile.admin') }} />
          <Stack.Screen name="AdminVaara" component={AdminVaaraScreen} options={{ title: t('profile.adminVaara') }} />
          <Stack.Screen name="AdminHosts" component={AdminHostsScreen} options={{ title: t('profile.adminHosts') }} />
          <Stack.Screen name="AdminHostsManage" component={AdminHostsManageScreen} options={{ title: t('profile.adminHostsManage') }} />
          <Stack.Screen name="Pooja" component={PoojaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveRoom" component={LiveRoomScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      </AuthProvider>
      </LocaleContext.Provider>
    </SafeAreaProvider>
  );
}
