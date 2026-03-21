import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { SemanticSearch } from "./semantic-search";
import { 
  LayoutDashboard, 
  Bot, 
  Workflow, 
  ActivitySquare, 
  Database, 
  Blocks, 
  Settings,
  Bell,
  Menu,
  X,
  Wand2,
  Plug,
  FlaskConical,
  Lightbulb,
  Trophy,
  GitCompareArrows,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wand2, label: "AI Builder", href: "/ai-builder", highlight: true },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: Workflow, label: "Workflows", href: "/workflows" },
  { icon: ActivitySquare, label: "Executions", href: "/executions" },
  { icon: FlaskConical, label: "Evaluations", href: "/evaluations" },
  { icon: Database, label: "Knowledge", href: "/knowledge-bases" },
  { icon: Plug, label: "Integrations", href: "/integrations" },
  { icon: Blocks, label: "Templates", href: "/templates" },
  { icon: GitCompareArrows, label: "A/B Testing", href: "/ab-testing" },
  { icon: FileSpreadsheet, label: "Bulk Execution", href: "/bulk-execution" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Lightbulb, label: "Feature Requests", href: "/feature-requests" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/40 backdrop-blur-sm z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="AgentFlow" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-foreground">AgentFlow</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const isHighlight = (item as any).highlight && !isActive;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive ? 'text-primary-foreground' : isHighlight ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
                `}>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active" 
                      className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 rounded-xl -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {isHighlight && (
                    <div className="absolute inset-0 border border-primary/30 bg-primary/5 rounded-xl -z-10" />
                  )}
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : isHighlight ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                  <span className="font-medium">{item.label}</span>
                  {isHighlight && <span className="ml-auto text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">New</span>}
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-border">
          <Link href="/settings" className="block">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full ${
              location === '/settings' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}>
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-display font-bold ml-2">AgentFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <SemanticSearch />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-background"></span>
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20 cursor-pointer">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="relative w-64 max-w-sm bg-card h-full flex flex-col border-r border-border p-6"
          >
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 mb-8">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="AgentFlow" className="w-6 h-6" />
               </div>
               <span className="font-display font-bold text-xl">AgentFlow</span>
            </div>
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
              <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground mt-4 pt-4 border-t border-border">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
