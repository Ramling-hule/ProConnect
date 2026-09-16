"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import apiClient from "@/services/apiClient";
import { openAuthModal } from "@/redux/features/authSlice";
import {
  mentorStep1Schema,
  mentorStep2Schema,
  mentorStep3Schema,
  mentorStep4Schema,
  mentorStep5Schema,
  mentorStep6Schema,
  getZodError,
} from "@/utils/schemas";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/utils/errorHelper";
import {
  User, Briefcase, GraduationCap, Globe, FileText, Shield,
  Plus, X, Upload, Loader, Check, ChevronRight, ChevronLeft,
  Eye, EyeOff,
} from "lucide-react";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

const STEPS = [
  { id: 1, title: "Personal Info",      icon: User,          color: "blue"   },
  { id: 2, title: "Professional",       icon: Briefcase,     color: "indigo" },
  { id: 3, title: "Education",          icon: GraduationCap, color: "violet" },
  { id: 4, title: "Public Profiles",    icon: Globe,         color: "purple" },
  { id: 5, title: "Proof of Work",      icon: FileText,      color: "fuchsia"},
  { id: 6, title: "KYC & Review",       icon: Shield,        color: "pink"   },
];

const STEP_COLOR = {
  blue:    { ring: "ring-blue-500",    bg: "bg-blue-600",    light: "bg-blue-500/10 text-blue-400",    bar: "bg-blue-500"    },
  indigo:  { ring: "ring-indigo-500",  bg: "bg-indigo-600",  light: "bg-indigo-500/10 text-indigo-400",bar: "bg-indigo-500"  },
  violet:  { ring: "ring-violet-500",  bg: "bg-violet-600",  light: "bg-violet-500/10 text-violet-400",bar: "bg-violet-500"  },
  purple:  { ring: "ring-purple-500",  bg: "bg-purple-600",  light: "bg-purple-500/10 text-purple-400",bar: "bg-purple-500"  },
  fuchsia: { ring: "ring-fuchsia-500", bg: "bg-fuchsia-600", light: "bg-fuchsia-500/10 text-fuchsia-400",bar: "bg-fuchsia-500"},
  pink:    { ring: "ring-pink-500",    bg: "bg-pink-600",    light: "bg-pink-500/10 text-pink-400",    bar: "bg-pink-500"    },
};

const INITIAL_FORM = {
  phone: "", city: "", state: "", country: "", dateOfBirth: "",
  headline: "", about: "", company: "", role: "", yearsOfExperience: 1,
  education: [{ degree: "", institution: "", year: "" }],
  achievements: [""],
  linkedin: "", github: "", portfolio: "", twitter: "", leetcode: "", codeforces: "", hackerrank: "",
  skills: [], languages: [], resumeUrl: "", videoIntroUrl: "",
  identityProofUrl: "", companyIdUrl: "", declaration: false,
};
const STEP_SCHEMAS = [
  mentorStep1Schema,
  mentorStep2Schema,
  mentorStep3Schema,
  mentorStep4Schema,
  mentorStep5Schema,
  mentorStep6Schema,
];

