"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Users, Loader, Search, ShieldCheck, GraduationCap, User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

const ROLE_BADGE = {
  admin:  "bg-red-500/20 text-red-300 border border-red-500/30",
  mentor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  user:   "bg-slate-700 text-slate-300 border border-slate-600",
};

const ROLE_ICON = { admin: ShieldCheck, mentor: GraduationCap, user: User };

export default function AdminUsersPage() {
  const { token } = useSelector((s) => s.auth);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.recentUsers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users size={22} className="text-blue-400" /> Users
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Showing the most recent sign-ups. Full user management coming soon.</p>
        </div>
      </div>

      {}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or username…"
          className="w-full pl-10 pr-4 py-2.5 bg-[#0C1323] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {}
      {loading ? (
        <div className="flex justify-center py-24 text-slate-500 gap-2">
          <Loader className="animate-spin" size={18} /> Loading users…
        </div>
      ) : (
        <div className="bg-[#0C1323] border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 px-5 py-3 hidden md:table-cell">Username</th>
                <th className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 px-5 py-3">Role</th>
                <th className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 px-5 py-3 hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500">No users found.</td>
                </tr>
              ) : filtered.map((u) => {
                const role = u.role?.toLowerCase() || "user";
                const RoleIcon = ROLE_ICON[role] || User;
                return (
                  <tr key={u._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.name?.[0] || "?"}
                        </div>
                        <span className="font-semibold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 hidden md:table-cell">@{u.username}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${ROLE_BADGE[role] || ROLE_BADGE.user}`}>
                        <RoleIcon size={11} /> {role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
