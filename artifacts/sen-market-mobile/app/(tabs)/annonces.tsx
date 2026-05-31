import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES } from "@/components/CategoryPill";
import { ListingCard, Listing } from "@/components/ListingCard";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/hooks/useApi";

const CITIES = [
  "Toutes les villes",
  "Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor",
  "Rufisque", "Touba", "Mbour", "Diourbel", "Tambacounda",
];

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

  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pendingCity, setPendingCity] = useState("Toutes les villes");
  const [pendingMin, setPendingMin] = useState("");
  const [pendingMax, setPendingMax] = useState("");

  const activeFiltersCount = [
    selectedCity !== "Toutes les villes" ? 1 : 0,
    minPrice ? 1 : 0,
    maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (params.category) setActiveCategory(params.category);
    if (params.search) setSearch(params.search);
  }, [params.category, params.search]);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(activeCategory !== "all" ? { category: activeCategory } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(selectedCity !== "Toutes les villes" ? { city: selectedCity } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
  });

  const { data, isLoading, refetch } = useQuery<ListingsPage>({
    queryKey: ["listings", activeCategory, search, page, selectedCity, minPrice, maxPrice],
    queryFn: () => apiFetch(`/api/listings?${queryParams}`),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const applyFilters = () => {
    setSelectedCity(pendingCity);
    setMinPrice(pendingMin);
    setMaxPrice(pendingMax);
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setPendingCity("Toutes les villes");
    setPendingMin("");
    setPendingMax("");
  };

  const openFilters = () => {
    setPendingCity(selectedCity);
    setPendingMin(minPrice);
    setPendingMax(maxPrice);
    setShowFilters(true);
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 + 34 : 100;

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const categoryLabel = activeCat && activeCategory !== "all"
    ? `${activeCat.icon}  ${activeCat.label}`
    : "Toutes les annonces";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.accent, paddingTop: topPadding + 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{categoryLabel}</Text>

        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: "#fff", flex: 1 }]}>
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
          <TouchableOpacity
            onPress={openFilters}
            style={[styles.filterBtn, { backgroundColor: activeFiltersCount > 0 ? colors.primary : "rgba(255,255,255,0.9)" }]}
            activeOpacity={0.7}
          >
            <Feather name="sliders" size={18} color={activeFiltersCount > 0 ? "#fff" : colors.primary} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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

      {isLoading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (data?.listings ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune annonce trouvée</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Essayez d'autres mots-clés, catégories ou filtres
          </Text>
          {(activeCategory !== "all" || activeFiltersCount > 0) && (
            <TouchableOpacity
              onPress={() => {
                setActiveCategory("all");
                setSelectedCity("Toutes les villes");
                setMinPrice("");
                setMaxPrice("");
                setPage(1);
              }}
              style={[styles.resetBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.resetBtnText, { color: colors.primary }]}>Réinitialiser les filtres</Text>
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
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
                  {data.total} annonce{data.total > 1 ? "s" : ""}
                </Text>
                {activeFiltersCount > 0 && (
                  <View style={styles.activeFiltersRow}>
                    {selectedCity !== "Toutes les villes" && (
                      <View style={[styles.filterTag, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                        <Feather name="map-pin" size={11} color={colors.primary} />
                        <Text style={[styles.filterTagText, { color: colors.primary }]}>{selectedCity}</Text>
                      </View>
                    )}
                    {(minPrice || maxPrice) && (
                      <View style={[styles.filterTag, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                        <Feather name="tag" size={11} color={colors.primary} />
                        <Text style={[styles.filterTagText, { color: colors.primary }]}>
                          {minPrice ? `${Number(minPrice).toLocaleString("fr-SN")}` : "0"} — {maxPrice ? `${Number(maxPrice).toLocaleString("fr-SN")} FCFA` : "max"}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
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

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Filtres</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.filterSectionTitle, { color: colors.mutedForeground }]}>VILLE</Text>
            <View style={[styles.cityGrid]}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setPendingCity(c)}
                  style={[
                    styles.cityChip,
                    {
                      backgroundColor: pendingCity === c ? colors.primary : colors.muted,
                      borderColor: pendingCity === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cityChipText, { color: pendingCity === c ? "#fff" : colors.foreground }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterSectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>FOURCHETTE DE PRIX (FCFA)</Text>
            <View style={styles.priceRow}>
              <View style={[styles.priceInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Min</Text>
                <TextInput
                  style={[styles.priceField, { color: colors.foreground }]}
                  value={pendingMin}
                  onChangeText={setPendingMin}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.priceSeparator, { backgroundColor: colors.border }]} />
              <View style={[styles.priceInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Max</Text>
                <TextInput
                  style={[styles.priceField, { color: colors.foreground }]}
                  value={pendingMax}
                  onChangeText={setPendingMax}
                  placeholder="Illimité"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={applyFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>Appliquer les filtres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
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
  resultsHeader: { marginBottom: 8 },
  resultsCount: { fontSize: 13, fontFamily: "Inter_400Regular", marginLeft: 2 },
  activeFiltersRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  row: { gap: 10, marginBottom: 10 },
  cardWrapper: { flex: 1 },
  loadMore: { margin: 16, padding: 14, borderRadius: 12, alignItems: "center" },
  loadMoreText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  resetText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalBody: { flex: 1, padding: 20 },
  filterSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  priceInput: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  priceSeparator: { width: 20, height: 2, marginHorizontal: 8 },
  priceLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  priceField: { fontSize: 16, fontFamily: "Inter_400Regular" },
  modalFooter: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
