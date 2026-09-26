import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Animated,
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
import { useDeities, deityFileUrl } from '../lib/deities';
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

const PALETTE: { key: string; emoji: string; label: string }[] = [
  { key: 'flowers',  emoji: '🌸', label: t('pooja.flowers') },
  { key: 'kumkuma',  emoji: '🔴', label: t('room.kumkuma') },
  { key: 'sandal',   emoji: '🟡', label: t('room.sandal') },
  { key: 'saffron',  emoji: '🟠', label: t('pooja.saffron') },
  { key: 'water',    emoji: '💧', label: t('room.water') },
  { key: 'aarti',    emoji: '🪔', label: t('pooja.aarti') },
];

let _oid = 0;
type Offer = { id: number; emoji: string; x: number };

function FloatingOffering({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }).start(
      ({ finished }) => finished && onDone(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 120] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.Text style={[styles.offering, { left: x, transform: [{ translateY }], opacity }]}>
      {emoji}
    </Animated.Text>
  );
}

function PresenceAvatar({ name, gold }: { name: string; gold?: boolean }) {
  const initial = (name.trim()[0] || '🙏').toUpperCase();
  return (
    <View style={[styles.avatar, gold && styles.avatarGold]}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

export default function LiveRoomScreen({ route, navigation }: Props) {
  const { meetingId, title, deityName, hostId } = route.params;
  const { profile, hostTypes, session } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const isOrganizer = !!session?.user.id && session.user.id === hostId;

  // LiveKit integration
  const {
    participants: lkParticipants,
    isMicOn,
    isCamOn,
    toggleMic,
    toggleCam,
    disconnect,
    error: lkError,
    connecting,
  } = useLiveRoom(meetingId);

  // Deity whiteboard state
  const { deities, imageUrlForName } = useDeities();
  const [chosenName, setChosenName] = useState<string | undefined>(deityName || undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const deityImg = imageUrlForName(chosenName);

  // Supabase Realtime presence (devotee list)
  const me: Participant | null = session?.user.id
    ? {
        user_id: session.user.id,
        name: profile?.name?.trim() || t('profile.devotee'),
        role: roleLabelFromType(hostTypes[0]),
      }
    : null;
  const presenceParticipants = useRoomPresence(meetingId, me);

  const [organizer, setOrganizer] = useState<{ name: string; role: string } | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const canvasW = useRef(320);

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

  const offer = (emoji: string) => {
    const x = 16 + Math.random() * Math.max(40, canvasW.current - 56);
    setOffers((o) => [...o, { id: ++_oid, emoji, x }]);
  };

  const pickDeity = (name: string) => {
    setChosenName(name);
    setPickerOpen(false);
    if (isOrganizer && isSupabaseConfigured)
      void supabase.from('host_meetings').update({ deity_name: name }).eq('id', meetingId);
  };

  const handleLeave = () => {
    disconnect();
    navigation.goBack();
  };

  // Merge presence participants with LiveKit participant list for the panel.
  const organizerFromPresence = presenceParticipants.find((p) => p.user_id === hostId);
  const organizerEntry: Participant | null = organizer
    ? { user_id: hostId, name: organizer.name, role: organizer.role }
    : organizerFromPresence ?? null;
  const otherPresence = presenceParticipants.filter((p) => p.user_id !== hostId);
  const count = otherPresence.length + (organizerEntry ? 1 : 0);

  // Host video tile (first LiveKit participant who is the host, or first remote participant)
  const hostLkParticipant = lkParticipants.find((p) => !p.isLocal) ?? lkParticipants[0];

  const ParticipantsPanel = (
    <View style={[styles.panel, wide ? styles.panelWide : styles.panelNarrow]}>
      <Text style={styles.panelTitle}>
        {t('room.participants')} ({count})
      </Text>
      <ScrollView>
        {organizerEntry && (
          <View style={styles.pRow}>
            <PresenceAvatar name={organizerEntry.name} gold />
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
            <PresenceAvatar name={p.name} />
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

        {/* Media controls */}
        <TouchableOpacity
          style={[styles.controlBtn, !isMicOn && styles.controlBtnOff]}
          onPress={toggleMic}
          accessibilityLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          hitSlop={6}
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
          accessibilityLabel={isCamOn ? 'Turn off camera' : 'Turn on camera'}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={isCamOn ? 'video' : 'video-off'}
            size={18}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLeave}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityLabel={t('pooja.end')}
        >
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

      {/* LiveKit error banner */}
      {!!lkError && !connecting && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.white} />
          <Text style={styles.errorText}>{lkError}</Text>
        </View>
      )}

      <View style={[styles.body, wide && styles.bodyWide]}>
        {/* Left column: deity whiteboard + offering palette */}
        <View style={styles.leftCol}>
          <View
            style={styles.canvas}
            onLayout={(e) => (canvasW.current = e.nativeEvent.layout.width)}
          >
            {deityImg ? (
              <>
                <Image source={{ uri: deityImg }} style={styles.deityBackdrop} resizeMode="cover" blurRadius={16} />
                <View style={styles.backdropDim} />
                <Image source={{ uri: deityImg }} style={styles.deityFore} resizeMode="contain" />
                {!!chosenName && (
                  <View style={styles.deityNameBar}>
                    <Text style={styles.deityNameFull}>{chosenName}</Text>
                  </View>
                )}
                {isOrganizer && (
                  <TouchableOpacity
                    style={styles.changeFab}
                    activeOpacity={0.85}
                    onPress={() => setPickerOpen(true)}
                  >
                    <MaterialCommunityIcons name="image-edit" size={16} color={colors.white} />
                    <Text style={styles.changeFabText}>{t('room.changeDeity')}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <View style={styles.medallion}>
                  <Text style={styles.om}>🕉️</Text>
                </View>
                <Text style={styles.deityName}>{chosenName || t('room.deityPlaceholder')}</Text>
                {isOrganizer && (
                  <TouchableOpacity style={styles.chooseBtn} activeOpacity={0.85} onPress={() => setPickerOpen(true)}>
                    <MaterialCommunityIcons name="image-edit" size={16} color={colors.maroon} />
                    <Text style={styles.chooseText}>{t('room.chooseDeity')}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {offers.map((o) => (
              <FloatingOffering
                key={o.id}
                emoji={o.emoji}
                x={o.x}
                onDone={() => setOffers((cur) => cur.filter((c) => c.id !== o.id))}
              />
            ))}
          </View>

          {/* Offering palette */}
          <View style={styles.paletteWrap}>
            <Text style={styles.paletteHint}>{t('room.tapToOffer')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
              {PALETTE.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.palItem}
                  activeOpacity={0.8}
                  onPress={() => offer(item.emoji)}
                >
                  <Text style={styles.palEmoji}>{item.emoji}</Text>
                  <Text style={styles.palLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Right column: participant video grid + presence panel */}
        <View style={[styles.rightCol, wide ? styles.rightColWide : styles.rightColNarrow]}>
          {/* LiveKit video tiles */}
          {lkParticipants.length > 0 ? (
            <ScrollView style={styles.videoGrid} contentContainerStyle={styles.videoGridContent}>
              {lkParticipants.map((p) => (
                <VideoTile
                  key={p.identity}
                  track={p.videoTrack as any}
                  isLocal={p.isLocal}
                  name={p.name}
                  audioMuted={p.audioMuted}
                  style={styles.videoTile}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.videoBox, wide ? styles.videoBoxWide : styles.videoBoxNarrow]}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>
                  {connecting ? 'Connecting…' : 'Waiting for participants'}
                </Text>
              </View>
            </View>
          )}

          {ParticipantsPanel}
        </View>
      </View>

      {/* Deity picker modal */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t('room.chooseDeity')}</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.grid}>
              {deities.map((d) => {
                const url = deityFileUrl(d.image_path);
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={styles.gridItem}
                    activeOpacity={0.85}
                    onPress={() => pickDeity(d.display_name)}
                  >
                    <View style={styles.gridThumb}>
                      {url ? (
                        <Image source={{ uri: url }} style={styles.gridImg} resizeMode="cover" />
                      ) : (
                        <Text style={{ fontSize: 30 }}>🕉️</Text>
                      )}
                    </View>
                    <Text style={styles.gridName} numberOfLines={1}>{d.display_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SANDAL = '#E7D3A1';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.maroon },
  topbar: {
    backgroundColor: colors.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  liveBadge: { backgroundColor: colors.live, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  liveText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  topTitle: { flex: 1, color: colors.white, fontSize: 15, fontWeight: '700' },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnOff: { backgroundColor: colors.live },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.live,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(42,10,18,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    gap: 14,
  },
  connectingText: { color: colors.cream, fontSize: 16, fontWeight: '600' },
  errorBanner: {
    backgroundColor: 'rgba(200,40,40,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  errorText: { color: colors.white, fontSize: 13, flex: 1 },
  body: { flex: 1 },
  bodyWide: { flexDirection: 'row' },
  leftCol: { flex: 1 },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SANDAL,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  medallion: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(122,10,20,0.06)',
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  om: { fontSize: 84 },
  deityBackdrop: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  backdropDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,10,18,0.28)' },
  deityFore: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  deityNameBar: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(122,10,20,0.85)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  deityNameFull: { color: colors.white, fontSize: 15, fontWeight: '800' },
  changeFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(122,10,20,0.9)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  changeFabText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  rightCol: {},
  rightColWide: { width: 300, margin: spacing.md, marginLeft: spacing.sm, gap: 10 },
  rightColNarrow: { marginHorizontal: spacing.md, marginBottom: spacing.md, gap: 8 },
  videoGrid: { flexGrow: 0 },
  videoGridContent: { gap: 6 },
  videoTile: { width: '100%', height: 160 },
  videoBox: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: 10 },
  videoBoxWide: { height: 180 },
  videoBoxNarrow: { height: 150 },
  videoPlaceholder: {
    flex: 1,
    minHeight: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  deityName: { color: colors.maroon, fontSize: 18, fontWeight: '800', marginTop: 16 },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.maroon,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },
  chooseText: { color: colors.maroon, fontWeight: '700', fontSize: 13 },
  offering: { position: 'absolute', top: 24, fontSize: 26 },
  panel: { backgroundColor: colors.cream, borderRadius: radius.lg, padding: spacing.md },
  panelWide: { flex: 1 },
  panelNarrow: { maxHeight: 180 },
  panelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGold: { backgroundColor: colors.saffron },
  avatarText: { color: colors.white, fontWeight: '700' },
  pName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  pRole: { fontSize: 11, color: colors.muted },
  orgTag: { backgroundColor: colors.gold, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  orgTagText: { fontSize: 9, fontWeight: '800', color: colors.maroon },
  paletteWrap: { paddingTop: 10, paddingBottom: 6, paddingHorizontal: spacing.md },
  paletteHint: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center', marginBottom: 8 },
  palette: { gap: 10, alignItems: 'center' },
  palItem: {
    width: 66,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    paddingVertical: 8,
  },
  palEmoji: { fontSize: 26 },
  palLabel: { color: colors.white, fontSize: 10, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '80%',
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.maroon },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  gridItem: { width: 92, alignItems: 'center' },
  gridThumb: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridImg: { width: 84, height: 84 },
  gridName: { fontSize: 12, color: colors.ink, marginTop: 4, textAlign: 'center' },
});
