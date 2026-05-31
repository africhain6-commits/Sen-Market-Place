import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListingCard, Listing } from "@/components/ListingCard";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";

export default function FavorisScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : 100;

  const { data: favorites, isLoading, refetch, isRefetching } = useQuery<Listing[]>({
    queryKey: ["favorites"],
    queryFn: () => apiFetch("/api/favorites"),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (listingId: number) =>
      apiFetch(`/api/favorites/${listingId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const handleRemove = (listingId: number) => {
    Alert.alert(
      "Retirer des favoris",
      "Voulez-vous retirer cette annonce de vos favoris ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => removeMutation.mutate(listingId),
        },
      ],
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes favoris</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.center}>
          <Feather name="heart" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connectez-vous</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Créez un compte pour sauvegarder vos annonces préférées
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.btnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !favorites || favorites.length === 0 ? (
        <View style={styles.center}>
          <Feather name="heart" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun favori</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Appuyez sur le cœur d'une annonce pour la sauvegarder ici
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/(tabs)/annonces")}
          >
            <Text style={[styles.btnText, { color: colors.accentForeground }]}>Parcourir les annonces</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ padding: 12, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {favorites.length} favori{favorites.length > 1 ? "s" : ""}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ListingCard
                listing={item}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => handleRemove(item.id)}
              >
                <Feather name="heart" size={12} color="#fff" />
                <Text style={styles.removeBtnText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  row: { gap: 10, marginBottom: 10 },
  cardWrapper: { flex: 1 },
  count: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8, marginLeft: 2 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -4,
    marginBottom: 6,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeBtnText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
