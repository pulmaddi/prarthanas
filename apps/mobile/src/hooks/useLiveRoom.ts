// Native fallback — no livekit-client import (browser APIs unavailable on native).
// Native LiveKit requires @livekit/react-native which needs a custom Expo dev build.
// This stub keeps the import from crashing on iOS/Android.

export type RoomParticipant = {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
  videoTrack?: unknown;
};

// Mirror the ConnectionState enum values used in the UI.
export const ConnectionState = {
  Disconnected: 'disconnected' as const,
  Connecting: 'connecting' as const,
  Connected: 'connected' as const,
  Reconnecting: 'reconnecting' as const,
};
export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

export type UseLiveRoomResult = {
  connectionState: ConnectionState;
  participants: RoomParticipant[];
  isMicOn: boolean;
  isCamOn: boolean;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  connecting: boolean;
  roomAccess: null;
};

export function useLiveRoom(_meetingId: string): UseLiveRoomResult {
  return {
    connectionState: ConnectionState.Disconnected,
    participants: [],
    isMicOn: false,
    isCamOn: false,
    toggleMic: async () => {},
    toggleCam: async () => {},
    disconnect: () => {},
    error: 'Live video calls require the native Prarthanas app.',
    connecting: false,
    roomAccess: null,
  };
}
