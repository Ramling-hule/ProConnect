"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Users, Briefcase, Globe, Github, Linkedin, ChevronRight, Loader, MessageSquare, Calendar, Clock, Video, X } from 'lucide-react';
import { BookSessionButton } from '@/Components/AuthActionButtons';
import PaymentFlow from '@/Components/PaymentFlow';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicMentorPage() {
  const params = useParams();
  const username = params?.username;

  const [mentor, setMentor] = useState(null);
  const [webinars, setWebinars] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useSelector(state => state.auth);
  
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [registeringId, setRegisteringId] = useState(null);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [registrationDetails, setRegistrationDetails] = useState(null);

  const handleRegisterWebinar = async (webinar) => {
    if (!user) return toast.error("Please login to register");
    setRegisteringId(webinar._id);
    try {
      const res = await fetch(`${API_URL}/api/webinars/${webinar._id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }
      
      if (webinar.price > 0) {
        setRegistrationDetails(data.registration);
        setSelectedWebinar(webinar);
      } else {
        toast.success("Registered successfully!");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegisteringId(null);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to leave a review");
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ mentorId: mentor.id || mentor._id, rating, comment: reviewText })
      });
      if (res.ok) {
        toast.success("Review submitted!");
        setReviewText("");
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to submit review");
      }
    } catch {
      toast.error("Error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    const fetchMentor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/mentors/${username}`);
        if (res.ok) {
          const data = await res.json();
          setMentor(data);
          if (data && (data.id || data._id)) {
            try {
              const webRes = await fetch(`${API_URL}/api/webinars?mentorId=${data.id || data._id}`);
              if (webRes.ok) {
                const webData = await webRes.json();
                setWebinars(webData.webinars || []);
              }
            } catch (err) {
              console.error('Failed to fetch webinars:', err);
            }
            try {
              const reviewRes = await fetch(`${API_URL}/api/review/mentor/${data.id || data._id}`);
              if (reviewRes.ok) {
                const reviewData = await reviewRes.json();
                setReviews(reviewData.reviews || []);
              }
            } catch (err) {
              console.error('Failed to fetch reviews:', err);
            }
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch mentor:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading mentor profile...</span>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-2">Mentor Not Found</h2>
          <p className="text-slate-500 mb-6">The mentor you're looking for doesn't exist.</p>
          <Link href="/mentors" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
            Browse Mentors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pt-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-12 mb-6">
            <img
              src={mentor.user?.profilePicture || '/default-avatar.svg'}
              alt={mentor.user?.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md"
            />
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {mentor.user?.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">@{mentor.user?.username}</p>
            </div>
            <div className="pb-2 w-full md:w-auto">
              <BookSessionButton mentorId={mentor.id || mentor._id} username={username} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{mentor.about}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Briefcase size={18} /> Experience</h3>
                <p className="font-semibold text-slate-800 dark:text-white">{mentor.role}</p>
                <p className="text-slate-500 dark:text-slate-400">{mentor.company} • {mentor.yearsOfExperience} years exp.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Rating</span>
                    <span className="font-bold flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {mentor.averageRating?.toFixed(1) ?? '0.0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Sessions</span>
                    <span className="font-bold flex items-center gap-1"><Users size={14} className="text-blue-500" /> {mentor.totalSessions}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills?.map(s => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {(mentor.linkedin || mentor.github || mentor.portfolio) && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Links</h3>
                  <div className="flex gap-3">
                    {mentor.linkedin && <a href={mentor.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>}
                    {mentor.github && <a href={mentor.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Github size={20} /></a>}
                    {mentor.portfolio && <a href={mentor.portfolio} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors"><Globe size={20} /></a>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {}
          {webinars.length > 0 && (
            <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Video size={20} className="text-blue-500" />
                Upcoming Webinars
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {webinars.map(webinar => (
                  <div key={webinar._id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-md transition flex flex-col">
                    <h4 className="font-bold text-lg mb-2">{webinar.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">{webinar.description}</p>
                    <div className="flex flex-col gap-2 mt-auto mb-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} /> {new Date(webinar.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} /> {webinar.time} ({webinar.duration} mins)
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-brand-primary">{webinar.price > 0 ? `₹${webinar.price}` : 'Free'}</span>
                      <button 
                        onClick={() => handleRegisterWebinar(webinar)}
                        disabled={registeringId === webinar._id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
                      >
                        {registeringId === webinar._id ? 'Processing...' : 'Register'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {reviews.length > 0 && (
            <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Star size={20} className="text-yellow-500 fill-yellow-500" />
                What Mentees Say
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.slice(0, 4).map((review, idx) => (
                  <div 
                    key={review._id} 
                    className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={review.user?.profilePicture || '/default-avatar.svg'} 
                        alt={review.user?.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform" 
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{review.isAnonymous ? "Anonymous User" : review.user?.name}</h4>
                        <div className="flex gap-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200 dark:text-slate-600"} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic flex-1">
                      "{review.reviewText}"
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-4 block">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" />
              Leave a Review
            </h3>
            {user ? (
              <form onSubmit={submitReview} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-2xl">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                        <Star size={24} className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-600"} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  required
                  rows="3"
                  placeholder="Share your experience with this mentor..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                ></textarea>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <p className="text-slate-500">Please <Link href="/login" className="text-blue-500 hover:underline">login</Link> to leave a review.</p>
            )}
          </div>

        </div>
      </div>

      {}
      {selectedWebinar && registrationDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold">Complete Payment for Webinar</h2>
              <button 
                onClick={() => { setSelectedWebinar(null); setRegistrationDetails(null); }} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <PaymentFlow 
                type="webinar"
                entityId={registrationDetails._id}
                amount={selectedWebinar.price}
                onSuccess={() => {
                  setSelectedWebinar(null);
                  setRegistrationDetails(null);
                }}
                onCancel={() => {
                  setSelectedWebinar(null);
                  setRegistrationDetails(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
