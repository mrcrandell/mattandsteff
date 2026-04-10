import { readonly, ref } from "vue";

export interface Toast {
  id: string;
  type: "success" | "danger" | "warning" | "info";
  message: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);

export const useToast = () => {
  const addToast = (
    message: string,
    type: Toast["type"] = "success",
    duration: number = 3000,
  ) => {
    // Keep notifications calm by suppressing duplicates that are already visible.
    const hasDuplicateVisibleToast = toasts.value.some((toast) =>
      toast.type === type && toast.message === message
    );
    if (hasDuplicateVisibleToast) {
      return;
    }

    const id = Math.random().toString(36).substring(7);
    toasts.value.push({ id, type, message, duration });
  };

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    success: (message: string, duration?: number) =>
      addToast(message, "success", duration),
    error: (message: string, duration?: number) =>
      addToast(message, "danger", duration),
    warning: (message: string, duration?: number) =>
      addToast(message, "warning", duration),
    info: (message: string, duration?: number) =>
      addToast(message, "info", duration),
  };
};
