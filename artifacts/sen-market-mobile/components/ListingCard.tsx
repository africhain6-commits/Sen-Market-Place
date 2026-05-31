import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { apiUrl } from "@/hooks/useApi";

export interface Listing {
  id: number;
  title: string;
  price: number;
  category: string;
  city: string;
  photos: string[];
  createdAt: string;
  status?: string;
  isFeatured?: boolean;
}

interface Props {
  listing: Listing;
  onPress: () => void;
  horizontal?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Immobilier": "🏠",
  "Véhicules": "🚗",
  "Électronique": "📱",
  "Emploi": "💼",
  "Emplois": "💼",
  "Mode": "👗",
  "Maison & Jardin": "🛋️",
  "Services": "🔧",
  "Autres": "📦",
};

function resolveUri(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("/api")) return apiUrl(uri);
  return uri;
}

export function ListingCard({ listing, onPress, horizontal }: Props) {
  const colors = useColors();

  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuit";
    return new Intl.NumberFormat("fr-SN").format(price) + " FCFA";
  };

  const timeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffH < 1) return "À l'instant";
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD < 7) return `Il y a ${diffD}j`;
    return d.toLocaleDateString("fr-FR");
  };

  const imageUri = listing.photos?.[0] ? resolveUri(listing.photos[0]) : null;
  const categoryIcon = CATEGORY_ICONS[listing.category] ?? "📦";

  if (horizontal) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.hCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.hImage} resizeMode="cover" />
        ) : (
          <View style={[styles.hImage, styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
          </View>
        )}
        <View style={styles.hContent}>
          <Text style={[styles.hTitle, { color: colors.foreground }]} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={[styles.hPrice, { color: colors.accent }]}>
            {formatPrice(listing.price)}
          </Text>
          <Text style={[styles.hMeta, { color: colors.mutedForeground }]}>
            📍 {listing.city} · {timeAgo(listing.createdAt)}
          </Text>
          {listing.status && listing.status !== "active" && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: listing.status === "pending" ? "#FEF3C7" : listing.status === "sold" ? "#D1FAE5" : colors.muted }
            ]}>
              <Text style={[
                styles.statusText,
                { color: listing.status === "pending" ? "#92400E" : listing.status === "sold" ? "#065F46" : colors.mutedForeground }
              ]}>
                {listing.status === "pending" ? "En attente" : listing.status === "sold" ? "Vendu" : listing.status}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {listing.isFeatured && (
        <View style={[styles.featuredBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.featuredText, { color: colors.accentForeground }]}>Vedette</Text>
        </View>
      )}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
          <Text style={styles.categoryIconLarge}>{categoryIcon}</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={[styles.price, { color: colors.accent }]}>
          {formatPrice(listing.price)}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
            📍 {listing.city}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {timeAgo(listing.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
    minWidth: 160,
    maxWidth: "48%",
  },
  image: { width: "100%", height: 140 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  categoryIcon: { fontSize: 24 },
  categoryIconLarge: { fontSize: 36 },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  featuredText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  content: { padding: 10 },
  title: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4, lineHeight: 18 },
  price: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  meta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statusBadge: { marginTop: 4, alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  hCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  hImage: { width: 100, height: 90 },
  hContent: { flex: 1, padding: 10, justifyContent: "center" },
  hTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4, lineHeight: 20 },
  hPrice: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  hMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
