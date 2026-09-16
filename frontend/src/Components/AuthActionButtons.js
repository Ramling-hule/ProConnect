"use client";
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { openAuthModal } from '@/redux/features/authSlice';
import { toast } from 'react-hot-toast';
import HackathonRegistrationModal from './HackathonRegistrationModal';
import SessionBookingModal from './SessionBookingModal';

export function RegisterHackathonButton({ hackathonId, slug, soloAllowed }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAction = () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in first to register!"));
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button onClick={handleAction} className="block w-full text-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors mb-4">
        Register Now
      </button>
      
      <HackathonRegistrationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hackathonId={hackathonId}
        soloAllowed={soloAllowed}
      />
    </>
  );
}

export function BookSessionButton({ mentorId, username }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAction = () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to book a session!"));
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button onClick={handleAction} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors text-sm">
        Book a Session
      </button>

      <SessionBookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mentorId={mentorId}
        username={username}
      />
    </>
  );
}
