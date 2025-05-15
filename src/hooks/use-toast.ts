
// Import the shadcn UI toast components
import { useToast as useShadcnToast } from '@/components/ui/toast';
// Import sonner for simpler toast notifications
import { toast as sonnerToast } from 'sonner';

// Re-export the components
export { useShadcnToast as useToast, sonnerToast as toast };

// TypeScript type declarations
import { type ToastActionElement, ToastProps } from "@/components/ui/toast";

// Export the types for convenience
export type { ToastActionElement, ToastProps };
