import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { t } from '../i18n';
import { useAuth } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useRoomPresence, type Participant } from '../lib/roomPresence';
import { useLiveRoom } from '../hooks/useLiveRoom';
import VideoTile from '../components/VideoTile';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveRoom'>;

function roleLabelFromType(ht?: string | null): string {
  switch (ht) {
    case 'priest':       return t('roles.priest');
    case 'guru':         return t('roles.guru');
    case 'temple_exec':  return t('roles.templeExec');
    case 'numerologist': return t('roles.numerologist');
    case 'astrologer':   return t('roles.astrologer');
    default:             return t('roles.devotee');
  }
}

function Avatar({ name, gold, size = 36 }: { name: string; gold?: boolean; size?: number }) {
  const initial = (name.trim()[0] || '🙏').toUpperCase();
  return (
    <View style={[styles.avatar, gold && styles.avatarGold, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

export default function LiveRoomScreen({ route, navigation }: Props) {
  const { meetingId, title, hostId } = route.params;
  const { profile, hostTypes, session } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const isOrganizer = !!session?.user.id && session.user.id === hostId;

  const {
    participants: lkParticipants,
    isMicOn,
    isCamOn,
    facingMode,
    flipMessage,
    toggleMic,
    toggleCam,
    flipCamera,
    dismissFlipMessage,
    disconnect,
    error: lkError,
    connecting,
  } = useLiveRoom(meetingId);

  const me: Participant | null = session?.user.id
    ? {
        user_id: session.user.id,
        name: profile?.name?.trim() || t('profile.devotee'),
        role: roleLabelFromType(hostTypes[0]),
      }
    : null;
  const presenceParticipants = useRoomPresence(meetingId, me);

  const [organizer, setOrganizer] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from('hosts_public')
        .select('name,host_types')
        .eq('user_id', hostId)
        .maybeSingle();
      if (alive && data)
        setOrganizer({
          name: (data as any).name || t('room.organizer'),
          role: roleLabelFromType((data as any).host_types?.[0]),
        });
    })();
    return () => { alive = false; };
  }, [hostId]);

  const handleLeave = () => {
    disconnect();
    navigation.goBack();
  };

  const organizerFromPresence = presenceParticipants.find((p) => p.user_id === hostId);
  const organizerEntry: Participant | null = organizer
    ? { user_id: hostId, name: organizer.name, role: organizer.role }
    : organizerFromPresence ?? null;
  const otherPresence = presenceParticipants.filter((p) => p.user_id !== hostId);
  const count = otherPresence.length + (organizerEntry ? 1 : 0);

  // Primary video: prefer remote host; fall back to local (organizer alone in room)
  const remoteLk = lkParticipants.find((p) => !p.isLocal) ?? null;
  const localLk  = lkParticipants.find((p) => p.isLocal)  ?? null;
  // Show local as primary when no remote is present yet
  const primaryLk = remoteLk ?? localLk;
  const isLocalPrimary = primaryLk?.isLocal ?? false;
  const otherLk = lkParticipants.filter((p) => p !== primaryLk);

  const ParticipantsPanel = (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{t('room.participants')} ({count})</Text>
      <ScrollView>
        {organizerEntry && (
          <View style={styles.pRow}>
            <Avatar name={organizerEntry.name} gold />
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{organizerEntry.name || t('room.organizer')}</Text>
              <Text style={styles.pRole}>{organizerEntry.role || t('roles.priest')}</Text>
            </View>
            <View style={styles.orgTag}>
              <Text style={styles.orgTagText}>{t('room.organizer')}</Text>
            </View>
          </View>
        )}
        {otherPresence.map((p) => (
          <View key={p.user_id} style={styles.pRow}>
            <Avatar name={p.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pName}>{p.name || t('profile.devotee')}</Text>
              <Text style={styles.pRole}>{p.role || t('roles.devotee')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>● {t('room.live')}</Text>
        </View>
        <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>

        <TouchableOpacity
          style={[styles.controlBtn, !isMicOn && styles.controlBtnOff]}
          onPress={toggleMic}
          hitSlop={6}
          accessibilityLabel={isMicOn ? 'Mute' : 'Unmute'}
        >
          <MaterialCommunityIcons
            name={isMicOn ? 'microphone' : 'microphone-off'}
            size={18}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, !isCamOn && styles.controlBtnOff]}
          onPress={toggleCam}
          hitSlop={6}
          accessibilityLabel={isCamOn ? 'Camera off' : 'Camera on'}
        >
          <MaterialCommunityIcons
            name={isCamOn ? 'video' : 'video-off'}
            size={18}
            color={colors.white}
          />
        </TouchableOpacity>

        {/* Flip camera: front ↔ rear */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={flipCamera}
          hitSlop={6}
          accessibilityLabel={facingMode === 'user' ? 'Switch to rear camera' : 'Switch to front camera'}
        >
          <MaterialCommunityIcons name="camera-flip-outline" size={18} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn} hitSlop={8}>
          <MaterialCommunityIcons name="phone-hangup" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Connecting overlay */}
      {connecting && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator size="large" color={colors.turmeric} />
          <Text style={styles.connectingText}>Joining room…</Text>
        </View>
      )}

      {/* Error banner */}
      {!!lkError && !connecting && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.white} />
          <Text style={styles.errorText}>{lkError}</Text>
        </View>
      )}

      {/* Flip-camera not-available toast */}
      {!!flipMessage && (
        <TouchableOpacity style={styles.flipToast} onPress={dismissFlipMessage} activeOpacity={0.85}>
          <MaterialCommunityIcons name="cellphone" size={16} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.flipToastText}>{flipMessage}</Text>
          <MaterialCommunityIcons name="close" size={14} color={colors.white} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}

      {/* Main layout */}
      <View style={[styles.body, wide && styles.bodyWide]}>

        {/* Video area */}
        <View style={styles.videoArea}>
          {/* Primary video — remote host, or local when alone */}
          <View style={styles.primaryVideo}>
            {primaryLk ? (
              <>
                <VideoTile
                  track={primaryLk.videoTrack as any}
                  isLocal={primaryLk.isLocal}
                  name={primaryLk.name}
                  audioMuted={primaryLk.audioMuted}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.primaryLabel}>
                  {primaryLk.audioMuted && (
                    <MaterialCommunityIcons name="microphone-off" size={13} color="rgba(255,255,255,0.8)" />
                  )}
                  <Text style={styles.primaryLabelText}>
                    {isLocalPrimary ? 'You (Organizer)' : primaryLk.name}
                  </Text>
                  {isLocalPrimary && (
                    <View style={styles.orgTagSmall}>
                      <Text style={styles.orgTagSmallText}>
                        {facingMode === 'environment' ? '📷 Rear' : '🤳 Front'}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Hint for organizer when alone */}
                {isLocalPrimary && (
                  <View style={styles.soloHint}>
                    <Text style={styles.soloHintText}>Waiting for participants to join…</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.waitingBox}>
                <MaterialCommunityIcons name="video-off-outline" size={40} color="rgba(255,255,255,0.3)" />
                <Text style={styles.waitingText}>
                  {connecting ? 'Connecting…' : 'Waiting for the organizer to start'}
                </Text>
              </View>
            )}
          </View>

          {/* Self-view PiP — only when remote is the primary */}
          {localLk && remoteLk && (
            <View style={styles.selfView}>
              <VideoTile
                track={localLk.videoTrack as any}
                isLocal
                name={localLk.name}
                audioMuted={localLk.audioMuted}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.selfLabel}>You</Text>
            </View>
          )}

          {/* Other remote participants (strip at bottom) */}
          {otherLk.filter((p) => !p.isLocal).length > 0 && (
            <ScrollView
              horizontal
              style={styles.otherStrip}
              contentContainerStyle={styles.otherStripContent}
              showsHorizontalScrollIndicator={false}
            >
              {otherLk.filter((p) => !p.isLocal).map((p) => (
                <View key={p.identity} style={styles.otherTile}>
                  <VideoTile
                    track={p.videoTrack as any}
                    isLocal={false}
                    name={p.name}
                    audioMuted={p.audioMuted}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.otherName} numberOfLines={1}>{p.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Participants panel — sidebar on wide, compact strip on narrow */}
        {wide ? (
          <View style={styles.sidebar}>
            {ParticipantsPanel}
          </View>
        ) : (
          <View style={styles.narrowPanel}>
            {ParticipantsPanel}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },

  topbar: {
    backgroundColor: colors.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  liveBadge: {
    backgroundColor: '#C0392B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  topTitle: { flex: 1, color: colors.white, fontSize: 15, fontWeight: '700' },
  controlBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnOff: { backgroundColor: '#C0392B' },
  leaveBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
  },

  connectingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.88)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 50, gap: 14,
  },
  connectingText: { color: colors.cream, fontSize: 16, fontWeight: '600' },

  errorBanner: {
    backgroundColor: 'rgba(192,57,43,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  errorText: { color: colors.white, fontSize: 13, flex: 1 },

  flipToast: {
    backgroundColor: 'rgba(30,30,30,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  flipToastText: { color: colors.white, fontSize: 13, flex: 1 },

  body: { flex: 1 },
  bodyWide: { flexDirection: 'row' },

  videoArea: { flex: 1, position: 'relative' },

  primaryVideo: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    minHeight: 260,
  },
  waitingBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
  },
  waitingText: {
    color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 21,
  },
  soloHint: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  soloHintText: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  primaryLabel: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  primaryLabelText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  orgTagSmall: {
    backgroundColor: colors.gold,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  orgTagSmallText: { fontSize: 9, fontWeight: '800', color: colors.maroon },

  selfView: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 100,
    height: 140,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  selfLabel: {
    position: 'absolute',
    bottom: 5,
    left: 6,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  otherStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  otherStripContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherTile: {
    width: 90,
    height: 94,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#222',
    position: 'relative',
  },
  otherName: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },

  sidebar: {
    width: 260,
    backgroundColor: colors.cream,
  },
  narrowPanel: {
    height: 180,
    backgroundColor: colors.cream,
  },

  panel: {
    flex: 1,
    padding: spacing.md,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  avatar: {
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGold: { backgroundColor: colors.saffron },
  avatarText: { color: colors.white, fontWeight: '700' },
  pName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  pRole: { fontSize: 11, color: colors.muted, marginTop: 1 },
  orgTag: {
    backgroundColor: colors.gold,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orgTagText: { fontSize: 9, fontWeight: '800', color: colors.maroon },
});
