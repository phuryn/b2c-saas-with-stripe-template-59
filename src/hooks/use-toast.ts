// Import the shadcn UI toast components
import * as React from "react"
import { 
  type ToastActionElement, 
  type ToastProps 
} from "@/components/ui/toast"
// Import sonner for simpler toast notifications
import { toast as sonnerToast } from 'sonner';

// Re-export the shadcn toast components and types
export {
  useToast,
  toast as shadcnToast,
  type ToasterToast
} from './use-toast-shadcn';

// Configure and export a custom sonner toast with shorter duration
export const toast = {
  ...sonnerToast,
  // Override default methods with custom duration
  success: (message: string, options?: any) => 
    sonnerToast.success(message, { duration: 1000, ...options }),
  error: (message: string, options?: any) => 
    sonnerToast.error(message, { duration: 3000, ...options }),
  info: (message: string, options?: any) => 
    sonnerToast.info(message, { duration: 1000, ...options }),
  warning: (message: string, options?: any) => 
    sonnerToast.warning(message, { duration: 2000, ...options }),
  // Keep the original methods accessible as well
  default: sonnerToast
};

// Export the types for convenience
export type { ToastActionElement, ToastProps };
