import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useBreakpoint } from '../lib/useBreakpoint';
import { colors } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
};

/**
 * On desktop web: centres children inside a max-width container with a
 * subtle background. On mobile the wrapper is transparent/invisible.
 */
export default function WebPageWrapper({ children, style, maxWidth = 940 }: Props) {
  const { isDesktop } = useBreakpoint();
  if (!isDesktop) return <>{children}</>;

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { maxWidth }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.ivory,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
