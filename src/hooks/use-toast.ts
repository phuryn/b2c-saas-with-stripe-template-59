
// This is a proxy module to unify toast usage across the app
import { toast as sonnerToast } from 'sonner';
import { useToast as useShadcnToast } from '@/components/ui/toast';

// Export the shadcn toast hook for components that use it
export const useToast = useShadcnToast;

// Export a toast function that uses sonner for simple toast calls
export const toast = sonnerToast;
