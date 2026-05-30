import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill, CATEGORIES } from "@/components/CategoryPill";
import { ListingCard, Listing } from "@/components/ListingCard";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/hooks/useApi";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: featured, refetch: refetchFeatured } = useQuery<Listing[]>({
    queryKey: ["listings", "featured"],
    queryFn: () => apiFetch("/api/listings/featured"),
  });

  const { data: recent, refetch: refetchRecent } = useQuery<{ listings: Listing[] }>({
    queryKey: ["listings", "recent"],
    queryFn: () => apiFetch("/api/listings?limit=20&sortBy=date&sortOrder=desc"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFeatured(), refetchRecent()]);
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/(tabs)/annonces?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 50 : 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSmall}>Bonjour 👋</Text>
            <Text style={styles.headerTitle}>SenMarket</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profil")}
            style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <Feather name="user" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: "#fff" }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Que cherchez-vous ?"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                isActive={false}
                onPress={() => router.push(`/(tabs)/annonces?category=${cat.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        {featured && featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Annonces vedettes</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/annonces")}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featured.slice(0, 6)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View style={{ width: 180 }}>
                  <ListingCard
                    listing={item}
                    onPress={() => router.push(`/listing/${item.id}`)}
                  />
                </View>
              )}
            />
          </View>
        )}

        {/* Recent */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Annonces récentes</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/annonces")}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {!recent ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (recent.listings ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune annonce pour l'instant</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {(recent.listings ?? []).map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onPress={() => router.push(`/listing/${item.id}`)}
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerSmall: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" },
  headerTitle: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  headerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  scroll: { flex: 1 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  categories: { paddingHorizontal: 16, paddingBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 40 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
