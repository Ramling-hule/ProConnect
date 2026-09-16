"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  Users, GraduationCap, Clock, CheckCircle, XCircle,
  BookOpen, FileText, Trophy, Layers, Star,
  TrendingUp, ChevronRight, Loader, RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

function StatCard({ icon: Icon, label, value, sub, color, href }) {
  const colorMap = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300"   },
    green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  icon: "text-green-400",  badge: "bg-green-500/20 text-green-300"  },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/20",    icon: "text-red-400",    badge: "bg-red-500/20 text-red-300"    },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", badge: "bg-purple-500/20 text-purple-300"},
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-400", badge: "bg-orange-500/20 text-orange-300"},
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: "text-indigo-400", badge: "bg-indigo-500/20 text-indigo-300"},
    teal:   { bg: "bg-teal-500/10",   border: "border-teal-500/20",   icon: "text-teal-400",   badge: "bg-teal-500/20 text-teal-300"   },
  };
  const c = colorMap[color] || colorMap.blue;

  const inner = (
    <div className={`relative flex flex-col gap-4 p-5 rounded-2xl border ${c.bg} ${c.border} transition-all duration-200 ${href ? "hover:scale-[1.02] hover:shadow-lg cursor-pointer" : ""} h-full`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
          <Icon size={20} className={c.icon} />
        </div>
        {sub !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{sub}</span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value ?? "—"}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
      {href && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${c.icon}`}>
          View all <ChevronRight size={12} />
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function RecentMentorRow({ mentor }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <img
        src={mentor.user?.profilePicture || "/default-avatar.svg"}
        alt={mentor.user?.name}
        className="w-8 h-8 rounded-full object-cover border border-yellow-500/30 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{mentor.user?.name}</p>
        <p className="text-xs text-slate-500">@{mentor.user?.username}</p>
      </div>
      <Link
        href="/admin/mentors"
        className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 hover:border-orange-400/50 px-2.5 py-1 rounded-lg font-semibold transition-all"
      >
        Review
      </Link>
    </div>
  );
}

function RecentUserRow({ user }) {
  const roleColor = {
    admin:  "bg-red-500/20 text-red-300",
    mentor: "bg-blue-500/20 text-blue-300",
    user:   "bg-slate-500/20 text-slate-300",
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
        {user.name?.[0] || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
        <p className="text-xs text-slate-500">@{user.username}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleColor[user.role?.toLowerCase()] || roleColor.user}`}>
        {user.role || "user"}
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Platform statistics — last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.07] rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center items-center py-32 text-slate-500 gap-3">
          <Loader className="animate-spin" size={22} /> Loading platform data…
        </div>
      ) : stats ? (
        <>
          {}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}        label="Total Users"       value={stats.users?.total}     sub={`+${stats.users?.newToday} today`} color="blue"   />
            <StatCard icon={CheckCircle}  label="Active Mentors"    value={stats.mentors?.approved} href="/admin/mentors" color="green"  />
            <StatCard icon={Clock}        label="Pending Approvals" value={stats.mentors?.pending}  href="/admin/mentors" color="yellow" />
            <StatCard icon={BookOpen}     label="Total Bookings"    value={stats.bookings?.total}   color="purple" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileText}     label="Total Posts"       value={stats.posts?.total}       color="indigo" />
            <StatCard icon={Trophy}       label="Hackathons"        value={stats.hackathons?.total}  color="orange" />
            <StatCard icon={Layers}       label="Pods"              value={stats.pods?.total}        href="/admin/pods" color="teal" />
            <StatCard icon={Star}         label="Reviews"           value={stats.reviews?.total}     color="red" />
          </div>

          {}
          <div className="bg-[#0C1323] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap size={16} className="text-orange-400" /> Mentor Pipeline
              </h2>
              <Link href="/admin/mentors" className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                Manage all →
              </Link>
            </div>
            {(() => {
              const total = (stats.mentors?.pending || 0) + (stats.mentors?.approved || 0) + (stats.mentors?.rejected || 0);
              const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
              return (
                <div className="space-y-3">
                  {[
                    { label: "Approved", value: stats.mentors?.approved, color: "bg-green-500",  pct: pct(stats.mentors?.approved)  },
                    { label: "Pending",  value: stats.mentors?.pending,  color: "bg-yellow-500", pct: pct(stats.mentors?.pending)  },
                    { label: "Rejected", value: stats.mentors?.rejected, color: "bg-red-500",    pct: pct(stats.mentors?.rejected) },
                  ].map(({ label, value, color, pct: p }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-16">{label}</span>
                      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${p}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right">{value ?? 0}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {}
            <div className="bg-[#0C1323] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock size={15} className="text-yellow-400" /> Pending Applications
                </h2>
                <Link href="/admin/mentors" className="text-xs text-orange-400 hover:text-orange-300 font-semibold">
                  View all →
                </Link>
              </div>
              {stats.recentMentors?.length > 0 ? (
                stats.recentMentors.map((m) => <RecentMentorRow key={m._id} mentor={m} />)
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No pending applications 🎉</p>
              )}
            </div>

            {}
            <div className="bg-[#0C1323] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp size={15} className="text-blue-400" /> Recent Sign-ups
                </h2>
              </div>
              {stats.recentUsers?.length > 0 ? (
                stats.recentUsers.map((u) => <RecentUserRow key={u._id} user={u} />)
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No recent sign-ups</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-24 text-slate-500">Failed to load stats.</div>
      )}
    </div>
  );
}
