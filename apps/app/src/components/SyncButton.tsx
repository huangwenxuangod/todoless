import { Alert, Pressable, StyleSheet } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { colors, radii } from "../constants/theme";
import { syncEnabled } from "../services/sync";

export function SyncButton() {
  return (
    <Pressable
      accessibilityLabel="Sync"
      onPress={() => {
        Alert.alert(syncEnabled ? "Sync" : "Local only", syncEnabled ? "Sync will run after sign in." : "Tasks are stored on this device.");
      }}
      style={styles.button}
    >
      <RefreshCw size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
