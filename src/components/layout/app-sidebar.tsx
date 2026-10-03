"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  OverviewIcon,
  JobsIcon,
  CandidatesIcon,
  SearchIcon,
  SettingsIcon,
  LogoutIcon,
} from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { logoutRecruiter } from "@/lib/actions/auth-actions";

export interface RecruiterInfo {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

export interface AppSidebarProps {
  recruiter: RecruiterInfo;
  onNavigate?: () => void;
}

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: OverviewIcon,
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: JobsIcon,
  },
  {
    label: "Candidates",
    href: "/candidates",
    icon: CandidatesIcon,
  },
  {
    label: "Search",
    href: "/search",
    icon: SearchIcon,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SettingsIcon,
  },
];

export function AppSidebar({ recruiter, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
          HL
        </div>
        <div className="leading-tight">
          <span className="font-bold text-sm tracking-tight text-slate-900 block">
            HireLens
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Recruitment AI
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Platform
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-blue-900" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Recruiter Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar name={recruiter.name} size="sm" />
            <div className="truncate leading-tight">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {recruiter.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {recruiter.company || recruiter.email}
              </p>
            </div>
          </div>

          <form action={logoutRecruiter}>
            <button
              type="submit"
              title="Sign out of HireLens"
              aria-label="Sign out"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
