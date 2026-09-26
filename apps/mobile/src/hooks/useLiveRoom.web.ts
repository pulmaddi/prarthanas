// Web-only LiveKit room hook. Metro/webpack resolves this file on web builds;
// the .ts fallback is used on native (no livekit-client import there).
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  type LocalVideoTrack,
  type RemoteVideoTrack,
  type Participant,
} from 'livekit-client';
import { getLivekitToken, type RoomAccess } from '../lib/livekitToken';

export type RoomParticipant = {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
  videoTrack?: LocalVideoTrack | RemoteVideoTrack;
};

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
  roomAccess: RoomAccess | null;
};

function toRoomParticipant(p: Participant, isLocal: boolean): RoomParticipant {
  const camPub = p.getTrackPublication(Track.Source.Camera);
  const micPub = p.getTrackPublication(Track.Source.Microphone);
  return {
    identity: p.identity,
    name: p.name || p.identity,
    isLocal,
    isSpeaking: p.isSpeaking,
    audioMuted: !micPub || micPub.isMuted,
    videoMuted: !camPub || camPub.isMuted,
    videoTrack: camPub?.videoTrack as LocalVideoTrack | RemoteVideoTrack | undefined,
  };
}

export function useLiveRoom(meetingId: string): UseLiveRoomResult {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [roomAccess, setRoomAccess] = useState<RoomAccess | null>(null);

  const refreshParticipants = useCallback((room: Room) => {
    const local = toRoomParticipant(room.localParticipant, true);
    const remotes = Array.from(room.remoteParticipants.values()).map((p) =>
      toRoomParticipant(p, false)
    );
    setParticipants([local, ...remotes]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const access = await getLivekitToken(meetingId);
        if (cancelled) return;
        setRoomAccess(access);

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        const refresh = () => refreshParticipants(room);

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          setConnectionState(state);
          if (state === ConnectionState.Connected) setConnecting(false);
        });
        room.on(RoomEvent.ParticipantConnected, refresh);
        room.on(RoomEvent.ParticipantDisconnected, refresh);
        room.on(RoomEvent.TrackSubscribed, refresh);
        room.on(RoomEvent.TrackUnsubscribed, refresh);
        room.on(RoomEvent.TrackMuted, refresh);
        room.on(RoomEvent.TrackUnmuted, refresh);
        room.on(RoomEvent.LocalTrackPublished, refresh);
        room.on(RoomEvent.LocalTrackUnpublished, refresh);
        room.on(RoomEvent.ActiveSpeakersChanged, refresh);

        await room.connect(access.livekitUrl, access.token);
        if (cancelled) { room.disconnect(); return; }

        try {
          await room.localParticipant.enableCameraAndMicrophone();
        } catch {
          // User may have denied camera permission; try audio-only.
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
          } catch {
            // Both denied — continue without publish capability.
          }
        }

        if (!cancelled) refresh();
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Could not connect to the meeting room.';
          setError(msg);
          setConnecting(false);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [meetingId, refreshParticipants]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isMicOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, audioMuted: !next } : p))
    );
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isCamOn;
    await room.localParticipant.setCameraEnabled(next);
    setIsCamOn(next);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, videoMuted: !next } : p))
    );
  }, [isCamOn]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
  }, []);

  return {
    connectionState,
    participants,
    isMicOn,
    isCamOn,
    toggleMic,
    toggleCam,
    disconnect,
    error,
    connecting,
    roomAccess,
  };
}
