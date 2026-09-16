"use client";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Network,
} from "lucide-react";

const NAV = [
  { href: "/admin",          label: "Dashboard",       icon: LayoutDashboard, exact: true },
  { href: "/admin/mentors",  label: "Mentor Approvals",icon: GraduationCap },
  { href: "/admin/pods",     label: "Pod Management",  icon: Layers },
  { href: "/admin/users",    label: "Users",           icon: Users },
];

export default function AdminLayout({ children }) {
  const { user, token } = useSelector((s) => s.auth);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role?.toLowerCase() !== "admin") { router.push("/dashboard"); }
  }, [user, router]);

  if (!user || user.role?.toLowerCase() !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#080E1C] text-slate-200 flex">
      {}
      <aside className="w-64 flex-shrink-0 fixed top-0 left-0 h-screen flex flex-col border-r border-white/[0.06] bg-[#0C1323] z-40">
        {}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
            <p className="text-[10px] text-orange-400 font-medium">ProConnect</p>
          </div>
        </div>

        {}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold px-2 mb-3">
            Management
          </p>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group
                  ${active
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
              >
                <Icon size={17} className={active ? "text-orange-400" : "text-slate-500 group-hover:text-slate-300"} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="text-orange-400 opacity-70" />}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold px-2 mb-3">
              Quick Links
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <Network size={17} className="text-slate-500" />
              Back to App
            </Link>
          </div>
        </nav>

        {}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.name?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-orange-400 font-medium">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {}
        <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#080E1C]/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck size={14} className="text-orange-400" />
            <span>Admin</span>
            {pathname !== "/admin" && (
              <>
                <ChevronRight size={13} />
                <span className="text-slate-300 font-semibold capitalize">
                  {pathname.split("/admin/")[1]?.replace(/-/g, " ") || ""}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
