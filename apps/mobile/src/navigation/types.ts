export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Terms: undefined;
  Register: undefined;
  Login: undefined;
  Main: undefined;
  Profile: undefined;
  MyProfile: undefined;
  ChangePassword: undefined;
  Admin: undefined;
  AdminVaara: undefined;
  AdminHosts: undefined;
  AdminHostsManage: undefined;
  Pooja: { deityName?: string; vaara?: boolean; day?: number } | undefined;
  LiveRoom: { meetingId: string; title: string; deityName?: string; hostId: string };
  RitualBooking: { occasionId: string; title: string };
  LiveMeeting: { occasionInstanceId: string; title: string };
  HostProfile: { hostId: string };
  Subscribe: { hostId: string; hostName: string };
};

export type MainTabParamList = {
  Home: undefined;
  TodaysPuja: undefined;
  JoinCommunity: undefined;
  JoinMeeting: undefined;
  // Host tabs (Priest / Guru / Temple Exec)
  Meetings: undefined;
  MyNotifications: undefined;
};
