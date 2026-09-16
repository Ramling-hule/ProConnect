"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, Star, Users, ChevronRight, Loader, Search, Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicMentorsPage() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;

  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minExperience, setMinExperience] = useState('');

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '18'
      });
      if (searchName) queryParams.append('search', searchName);
      if (sessionType) queryParams.append('sessionType', sessionType);
      if (minRating) queryParams.append('minRating', minRating);
      if (minExperience) queryParams.append('minExperience', minExperience);

      const res = await fetch(`${API_URL}/api/public/mentors?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMentors(data.mentors || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      } else {
        setMentors([]);
      }
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchName, sessionType, minRating, minExperience]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return (
    <div className="pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={24} className="text-blue-600 dark:text-blue-400" />
              Expert Mentors
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Connect with industry-approved experts to level up your skills and navigate your career.
            </p>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-[#0C1323] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Session type (e.g. Mock Interview)"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="w-full md:w-32">
            <input
              type="number"
              placeholder="Min rating (0-5)"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              min="0"
              max="5"
              step="0.5"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="w-full md:w-40">
            <input
              type="number"
              placeholder="Min experience (years)"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              min="0"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <button
            onClick={fetchMentors}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Filter size={16} /> Filter
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24 text-slate-500">
            <Loader className="animate-spin mr-2" /> Loading mentors...
          </div>
        ) : mentors && mentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Link
                key={mentor._id || mentor.id}
                href={`/mentors/${mentor.user?.username}`}
                className="group bg-white dark:bg-[#0C1323] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={mentor.user?.profilePicture || '/default-avatar.svg'}
                    alt={mentor.user?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 transition-colors">
                      {mentor.user?.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{mentor.user?.username}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{mentor.role} @ {mentor.company}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">{mentor.about}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(mentor.skills ?? []).slice(0, 3).map(s => (
                    <span key={s} className="text-xs bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {mentor.averageRating?.toFixed(1) ?? '0.0'}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {mentor.totalSessions} sessions</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">View <ChevronRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500">No mentors found.</div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/mentors?page=${p}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#0C1323] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
