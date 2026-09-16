"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  User,
  Building,
  Briefcase,
  Star,
  ChevronDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

const STATUS_TABS = [
  { key: "pending", label: "Pending", icon: Clock, color: "text-yellow-500" },
  { key: "approved", label: "Approved", icon: CheckCircle, color: "text-green-500" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-500" },
  { key: "all", label: "All", icon: GraduationCap, color: "text-blue-500" },
];

const STATUS_BADGE = {
  pending:  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  approved: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
  suspended:"bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
};

export default function AdminMentorsPage() {
  const { user, token } = useSelector((state) => state.auth);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("pending");
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/mentors?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMentors(data.mentors || []);
      } else {
        toast.error("Failed to load mentors");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "ADMIN")) {
      fetchMentors();
    }
  }, [fetchMentors, user]);

  const handleAction = async (mentorId, action) => {
    setActionLoading((prev) => ({ ...prev, [mentorId]: action }));
    try {
      const res = await fetch(`${API_URL}/api/admin/mentors/${mentorId}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setMentors((prev) => prev.filter((m) => m._id !== mentorId));
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [mentorId]: null }));
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "ADMIN")) return null;

  const counts = { pending: 0, approved: 0, rejected: 0, all: mentors.length };

  return (
    <div className="pb-12">
      <div className="max-w-5xl mx-auto">
        {}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={26} className="text-blue-600 dark:text-blue-400" />
            Mentor Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and manage mentor applications. Approve qualified candidates to make them visible to users.
          </p>
        </div>

        {}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-fit">
          {STATUS_TABS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon size={14} className={activeTab === key ? color : ""} />
              {label}
            </button>
          ))}
        </div>

        {}
        {loading ? (
          <div className="flex justify-center items-center py-24 text-slate-500 gap-2">
            <Loader className="animate-spin" size={20} /> Loading applications...
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <GraduationCap size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No {activeTab === "all" ? "" : activeTab} mentor applications found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mentors.map((mentor) => {
              const isExpanded = expandedId === mentor._id;
              const isActing = actionLoading[mentor._id];

              return (
                <div
                  key={mentor._id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all"
                >
                  {}
                  <div className="p-5 flex items-center gap-4">
                    <img
                      src={mentor.user?.profilePicture || "/default-avatar.svg"}
                      alt={mentor.user?.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {mentor.user?.name}
                        </h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[mentor.status]}`}>
                          {mentor.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User size={11} /> @{mentor.user?.username}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building size={11} /> {mentor.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={11} /> {mentor.role}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={11} /> {mentor.yearsOfExperience}y exp
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {mentor.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(mentor._id, "approve")}
                            disabled={!!isActing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            {isActing === "approve" ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(mentor._id, "reject")}
                            disabled={!!isActing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            {isActing === "reject" ? <Loader size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </>
                      )}
                      {mentor.status === "approved" && (
                        <button
                          onClick={() => handleAction(mentor._id, "reject")}
                          disabled={!!isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-60 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg transition-colors"
                        >
                          {isActing === "reject" ? <Loader size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Revoke
                        </button>
                      )}
                      {mentor.status === "rejected" && (
                        <button
                          onClick={() => handleAction(mentor._id, "approve")}
                          disabled={!!isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-60 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg transition-colors"
                        >
                          {isActing === "approve" ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Re-approve
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : mentor._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <ChevronDown
                          size={18}
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Headline
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{mentor.headline}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          About
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{mentor.about}</p>
                      </div>
                      {mentor.skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.skills.map((s) => (
                              <span
                                key={s}
                                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {[
                          { label: "Email", value: mentor.user?.email },
                          { label: "Experience", value: `${mentor.yearsOfExperience} years` },
                          { label: "Sessions", value: mentor.totalSessions },
                          { label: "Rating", value: mentor.averageRating?.toFixed(1) ?? "0.0" },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                      {(mentor.linkedin || mentor.github || mentor.portfolio) && (
                        <div className="flex gap-3 pt-1">
                          {mentor.linkedin && (
                            <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">LinkedIn</a>
                          )}
                          {mentor.github && (
                            <a href={mentor.github} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">GitHub</a>
                          )}
                          {mentor.portfolio && (
                            <a href={mentor.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Portfolio</a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
