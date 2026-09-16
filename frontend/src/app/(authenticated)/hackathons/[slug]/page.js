"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Calendar, Users, Wifi, Globe, Clock, Cpu, Loader, LayoutDashboard } from 'lucide-react';
import { RegisterHackathonButton } from '@/Components/AuthActionButtons';
import HackathonScrollNav from './HackathonScrollNav';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicHackathonDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [h, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchHackathon = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/hackathons/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setHackathon(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch hackathon:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHackathon();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading hackathon details...</span>
      </div>
    );
  }

  if (error || !h) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-2">Hackathon Not Found</h2>
          <p className="text-slate-500 mb-6">The hackathon you're looking for doesn't exist or was removed.</p>
          <Link href="/hackathons" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
            Browse Hackathons
          </Link>
        </div>
      </div>
    );
  }

  const regClose  = h.timeline?.registrationClose ? new Date(h.timeline.registrationClose) : null;
  const hackStart = h.timeline?.hackathonStart    ? new Date(h.timeline.hackathonStart)    : null;
  const hackEnd   = h.timeline?.hackathonEnd      ? new Date(h.timeline.hackathonEnd)      : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="relative w-full h-72 md:h-96 bg-gradient-to-br from-orange-500 to-pink-600 overflow-hidden">
        {h.banner && <img src={h.banner} alt={h.title} className="w-full h-full object-cover opacity-80" />}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8">
          {h.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 mb-3 w-fit">
              <Trophy size={12} /> Featured
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">{h.title}</h1>
          {h.tagline && <p className="text-white/80 mt-2 text-lg">{h.tagline}</p>}
        </div>
      </div>

      <HackathonScrollNav hackathon={h} />

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div id="about" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
              <div 
                className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400"
                dangerouslySetInnerHTML={{ __html: h.description }}
              />
            </div>

            {h.tracks?.length > 0 && (
              <div id="tracks" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 scroll-mt-24">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Tracks</h2>
                <div className="space-y-3">
                  {h.tracks.map((t, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <h3 className="font-semibold text-slate-800 dark:text-white">{t.name}</h3>
                      {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {h.prizes?.length > 0 && (
              <div id="prizes" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 scroll-mt-24">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🏆 Prizes</h2>
                <div className="space-y-2">
                  {h.prizes.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800">
                      <span className="font-bold text-slate-900 dark:text-white">{p.rank} — {p.title}</span>
                      {p.amount > 0 && <span className="font-black text-green-600">₹{p.amount.toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {h.faqs?.length > 0 && (
              <div id="faqs" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 scroll-mt-24">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">FAQs</h2>
                <div className="space-y-4">
                  {h.faqs.map((f, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{f.question}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6 sticky top-24">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <p className="font-black text-2xl text-slate-900 dark:text-white mb-4">
                {h.isFree ? <span className="text-green-600">Free</span> : `₹${h.registrationFee}`}
              </p>
              <RegisterHackathonButton hackathonId={h.id || h._id} slug={slug} soloAllowed={h.soloAllowed} />
              
              <Link href={`/hackathons/${slug}/find-teammates`} className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl font-bold transition-colors">
                <Users size={18} /> Find Teammates
              </Link>

              <Link href={`/hackathons/${slug}/dashboard`} className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-xl font-bold transition-colors">
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              <div className="space-y-2 mt-4 text-sm text-slate-600 dark:text-slate-400">
                {regClose  && <div className="flex items-center gap-2"><Calendar size={14} /> Reg. closes: {regClose.toLocaleDateString()}</div>}
                {hackStart && <div className="flex items-center gap-2"><Clock size={14} /> Starts: {hackStart.toLocaleDateString()}</div>}
                {hackEnd   && <div className="flex items-center gap-2"><Clock size={14} /> Ends: {hackEnd.toLocaleDateString()}</div>}
                <div className="flex items-center gap-2"><Users size={14} /> Team: {h.minTeamSize}–{h.maxTeamSize}</div>
                <div className="flex items-center gap-2"><Users size={14} /> {h.registrationCount} registered</div>
              </div>
            </div>

            {h.skills?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {h.skills.map(s => <span key={s} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
