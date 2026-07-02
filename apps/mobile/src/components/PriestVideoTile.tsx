import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { t } from '../i18n';

/**
 * Priest's mic/video tile.
 *
 * Phase A: on web, the organizer publishes a local camera/mic self-view via
 * the browser's getUserMedia (no server yet). Devotees / native builds see a
 * placeholder until LiveKit media lands (Phase B), when the <video> source is
 * swapped to the subscribed track.
 */
export default function PriestVideoTile({
  name,
  role,
  canPublish,
}: {
  name: string;
  role: string;
  canPublish: boolean;
}) {
  const videoRef = useRef<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const showVideo = isWeb && canPublish && !err && camOn;

  // Acquire the local camera/mic once (organizer, web).
  useEffect(() => {
    if (!isWeb || !canPublish) return;
    let cancelled = false;
    let acquired: any = null;
    const nav: any = (globalThis as any).navigator;
    if (!nav?.mediaDevices?.getUserMedia) {
      setErr(t('room.noCamera'));
      return;
    }
    nav.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s: any) => {
        if (cancelled) {
          s.getTracks().forEach((tr: any) => tr.stop());
          return;
        }
        acquired = s;
        setStream(s);
      })
      .catch((e: any) => setErr(e?.name === 'NotAllowedError' ? t('room.camDenied') : String(e?.message ?? e)));
    return () => {
      cancelled = true;
      acquired?.getTracks?.().forEach((tr: any) => tr.stop());
    };
  }, [isWeb, canPublish]);

  // Attach the stream to the <video> element once both exist (and on remount
  // when the camera is toggled back on).
  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      try {
        el.srcObject = stream;
        const p = el.play?.();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }, [stream, showVideo]);

  const toggleCam = () => {
    const on = !camOn;
    setCamOn(on);
    stream?.getVideoTracks?.().forEach((tr: any) => (tr.enabled = on));
  };
  const toggleMic = () => {
    const on = !micOn;
    setMicOn(on);
    stream?.getAudioTracks?.().forEach((tr: any) => (tr.enabled = on));
  };

  return (
    <View style={styles.tile}>
      {showVideo
        ? React.createElement('video', {
            ref: videoRef,
            autoPlay: true,
            muted: true,
            playsInline: true,
            style: { width: '100%', height: '100%', objectFit: 'cover' },
          })
        : null}

      {!showVideo && (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name={canPublish ? (camOn ? 'account' : 'video-off') : 'video-account'}
            size={30}
            color="rgba(255,255,255,0.85)"
          />
          {!canPublish && <Text style={styles.waiting}>{t('room.priestVideo')}</Text>}
        </View>
      )}

      {/* name + controls */}
      <View style={styles.bar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {role}
          </Text>
        </View>
        {canPublish && isWeb && !err && (
          <View style={styles.ctrls}>
            <TouchableOpacity onPress={toggleMic} style={[styles.ctrl, !micOn && styles.ctrlOff]} hitSlop={6}>
              <MaterialCommunityIcons name={micOn ? 'microphone' : 'microphone-off'} size={15} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCam} style={[styles.ctrl, !camOn && styles.ctrlOff]} hitSlop={6}>
              <MaterialCommunityIcons name={camOn ? 'video' : 'video-off'} size={15} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!!err && <Text style={styles.err}>{err}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#1B0509',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 4 },
  waiting: { color: 'rgba(255,255,255,0.7)', fontSize: 9, textAlign: 'center', paddingHorizontal: 4 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  name: { color: colors.white, fontSize: 11, fontWeight: '700' },
  role: { color: 'rgba(255,255,255,0.8)', fontSize: 9 },
  ctrls: { flexDirection: 'row', gap: 5 },
  ctrl: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlOff: { backgroundColor: colors.live },
  err: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    color: colors.white,
    fontSize: 9,
    textAlign: 'center',
  },
});
