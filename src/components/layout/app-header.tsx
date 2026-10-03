"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MenuIcon, SearchIcon, SettingsIcon, LogoutIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { RecruiterInfo } from "./app-sidebar";
import { logoutRecruiter } from "@/lib/actions/auth-actions";

export interface AppHeaderProps {
  recruiter: RecruiterInfo;
  onOpenMobileMenu: () => void;
}

export function AppHeader({ recruiter, onOpenMobileMenu }: AppHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* Recruiter Account Menu Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
          className="flex items-center gap-3 p-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all cursor-pointer"
        >
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {recruiter.name}
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">
              {recruiter.company || "HireLens Recruiter"}
            </span>
          </div>
          <Avatar name={recruiter.name} size="sm" />
        </button>

        {/* Account Menu Popover */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-30 animate-in fade-in duration-100">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900 truncate">{recruiter.name}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{recruiter.email}</p>
              {recruiter.company && (
                <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                  {recruiter.company}
                </span>
              )}
            </div>

            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Account & Organization</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-1">
              <form action={logoutRecruiter}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogoutIcon className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
