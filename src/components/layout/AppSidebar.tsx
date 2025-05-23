
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { FolderTree } from "@/components/folders/FolderTree";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MessageSquare,
  Notebook,
  Presentation,
  Settings as SettingsIcon,
  PlusCircle,
  CalendarDays,
  ListChecks,
  PanelLeftClose,
  PanelRightOpen,
  Workflow,
  Server, // Added Server icon for MCP
} from "lucide-react";
import { useEffect, useState } from "react";

const OllamaLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M64 128C99.3462 128 128 99.3462 128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128ZM41.6649 50.368C42.9649 48.0227 45.9307 46.9027 48.2773 48.2013L78.5893 65.74C80.9347 67.04 82.056 69.9987 80.7573 72.344C79.4587 74.6893 76.492 75.8107 74.1467 74.512L43.8347 56.972C41.4893 55.6733 40.3667 52.7133 41.6649 50.368ZM54.6322 75.0493C53.3322 77.3947 50.3667 78.5147 48.02 77.216L17.708 59.676C15.3627 58.3773 14.2413 55.4187 15.54 53.0733C16.8387 50.728 19.8053 49.6067 22.1507 50.9053L52.4627 68.4453C54.808 69.7453 55.9307 72.704 54.6322 75.0493ZM86.0649 88.896C84.7649 91.2413 81.7993 92.3613 79.4527 91.0627L49.1407 73.5227C46.7953 72.224 45.674 69.2653 46.9727 66.92C48.2713 64.5747 51.238 63.4533 53.5827 64.752L83.8947 82.292C86.24 83.592 87.3627 86.5507 86.0649 88.896ZM71.3682 37.6507C72.6682 35.3053 75.6333 34.1853 77.98 35.484L108.292 53.024C110.637 54.3227 111.759 57.2813 110.46 59.6267C109.161 61.972 106.195 63.0933 103.85 61.7947L73.5373 44.2547C71.192 42.9547 70.0707 39.996 71.3682 37.6507Z"
      fill="currentColor"
    />
  </svg>
);

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/notes", icon: Notebook, label: "Notes" },
  { href: "/whiteboards", icon: Presentation, label: "Whiteboards" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/tasks", icon: ListChecks, label: "Tasks" },
  { href: "/agents", icon: Workflow, label: "AI agents" },
  { href: "/n8n", icon: Workflow, label: "n8n workflows" },
  { href: "/mcp-servers", icon: Server, label: "MCP servers" }, // Added MCP Servers
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, open } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
      <SidebarHeader className="flex items-center gap-2 p-4 border-b">
        <OllamaLogo />
        <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
          LibreOllama
        </span>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-0">
        <SidebarMenu className="p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Folders</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 group-data-[collapsible=icon]:hidden">
              <PlusCircle size={16} />
            </Button>
          </SidebarGroupLabel>
          {mounted && (
            <div className="group-data-[collapsible=icon]:hidden">
              <FolderTree />
            </div>
          )}
          <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2 mt-2">
            {/* Placeholder for icon-only view of folders if needed */}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
            >
              <Link href="/settings">
                <SettingsIcon />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

           <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              {open ? <PanelLeftClose /> : <PanelRightOpen />}
              <span>{open ? "Collapse sidebar" : "Expand sidebar"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
