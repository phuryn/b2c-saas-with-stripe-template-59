
// Export components
export { Sidebar } from "./sidebar-components"
export { SidebarInset } from "./sidebar-components"
export { SidebarRail } from "./sidebar-components"
export { SidebarContent } from "./sidebar-components"
export { SidebarHeader } from "./sidebar-components"
export { SidebarInput } from "./sidebar-components"
export { SidebarTrigger } from "./sidebar-components"
export { SidebarSeparator } from "./sidebar-components"
export { SidebarGroup } from "./sidebar-components"
export { SidebarGroupLabel } from "./sidebar-components"
export { SidebarGroupContent } from "./sidebar-components"
export { SidebarGroupAction } from "./sidebar-components"
export { SidebarMenu } from "./sidebar-components"
export { SidebarMenuItem } from "./sidebar-components"
export { SidebarMenuButton } from "./sidebar-components"
export { SidebarMenuAction } from "./sidebar-components"
export { SidebarMenuBadge } from "./sidebar-components"
export { SidebarMenuSub } from "./sidebar-components"
export { SidebarMenuSubItem } from "./sidebar-components"
export { SidebarMenuSubButton } from "./sidebar-components"
export { SidebarMenuSkeleton } from "./sidebar-components"
export { SidebarFooter } from "./sidebar-components"

// Export hooks and providers
export { 
  useSidebar,
  SidebarProvider,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_WIDTH_ICON
} from "./sidebar-context"

// Import and use the global useIsMobile hook
import { useIsMobile } from "@/hooks/use-mobile"
export { useIsMobile }
