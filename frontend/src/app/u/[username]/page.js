"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h1>
        <Link href="/discover" className="text-blue-600 mt-4 inline-block hover:underline">Return to Discover</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mt-16">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            <img 
              src={profile.profilePicture || '/default-avatar.svg'} 
              alt={profile.name}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover bg-gray-100"
            />
            <Link 
              href={`/login?callbackUrl=/u/${username}`}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
            >
              Connect
            </Link>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">@{profile.username}</p>
            <p className="text-lg text-gray-800 dark:text-gray-200 mt-2">{profile.headline}</p>
            {profile.instituteName && (
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                🎓 {profile.instituteName}
              </p>
            )}
          </div>
        {profile.availability && profile.availability !== "Not Looking" && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="font-bold text-green-800 dark:text-green-300">Availability</h3>
            <p className="text-green-700 dark:text-green-400 mt-1">{profile.availability}</p>
          </div>
        )}

        {profile.codingProfiles && Object.keys(profile.codingProfiles).some(k => profile.codingProfiles[k]) && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Coding Profiles</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(profile.codingProfiles).map(([platform, link]) => {
                if (!link) return null;
                return (
                  <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 capitalize text-sm font-semibold">
                    {platform}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {profile.portfolio && (
          <div className="mt-6">
            <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-bold">
              View Portfolio Website ↗
            </a>
          </div>
        )}
      </div>
      </div>

      {profile.about && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.about}</p>
        </div>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Join ProConnect to see the full profile</h3>
        <p className="text-blue-700 dark:text-blue-300 mt-2 mb-4">
          Connect with {profile.name}, send messages, and view more details.
        </p>
        <Link 
          href="/login"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
