"use client";
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { openAuthModal } from '@/redux/features/authSlice';
import { API_BASE_URL } from '@/utils/config';

export default function JoinPodButton({ podId, isFull, status }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      dispatch(openAuthModal('Please sign in to join a pod.'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pods/${podId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join pod');
      
      toast.success(data.message || 'Joined pod successfully!');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'FORMING' && status !== 'ACTIVE') {
    return (
      <button disabled className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl cursor-not-allowed">
        Pod Closed
      </button>
    );
  }

  if (isFull) {
    return (
      <button disabled className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-500 font-bold rounded-xl cursor-not-allowed">
        Pod is Full
      </button>
    );
  }

  return (
    <button 
      onClick={handleJoin}
      disabled={loading}
      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {loading ? <Loader size={18} className="animate-spin" /> : 'Join this Pod'}
    </button>
  );
}
