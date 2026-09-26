// Web-only video tile — attaches a LiveKit VideoTrack to an HTML <video> element.
// Webpack resolves this file on web builds; VideoTile.tsx is used on native.
import React, { useEffect, useRef } from 'react';
import type { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';
import { colors } from '../theme';

type Props = {
  track?: LocalVideoTrack | RemoteVideoTrack;
  isLocal?: boolean;
  name: string;
  audioMuted?: boolean;
  style?: React.CSSProperties;
};

export default function VideoTile({ track, isLocal, name, audioMuted, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [track]);

  const initial = (name.trim()[0] || '?').toUpperCase();

  return React.createElement(
    'div',
    {
      style: {
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colors.maroon,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        ...style,
      },
    },
    // Avatar shown when no video track or track is muted
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.maroon,
          zIndex: 0,
        },
      },
      React.createElement(
        'span',
        {
          style: {
            color: '#fff',
            fontSize: 36,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            userSelect: 'none',
          },
        },
        initial,
      ),
    ),
    // Video element — sits above avatar, transparent background until stream loads
    React.createElement('video', {
      ref: videoRef,
      autoPlay: true,
      playsInline: true,
      muted: !!isLocal,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        zIndex: 1,
        backgroundColor: 'transparent',
      },
    }),
    // Name + mic-muted indicator bar
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '14px 8px 6px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 2,
        },
      },
      audioMuted
        ? React.createElement(
            'span',
            { style: { fontSize: 12, lineHeight: 1 } },
            '🔇',
          )
        : null,
      React.createElement(
        'span',
        {
          style: {
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          },
        },
        `${name}${isLocal ? ' (You)' : ''}`,
      ),
    ),
  );
}
