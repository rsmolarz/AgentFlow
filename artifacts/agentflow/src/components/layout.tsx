import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { SemanticSearch } from "./semantic-search";
import { useTheme } from "@/hooks/use-theme";
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
  FileSpreadsheet,
  Webhook,
  BookOpen,
  Sun,
  Moon,
  Shield,
  Brain,
  Gauge,
  Bug,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Users,
  MessageSquare,
  ScrollText,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

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
  { icon: Webhook, label: "Webhooks", href: "/webhooks" },
  { icon: BookOpen, label: "Prompts", href: "/prompts" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Shield, label: "Audit Log", href: "/audit-log" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Sparkles, label: "Agent Presets", href: "/agent-presets" },
  { icon: Brain, label: "Memory Viewer", href: "/memory-viewer" },
  { icon: Gauge, label: "Rate Limits", href: "/rate-limits" },
  { icon: Bug, label: "Debug Trace", href: "/debug-trace" },
  { icon: ShieldCheck, label: "Output Validation", href: "/output-validation" },
  { icon: Sparkles, label: "Workflow Refiner", href: "/workflow-refiner" },
  { icon: DollarSign, label: "Cost Optimizer", href: "/cost-optimizer" },
  { icon: Users, label: "Team Workspaces", href: "/team-workspaces" },
  { icon: MessageSquare, label: "Slack Notifications", href: "/slack-config" },
  { icon: Lightbulb, label: "Feature Requests", href: "/feature-requests" },
];

const API_BASE = import.meta.env.VITE_API_URL || "";

const notifTypeIcons: Record<string, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-400" },
  error: { icon: XCircle, color: "text-red-400" },
  warning: { icon: AlertTriangle, color: "text-amber-400" },
  info: { icon: Info, color: "text-blue-400" },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/notifications/unread-count`)
      .then(r => r.json())
      .then(d => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, [location]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openNotifications() {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetch(`${API_BASE}/api/notifications`)
        .then(r => r.json())
        .then(d => setNotifications(Array.isArray(d) ? d.slice(0, 8) : []))
        .catch(() => {});
    }
  }

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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <div className="relative" ref={notifRef}>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground"
                onClick={openNotifications}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-background text-[10px] font-bold text-white flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {unreadCount === 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-background"></span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border/50 rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-50">
                  <div className="flex items-center justify-between p-3 border-b border-border/30">
                    <span className="font-semibold text-foreground text-sm">Notifications</span>
                    <Link href="/notifications" onClick={() => setShowNotifications(false)}>
                      <span className="text-xs text-primary hover:underline cursor-pointer">View All</span>
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Bell className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((n: any) => {
                        const cfg = notifTypeIcons[n.type] || notifTypeIcons.info;
                        const NIcon = cfg.icon;
                        return (
                          <div key={n.id} className={`flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors border-b border-border/20 ${!n.read ? "bg-primary/5" : ""}`}>
                            <NIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
