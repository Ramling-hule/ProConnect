"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, X, Search, MoreVertical, Loader } from "lucide-react";
import UserProfileModal from "@/Components/UserProfileModal";
import { openChat } from "@/redux/features/chatSlice";
import { openAuthModal } from "@/redux/features/authSlice";
import { API_BASE_URL } from "@/utils/config";

export default function ConnectionsView() {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);

  const [invites, setInvites] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  const dispatch = useDispatch();
  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const token = user?.token || localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/dashboard/network`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setInvites(Array.isArray(data.invitations) ? data.invitations : []);
          setConnections(
            Array.isArray(data.connections) ? data.connections : []
          );
        }
      } catch (err) {
        console.error("Network fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem("token") : null);
    if (user || token) {
      fetchNetwork();
    } else {
      setLoading(false);
    }
  }, [user]);
  const handleResponse = async (connectionId, action) => {
    setInvites((prev) => prev.filter((i) => i._id !== connectionId));

    if (action === "accept") {
      const inviteData = invites.find((i) => i._id === connectionId);
      if (inviteData && inviteData.user) {
        setConnections((prev) => [inviteData.user, ...prev]);
      }
    }

    try {
      const token = user?.token || localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/dashboard/network/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ connectionId, action }),
      });
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader className="animate-spin inline text-brand-primary" /> Loading
        network...
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-up pb-10">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`font-bold text-lg ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            Invitations{" "}
            <span className="text-brand-primary text-sm ml-2">
              ({invites.length})
            </span>
          </h3>
        </div>

        {invites.length === 0 ? (
          <div
            className={`p-8 text-center rounded-xl border border-dashed ${
              isDark
                ? "border-slate-800 text-slate-500"
                : "border-slate-200 text-slate-400"
            }`}
          >
            {!user ? "Sign in to see your pending invitations." : "No pending invitations."}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
            {invites.map((invite) => (
              <div
                key={invite._id}
                className={`snap-start min-w-[280px] w-[280px] p-4 rounded-xl border shadow-sm flex flex-col items-center text-center ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-100"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-primary to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-3">
                  {invite.user?.name?.[0] || "?"}
                </div>

                <h4
                  className={`font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {invite.user?.name || "Unknown"}
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  {invite.user?.institute || "Institute"}
                </p>

                <div className="flex gap-2 w-full mt-auto">
                  <button
                    onClick={() => handleResponse(invite._id, "accept")}
                    className="flex-1 flex items-center justify-center gap-1 bg-brand-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleResponse(invite._id, "reject")}
                    className={`flex-1 flex items-center justify-center gap-1 border py-2 rounded-lg text-xs font-bold hover:opacity-80 ${
                      isDark
                        ? "border-slate-600 text-slate-300"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <X size={14} /> Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`font-bold text-lg ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            My Connections{" "}
            <span className="text-xs opacity-50">({connections.length})</span>
          </h3>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-xs outline-none w-24 md:w-40"
            />
          </div>
        </div>

        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-100"
          }`}
        >
          {connections.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              {!user ? "Sign in to view and manage your professional connections." : "You haven't connected with anyone yet."}
              {!user && (
                <div className="mt-6">
                  <button onClick={() => dispatch(openAuthModal("Please sign in to manage your network."))} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md inline-block">Sign In</button>
                </div>
              )}
            </div>
          ) : (
            connections.map((conn, index) => (
              <div
                key={conn._id}
                onClick={() => {
                  setSelectedUser(conn)
                  setSelectedConnection(conn);
                }}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors group
                   ${index !== connections.length - 1 ? "border-b" : ""} 
                   ${
                     isDark
                       ? "border-slate-800 hover:bg-slate-800"
                       : "border-slate-50 hover:bg-slate-50"
                   }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                    {conn.name?.[0] || "U"}
                  </div>
                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {conn.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {conn.headline || conn.institute}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(openChat(conn));
                  }}
                  className="flex items-center gap-1 bg-brand-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Message
                </button>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <UserProfileModal
        conn={selectedConnection}
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
