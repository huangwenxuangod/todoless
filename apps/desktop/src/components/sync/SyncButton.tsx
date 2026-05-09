import { RefreshCw } from "lucide-react";
import { syncEnabled } from "../../services/sync";
import { showToast } from "../../stores/toastStore";

export function SyncButton() {
  return (
    <button
      aria-label="Sync"
      className="icon-button sync-button"
      onClick={() => {
        showToast(syncEnabled ? "Sync will run after sign in" : "Local only", "success");
      }}
      title={syncEnabled ? "Sync" : "Local only"}
      type="button"
    >
      <RefreshCw size={18} />
    </button>
  );
}
