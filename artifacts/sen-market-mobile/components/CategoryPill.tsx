import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "all", label: "Tout", icon: "🔍" },
  { id: "Immobilier", label: "Immobilier", icon: "🏠" },
  { id: "Véhicules", label: "Véhicules", icon: "🚗" },
  { id: "Électronique", label: "Électronique", icon: "📱" },
  { id: "Emploi", label: "Emploi", icon: "💼" },
  { id: "Mode", label: "Mode", icon: "👗" },
  { id: "Maison", label: "Maison", icon: "🛋️" },
  { id: "Services", label: "Services", icon: "🔧" },
  { id: "Autres", label: "Autres", icon: "📦" },
];

export { CATEGORIES };

interface Props {
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
}

export function CategoryPill({ label, icon, isActive, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.pill,
        {
          backgroundColor: isActive ? colors.primary : colors.card,
          borderColor: isActive ? colors.primary : colors.border,
        },
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  icon: { fontSize: 14 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
