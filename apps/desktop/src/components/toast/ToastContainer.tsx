import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { dismissToast, useToastStore } from "../../stores/toastStore";

const toastIcon: Record<string, string> = {
  error: "●",
  success: "●",
  warning: "●",
};

const toastColor: Record<string, string> = {
  error: "var(--error)",
  success: "var(--success)",
  warning: "var(--accent)",
};

export function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            animate={{ opacity: 1, y: 0 }}
            className="toast"
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, y: -8 }}
            layout
          >
            <span className="toast-dot" style={{ color: toastColor[toast.type] }}>
              {toastIcon[toast.type]}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button
              aria-label="Dismiss"
              className="toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
