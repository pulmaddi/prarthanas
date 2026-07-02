import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

/** Section title on a soft saffron bar with a crisp vector icon. */
export default function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.bar}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.maroon} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7E4CC',
    borderLeftWidth: 4,
    borderLeftColor: colors.saffron,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.maroon },
});
