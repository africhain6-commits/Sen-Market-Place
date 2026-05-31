import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";

const CITIES = [
  "Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor",
  "Rufisque", "Touba", "Mbour", "Diourbel", "Tambacounda",
];

export default function EditProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom est requis");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/api/users/${user!.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          city: city.trim() || null,
        }),
      });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Profil mis à jour", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          <Text style={[styles.saveText, { opacity: loading ? 0.5 : 1 }]}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentForeground }]}>
            {(name || user?.name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Nom complet *</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Téléphone</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+221 77 000 00 00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>WhatsApp</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="message-circle" size={16} color="#25D366" />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="+221 77 000 00 00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Ville</Text>
            <TouchableOpacity
              style={[styles.inputRow, { borderColor: colors.border }]}
              onPress={() => setShowCities(v => !v)}
            >
              <Feather name="map-pin" size={16} color={colors.mutedForeground} />
              <Text style={[styles.input, { color: city ? colors.foreground : colors.mutedForeground }]}>
                {city || "Choisir une ville"}
              </Text>
              <Feather name={showCities ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showCities && (
              <View style={[styles.cityList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {CITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityItem, c === city && { backgroundColor: colors.primary + "15" }]}
                    onPress={() => { setCity(c); setShowCities(false); }}
                  >
                    <Text style={[styles.cityText, { color: c === city ? colors.primary : colors.foreground }]}>{c}</Text>
                    {c === city && <Feather name="check" size={14} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveFullBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveFullBtnText}>{loading ? "Sauvegarde..." : "Sauvegarder le profil"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  content: { padding: 20, alignItems: "center", gap: 16 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold" },
  card: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  cityList: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  cityText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  saveFullBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  saveFullBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
