import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/hooks/useApi";

interface Conversation {
  listingId: number;
  otherUserId: number;
  otherUserName: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => apiFetch("/api/messages/conversations"),
    enabled: isAuthenticated,
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : 100;

  const timeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffH < 1) return "maintenant";
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}j`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {!isAuthenticated ? (
        <View style={styles.authPrompt}>
          <Feather name="message-square" size={56} color={colors.mutedForeground} />
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Vos conversations</Text>
          <Text style={[styles.authText, { color: colors.mutedForeground }]}>
            Connectez-vous pour accéder à vos messages
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun message</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Contactez un vendeur depuis une annonce pour démarrer une conversation
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => `${item.listingId}-${item.otherUserId}`}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/conversation/${item.listingId}/${item.otherUserId}`)}
              style={[styles.convItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{item.otherUserName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.convContent}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.otherUserName}
                  </Text>
                  <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                    {timeAgo(item.lastMessageAt)}
                  </Text>
                </View>
                <Text style={[styles.convListing, { color: colors.accent }]} numberOfLines={1}>
                  {item.listingTitle}
                </Text>
                <View style={styles.convBottom}>
                  <Text style={[styles.convMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.badgeText, { color: colors.accentForeground }]}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  authPrompt: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  authTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  authText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  convContent: { flex: 1 },
  convTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  convName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  convTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  convListing: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
  convBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convMsg: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});
