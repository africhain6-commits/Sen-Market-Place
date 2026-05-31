import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiUrl } from "@/hooks/useApi";

interface ListingDetail {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  images: string[];
  createdAt: string;
  status: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    avatarUrl?: string | null;
    createdAt: string;
  };
}

export default function ListingDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState("");

  const { data: listing, isLoading } = useQuery<ListingDetail>({
    queryKey: ["listing", id],
    queryFn: () => apiFetch(`/api/listings/${id}`),
  });

  const sendMutation = useMutation({
    mutationFn: () => apiFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        listingId: Number(id),
        receiverId: listing?.userId,
        content: message,
      }),
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowContact(false);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      Alert.alert("Message envoyé", "Votre message a bien été envoyé au vendeur.");
    },
    onError: (e: Error) => {
      Alert.alert("Erreur", e.message);
    },
  });

  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuit";
    return new Intl.NumberFormat("fr-SN").format(price) + " FCFA";
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `${listing.title} — ${formatPrice(listing.price)}\n${listing.city}\n\nVoir sur SenMarket : ${apiUrl(`/listing/${listing.id}`)}`,
      });
    } catch {
      // user cancelled
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading || !listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingCenter}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Chargement...</Text>
        </View>
      </View>
    );
  }

  const isOwner = user?.id === listing.userId;
  const seller = listing.user;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: isOwner ? 20 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Images */}
        <View style={styles.imageContainer}>
          {(listing.images ?? []).length > 0 ? (
            <>
              <Image
                source={{ uri: listing.images[currentImage].startsWith("/api") ? apiUrl(listing.images[currentImage]) : listing.images[currentImage] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {(listing.images ?? []).length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails} contentContainerStyle={{ gap: 8, padding: 8 }}>
                  {(listing.images ?? []).map((img, i) => (
                    <TouchableOpacity key={i} onPress={() => setCurrentImage(i)}>
                      <Image
                        source={{ uri: img.startsWith("/api") ? apiUrl(img) : img }}
                        style={[styles.thumbnail, { borderColor: i === currentImage ? colors.accent : "transparent" }]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={[styles.mainImage, styles.noImage, { backgroundColor: colors.muted }]}>
              <Feather name="image" size={60} color={colors.mutedForeground} />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: topPadding + 8 }]}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareBtn, { top: topPadding + 8 }]}
          >
            <Feather name="share-2" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>{listing.title}</Text>
            <Text style={[styles.price, { color: colors.accent }]}>{formatPrice(listing.price)}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{listing.category}</Text>
            </View>
            <View style={styles.location}>
              <Feather name="map-pin" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{listing.city}</Text>
            </View>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {new Date(listing.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Description</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{listing.description}</Text>

          {seller && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Vendeur</Text>
              <View style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sellerTop}>
                  <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.sellerAvatarText}>{seller.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.sellerInfo}>
                    <Text style={[styles.sellerName, { color: colors.foreground }]}>{seller.name}</Text>
                    <Text style={[styles.sellerSince, { color: colors.mutedForeground }]}>
                      Membre depuis {new Date(seller.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </Text>
                  </View>
                </View>

                {/* Contact info */}
                {!isOwner && (
                  <View style={[styles.contactInfo, { borderTopColor: colors.border }]}>
                    {seller.phone && (
                      <TouchableOpacity
                        style={[styles.contactInfoBtn, { backgroundColor: colors.muted }]}
                        onPress={() => Linking.openURL(`tel:${seller.phone}`)}
                      >
                        <Feather name="phone" size={16} color={colors.primary} />
                        <Text style={[styles.contactInfoText, { color: colors.foreground }]}>{seller.phone}</Text>
                      </TouchableOpacity>
                    )}
                    {seller.whatsapp && (
                      <TouchableOpacity
                        style={[styles.contactInfoBtn, { backgroundColor: "#e8f5e9" }]}
                        onPress={() => Linking.openURL(`https://wa.me/${seller.whatsapp!.replace(/\D/g, "")}`)}
                      >
                        <Feather name="message-circle" size={16} color="#25D366" />
                        <Text style={[styles.contactInfoText, { color: "#1a7f37" }]}>{seller.whatsapp}</Text>
                      </TouchableOpacity>
                    )}
                    {seller.email && (
                      <TouchableOpacity
                        style={[styles.contactInfoBtn, { backgroundColor: colors.muted }]}
                        onPress={() => Linking.openURL(`mailto:${seller.email}`)}
                      >
                        <Feather name="mail" size={16} color={colors.primary} />
                        <Text style={[styles.contactInfoText, { color: colors.foreground }]}>{seller.email}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </>
          )}

          {/* Share section */}
          <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 8 }]}>Partager cette annonce</Text>
          <View style={styles.shareRow}>
            <TouchableOpacity
              style={[styles.shareNetBtn, { backgroundColor: "#1877F2" }]}
              onPress={() => {
                const url = encodeURIComponent(apiUrl(`/listing/${listing.id}`));
                Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
              }}
            >
              <Text style={styles.shareNetText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareNetBtn, { backgroundColor: "#25D366" }]}
              onPress={() => {
                const text = encodeURIComponent(`${listing.title} — ${formatPrice(listing.price)}\n${apiUrl(`/listing/${listing.id}`)}`);
                Linking.openURL(`https://wa.me/?text=${text}`);
              }}
            >
              <Text style={styles.shareNetText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareNetBtn, { backgroundColor: "#1DA1F2" }]}
              onPress={() => {
                const text = encodeURIComponent(`${listing.title} — ${formatPrice(listing.price)} sur SenMarket`);
                const url = encodeURIComponent(apiUrl(`/listing/${listing.id}`));
                Linking.openURL(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
              }}
            >
              <Text style={styles.shareNetText}>Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareNetBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
              onPress={handleShare}
            >
              <Text style={[styles.shareNetText, { color: colors.foreground }]}>Autre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      {!isOwner && (
        <View style={[styles.ctaBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {seller?.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${seller.phone}`)}
              style={[styles.ctaBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Feather name="phone" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {seller?.whatsapp && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://wa.me/${seller.whatsapp!.replace(/\D/g, "")}`)}
              style={[styles.ctaBtn, { backgroundColor: "#25D366" }]}
              activeOpacity={0.8}
            >
              <Feather name="message-circle" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              if (!isAuthenticated) {
                Alert.alert("Connexion requise", "Connectez-vous pour contacter ce vendeur.", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Se connecter", onPress: () => router.push("/auth/login") },
                ]);
                return;
              }
              setShowContact(true);
            }}
            style={[styles.ctaBtnMain, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Feather name="message-circle" size={20} color="#fff" />
            <Text style={styles.contactBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contact modal */}
      <Modal visible={showContact} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Envoyer un message</Text>
            <TouchableOpacity onPress={() => setShowContact(false)}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
            À propos de : {listing.title}
          </Text>
          <TextInput
            style={[styles.messageInput, { borderColor: colors.border, color: colors.foreground }]}
            placeholder="Bonjour, je suis intéressé(e) par votre annonce..."
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              if (!message.trim()) { Alert.alert("Erreur", "Écrivez un message"); return; }
              sendMutation.mutate();
            }}
            disabled={sendMutation.isPending}
            style={[styles.sendBtn, { backgroundColor: colors.accent, opacity: sendMutation.isPending ? 0.6 : 1 }]}
          >
            <Feather name="send" size={18} color={colors.accentForeground} />
            <Text style={[styles.sendBtnText, { color: colors.accentForeground }]}>
              {sendMutation.isPending ? "Envoi..." : "Envoyer"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: "absolute", left: 16, zIndex: 10 },
  scroll: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  imageContainer: { position: "relative" },
  mainImage: { width: "100%", height: 300 },
  noImage: { alignItems: "center", justifyContent: "center" },
  thumbnails: { maxHeight: 80 },
  thumbnail: { width: 64, height: 64, borderRadius: 8, borderWidth: 2 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,36,99,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,36,99,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16 },
  titleRow: { marginBottom: 10 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 6, lineHeight: 28 },
  price: { fontSize: 24, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  location: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8, marginTop: 4 },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 20 },
  sellerCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  sellerTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  sellerAvatarText: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  sellerSince: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  contactInfo: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  contactInfoBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  contactInfoText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  shareRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  shareNetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: "center" },
  shareNetText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ctaBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  ctaBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 12,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  contactBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modal: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: 160,
    marginBottom: 16,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  sendBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
