import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'DirectChat'>;

type Message = {
  id: string;
  sender_id: string;
  body: string;
  is_meeting_invite: boolean;
  meeting_room_id: string | null;
  created_at: string;
};

export default function DirectChatScreen({ route }: Props) {
  const { requestId, otherUserId, otherName } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, hostTypes } = useAuth();
  const uid = session?.user.id;
  const isHost = (hostTypes ?? []).length > 0;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [startingMeeting, setStartingMeeting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('id,sender_id,body,is_meeting_invite,meeting_room_id,created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  }, [requestId, uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Realtime subscription
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`chat:${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [requestId, uid]);

  const send = async () => {
    if (!uid || !text.trim()) return;
    setSending(true);
    await supabase.from('direct_messages').insert({
      request_id: requestId,
      sender_id: uid,
      recipient_id: otherUserId,
      body: text.trim(),
      is_meeting_invite: false,
    });
    setText('');
    setSending(false);
  };

  const startMeeting = async () => {
    if (!uid) return;
    setStartingMeeting(true);
    const roomId = `private-${requestId.slice(0, 8)}-${Date.now()}`;

    // Update request status to meeting_started
    await supabase
      .from('session_requests')
      .update({ status: 'meeting_started', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    // Post meeting invite message
    await supabase.from('direct_messages').insert({
      request_id: requestId,
      sender_id: uid,
      recipient_id: otherUserId,
      body: `🙏 Your meeting is ready. Tap "Join Meeting" to enter.`,
      is_meeting_invite: true,
      meeting_room_id: roomId,
    });
    setStartingMeeting(false);
  };

  const joinMeeting = (roomId: string) => {
    nav.navigate('LiveRoom', {
      meetingId: roomId,
      title: `Session with ${otherName}`,
      hostId: isHost ? (uid ?? '') : otherUserId,
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.screen}>
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageBody}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <Text style={styles.empty}>No messages yet. Say namaste! 🙏</Text>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === uid;
            return (
              <View key={m.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                {m.is_meeting_invite ? (
                  <View style={styles.inviteCard}>
                    <MaterialCommunityIcons name="video" size={20} color={colors.maroon} />
                    <Text style={styles.inviteText}>{m.body}</Text>
                    <TouchableOpacity
                      style={styles.joinBtn}
                      onPress={() => joinMeeting(m.meeting_room_id!)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.joinBtnText}>Join Meeting →</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.msgText, mine && styles.msgTextMine]}>{m.body}</Text>
                )}
                <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(m.created_at)}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Host: Start Meeting button */}
        {isHost && (
          <TouchableOpacity
            style={[styles.startMeetingBtn, startingMeeting && { opacity: 0.6 }]}
            onPress={startMeeting}
            disabled={startingMeeting}
            activeOpacity={0.85}
          >
            {startingMeeting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <MaterialCommunityIcons name="video-plus" size={16} color="#fff" />
                  <Text style={styles.startMeetingText}>Start Meeting & Share Link</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={send}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  messageList: { flex: 1 },
  messageBody: { padding: spacing.md, paddingBottom: 12, gap: 10 },
  empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    padding: 10,
    paddingHorizontal: 13,
  },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.maroon },
  msgText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  msgTextMine: { color: '#fff' },
  time: { fontSize: 10, color: colors.muted, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.65)' },
  inviteCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  inviteText: { fontSize: 13, color: colors.ink, textAlign: 'center', lineHeight: 19 },
  joinBtn: {
    backgroundColor: colors.maroon,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 4,
  },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  startMeetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B6B4A',
    marginHorizontal: spacing.md,
    marginBottom: 8,
    borderRadius: radius.pill,
    paddingVertical: 11,
  },
  startMeetingText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: spacing.md,
    paddingTop: 6,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
