import type { Metadata } from 'next';
// Removed Geist font imports
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import { SidebarInset } from '@/components/ui/sidebar';
import AdvancedAgentSidebar from '@/components/layout/AdvancedAgentSidebar';
import { ChatProvider } from '@/components/providers/ChatProvider';

// Removed geistSans and geistMono declarations

export const metadata: Metadata = {
  title: 'LibreOllama dashboard',
  description: 'Your intelligent productivity hub with local Ollama support.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"> {/* Removed font variables from className */}
        <SidebarProvider defaultOpen={true}>
          <ChatProvider>
            <div className="flex h-screen bg-background">
              <AppSidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <AppHeader />
                <div className="flex flex-1 overflow-hidden"> {/* Container for main content and right sidebar */}
                  <SidebarInset className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
                    {children}
                  </SidebarInset>
                  <AdvancedAgentSidebar /> {/* Added new right sidebar */}
                </div>
              </div>
            </div>
          </ChatProvider>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