function InputField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function StyledInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500 text-sm ${className}`}
      {...props}
    />
  );
}

function StyledTextarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500 text-sm resize-none ${className}`}
      {...props}
    />
  );
}
function FileUploadField({ label, required, hint, accept, value, onChange, token }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && (data.url || data.fileUrl || data.secure_url)) {
        const url = data.url || data.fileUrl || data.secure_url;
        onChange(url);
        toast.success("File uploaded!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative flex items-center gap-3 px-4 py-3 bg-slate-800/60 border-2 border-dashed rounded-xl cursor-pointer transition-all
          ${value ? "border-green-500/60 bg-green-900/10" : "border-slate-700 hover:border-blue-500/60 hover:bg-blue-900/10"}`}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} />
        {uploading ? (
          <><Loader size={18} className="animate-spin text-blue-400" /><span className="text-sm text-blue-300">Uploading…</span></>
        ) : value ? (
          <><Check size={18} className="text-green-400" /><span className="text-sm text-green-300 truncate flex-1">{value.split("/").pop()}</span><X size={14} className="text-slate-400 hover:text-red-400 flex-shrink-0" onClick={(e) => { e.stopPropagation(); onChange(""); }} /></>
        ) : (
          <><Upload size={18} className="text-slate-400" /><span className="text-sm text-slate-400">Click to upload</span></>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
function TagInput({ label, required, value, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 text-sm"
        />
        <button type="button" onClick={add} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 text-xs bg-blue-900/30 text-blue-300 border border-blue-700/50 px-2.5 py-1 rounded-full">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="hover:text-red-400 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
function SummaryRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex gap-3 text-sm py-1.5 border-b border-slate-800">
      <span className="text-slate-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-slate-200 flex-1 break-words">
        {Array.isArray(value) ? value.join(", ") : String(value)}
      </span>
    </div>
  );
}
export default function BecomeMentorPage() {
  const router   = useRouter();
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [step, setStep]       = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors]   = useState({});

  const set = (key, value) => setFormData((p) => ({ ...p, [key]: value }));
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };
  const validateStep = () => {
    try {
      STEP_SCHEMAS[step - 1].parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      const fieldErrors = {};
      if (err?.issues) {
        err.issues.forEach((issue) => {
          const key = issue.path.join(".");
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        });
      }
      setErrors(fieldErrors);
      toast.error(getZodError(err));
      return false;
    }
  };

  const nextStep = () => { if (validateStep()) setStep((s) => s + 1); };
  const prevStep = () => { setStep((s) => s - 1); setErrors({}); };
  const applyMutation = useMutation({
    mutationFn: async (data) => {
      const { declaration, ...payload } = data;
      payload.education    = payload.education.filter((e) => e.degree && e.institution && e.year);
      payload.achievements = payload.achievements.filter(Boolean);
      const { data: res } = await apiClient.post("/api/mentor/apply", payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Application submitted! Our team will review it shortly.");
      router.push("/dashboard");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Submission failed")),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    applyMutation.mutate(formData);
  };
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center">
          <GraduationCap size={40} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in first</h2>
          <p className="text-slate-400 mb-6">You need an account before applying as a mentor.</p>
          <button
            onClick={() => dispatch(openAuthModal("Please sign in to become a mentor."))}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const current = STEPS[step - 1];
  const colors  = STEP_COLOR[current.color];
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      {}
      <div className="relative pt-12 pb-10 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        <h1 className="relative text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 mb-2">
          Become a Mentor
        </h1>
        <p className="relative text-slate-400 text-base max-w-md mx-auto">
          Share your expertise. Build your brand. Get paid for your knowledge.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium">Step {step} of {STEPS.length}</span>
            <span className="text-xs text-slate-400">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${progress === 0 ? 8 : progress}%` }}
            />
          </div>
        </div>

        {}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-4 left-0 right-0 h-px bg-slate-800 -z-0" />
          {STEPS.map(({ id, title, icon: Icon, color }) => {
            const c = STEP_COLOR[color];
            const done   = id < step;
            const active = id === step;
            return (
              <div key={id} className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                  ${done   ? "bg-green-600 border-green-500 text-white" :
                    active ? `${c.bg} border-transparent text-white shadow-lg` :
                    "bg-slate-900 border-slate-700 text-slate-600"}`}
                >
                  {done ? <Check size={14} /> : <Icon size={13} />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-slate-200" : done ? "text-green-400" : "text-slate-600"}`}>
                  {title}
                </span>
              </div>
            );
          })}
        </div>

        {}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {}
          <div className={`px-8 py-5 border-b border-slate-800 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.light}`}>
              <current.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Step {step}</p>
              <h2 className="text-lg font-bold text-white">{current.title}</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-8 py-7 space-y-6">

              {}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Phone Number" required>
                      <StyledInput name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </InputField>
                    <InputField label="Date of Birth" required>
                      <StyledInput name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                      {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>}
                    </InputField>
                    <InputField label="City" required>
                      <StyledInput name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai" />
                      {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                    </InputField>
                    <InputField label="State" required>
                      <StyledInput name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Maharashtra" />
                      {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                    </InputField>
                    <InputField label="Country" required className="md:col-span-2">
                      <StyledInput name="country" value={formData.country} onChange={handleChange} placeholder="e.g. India" />
                      {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                    </InputField>
                  </div>
                </>
              )}

              {}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Current Company" required>
                      <StyledInput name="company" value={formData.company} onChange={handleChange} placeholder="e.g. Google" />
                      {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
                    </InputField>
                    <InputField label="Your Role / Designation" required>
                      <StyledInput name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Senior Software Engineer" />
                      {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
                    </InputField>
                    <InputField label="Years of Experience" required>
                      <StyledInput name="yearsOfExperience" type="number" min="0" max="50" value={formData.yearsOfExperience} onChange={handleChange} />
                      {errors.yearsOfExperience && <p className="text-red-400 text-xs mt-1">{errors.yearsOfExperience}</p>}
                    </InputField>
                  </div>
                  <InputField label="Professional Headline" required hint="A short tagline shown on your mentor card">
                    <StyledInput name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g. Senior SWE at Google | Ex-Amazon | DSA Coach" />
                    {errors.headline && <p className="text-red-400 text-xs mt-1">{errors.headline}</p>}
                  </InputField>
                  <InputField label="About You" required hint="Minimum 50 characters. Tell mentees about your journey, specialties, and mentoring style.">
                    <StyledTextarea name="about" rows={5} value={formData.about} onChange={handleChange} placeholder="I'm a software engineer with 8+ years of experience in distributed systems..." />
                    <div className="flex justify-between mt-1">
                      {errors.about ? <p className="text-red-400 text-xs">{errors.about}</p> : <span />}
                      <span className="text-xs text-slate-500">{formData.about.length} chars</span>
                    </div>
                  </InputField>
                </>
              )}

              {}
              {step === 3 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">Education <span className="text-red-400">*</span></label>
                      <button
                        type="button"
                        onClick={() => set("education", [...formData.education, { degree: "", institution: "", year: "" }])}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Plus size={12} /> Add Entry
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.education.map((edu, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-start bg-slate-800/40 rounded-xl p-3 border border-slate-700">
                          <div className="col-span-5">
                            <input
                              value={edu.degree}
                              onChange={(e) => { const updated = [...formData.education]; updated[i].degree = e.target.value; set("education", updated); }}
                              placeholder="Degree / Course"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              value={edu.institution}
                              onChange={(e) => { const updated = [...formData.education]; updated[i].institution = e.target.value; set("education", updated); }}
                              placeholder="Institution"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={edu.year}
                              onChange={(e) => { const updated = [...formData.education]; updated[i].year = e.target.value; set("education", updated); }}
                              placeholder="Year"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center pt-2">
                            {formData.education.length > 1 && (
                              <button type="button" onClick={() => set("education", formData.education.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {errors.education && <p className="text-red-400 text-xs">{errors.education}</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">Achievements & Awards <span className="text-slate-500 font-normal">(optional)</span></label>
                      <button
                        type="button"
                        onClick={() => set("achievements", [...formData.achievements, ""])}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.achievements.map((ach, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            value={ach}
                            onChange={(e) => { const updated = [...formData.achievements]; updated[i] = e.target.value; set("achievements", updated); }}
                            placeholder="e.g. Winner — Google Code Jam 2023"
                            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <button type="button" onClick={() => set("achievements", formData.achievements.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {}
              {step === 4 && (
                <>
                  <p className="text-sm text-slate-500 -mt-2">Add your public profiles so admins and mentees can verify your expertise. All fields are optional.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { name: "linkedin",   label: "LinkedIn",   placeholder: "https://linkedin.com/in/you" },
                      { name: "github",     label: "GitHub",     placeholder: "https://github.com/you" },
                      { name: "portfolio",  label: "Portfolio / Website", placeholder: "https://yoursite.com" },
                      { name: "twitter",    label: "Twitter / X",placeholder: "https://x.com/you" },
                      { name: "leetcode",   label: "LeetCode",   placeholder: "https://leetcode.com/you" },
                      { name: "codeforces", label: "Codeforces", placeholder: "https://codeforces.com/profile/you" },
                      { name: "hackerrank", label: "HackerRank", placeholder: "https://hackerrank.com/you" },
                    ].map(({ name, label, placeholder }) => (
                      <InputField key={name} label={label}>
                        <StyledInput name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} />
                        {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
                      </InputField>
                    ))}
                  </div>
                </>
              )}

              {}
              {step === 5 && (
                <>
                  <TagInput
                    label="Skills"
                    required
                    value={formData.skills}
                    onChange={(v) => set("skills", v)}
                    placeholder="Type a skill and press Enter"
                  />
                  {errors.skills && <p className="text-red-400 text-xs -mt-4">{errors.skills}</p>}

                  <TagInput
                    label="Languages you speak"
                    required
                    value={formData.languages}
                    onChange={(v) => set("languages", v)}
                    placeholder="e.g. English, Hindi"
                  />
                  {errors.languages && <p className="text-red-400 text-xs -mt-4">{errors.languages}</p>}

                  <FileUploadField
                    label="Resume / CV"
                    required
                    hint="PDF or Word document, max 10 MB"
                    accept=".pdf,.doc,.docx"
                    value={formData.resumeUrl}
                    onChange={(url) => set("resumeUrl", url)}
                    token={token}
                  />
                  {errors.resumeUrl && <p className="text-red-400 text-xs">{errors.resumeUrl}</p>}

                  <InputField label="Video Introduction URL" hint="Optional — a short Loom / YouTube video about yourself">
                    <StyledInput name="videoIntroUrl" value={formData.videoIntroUrl} onChange={handleChange} placeholder="https://loom.com/share/..." />
                    {errors.videoIntroUrl && <p className="text-red-400 text-xs mt-1">{errors.videoIntroUrl}</p>}
                  </InputField>
                </>
              )}

              {}
              {step === 6 && (
                <>
                  <div className="space-y-5">
                    <FileUploadField
                      label="Government ID (Aadhaar / Passport / Driving License)"
                      required
                      hint="JPG, PNG or PDF, max 10 MB"
                      accept="image/*,.pdf"
                      value={formData.identityProofUrl}
                      onChange={(url) => set("identityProofUrl", url)}
                      token={token}
                    />
                    {errors.identityProofUrl && <p className="text-red-400 text-xs">{errors.identityProofUrl}</p>}

                    <FileUploadField
                      label="Company ID Card / Offer Letter (optional)"
                      hint="Helps verify your current employment"
                      accept="image/*,.pdf"
                      value={formData.companyIdUrl}
                      onChange={(url) => set("companyIdUrl", url)}
                      token={token}
                    />
                  </div>

                  {}
                  <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2"><Eye size={14} /> Application Summary</h3>
                    <div className="space-y-0.5">
                      <SummaryRow label="Phone"        value={formData.phone} />
                      <SummaryRow label="Location"     value={[formData.city, formData.state, formData.country].filter(Boolean).join(", ")} />
                      <SummaryRow label="Company"      value={formData.company} />
                      <SummaryRow label="Role"         value={formData.role} />
                      <SummaryRow label="Experience"   value={`${formData.yearsOfExperience} years`} />
                      <SummaryRow label="Headline"     value={formData.headline} />
                      <SummaryRow label="Education"    value={formData.education.filter(e => e.degree).map(e => `${e.degree} — ${e.institution} (${e.year})`)} />
                      <SummaryRow label="Skills"       value={formData.skills} />
                      <SummaryRow label="Languages"    value={formData.languages} />
                      <SummaryRow label="LinkedIn"     value={formData.linkedin} />
                      <SummaryRow label="GitHub"       value={formData.github} />
                      <SummaryRow label="LeetCode"     value={formData.leetcode} />
                      <SummaryRow label="Resume"       value={formData.resumeUrl ? "✅ Uploaded" : "—"} />
                      <SummaryRow label="Govt ID"      value={formData.identityProofUrl ? "✅ Uploaded" : "—"} />
                    </div>
                  </div>

                  {}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="declaration"
                      checked={formData.declaration}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 accent-pink-500 flex-shrink-0"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                      I declare that all information provided is accurate and genuine. I understand that submitting false information will result in permanent disqualification from the platform.
                    </span>
                  </label>
                  {errors.declaration && <p className="text-red-400 text-xs">{errors.declaration}</p>}
                </>
              )}
            </div>

            {}
            <div className="px-8 py-5 border-t border-slate-800 flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all text-sm"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`flex items-center gap-2 px-6 py-2.5 ${colors.bg} hover:opacity-90 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 text-sm`}
                >
                  Next Step <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={applyMutation.isPending || !formData.declaration}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-pink-600/30 transition-all hover:-translate-y-0.5 text-sm"
                >
                  {applyMutation.isPending ? (
                    <><Loader size={15} className="animate-spin" /> Submitting…</>
                  ) : (
                    <><Shield size={15} /> Submit Application</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
