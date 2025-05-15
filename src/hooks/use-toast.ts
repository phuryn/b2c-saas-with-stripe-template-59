// Import the shadcn UI toast components
import { useToast as useShadcnToast, toast as shadcnToast } from '@/components/ui/use-toast';
// Import sonner for simpler toast notifications
import { toast as sonnerToast } from 'sonner';

// Re-export the components with custom configuration
export { useShadcnToast as useToast };

// Configure and export a custom sonner toast with shorter duration
export const toast = {
  ...sonnerToast,
  // Override default methods with custom duration
  success: (message: string, options?: any) => 
    sonnerToast.success(message, { duration: 3000, dismissible: true, ...options }),
  error: (message: string, options?: any) => 
    sonnerToast.error(message, { duration: 5000, dismissible: true, ...options }),
  info: (message: string, options?: any) => 
    sonnerToast.info(message, { duration: 3000, dismissible: true, ...options }),
  warning: (message: string, options?: any) => 
    sonnerToast.warning(message, { duration: 4000, dismissible: true, ...options }),
  // Keep the original methods accessible as well
  default: sonnerToast
};

// TypeScript type declarations
import { type ToastActionElement, ToastProps } from "@/components/ui/toast";

// Export the types for convenience
export type { ToastActionElement, ToastProps };
