"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { LogOut, User, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/redux/features/authSlice";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const dispatch = useDispatch();
  const router = useRouter();

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

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold overflow-hidden border-2 border-transparent hover:border-brand-primary transition-all focus:outline-none"
      >
        {user?.profilePicture ? (
            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover"/>
        ) : (
            user?.name?.[0] || 'U'
        )}
      </button>
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200 ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          
          <div className={`p-4 border-b flex flex-col ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {user.name}
            </span>
            <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                @{user.username}
            </span>
          </div>

          <div className="py-2">
            <Link 
              href={`/u/${user.username}`}
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <User size={16} />
              View Profile
            </Link>
            
            <button 
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Settings size={16} />
              Settings
            </button>
            
            <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}></div>
            
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 transition-colors ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-red-50'
              }`}
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
