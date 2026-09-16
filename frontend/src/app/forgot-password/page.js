"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/apiClient';
import { extractErrorMessage } from '@/utils/errorHelper';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/forgot-password', { email });
      toast.success(data.message || "OTP has been sent to your email.");
      setStep(2);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !password) return toast.error("Please fill in all fields");

    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/reset-password', { email, otp, password });
      toast.success(data.message || "Password reset successfully!");
      router.push('/login');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to reset password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-brand-dark text-white' : 'bg-brand-light text-slate-900'}`}>
      
      <button onClick={() => setIsDark(!isDark)} className="absolute top-6 right-6 p-2 rounded-full opacity-50 hover:opacity-100 text-2xl">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${isDark ? 'bg-brand-dark-card border-brand-dark-border' : 'bg-brand-light-card border-brand-light-border'}`}>
        
        <div className="mb-6">
          <button 
            onClick={() => step === 2 ? setStep(1) : router.push('/login')} 
            className="flex items-center text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-primary flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-brand-primary/30">U</div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-sm opacity-60 mt-2">
            {step === 1 ? 'Enter your email to receive a reset code.' : 'Enter the code sent to your email and your new password.'}
          </p>
        </div>

        {step === 1 ? (
          <form className="space-y-4" onSubmit={handleRequestOtp}>
            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Email</label>
              <input 
                name="email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@institute.edu"
                className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark ? 'bg-brand-primary text-white hover:brightness-110' : 'bg-brand-primary text-white hover:brightness-110'}`}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Reset Code (OTP)</label>
              <input 
                name="otp"
                type="text" 
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1234"
                className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all text-center tracking-[0.5em] text-lg font-mono ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">New Password</label>
              <div className="relative">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all pr-10 ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark ? 'bg-brand-primary text-white hover:brightness-110' : 'bg-brand-primary text-white hover:brightness-110'}`}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
