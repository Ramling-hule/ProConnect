"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "@/redux/features/themeSlice";
import { setActiveTab } from "@/redux/features/navSlice";
import { setNotifications, addNotification } from "@/redux/features/notificationSlice";
import { logout, openAuthModal } from "@/redux/features/authSlice";
import RightSidebar from "@/Components/RightSidebar";
import CopilotPanel from "@/Components/CopilotPanel";
import { Home, Search, Users, Trophy, Layers, Sun, Moon, Sparkles, Briefcase, Target, Compass, UserPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ChatWindow from "@/Components/ChatWindow";
import NotificationDropdown from "@/Components/NotificationDropdown";
import ProfileDropdown from "@/Components/ProfileDropdown";
import io from "socket.io-client";
import { API_BASE_URL } from "@/utils/config";

let socket;

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const { activeTab } = useSelector((state) => state.nav);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const pathname = usePathname();

  const isMentor = user?.role?.toLowerCase() === 'mentor';
  const isAdmin  = user?.role?.toLowerCase() === 'admin';
  let navItems = [];

  if (isMentor) {
    navItems = [
      { id: "mentor-dashboard", label: "Mentor Dashboard", icon: Briefcase, href: "/mentor-dashboard" },
      { id: "discover", label: "Discover", icon: Search, href: "/discover" },
      { id: "home", label: "Feed", icon: Home, href: "/dashboard" },
    ];
  } else {
    navItems = [
      { id: "home", label: "Home", icon: Home, href: "/dashboard" },
      { id: "discover", label: "Discover", icon: Search, href: "/discover" },
    ];
    if (user) {
      navItems.push({ id: "my-activity", label: "My Activity", icon: Layers, href: "/my-activity" });
    }
    navItems.push(
      { id: "hackathons", label: "Hackathons", icon: Trophy, href: "/hackathons" },
      { id: "find-teammates", label: "Find Teammates", icon: UserPlus, href: "/find-teammates" },
      { id: "mentors", label: "Mentors", icon: Briefcase, href: "/mentors" }
    );
  }

  useEffect(() => {
    if (user) {
      socket = io(API_BASE_URL);
      socket.emit("setup_user", user.id || user._id);

      const token = user.token || localStorage.getItem("token");
      fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          console.warn("Notifications fetch returned:", res.status);
          return null;
        })
        .then((data) => {
          if (data && Array.isArray(data)) dispatch(setNotifications(data));
        })
        .catch((err) => console.error("Notification fetch error:", err));

      socket.on("new_notification", (notif) => {
        dispatch(addNotification(notif));
      });

      return () => { if (socket) socket.disconnect(); };
    }
  }, [user, dispatch]);
  const bg    = isDark ? "#060B18"  : "#F0F4FF";
  const nav   = isDark ? "rgba(6,11,24,0.85)"  : "rgba(255,255,255,0.85)";
  const sidebar = isDark ? "#0D1526" : "#FFFFFF";
  const border  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textPrimary   = isDark ? "#E8EFF8" : "#0F172A";
  const textSecondary = isDark ? "#6B7FA3" : "#64748B";

  const navItemBase =
    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mb-0.5";
  const navItemActive =
    "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
  const navItemInactive = isDark
    ? "text-[#6B7FA3] hover:bg-white/4 hover:text-[#E8EFF8]"
    : "text-[#64748B] hover:bg-brand-primary/5 hover:text-[#0F172A]";

  return (
      <div
        className="min-h-screen"
        style={{ background: bg, color: textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <nav
          className="fixed top-0 left-0 right-0 h-16 z-50 px-4 md:px-8 flex items-center justify-between"
          style={{
            background: nav,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md"
              style={{ background: "linear-gradient(135deg, #4F8EF7, #818CF8)" }}
            >
              U
            </div>
            <span className="text-base font-bold tracking-tight hidden md:block" style={{ color: textPrimary }}>
              ProConnect
            </span>
          </Link>
          <div className="flex items-center gap-2">

            {user ? (
              <NotificationDropdown />
            ) : null}

            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                color: isDark ? "#FBBF24" : "#64748B",
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <ProfileDropdown />
            ) : (
              <Link href="/login" className="ml-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md">
                Sign In
              </Link>
            )}
          </div>
        </nav>
        <div className="pt-16 flex max-w-[1600px] mx-auto pb-16 md:pb-0">
          <aside
            className="hidden md:flex flex-col w-64 fixed h-[calc(100vh-64px)] overflow-y-auto p-4 custom-scrollbar"
            style={{
              background: sidebar,
              borderRight: `1px solid ${border}`,
              top: 64,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: textSecondary }}>
              Navigation
            </p>

            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const cls = `${navItemBase} ${isActive ? navItemActive : navItemInactive}`;

                return (
                  <Link key={item.id} href={item.href} className={cls}>
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  if (!user) {
                    dispatch(openAuthModal("Please sign in to access AI Copilot"));
                  } else {
                    setIsCopilotOpen(true);
                  }
                }}
                className={`${navItemBase} mt-2`}
                style={{
                  background: isCopilotOpen
                    ? "linear-gradient(135deg,rgba(79,142,247,0.18),rgba(129,140,248,0.12))"
                    : isDark ? "rgba(79,142,247,0.07)" : "rgba(79,142,247,0.06)",
                  color: isDark ? "#818CF8" : "#4F8EF7",
                  border: `1px solid ${isDark ? "rgba(129,140,248,0.2)" : "rgba(79,142,247,0.15)"}`,
                }}
              >
                <Sparkles size={18} />
                AI Copilot
              </button>
            </nav>

            {}
            {isAdmin && (
              <div className="mt-4">
                <Link
                  href="/admin"
                  className={`${navItemBase} border`}
                  style={{
                    background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)",
                    borderColor: isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.15)",
                    color: "#F97316",
                  }}
                >
                  <ShieldCheck size={18} />
                  Admin Panel
                </Link>
              </div>
            )}
            {user && (
              <div
                className="mt-auto mx-0 p-3 rounded-2xl flex items-center gap-3"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(79,142,247,0.05)",
                  border: `1px solid ${border}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)" }}
                >
                  {user.name?.[0] || "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate" style={{ color: textPrimary }}>{user.name}</p>
                  <p className="text-xs truncate" style={{ color: textSecondary }}>@{user.username}</p>
                </div>
              </div>
            )}
          </aside>
          <main className="flex-1 md:ml-64 xl:mr-80 p-4 md:p-6 min-h-[calc(100vh-64px)] w-full">
            {children}
          </main>

          <ChatWindow />
          <RightSidebar />
        </div>
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 flex justify-around items-center"
          style={{
            background: nav,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: `1px solid ${border}`,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.id} href={item.href}>
                <div className="flex flex-col items-center gap-1 px-2 py-1">
                  <Icon size={20} style={{ color: isActive ? "#4F8EF7" : textSecondary }} />
                  <span className="text-[10px] font-semibold" style={{ color: isActive ? "#4F8EF7" : textSecondary }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
          <button onClick={() => {
            if (!user) {
              dispatch(openAuthModal("Please sign in to access AI Copilot"));
            } else {
              setIsCopilotOpen(true);
            }
          }} className="flex flex-col items-center gap-1 px-2 py-1">
            <Sparkles size={20} style={{ color: isCopilotOpen ? "#818CF8" : textSecondary }} />
            <span className="text-[10px] font-semibold" style={{ color: isCopilotOpen ? "#818CF8" : textSecondary }}>
              Copilot
            </span>
          </button>
        </div>
        <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
      </div>
  );
}
