import React from 'react';
import {
  Text,
  TextProps,
  TouchableOpacity,
  View,
  ViewProps,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, type, shadow, gradients } from '../theme';

export const Card = ({ style, ...props }: ViewProps) => (
  <View style={[styles.card, style]} {...props} />
);

// Typography helpers (Marcellus headings / Mukta body)
export const Display = ({ style, ...props }: TextProps) => (
  <Text style={[type.display, style]} {...props} />
);
export const H1 = ({ style, ...props }: TextProps) => (
  <Text style={[type.h1, style]} {...props} />
);
export const H2 = ({ style, ...props }: TextProps) => (
  <Text style={[type.h2, style]} {...props} />
);
export const Title = ({ style, ...props }: TextProps) => (
  <Text style={[type.h3, style]} {...props} />
);
export const Body = ({ style, ...props }: TextProps) => (
  <Text style={[type.body, style]} {...props} />
);
export const Muted = ({ style, ...props }: TextProps) => (
  <Text style={[type.caption, style]} {...props} />
);
export const Eyebrow = ({ style, ...props }: TextProps) => (
  <Text style={[type.eyebrow, style]} {...props} />
);

export const Button = ({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'green' | 'ghost';
}) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.btnWrap, shadow.glow]}>
        <LinearGradient
          colors={[...gradients.warm]}
          locations={[...gradients.warmLocations]}
          start={gradients.start}
          end={gradients.end}
          style={styles.btn}
        >
          <Text style={[type.button, { color: colors.onPrimary }]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.btn,
        styles.btnWrap,
        variant === 'outline' && styles.btnOutline,
        variant === 'green' && styles.btnGreen,
        variant === 'ghost' && styles.btnGhost,
      ]}
    >
      <Text
        style={[
          type.button,
          { color: colors.onPrimary },
          variant === 'outline' && { color: colors.maroon },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const LiveBadge = () => (
  <View style={styles.liveBadge}>
    <Text style={styles.liveText}>● LIVE</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: 'rgba(201,169,106,0.3)', // sandalDeep @ 30%
    borderWidth: 1,
    borderRadius: radius.md, // 14
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadow.card,
  },
  btnWrap: { borderRadius: radius.pill, marginTop: spacing.sm },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.sandalDeep,
  },
  btnGreen: { backgroundColor: colors.green },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  liveBadge: {
    backgroundColor: colors.live,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  liveText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
