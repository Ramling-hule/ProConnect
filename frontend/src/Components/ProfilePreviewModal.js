import React from "react";
import { X, ExternalLink, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

export default function ProfilePreviewModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X size={24} />
          </button>
          
          <div className="flex gap-4 items-start">
            <img src={user.profilePicture || "/default-avatar.svg"} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-sm" />
            <div className="mt-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
              <p className="text-sm font-semibold text-brand-primary">@{user.username}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{user.headline || "Student"}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {user.skills?.map((s, i) => (
                <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md">
                  {s}
                </span>
              ))}
            </div>

            {user.codingProfiles && Object.keys(user.codingProfiles).some(k => user.codingProfiles[k]) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Coding Profiles</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(user.codingProfiles).map(([platform, link]) => {
                    if (!link) return null;
                    return (
                      <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline capitalize">
                        {platform} ↗
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-slate-800">
              <Link href={`/profile/${user.username}`} className="text-sm font-bold text-brand-primary hover:underline flex items-center gap-1">
                View Full Profile <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
