"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell, Check, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { markAllRead, setNotifications } from "@/redux/features/notificationSlice";
import { API_BASE_URL } from "@/utils/config";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const dispatch = useDispatch();
  const router = useRouter();

  const { items: notifications, unreadCount } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleToggle = async () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
        setLoading(true);
        try {
            const token = user?.token || localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                dispatch(setNotifications(data));
            }
        } catch (err) {
            console.error("Failed to refresh notifications", err);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllRead());
    try {
      const token = user?.token || localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleNotificationClick = (notif) => {
    setIsOpen(false);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className={`p-2 rounded-full transition-colors relative ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 md:w-96 rounded-xl shadow-2xl border overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200 ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          
          <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Notifications
                {loading && <span className="text-xs font-normal ml-2 opacity-50">Refreshing...</span>}
            </h3>
            {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                >
                   <Check size={12} /> Mark all read
                </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 && !loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                   No notifications yet.
                </div>
            ) : (
                notifications.map((notif) => (
                   <div 
                     key={notif._id} 
                     onClick={() => handleNotificationClick(notif)}
                     className={`p-4 flex gap-3 cursor-pointer transition-colors border-b last:border-0 ${
                         !notif.isRead 
                            ? (isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-blue-50/50 border-slate-100') 
                            : (isDark ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100')
                     }`}
                   >
                      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                          {notif.sender?.profilePicture ? (
                              <img src={notif.sender.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                  {notif.sender?.name?.[0] || "?"}
                              </div>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              <span className="font-bold">{notif.sender?.name || "System"}</span> {notif.message}
                          </p>
                          <span className={`text-[10px] mt-1 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                             {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {notif.type === 'INTEREST_RECEIVED' && notif.sender?.username && (
                            <div className="mt-2 flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/profile/${notif.sender.username}`);
                                  setIsOpen(false);
                                }}
                                className="px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-brand-primary/90"
                              >
                                View Profile
                              </button>
                            </div>
                          )}
                      </div>
                      {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-brand-primary mt-2 shrink-0"></div>
                      )}
                   </div>
                ))
            )}
          </div>
          
          <div className={`p-2 text-center border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
             <button onClick={() => router.push('/notifications')} className="text-xs font-bold text-slate-500 hover:text-brand-primary">
                View all history
             </button>
          </div>
        </div>
      )}
    </div>
  );
}