"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Target, Clock, AlertCircle, Loader } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PodsDashboardPage() {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPods = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_URL}/api/pods`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPods(data.pods || []);
        } else {
          setPods([]);
        }
      } catch (err) {
        console.error('Failed to fetch pods:', err);
        setPods([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPods();
  }, []);

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-purple-600" size={32} />
          Mentor Pods
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Join small, focused groups led by industry experts to master specific skills.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/mentor/pods" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-colors">
            My Mentor Pods
          </Link>
          <Link href="/admin/pods" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Admin Pods
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-slate-500">
          <Loader className="animate-spin mr-2" /> Loading pods...
        </div>
      ) : pods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pods.map((pod) => {
            const isFull = pod.memberCount >= pod.maxSize;
            
            return (
              <Link 
                key={pod._id} 
                href={`/pods/${pod._id}`}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    pod.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {pod.status}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isFull ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {pod.memberCount}/{pod.maxSize} Members
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 transition-colors">
                  {pod.name}
                </h2>
                
                <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                  <Target size={16} className="text-purple-500 mt-0.5 shrink-0" />
                  <span className="font-medium">{pod.goal}</span>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <AlertCircle size={14} /> Level: {pod.requirements?.skillLevel || 'OPEN'}
                  </div>
                  {pod.schedule?.liveSessionDay && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={14} /> {pod.schedule.liveSessionDay}s, {pod.schedule.liveSessionTime} ({pod.schedule.timezone})
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Led by</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pod.mentorId?.name}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    isFull 
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-700' 
                      : 'bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors'
                  }`}>
                    {isFull ? 'Full' : 'View Pod'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 text-slate-500">No pods available right now. Check back soon!</div>
      )}
    </div>
  );
}
