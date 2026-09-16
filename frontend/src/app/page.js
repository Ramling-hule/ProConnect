"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Network, Trophy, Users, GraduationCap, ChevronRight, MessageSquare, Briefcase } from 'lucide-react';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
);
const ProConnectGraphic = ({ isDark }) => (
  <div className="relative animate-float w-full max-w-md mx-auto lg:mx-0">
    <div className={`
      relative p-5 rounded-2xl shadow-2xl transition-all duration-500 border z-10
      ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
    `}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          AS
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Alex Smith</h3>
          <p className="text-xs text-blue-500">Computer Science Student @ MIT</p>
        </div>
      </div>
      <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-4 leading-relaxed`}>
        Just won 1st place at the Global AI Hackathon with my team! Huge thanks to my mentor for the guidance. Ready for the next challenge! 🚀🏆
      </div>
      <div className="flex gap-2 mb-4">
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-medium">#AI</span>
        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md font-medium">#HackathonWinner</span>
      </div>
      <div className={`flex items-center gap-4 text-xs font-medium pt-3 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
        <div className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"><span className="text-lg">👏</span> 248</div>
        <div className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"><MessageSquare size={14} /> 32</div>
      </div>
    </div>
    <div className={`
      absolute -right-6 -bottom-10 p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-pulse-slow z-20 w-64
      ${isDark ? 'bg-slate-900/90 border-slate-700 backdrop-blur-sm' : 'bg-white/90 border-slate-200 backdrop-blur-sm'}
    `}>
      <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
        <Trophy size={20} />
      </div>
      <div>
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Global AI Hackathon</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Registrations open now</p>
      </div>
    </div>
    <div className={`
      absolute -left-8 top-10 p-3 rounded-xl shadow-xl border flex items-center gap-3 animate-pulse-slow z-0
      ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
    `}>
      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
        <Users size={16} />
      </div>
      <div>
        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>New Mentor Match</p>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans overflow-x-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <nav className="flex justify-between items-center py-6 px-6 lg:px-12 max-w-7xl mx-auto relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            <Network size={22} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">ProConnect</span>
        </div>
        <div className={`hidden md:flex gap-8 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <Link href="/hackathons" className="hover:text-blue-600 transition-colors flex items-center gap-1"><Trophy size={16} /> Hackathons</Link>
          <Link href="/mentors" className="hover:text-blue-600 transition-colors flex items-center gap-1"><GraduationCap size={16} /> Mentors</Link>
          {}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2.5 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link href="/login">
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              Sign In
            </button>
          </Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-28 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-20">
        <div className="space-y-8 max-w-xl animate-fade-up">

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isDark ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            The Ultimate Student & Professional Network
          </div>

          <h1 className={`text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Connect. <br />
            Collaborate. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Succeed.</span>
          </h1>

          <p className={`text-lg leading-relaxed max-w-md font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Build your professional portfolio, find expert mentors, form elite hackathon teams, and share your achievements with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-1 shadow-xl shadow-blue-600/30 w-full flex items-center justify-center gap-2">
                Explore Feed <ChevronRight size={18} />
              </button>
            </Link>
            <Link href="/hackathons" className="w-full sm:w-auto">
              <button className={`px-8 py-4 rounded-xl font-bold text-base border flex items-center justify-center gap-2 transition-all w-full ${isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                <Trophy size={18} className={isDark ? "text-orange-400" : "text-orange-500"} /> Discover Hackathons
              </button>
            </Link>
          </div>
          <div className={`pt-10 grid grid-cols-3 gap-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-blue-600">10k+</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Active Users</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-blue-600">500+</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Expert Mentors</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-blue-600">50+</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Hackathons</span>
            </div>
          </div>
        </div>
        <div className="relative flex justify-center lg:justify-end min-h-[500px] items-center mt-10 lg:mt-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>

          <ProConnectGraphic isDark={isDark} />
        </div>

      </main>
    </div>
  );
}
