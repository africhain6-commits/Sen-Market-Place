import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListingCard, Listing } from "@/components/ListingCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/hooks/useApi";

export default function ProfilScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();

  const { data: myListings, isLoading, refetch } = useQuery<Listing[]>({
    queryKey: ["my-listings"],
    queryFn: () => apiFetch("/api/listings/user/mine"),
    enabled: isAuthenticated,
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : 100;

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter", style: "destructive", onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.authPrompt}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.muted }]}>
            <Feather name="user" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Rejoignez SenMarket</Text>
          <Text style={[styles.authText, { color: colors.mutedForeground }]}>
            Connectez-vous pour gérer vos annonces et accéder à toutes les fonctionnalités
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={[styles.btn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/auth/register")}
            style={[styles.btn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
          >
            <Text style={[styles.btnText, { color: colors.foreground }]}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.accentForeground }]}>
              {user?.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <View style={styles.infoRow}>
              <Feather name="mail" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.profileInfoText}>{user?.email}</Text>
            </View>
            {user?.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${user.phone}`)}>
                <Feather name="phone" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.profileInfoText}>{user.phone}</Text>
              </TouchableOpacity>
            )}
            {user?.whatsapp && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => Linking.openURL(`https://wa.me/${user.whatsapp!.replace(/\D/g, "")}`)}
              >
                <Feather name="message-circle" size={12} color="#25D366" />
                <Text style={[styles.profileInfoText, { color: "#25D366" }]}>{user.whatsapp}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoCardRow}>
            <Feather name="mail" size={16} color={colors.primary} />
            <View style={styles.infoCardContent}>
              <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>Email</Text>
              <Text style={[styles.infoCardValue, { color: colors.foreground }]}>{user?.email}</Text>
            </View>
          </View>
          {user?.phone ? (
            <TouchableOpacity style={styles.infoCardRow} onPress={() => Linking.openURL(`tel:${user.phone}`)}>
              <Feather name="phone" size={16} color={colors.primary} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>Téléphone</Text>
                <Text style={[styles.infoCardValue, { color: colors.primary }]}>{user.phone}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <View style={styles.infoCardRow}>
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>Téléphone</Text>
                <Text style={[styles.infoCardValue, { color: colors.mutedForeground }]}>Non renseigné</Text>
              </View>
            </View>
          )}
          {user?.whatsapp ? (
            <TouchableOpacity
              style={styles.infoCardRow}
              onPress={() => Linking.openURL(`https://wa.me/${user.whatsapp!.replace(/\D/g, "")}`)}
            >
              <Feather name="message-circle" size={16} color="#25D366" />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>WhatsApp</Text>
                <Text style={[styles.infoCardValue, { color: "#25D366" }]}>{user.whatsapp}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <View style={styles.infoCardRow}>
              <Feather name="message-circle" size={16} color={colors.mutedForeground} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>WhatsApp</Text>
                <Text style={[styles.infoCardValue, { color: colors.mutedForeground }]}>Non renseigné</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{myListings?.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Annonces</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.primary }]}>
              {myListings?.filter(l => l.status === "active").length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Actives</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.accent }]}>
              {myListings?.filter(l => l.status === "pending").length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>En attente</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/publier")}
            style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          >
            <Feather name="plus-circle" size={20} color={colors.accentForeground} />
            <Text style={[styles.actionText, { color: colors.accentForeground }]}>Publier une annonce</Text>
          </TouchableOpacity>
        </View>

        {/* My listings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mes annonces</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : !myListings || myListings.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="package" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Vous n'avez pas encore d'annonces
              </Text>
            </View>
          ) : (
            <View style={styles.listingsList}>
              {myListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  horizontal
                  onPress={() => router.push(`/listing/${listing.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  profileHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  bigAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginTop: 4 },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  profileInfoText: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular" },
  logoutBtn: { padding: 8 },
  infoCard: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  infoCardContent: { flex: 1 },
  infoCardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  infoCardValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  actionText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 30 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  listingsList: { gap: 0 },
  authPrompt: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  authTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  authText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  btn: { width: "100%", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
