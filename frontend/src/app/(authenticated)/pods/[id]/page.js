"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Target, Clock, AlertCircle, Users, ArrowLeft, Loader, MessageSquare, CheckSquare, Calendar } from 'lucide-react';
import JoinPodButton from './JoinPodButton';
import { toast } from 'react-hot-toast';
import PodChat from '@/Components/Pods/PodChat';
import PodTasks from '@/Components/Pods/PodTasks';
import PodMeetings from '@/Components/Pods/PodMeetings';
import { useSelector } from 'react-redux';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PodDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!id) return;
    const fetchPod = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_URL}/api/pods/${id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch pod:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPod();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-500">
        <Loader className="animate-spin text-purple-600 mr-2" size={32} />
        <span className="text-lg">Loading pod details...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pod Not Found</h1>
        <Link href="/pods" className="text-purple-600 mt-4 inline-block hover:underline">Return to Pods</Link>
      </div>
    );
  }

  const { pod, members, memberCount } = data;
  const isFull = memberCount >= pod.maxSize;
  const isMentor = user?._id === pod.mentorId?._id;
  const isMember = members.some(m => m.userId?._id === user?._id) || isMentor;

  const handleMentorAction = async (action) => {
    try {
      const res = await fetch(`${API_URL}/api/pods/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`Pod ${action.split('/')[0]} successful`);
        window.location.reload();
      } else toast.error(json.message || `Failed to ${action}`);
    } catch { toast.error(`Error performing action: ${action}`); }
  };

  return (
    <div className="pb-10 max-w-5xl mx-auto">
      <Link href="/pods" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Pods
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                pod.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {pod.status}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {memberCount}/{pod.maxSize} Members
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              {pod.name}
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-2xl">
              {pod.description || "Join this pod to collaborate, learn, and hit milestones together."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-8">
              <div className="flex items-start gap-3">
                <Target className="text-purple-500 mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Primary Goal</p>
                  <p className="text-slate-500">{pod.goal}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="text-purple-500 mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Live Sessions</p>
                  <p className="text-slate-500">
                    {pod.schedule?.liveSessionDay ? `${pod.schedule.liveSessionDay}s, ${pod.schedule.liveSessionTime} (${pod.schedule.timezone})` : 'TBD by Mentor'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="text-purple-500 mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Required Skill Level</p>
                  <p className="text-slate-500">{pod.requirements?.skillLevel || 'OPEN'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-72 shrink-0">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-center">Ready to commit?</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {!isMember && (
                  <JoinPodButton podId={pod._id} isFull={isFull} />
                )}
              </div>
            </div>
          </div>
        </div>

        {isMentor && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 relative z-10 flex flex-wrap gap-3">
            <h3 className="w-full font-bold text-slate-900 dark:text-white mb-2">Mentor Actions</h3>
            {pod.status !== 'ACTIVE' && pod.status !== 'COMPLETED' && (
              <button onClick={() => handleMentorAction('start')} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 font-bold rounded-xl text-sm transition-colors">Start Pod</button>
            )}
            {pod.status === 'ACTIVE' && (
              <button onClick={() => handleMentorAction('complete')} className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold rounded-xl text-sm transition-colors">Complete Pod</button>
            )}
            <button onClick={() => handleMentorAction('ai/suggest-members')} className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
              <Users size={16} /> AI Suggest Members
            </button>
          </div>
        )}
      </div>

      {isMember && (
        <div className="flex border-b border-slate-700 mb-6 space-x-4">
          <button 
            className={`pb-2 px-1 font-semibold ${activeTab === 'overview' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-2 px-1 font-semibold ${activeTab === 'tasks' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`pb-2 px-1 font-semibold ${activeTab === 'meetings' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('meetings')}
          >
            Meetings
          </button>
          <button 
            className={`pb-2 px-1 font-semibold ${activeTab === 'chat' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Current Roster
              </h2>
              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <img 
                        src={m.userId?.profilePicture || '/default-avatar.svg'} 
                        alt={m.userId?.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{m.userId?.name}</p>
                        <p className="text-xs text-slate-500">{m.userId?.headline || 'Member'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Be the first to join this pod!
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Led By</h2>
              <Link href={`/mentors/${pod.mentorId?.username}`} className="block group">
                <div className="flex items-center gap-4 mb-3">
                  <img 
                    src={pod.mentorId?.profilePicture || '/default-avatar.svg'} 
                    alt={pod.mentorId?.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-100"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                      {pod.mentorId?.name}
                    </p>
                    <p className="text-xs text-slate-500">{pod.mentorId?.headline}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {pod.mentorId?.about}
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'tasks' && isMember && (
        <PodTasks podId={pod._id} isMentor={isMentor} />
      )}
      
      {activeTab === 'meetings' && isMember && (
        <PodMeetings podId={pod._id} isMentor={isMentor} />
      )}
      
      {activeTab === 'chat' && isMember && (
        <PodChat podId={pod._id} />
      )}
    </div>
  );
}
