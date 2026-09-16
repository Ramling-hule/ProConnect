"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Trophy, Calendar, Users, Globe, Wifi, Cpu, ChevronRight, Loader, Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

const ModeIcon = ({ mode }) => {
  if (mode === 'online') return <Wifi size={13} />;
  if (mode === 'offline') return <Globe size={13} />;
  return <Cpu size={13} />;
};

const statusColor = (status) => {
  if (status === 'ongoing')   return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'published') return 'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400';
  return 'bg-slate-100 text-slate-600';
};

function PublicHackathonsContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;

  const [hackathons, setHackathons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/hackathons?page=${page}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          setHackathons(data.hackathons || []);
          setPagination(data.pagination || { total: 0, pages: 1 });
        } else {
          setHackathons([]);
        }
      } catch (err) {
        console.error('Failed to fetch hackathons:', err);
        setHackathons([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, [page]);

  return (
    <div className="pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy size={24} className="text-orange-500" />
              Discover Hackathons
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Register, form a team, and compete in the latest hackathons across AI, Web3, and more.
            </p>
          </div>
          <Link href="/hackathons/create" className="hidden sm:flex px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 items-center gap-2">
            <Plus size={18} /> Create Hackathon
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-24 text-slate-500">
            <Loader className="animate-spin mr-2" /> Loading hackathons...
          </div>
        ) : hackathons && hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((h) => (
              <Link
                key={h._id || h.id}
                href={`/hackathons/${h.slug}`}
                className="group bg-white dark:bg-[#0C1323] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                {h.banner ? (
                  <img src={h.banner} alt={h.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-orange-500 to-pink-600" />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusColor(h.status)}`}>{h.status}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 capitalize"><ModeIcon mode={h.mode} /> {h.mode}</span>
                  </div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                    {h.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{h.tagline || h.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(h.skills ?? []).slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(h.timeline?.hackathonStart).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {h.registrationCount} registered</span>
                    <span className={`font-bold ${h.isFree ? 'text-green-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {h.isFree ? 'Free' : `₹${h.registrationFee}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500">No hackathons available right now. Check back soon!</div>
        )}
        
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/hackathons?page=${p}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#0C1323] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}>
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicHackathonsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white"><Loader className="animate-spin text-blue-500" size={32} /></div>}>
      <PublicHackathonsContent />
    </Suspense>
  );
}
