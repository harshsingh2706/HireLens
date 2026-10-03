"use client";

import React from "react";
import { MenuIcon, SearchIcon } from "@/components/ui/icons";
import { RecruiterInfo } from "./app-sidebar";

export interface AppHeaderProps {
  recruiter: RecruiterInfo;
  onOpenMobileMenu: () => void;
}

export function AppHeader({ recruiter, onOpenMobileMenu }: AppHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Global search placeholder */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 w-64 md:w-80 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 focus-within:bg-white transition-all">
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="search"
            placeholder="Search candidates, skills, or jobs..."
            className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none"
            readOnly
            title="Search will be activated in the Candidate Management phase"
          />
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Recruiter Status Indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {recruiter.name}
          </span>
          <span className="text-[11px] text-slate-400 leading-tight">
            {recruiter.company || "HireLens Recruiter"}
          </span>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shrink-0" title="Active session" />
      </div>
    </header>
  );
}
