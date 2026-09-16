"use client";
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal } from '@/redux/features/authSlice';
import { Search, Users, Trophy, Loader, X } from 'lucide-react';
import apiClient from '@/services/apiClient';
import toast from 'react-hot-toast';
import Link from 'next/link';

const getLevenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export default function FindTeammatesPage() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const [showMyPosts, setShowMyPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [interestModal, setInterestModal] = useState({ isOpen: false, request: null, message: "" });
  const [submitting, setSubmitting] = useState(false);

  const filters = ["All", "Frontend", "Backend", "Design", "Mobile", "AI/ML", "Web3"];

  useEffect(() => {
    fetchOpenings();
  }, []);

  const fetchOpenings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/hackathons/teammate-requests/all');
      setOpenings(res.data.requests);
    } catch (err) {
      toast.error("Failed to fetch teammate requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestClick = (request) => {
    if (!user) {
      dispatch(openAuthModal(`Please sign in first to join ${request.team?.name || 'this team'}`));
    } else {
      setInterestModal({ isOpen: true, request, message: "" });
    }
  };

  const submitInterest = async () => {
    if (!interestModal.request) return;
    try {
      setSubmitting(true);
      await apiClient.post(`/api/hackathons/teammate-requests/${interestModal.request._id}/interest`, {
        message: interestModal.message
      });
      toast.success(`Interest sent to ${interestModal.request.team?.name || 'the team'}!`);
      setInterestModal({ isOpen: false, request: null, message: "" });
      fetchOpenings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to express interest");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOpenings = openings.filter(opening => {
    if (showMyPosts && opening.creator?._id !== user?._id) return false;
    if (activeFilter !== "All") {
      const filterKeyword = activeFilter.toLowerCase();
      
      const allTags = [
        ...(opening.requiredSkills || []),
        ...(opening.requiredTechnologies || []),
        ...(opening.team?.techStack || []),
        ...(opening.team?.rolesNeeded || [])
      ].map(t => t.toLowerCase());

      const matchesFilter = 
        allTags.some(tag => tag.includes(filterKeyword)) ||
        (filterKeyword === 'design' && allTags.some(t => t.includes('ui/ux')));

      if (!matchesFilter) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const hackathonTitle = (opening.hackathon?.title || "").toLowerCase();
      const teamName = (opening.team?.name || "").toLowerCase();
      const creatorName = (opening.creator?.name || "").toLowerCase();
      const description = (opening.description || "").toLowerCase();
      const skillsText = (opening.requiredSkills || []).join(" ").toLowerCase();
      
      const matchesSearch = 
        hackathonTitle.includes(query) ||
        teamName.includes(query) ||
        creatorName.includes(query) ||
        description.includes(query) ||
        skillsText.includes(query);

      if (!matchesSearch) return false;
    }

    return true;
  });

  const suggestions = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];

    const queryLower = searchQuery.toLowerCase().trim();
    const dictionary = new Set();
    
    openings.forEach(op => {
      if (op.hackathon?.title) dictionary.add(op.hackathon.title);
      if (op.team?.name) dictionary.add(op.team.name);
      if (op.creator?.name) dictionary.add(op.creator.name);
      (op.requiredSkills || []).forEach(s => dictionary.add(s));
      (op.requiredTechnologies || []).forEach(s => dictionary.add(s));
    });

    const words = Array.from(dictionary);
    
    const substringMatches = words.filter(w => w.toLowerCase().includes(queryLower));
    
    if (substringMatches.length > 0) {
      return substringMatches.slice(0, 5).map(w => ({ word: w, type: 'match' }));
    }

    const fuzzyMatches = words.map(w => {
      return { word: w, dist: getLevenshteinDistance(queryLower, w.toLowerCase()) };
    }).filter(m => {
      const threshold = queryLower.length <= 4 ? 1 : 2;
      return m.dist <= threshold && m.dist > 0;
    })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map(m => ({ word: m.word, type: 'didYouMean' }));

    return fuzzyMatches;
  }, [searchQuery, openings]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Teammates</h1>
          <p className="text-slate-500 dark:text-slate-400">Discover teams looking for members for upcoming hackathons.</p>
        </div>
        
        {user && (
          <button
            onClick={() => setShowMyPosts(!showMyPosts)}
            className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all border shrink-0 ${
              showMyPosts 
                ? 'bg-brand-primary text-white border-brand-primary' 
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {showMyPosts ? 'Show All Posts' : 'My Posts'}
          </button>
        )}
      </div>

      <div className="relative max-w-3xl mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-2xl flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-primary/50 transition-all">
          <div className="pl-3 text-slate-400"><Search size={20} /></div>
          <input 
            type="text" 
            placeholder="Search by hackathon, role, or team name..." 
            className="bg-transparent border-none outline-none flex-1 py-2 px-1 text-sm text-slate-700 dark:text-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 overflow-hidden">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                onClick={() => {
                  setSearchQuery(suggestion.word);
                  setShowSuggestions(false);
                }}
              >
                <Search size={14} className="text-slate-400" />
                {suggestion.type === 'didYouMean' ? (
                  <span className="text-sm text-slate-600 dark:text-slate-300">Did you mean: <strong className="text-brand-primary">{suggestion.word}</strong>?</span>
                ) : (
                  <span className="text-sm font-medium">{suggestion.word}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === filter
                ? 'bg-brand-primary text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-brand-primary" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpenings.length > 0 ? filteredOpenings.map(opening => (
            <div key={opening._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link href={`/hackathons/${opening.hackathon?.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-md mb-3 hover:bg-brand-primary/20 transition-colors">
                    <Trophy size={14} /> {opening.hackathon?.title || 'Unknown Hackathon'}
                  </Link>
                  <h3 className="text-xl font-bold mb-1">{opening.team?.name || 'Unnamed Team'}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <span>Led by <Link href={`/u/${opening.creator?.username || opening.creator?._id}`} className="font-semibold hover:text-brand-primary hover:underline transition-colors">{opening.creator?.name || 'Unknown'}</Link></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {opening.team?.membersCount || 0}/{opening.team?.maxMembers || 0} Members</span>
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Looking For</h4>
                <div className="flex flex-wrap gap-2">
                  {(opening.requiredSkills || []).concat(opening.requiredTechnologies || []).map((role, idx) => (
                    <span key={idx} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold px-2.5 py-1 rounded-md">
                      {role}
                    </span>
                  ))}
                  {(opening.requiredSkills?.length === 0 && opening.requiredTechnologies?.length === 0) && (
                    <span className="text-sm text-slate-500 italic">Any skill level</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-1 line-clamp-3">
                {opening.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {opening.seatsAvailable} {opening.seatsAvailable === 1 ? 'seat' : 'seats'} available
                  </span>
                </div>
                {opening.creator?._id === user?._id ? (
                  <a
                    href={`/teams/${opening.team?._id}`}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    Manage Team
                  </a>
                ) : (
                  <button
                    onClick={() => handleInterestClick(opening)}
                    className="bg-brand-primary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    I'm Interested
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold mb-2">No openings found</h3>
              <p className="text-slate-500">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      )}

      {/* Interest Modal */}
      {interestModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-800">
              <h3 className="font-bold text-lg">Join {interestModal.request?.team?.name}</h3>
              <button onClick={() => setInterestModal({ isOpen: false, request: null, message: "" })} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You are about to express interest in joining this team for <strong>{interestModal.request?.hackathon?.title}</strong>. 
                Write a short message to the captain explaining why you'd be a great fit.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Message (Optional)</label>
                <textarea
                  className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  rows={4}
                  placeholder="E.g. Hi! I'm a React developer with 2 years of experience..."
                  value={interestModal.message}
                  onChange={(e) => setInterestModal({ ...interestModal, message: e.target.value })}
                />
              </div>
            </div>
            <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
              <button 
                onClick={() => setInterestModal({ isOpen: false, request: null, message: "" })}
                className="px-4 py-2 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={submitInterest}
                disabled={submitting}
                className="px-5 py-2 font-bold text-sm bg-brand-primary text-white rounded-xl hover:bg-blue-600 transition flex items-center gap-2"
              >
                {submitting && <Loader size={16} className="animate-spin" />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
