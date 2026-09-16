"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader, Users, Check, X, Shield, MessageCircle, UserMinus, Edit } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";
import Link from "next/link";
import ProfilePreviewModal from "@/Components/ProfilePreviewModal";

export default function TeamDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [teammateRequest, setTeammateRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [removeModal, setRemoveModal] = useState({ isOpen: false, memberId: null, memberName: "", reason: "" });
  const [removing, setRemoving] = useState(false);
  const [editPostModal, setEditPostModal] = useState(false);
  const [editPostData, setEditPostData] = useState({ description: "", requiredSkills: "", requiredTechnologies: "", seatsAvailable: 1, status: "active" });
  const [savingPost, setSavingPost] = useState(false);

  useEffect(() => {
    fetchTeamAndRequests();
  }, [id]);

  const fetchTeamAndRequests = async () => {
    setLoading(true);
    try {
      const [teamRes, reqRes, postRes] = await Promise.all([
        apiClient.get(`/api/teams/${id}`),
        apiClient.get("/api/teams/leader/requests"),
        apiClient.get(`/api/teams/${id}/teammate-request`).catch(() => ({ data: { request: null } }))
      ]);
      setTeam(teamRes.data.team);
      setRequests(reqRes.data.requests.filter(r => r.team === id || r.team?._id === id));
      
      const tr = postRes.data.request;
      setTeammateRequest(tr);
      if (tr) {
        setEditPostData({
          description: tr.description || "",
          requiredSkills: (tr.requiredSkills || []).join(", "),
          requiredTechnologies: (tr.requiredTechnologies || []).join(", "),
          seatsAvailable: tr.seatsAvailable || 1,
          status: tr.status || "active"
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await apiClient.post(`/api/teams/${id}/requests/${requestId}/accept`);
      toast.success("Request accepted! User added to team.");
      fetchTeamAndRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await apiClient.post(`/api/teams/${id}/requests/${requestId}/reject`);
      toast.success("Request rejected.");
      fetchTeamAndRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleRemoveMember = async () => {
    if (!removeModal.reason.trim()) {
      toast.error("Please provide a reason for removal.");
      return;
    }
    setRemoving(true);
    try {
      await apiClient.post(`/api/teams/${id}/remove-member`, {
        memberId: removeModal.memberId,
        reason: removeModal.reason
      });
      toast.success("Member removed successfully.");
      setRemoveModal({ isOpen: false, memberId: null, memberName: "", reason: "" });
      fetchTeamAndRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  };

  const handleSavePost = async () => {
    setSavingPost(true);
    try {
      const payload = {
        description: editPostData.description,
        requiredSkills: editPostData.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
        requiredTechnologies: editPostData.requiredTechnologies.split(",").map(s => s.trim()).filter(Boolean),
        seatsAvailable: parseInt(editPostData.seatsAvailable, 10),
        status: editPostData.status
      };
      
      await apiClient.patch(`/api/teams/${id}/teammate-request`, payload);
      toast.success("Post updated successfully!");
      setEditPostModal(false);
      fetchTeamAndRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update post");
    } finally {
      setSavingPost(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader className="animate-spin text-brand-primary" size={40} /></div>;
  }

  const isCaptain = team?.captain?._id === user?._id;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Dashboard: {team?.name}</h1>
          <p className="text-slate-500">Manage your team members and requests for {team?.hackathon?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <Users size={20} /> Team Members ({team?.members?.length || 0}/{team?.maxMembers || 0})
          </h2>
          
          <div className="space-y-4">
            {team?.members?.map(member => (
              <div key={member.user._id} className="flex justify-between items-center p-4 border dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedUser(member.user)}>
                    <img src={member.user.profilePicture || "/default-avatar.svg"} alt={member.user.name} className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-brand-primary" />
                  </button>
                  <div>
                    <button onClick={() => setSelectedUser(member.user)} className="font-bold hover:underline dark:text-white cursor-pointer flex items-center gap-2">
                      {member.user.name}
                      {member.user._id === team.captain._id && <Shield size={14} className="text-amber-500" />}
                    </button>
                    <p className="text-xs text-slate-500">{member.user.headline || "Student"}</p>
                  </div>
                </div>
                {isCaptain && member.user._id !== team.captain._id && (
                  <button 
                    onClick={() => setRemoveModal({ isOpen: true, memberId: member.user._id, memberName: member.user.name, reason: "" })}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Remove Teammate"
                  >
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {}
        {isCaptain && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
            <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <MessageCircle size={20} /> Pending Requests ({requests.length})
            </h2>
            
            {requests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No pending requests right now.</p>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req._id} className="flex justify-between items-center p-4 border dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedUser(req.user)}>
                        <img src={req.user.profilePicture || "/default-avatar.svg"} alt={req.user.name} className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-brand-primary" />
                      </button>
                      <div>
                        <button onClick={() => setSelectedUser(req.user)} className="font-bold hover:underline dark:text-white cursor-pointer">{req.user.name}</button>
                        <p className="text-xs text-slate-500">{req.user.headline || "Student"}</p>
                        {req.message && <p className="text-sm mt-1 text-slate-700 dark:text-slate-300 italic">&quot;{req.message}&quot;</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(req._id)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg" title="Accept">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleReject(req._id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg" title="Reject">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {}
        {isCaptain && teammateRequest && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                Find Teammates Post
              </h2>
              <button 
                onClick={() => setEditPostModal(true)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                <Edit size={16} /> Edit Post
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase">Status</span>
                <span className={`inline-block px-2 py-1 rounded text-sm font-bold mt-1 ${teammateRequest.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {teammateRequest.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase">Seats Available</span>
                <p className="font-semibold">{teammateRequest.seatsAvailable}</p>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs font-bold text-slate-500 uppercase">Required Skills</span>
                <p className="font-semibold">{teammateRequest.requiredSkills?.join(', ') || 'None'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs font-bold text-slate-500 uppercase">Description</span>
                <p className="text-sm mt-1">{teammateRequest.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      {removeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-800">
              <h3 className="font-bold text-lg text-red-600">Remove {removeModal.memberName}</h3>
              <button onClick={() => setRemoveModal({ isOpen: false, memberId: null, memberName: "", reason: "" })} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You are about to remove this member from your team. Please provide a formal reason for their removal. They will receive a notification with this reasoning.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason for removal <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  rows={3}
                  placeholder="E.g. Inactivity, did not contribute to codebase..."
                  value={removeModal.reason}
                  onChange={(e) => setRemoveModal({ ...removeModal, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
              <button 
                onClick={() => setRemoveModal({ isOpen: false, memberId: null, memberName: "", reason: "" })}
                className="px-4 py-2 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleRemoveMember}
                disabled={removing}
                className="px-5 py-2 font-bold text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
              >
                {removing && <Loader size={16} className="animate-spin" />}
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {editPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-800">
              <h3 className="font-bold text-lg">Edit Team Post</h3>
              <button onClick={() => setEditPostModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <select 
                  className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={editPostData.status}
                  onChange={(e) => setEditPostData({ ...editPostData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Seats Available</label>
                <input 
                  type="number"
                  min="0"
                  className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={editPostData.seatsAvailable}
                  onChange={(e) => setEditPostData({ ...editPostData, seatsAvailable: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Required Skills (Comma separated)</label>
                <input 
                  type="text"
                  className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={editPostData.requiredSkills}
                  onChange={(e) => setEditPostData({ ...editPostData, requiredSkills: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  className="w-full border dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  rows={4}
                  value={editPostData.description}
                  onChange={(e) => setEditPostData({ ...editPostData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
              <button 
                onClick={() => setEditPostModal(false)}
                className="px-4 py-2 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePost}
                disabled={savingPost}
                className="px-5 py-2 font-bold text-sm bg-brand-primary text-white rounded-xl hover:bg-blue-600 transition flex items-center gap-2"
              >
                {savingPost && <Loader size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfilePreviewModal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        user={selectedUser} 
      />
    </div>
  );
}
