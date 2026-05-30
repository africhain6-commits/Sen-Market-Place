import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/hooks/useApi";

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
}

export default function ConversationScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { listingId, otherUserId } = useLocalSearchParams<{ listingId: string; otherUserId: string }>();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["conversation", listingId, otherUserId],
    queryFn: () => apiFetch(`/api/messages/conversations/${listingId}/${otherUserId}`),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => apiFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        listingId: Number(listingId),
        receiverId: Number(otherUserId),
        content: text.trim(),
      }),
    }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setText("");
      queryClient.invalidateQueries({ queryKey: ["conversation", listingId, otherUserId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate();
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = insets.bottom;

  const sorted = [...(messages ?? [])].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Conversation</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Messages */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id.toString()}
        inverted
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!sorted.length}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.id;
          return (
            <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
              <View style={[
                styles.bubble,
                isMe
                  ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                  : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}>
                <Text style={[styles.msgText, { color: isMe ? "#fff" : colors.foreground }]}>
                  {item.content}
                </Text>
                <Text style={[styles.msgTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucun message. Démarrez la conversation !</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: bottomPadding + 8 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Votre message..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          style={[styles.sendBtn, { backgroundColor: colors.accent, opacity: !text.trim() ? 0.4 : 1 }]}
          activeOpacity={0.8}
        >
          <Feather name="send" size={18} color={colors.accentForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  msgRow: { marginBottom: 8 },
  msgRowMe: { alignItems: "flex-end" },
  msgRowOther: { alignItems: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  msgTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
