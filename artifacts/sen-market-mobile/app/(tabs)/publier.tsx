import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES } from "@/components/CategoryPill";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";

const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Touba", "Diourbel", "Tambacounda", "Mbour", "Rufisque"];

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
          setTitle(""); setDescription(""); setPrice(""); setCategory(""); setCity("");
          router.push("/(tabs)/profil");
        }},
      ]);
    },
    onError: (e: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", e.message);
    },
  });

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
      images: [],
    });
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={styles.headerTitle}>Publier une annonce</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === "web" ? 120 : 120 }}
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
          disabled={mutation.isPending}
          style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: mutation.isPending ? 0.6 : 1 }]}
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
});
