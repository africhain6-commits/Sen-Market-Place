import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES } from "@/components/CategoryPill";
import { ListingCard, Listing } from "@/components/ListingCard";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/hooks/useApi";

interface ListingsPage {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AnnoncesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ search?: string; category?: string }>();

  const [search, setSearch] = useState(params.search ?? "");
  const [activeCategory, setActiveCategory] = useState(params.category ?? "all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.category) setActiveCategory(params.category);
    if (params.search) setSearch(params.search);
  }, [params.category, params.search]);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(activeCategory !== "all" ? { category: activeCategory } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const { data, isLoading, refetch } = useQuery<ListingsPage>({
    queryKey: ["listings", activeCategory, search, page],
    queryFn: () => apiFetch(`/api/listings?${queryParams}`),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : 100;

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const categoryLabel = activeCat && activeCategory !== "all"
    ? `${activeCat.icon}  ${activeCat.label}`
    : "Toutes les annonces";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header — orange/or */}
      <View style={[styles.header, { backgroundColor: colors.accent, paddingTop: topPadding + 10 }]}>
        {/* Titre catégorie */}
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{categoryLabel}</Text>

        {/* Barre de recherche */}
        <View style={[styles.searchBar, { backgroundColor: "#fff" }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Rechercher des annonces..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={(t) => { setSearch(t); setPage(1); }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); setPage(1); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres catégories */}
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
          renderItem={({ item }) => {
            const isActive = activeCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => { setActiveCategory(item.id); setPage(1); }}
                activeOpacity={0.7}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? colors.primary : "rgba(255,255,255,0.85)",
                    borderColor: isActive ? colors.primary : "rgba(255,255,255,0.5)",
                  },
                ]}
              >
                {item.icon ? <Text style={styles.pillIcon}>{item.icon}</Text> : null}
                <Text style={[styles.pillLabel, { color: isActive ? "#fff" : colors.primary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Résultats */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (data?.listings ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune annonce trouvée</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Essayez d'autres mots-clés ou catégories
          </Text>
          {activeCategory !== "all" && (
            <TouchableOpacity
              onPress={() => { setActiveCategory("all"); setPage(1); }}
              style={[styles.resetBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.resetBtnText, { color: colors.primary }]}>Voir toutes les annonces</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={data?.listings ?? []}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ padding: 12, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListHeaderComponent={
            data ? (
              <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
                {data.total} annonce{data.total > 1 ? "s" : ""}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ListingCard
                listing={item}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          )}
          ListFooterComponent={
            data && data.page < data.totalPages ? (
              <TouchableOpacity
                onPress={() => setPage(p => p + 1)}
                style={[styles.loadMore, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  categories: { paddingBottom: 4, gap: 0 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillIcon: { fontSize: 13 },
  pillLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  resetBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultsCount: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8, marginLeft: 2 },
  row: { gap: 10, marginBottom: 10 },
  cardWrapper: { flex: 1 },
  loadMore: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  loadMoreText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
