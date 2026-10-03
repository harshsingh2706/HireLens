"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar, RecruiterInfo } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { CloseIcon } from "@/components/ui/icons";

export interface AppShellProps {
  recruiter: RecruiterInfo;
  children: React.ReactNode;
}

export function AppShell({ recruiter, children }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  // Lock body scroll when mobile drawer is active
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <AppSidebar recruiter={recruiter} />
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-xl">
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <AppSidebar
              recruiter={recruiter}
              onNavigate={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AppHeader
          recruiter={recruiter}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
