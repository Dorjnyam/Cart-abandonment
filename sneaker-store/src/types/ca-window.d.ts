export {};

declare global {
  interface Window {
    _ca_user?: Record<string, string | number | boolean | undefined>;
    _ca?: {
      sendPurchase?: (extra: Record<string, unknown>) => void;
    };
  }
}
