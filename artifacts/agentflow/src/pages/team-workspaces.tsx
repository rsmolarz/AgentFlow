import { useState } from "react";
import {
  Users, Plus, Search, Crown, Shield, Eye, Settings, Mail,
  UserPlus, MoreHorizontal, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  avatar: string;
  lastActive: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  agentCount: number;
  workflowCount: number;
}

const roleConfig = {
  owner: { icon: Crown, color: "text-amber-400 bg-amber-500/10", label: "Owner" },
  admin: { icon: Shield, color: "text-red-400 bg-red-500/10", label: "Admin" },
  editor: { icon: Settings, color: "text-blue-400 bg-blue-500/10", label: "Editor" },
  viewer: { icon: Eye, color: "text-gray-400 bg-gray-500/10", label: "Viewer" },
};

const defaultWorkspaces: Workspace[] = [
  {
    id: "1",
    name: "Default Workspace",
    description: "Main workspace for all team members",
    members: [
      { id: "1", name: "John Doe", email: "john@example.com", role: "owner", avatar: "JD", lastActive: "Just now" },
    ],
    agentCount: 7,
    workflowCount: 7,
  },
];

export default function TeamWorkspaces() {
  const [workspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Team Workspaces
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage team access, roles, and collaborative workspaces.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowInvite(true)}>
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      {showInvite && (
        <div className="bg-card border border-primary/30 rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3">Invite Team Member</h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Enter email address..." value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)} className="pl-10 bg-background border-border/50" />
            </div>
            <select className="px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm">
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <Button onClick={() => { setShowInvite(false); setInviteEmail(""); }}>
              Send Invite
            </Button>
            <Button variant="outline" onClick={() => setShowInvite(false)} className="border-border/50">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Workspaces</div>
          <div className="text-2xl font-bold text-foreground mt-1">{workspaces.length}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Members</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {workspaces.reduce((s, w) => s + w.members.length, 0)}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Shared Resources</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {workspaces.reduce((s, w) => s + w.agentCount + w.workflowCount, 0)}
          </div>
        </div>
      </div>

      {workspaces.map(ws => (
        <div key={ws.id} className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{ws.name}</h3>
                  <p className="text-sm text-muted-foreground">{ws.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border/50">{ws.agentCount} agents</Badge>
                <Badge variant="outline" className="border-border/50">{ws.workflowCount} workflows</Badge>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {ws.members.map(member => {
              const cfg = roleConfig[member.role];
              const RoleIcon = cfg.icon;
              return (
                <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <Badge variant="outline" className={`gap-1 ${cfg.color}`}>
                    <RoleIcon className="w-3 h-3" /> {cfg.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{member.lastActive}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
