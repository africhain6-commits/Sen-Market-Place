import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Erreur", "Remplissez tous les champs");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/profil");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur de connexion", (e as Error).message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connexion</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.form}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>SM</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Bienvenue sur SenMarket</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Connectez-vous pour accéder à votre compte
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholder="votre@email.com"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Mot de passe</Text>
        <View style={[styles.pwdRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.pwdInput, { color: colors.foreground }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            autoComplete="password"
          />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
            <Feather name={showPwd ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
            {loading ? "Connexion..." : "Se connecter"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push("/auth/forgot-password")}
        >
          <Text style={[styles.forgotText, { color: colors.mutedForeground }]}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.replace("/auth/register")}>
            <Text style={[styles.footerLink, { color: colors.accent }]}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  form: { flex: 1, padding: 24 },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  logoText: { color: "#D4AF37", fontSize: 28, fontFamily: "Inter_700Bold" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 28 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  pwdRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  pwdInput: { flex: 1, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  forgotBtn: { alignItems: "center", marginBottom: 20, marginTop: -8 },
  forgotText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
