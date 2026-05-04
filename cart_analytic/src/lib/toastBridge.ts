type ToastType = "success" | "error" | "info";
type ToastFn = (message: string, type?: ToastType) => void;

let _handler: ToastFn | null = null;

export const toastBridge = {
  register(fn: ToastFn) {
    _handler = fn;
  },
  show(message: string, type: ToastType = "info") {
    _handler?.(message, type);
  },
};
