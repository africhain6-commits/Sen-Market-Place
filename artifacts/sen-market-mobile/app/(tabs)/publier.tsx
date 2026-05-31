import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES } from "@/components/CategoryPill";
import { useColors } from "@/hooks/useColors";
import { apiFetch, apiUrl } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Diourbel", "Tambacounda", "Mbour", "Rufisque"];
const MAX_PHOTOS = 8;

async function uploadImageToStorage(localUri: string): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const filename = localUri.split("/").pop() ?? "photo.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = ext === "png" ? "image/png" : "image/jpeg";

    const urlRes = await fetch(apiUrl("/api/storage/uploads/request-url"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: filename, size: 0, contentType }),
    });
    if (!urlRes.ok) return null;
    const { uploadURL, objectPath } = await urlRes.json();

    const imageRes = await fetch(localUri);
    const blob = await imageRes.blob();

    const putRes = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!putRes.ok) return null;

    return `/api/storage${objectPath}`;
  } catch {
    return null;
  }
}

export default function PublierScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: object) => apiFetch("/api/listings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      Alert.alert("Succès", "Votre annonce a été publiée et est en attente de validation.", [
        { text: "OK", onPress: () => {
          setTitle(""); setDescription(""); setPrice(""); setCategory(""); setCity(""); setPhotos([]);
          router.push("/(tabs)/profil");
        }},
      ]);
    },
    onError: (e: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", e.message);
    },
  });

  const pickPhotos = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Limite atteinte", `Maximum ${MAX_PHOTOS} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie pour ajouter des photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: MAX_PHOTOS - photos.length,
    });

    if (result.canceled) return;

    const assets = result.assets.slice(0, MAX_PHOTOS - photos.length);
    setUploadingCount((c) => c + assets.length);

    const uploaded = await Promise.all(
      assets.map((asset) => uploadImageToStorage(asset.uri))
    );

    const valid = uploaded.filter(Boolean) as string[];
    setPhotos((prev) => [...prev, ...valid]);
    setUploadingCount((c) => c - assets.length);

    if (valid.length < assets.length) {
      Alert.alert("Attention", "Certaines photos n'ont pas pu être téléchargées.");
    }
  };

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Limite atteinte", `Maximum ${MAX_PHOTOS} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la caméra.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploadingCount((c) => c + 1);
    const path = await uploadImageToStorage(result.assets[0].uri);
    setUploadingCount((c) => c - 1);

    if (path) {
      setPhotos((prev) => [...prev, path]);
    } else {
      Alert.alert("Erreur", "Impossible d'envoyer la photo.");
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est requis";
    if (!description.trim()) errs.description = "La description est requise";
    if (!category) errs.category = "Choisissez une catégorie";
    if (!city) errs.city = "Choisissez une ville";
    if (price && isNaN(Number(price))) errs.price = "Prix invalide";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      Alert.alert("Connexion requise", "Connectez-vous pour publier une annonce.", [
        { text: "Annuler", style: "cancel" },
        { text: "Se connecter", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    if (!validate()) return;
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      price: price ? Number(price) : 0,
      category,
      city,
      images: photos,
    });
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const isUploading = uploadingCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>Publier une annonce</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Titre *" error={errors.title}>
          <TextInput
            style={[styles.input, { borderColor: errors.title ? colors.destructive : colors.border, color: colors.foreground }]}
            placeholder="Ex: iPhone 15 Pro Max 256GB"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />
        </Field>

        <Field label="Description *" error={errors.description}>
          <TextInput
            style={[styles.textarea, { borderColor: errors.description ? colors.destructive : colors.border, color: colors.foreground }]}
            placeholder="Décrivez votre article en détail..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Field>

        <Field label="Prix (FCFA)">
          <TextInput
            style={[styles.input, { borderColor: errors.price ? colors.destructive : colors.border, color: colors.foreground }]}
            placeholder="0 = Gratuit / prix négociable"
            placeholderTextColor={colors.mutedForeground}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </Field>

        {/* Photos */}
        <Field label={`Photos (${photos.length}/${MAX_PHOTOS})`}>
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image
                    source={{ uri: apiUrl(uri) }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Principale</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(i)}>
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {Array.from({ length: uploadingCount }).map((_, i) => (
                <View key={`up-${i}`} style={[styles.photoThumb, { backgroundColor: colors.muted, justifyContent: "center", alignItems: "center" }]}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ))}
            </View>
          )}

          {isUploading && photos.length === 0 && (
            <View style={[styles.uploadZone, { borderColor: colors.border }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.uploadZoneText, { color: colors.mutedForeground }]}>Envoi en cours...</Text>
            </View>
          )}

          {!isUploading && photos.length < MAX_PHOTOS && (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={pickPhotos}
                activeOpacity={0.7}
              >
                <Feather name="image" size={20} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Galerie</Text>
              </TouchableOpacity>
              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={takePhoto}
                  activeOpacity={0.7}
                >
                  <Feather name="camera" size={20} color={colors.primary} />
                  <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Appareil photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {photos.length >= MAX_PHOTOS && (
            <Text style={[styles.limitText, { color: colors.mutedForeground }]}>Limite de {MAX_PHOTOS} photos atteinte.</Text>
          )}
        </Field>

        <Field label="Catégorie *" error={errors.category}>
          <View style={styles.pills}>
            {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: category === cat.id ? colors.primary : colors.card,
                    borderColor: category === cat.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.pillIcon}>{cat.icon}</Text>
                <Text style={[styles.pillLabel, { color: category === cat.id ? colors.primaryForeground : colors.foreground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Ville *" error={errors.city}>
          <View style={styles.pills}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCity(c)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: city === c ? colors.primary : colors.card,
                    borderColor: city === c ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.pillLabel, { color: city === c ? colors.primaryForeground : colors.foreground }]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending || isUploading}
          style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: (mutation.isPending || isUploading) ? 0.6 : 1 }]}
          activeOpacity={0.8}
        >
          {mutation.isPending ? (
            <Text style={[styles.submitText, { color: colors.accentForeground }]}>Publication...</Text>
          ) : (
            <>
              <Feather name="upload-cloud" size={20} color={colors.accentForeground} />
              <Text style={[styles.submitText, { color: colors.accentForeground }]}>Publier l'annonce</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: 120,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillIcon: { fontSize: 14 },
  pillLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold" },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: { width: "100%", height: "100%" },
  mainBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 2,
  },
  mainBadgeText: { color: "#fff", fontSize: 10, textAlign: "center", fontFamily: "Inter_500Medium" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 3,
  },
  uploadZone: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  uploadZoneText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  photoBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  limitText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
});
