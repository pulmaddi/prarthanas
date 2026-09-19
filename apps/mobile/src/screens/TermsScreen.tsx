import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

const SECTIONS: { h: string; body: string }[] = [
  {
    h: '1. Acceptance of terms',
    body: 'By creating an account or using Prarthanas, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use the app.',
  },
  {
    h: '2. The service',
    body: 'Prarthanas connects devotees with temples, Gurus/Swamijis and devotee groups for live audio/video gatherings, guided virtual rituals, information sharing and community messages. We provide the platform; devotional content and ceremonies are provided by the respective hosts.',
  },
  {
    h: '3. Eligibility & accounts',
    body: 'You must be 18+ or use the app under a parent/guardian. You register with a valid mobile number and are responsible for keeping your account secure and your information accurate.',
  },
  {
    h: '4. Conduct & community respect',
    body: 'This is a devotional space. You agree not to post unlawful, hateful or disrespectful content, disrupt events, harass participants or hosts, impersonate anyone, or record/redistribute sessions without permission.',
  },
  {
    h: '5. Hosts (temples, Gurus, groups)',
    body: 'Hosts complete verification (including KYC) before being listed or receiving payouts, and are responsible for the accuracy, legality and conduct of their events and rituals.',
  },
  {
    h: '6. Content, recordings & consent',
    body: 'Sessions may be recorded by hosts; where recording occurs you will be informed and consent obtained as per applicable law. You retain rights to content you submit (e.g. sankalpa details).',
  },
  {
    h: '7. Payments, subscriptions & refunds',
    body: 'TO BE ADDED. Detailed payment terms — subscriptions, pay-per-event/ritual charges, platform commission, taxes (GST), refunds, cancellations and host payouts — will be published here before paid features are enabled. We do not store your card details.',
  },
  {
    h: '8. Privacy & data',
    body: "We handle personal data per India's Digital Personal Data Protection (DPDP) Act, store data in India, and collect only what is needed. A full Privacy Policy will accompany these terms.",
  },
  {
    h: '9. Disclaimers & liability',
    body: 'The app is provided “as is”. We are a technology platform and are not responsible for the spiritual or devotional outcomes of any event or ritual. Our liability is limited to the extent permitted by law.',
  },
  {
    h: '10. Changes & governing law',
    body: 'We may update these terms; material changes will be notified in the app. These terms are governed by the laws of India.',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ⚠️ Draft for review — not final legal text. To be reviewed by legal
          counsel before launch. Payment terms will be added later.
        </Text>
      </View>
      {SECTIONS.map((s) => (
        <View key={s.h} style={styles.section}>
          <Text style={styles.h}>{s.h}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
      <Text style={styles.updated}>Last updated 23 June 2026 · v0.1 draft</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.xl },
  notice: {
    backgroundColor: '#FFF7EF',
    borderColor: colors.saffron,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  noticeText: { fontSize: 12, color: '#5b4a38', lineHeight: 18 },
  section: { marginBottom: 16 },
  h: { fontSize: 15, fontWeight: '700', color: colors.maroon, marginBottom: 4 },
  body: { fontSize: 13, color: colors.ink, lineHeight: 20 },
  updated: { fontSize: 11, color: colors.muted, marginTop: 8, marginBottom: 30 },
});
