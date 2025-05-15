
// Re-export our preferred toast implementation (Sonner)
export { toast } from './use-toast-sonner';

// Re-export the shadcn toast components and types for components that still use them
export {
  useToast,
  toast as shadcnToast,
  type ToasterToast
} from './use-toast-shadcn';

// Export the types for convenience
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast";
export type { ToastActionElement, ToastProps };
