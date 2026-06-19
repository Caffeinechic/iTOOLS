"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Clock, 
  Search, 
  UserPlus, 
  RotateCw, 
  Pencil, 
  Trash2,
  Mail,
  Briefcase
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: {
    name: string;
    tier: string;
  };
  committee?: {
    id: string;
    name: string;
    year: string;
    status: string;
  };
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortBy, setSortBy] = useState("tier-desc");

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await apiFetch<{ data: Member[] }>("/users");
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const getTierBadgeDetails = (tier: string) => {
    switch (tier) {
      case "MASTER":
        return { label: "FACULTY", className: "bg-red-50 text-red-600 border-red-100" };
      case "LEADERSHIP":
        return { label: "CORE", className: "bg-blue-50 text-blue-600 border-blue-100" };
      case "OPERATIONS":
        return { label: "EXECUTIVE", className: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      default:
        return { label: "MEMBER", className: "bg-slate-50 text-slate-600 border-slate-100" };
    }
  };

  const getShortCommitteeName = (fullName: string) => {
    if (!fullName) return "";
    if (fullName === "Silver Oak University IEEE Student Branch") return "Main SB";
    if (fullName === "SOU IEEE Signal Processing Society Chapter") return "SPS Chapter";
    if (fullName === "SOU IEEE Computer Society Chapter") return "CS Chapter";
    if (fullName === "SOU IEEE Women In Engineering Affinity Group") return "WIE Group";
    if (fullName === "SOU IEEE SIGHT Group") return "SIGHT Group";
    return fullName;
  };

  const getTierPriority = (tier: string) => {
    switch (tier) {
      case "MASTER": return 4;
      case "LEADERSHIP": return 3;
      case "OPERATIONS": return 2;
      default: return 1;
    }
  };

  const tabs = [
    { label: "All", value: "All" },
    { label: "Executive Chairs", value: "Executive Chairs" },
    { label: "Main SB", value: "Silver Oak University IEEE Student Branch" },
    { label: "SB Coordination", value: "Student Branch Coordination" },
    { label: "Computer Society", value: "SOU IEEE Computer Society Chapter" },
    { label: "Signal Processing", value: "SOU IEEE Signal Processing Society Chapter" },
    { label: "Women In Engineering", value: "SOU IEEE Women In Engineering Affinity Group" },
    { label: "SIGHT", value: "SOU IEEE SIGHT Group" },
  ];

  // Filter based on search query
  const searchedMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.role?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  // Filter based on active classification tab
  const classifiedMembers = searchedMembers.filter(member => {
    if (activeTab === "All") return true;
    return member.committee?.name === activeTab;
  });

  // Sort the final list
  const sortedMembers = [...classifiedMembers].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === "tier-desc") {
      const priorityA = getTierPriority(a.role?.tier || "");
      const priorityB = getTierPriority(b.role?.tier || "");
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "date-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Committee</h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 bg-white border border-slate-200/50 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Committee</h1>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">SOU IEEE SB 2026 • Member Classifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={loadMembers} 
            className="h-9 w-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
          </Button>
          <Button className="rounded-full bg-[#0f172a] hover:bg-[#1e293b] text-white gap-2 text-xs font-bold px-4 h-9 shadow-sm">
            <UserPlus className="w-3.5 h-3.5" /> Add Identity
          </Button>
        </div>
      </div>

      {/* Classification Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full border transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-[#0f172a] text-white border-[#0f172a] shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <Input
            type="text"
            placeholder="Search by name, role or email..."
            className="pl-11 pr-4 py-5.5 rounded-full border-slate-200 text-slate-900 focus-visible:ring-slate-950 focus-visible:border-slate-950 bg-white placeholder-slate-400 text-xs shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-full px-4 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors"
          >
            <option value="tier-desc">Tier (Leadership first)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="date-desc">Newest Added</option>
            <option value="date-asc">Oldest Added</option>
          </select>
        </div>
      </div>

      {/* Cards Roster */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedMembers.map(member => {
          const tierDetails = getTierBadgeDetails(member.role?.tier || "MEMBER");
          const formattedDate = new Date(member.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
          const initial = member.name.charAt(0).toUpperCase();

          return (
            <Card key={member.id} className="bg-white border-slate-200/50 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Top Header inside Card */}
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center font-extrabold text-slate-700 text-lg shadow-inner">
                    {initial}
                  </div>
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-800">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 border border-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Identity Name & Chapter badges */}
                <div className="space-y-2.5">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-wide leading-tight">{member.name}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{member.role?.name || "Member"}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wider ${tierDetails.className}`}>
                      {tierDetails.label}
                    </Badge>
                    {member.committee?.name && (
                      <Badge variant="outline" className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-violet-100 bg-violet-50 text-violet-600 tracking-wider">
                        {getShortCommitteeName(member.committee.name)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info Block */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-2 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.committee?.name || "No Chapter"}</span>
                  </div>
                </div>
              </CardContent>

              {/* Bottom footer inside Card */}
              <div className="px-5 py-3.5 bg-white border-t border-slate-100/80 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                <span>Added On</span>
                <span className="text-slate-700">{formattedDate}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {sortedMembers.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/50">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No members matched</h3>
          <p className="text-xs text-slate-400 mt-1">Try refining your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}
