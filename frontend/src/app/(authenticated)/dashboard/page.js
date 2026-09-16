"use client";
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import CreatePostModal from '@/Components/CreatePostModal';
import Feed from '@/Components/Feed';
import { Image as ImageIcon, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState(null);
  
  return (
    <div className="pb-10">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold tracking-tight capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Your Feed
            </h2>
        </div>
        {user && (
          <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${isDark ? 'bg-[#0C1323] border-white/[0.06]' : 'bg-white border-slate-100'}`}>
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                {user?.name?.[0] || "U"}
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className={`flex-1 text-left px-5 py-3 rounded-full text-sm font-medium transition-all truncate ${isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-white/[0.05]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 hover:border-brand-primary/30'}`}
              >
                Start a post...
              </button>
            </div>
            <div className="flex gap-4 pl-0 sm:pl-14 justify-between sm:justify-start">
                <button onClick={() => setShowModal(true)} className={`flex items-center gap-2 text-xs font-bold transition-colors px-2 py-1 rounded ${isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <ImageIcon size={18} className="text-blue-500" /> 
                    <span>Media</span>
                </button>
                <button className={`flex items-center gap-2 text-xs font-bold transition-colors px-2 py-1 rounded ${isDark ? 'text-orange-400 hover:bg-orange-500/10' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <Calendar size={18} className="text-orange-500" /> 
                    <span>Event</span>
                </button>
            </div>
          </div>
        )}
        <Feed newPostTrigger={newPost} />

      </div>
      <CreatePostModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onPostCreated={(post) => setNewPost(post)} 
      />

    </div>
  );
}
