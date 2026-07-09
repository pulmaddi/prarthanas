import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, type } from '../theme';

/** Section title on a soft sandalwood bar with a crisp saffron icon. */
export default function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.bar}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.saffron} />
      <Text style={[type.h2, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.sandalSoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.saffron,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  title: { fontSize: 18 },
});
