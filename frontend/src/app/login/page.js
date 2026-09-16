"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, resetAuthStatus } from '@/redux/features/authSlice';
import apiClient from '@/services/apiClient';
import { extractErrorMessage } from '@/utils/errorHelper';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { loginSchema, getZodError } from '@/utils/schemas';
import { Eye, EyeOff } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const { isLoading, error, user, mfaRequired, tempMfaToken, tempUserId } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ email: '', password: '', role: 'student' });
  const [mfaCode, setMfaCode] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !mfaRequired) {
      const role = user.role?.toLowerCase();
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'mentor' && callbackUrl === '/dashboard') {
        router.push('/mentor-dashboard');
      } else {
        router.push(callbackUrl);
      }
    }
  }, [user, mfaRequired, router, callbackUrl]);

  useEffect(() => {
    return () => dispatch(resetAuthStatus());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      loginSchema.parse({ email: formData.email, password: formData.password });
    } catch (err) {
      dispatch(authFailure(getZodError(err)));
      return;
    }
    dispatch(authStart()); 

    try {
      const { data } = await apiClient.post('/api/auth/login', formData);
      dispatch(authSuccess(data));
      if (!data.mfaRequired) toast.success('Welcome back!');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Login failed');
      dispatch(authFailure(msg));
      toast.error(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch(authStart());
    try {
      const { data } = await apiClient.post('/api/auth/google', { credential: credentialResponse.credential });
      dispatch(authSuccess(data));
      if (!data.mfaRequired) toast.success('Welcome back!');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Google Login failed');
      dispatch(authFailure(msg));
      toast.error(msg);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const { data } = await apiClient.post('/api/auth/login/mfa', {
        userId: tempUserId,
        tempToken: tempMfaToken,
        code: mfaCode,
      });
      dispatch(authSuccess(data));
      toast.success('MFA verification successful!');
      const role = data.user?.role?.toLowerCase();
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'mentor' && callbackUrl === '/dashboard') {
        router.push('/mentor-dashboard');
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'MFA Verification failed');
      dispatch(authFailure(msg));
      toast.error(msg);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-brand-dark text-white' : 'bg-brand-light text-slate-900'}`}>
      
      <button onClick={() => setIsDark(!isDark)} className="absolute top-6 right-6 p-2 rounded-full opacity-50 hover:opacity-100 text-2xl">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${isDark ? 'bg-brand-dark-card border-brand-dark-border' : 'bg-brand-light-card border-brand-light-border'}`}>
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-primary flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-brand-primary/30">U</div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mfaRequired ? 'Two-Factor Authentication' : 'Welcome back'}
          </h1>
          <p className="text-sm opacity-60 mt-2">
            {mfaRequired ? 'Enter the code from your authenticator app.' : 'Enter your details to access your dashboard.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        {mfaRequired ? (
          <form className="space-y-4" onSubmit={handleMfaSubmit}>
            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Authentication Code</label>
              <input 
                name="mfaCode"
                type="text" 
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all text-center tracking-[0.5em] text-lg font-mono ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark ? 'bg-brand-primary text-white hover:brightness-110' : 'bg-brand-primary text-white hover:brightness-110'}`}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        ) : (
          <>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Login As</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="student" 
                      checked={formData.role === 'student'}
                      onChange={handleChange}
                      className="accent-brand-primary"
                    />
                    <span className="text-sm font-medium">Student</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="mentor" 
                      checked={formData.role === 'mentor'}
                      onChange={handleChange}
                      className="accent-brand-primary"
                    />
                    <span className="text-sm font-medium">Mentor</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="admin" 
                      checked={formData.role === 'admin'}
                      onChange={handleChange}
                      className="accent-orange-500"
                    />
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Admin</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Email</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@institute.edu"
                  className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase opacity-70 block">Password</label>
                  <Link href="/forgot-password" className="text-xs font-bold opacity-70 hover:opacity-100 text-brand-primary underline">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={handleChange}
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 flex items-center justify-center space-x-2 opacity-50 text-sm">
              <div className="h-px bg-current flex-1"></div>
              <span>OR</span>
              <div className="h-px bg-current flex-1"></div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  dispatch(authFailure("Google Login Failed"));
                }}
                theme={isDark ? "filled_black" : "outline"}
                shape="rectangular"
              />
            </div>

            <p className="text-center text-xs mt-8 opacity-60">
              Don&apos;t have an account? <Link href="/register" className="font-bold underline hover:opacity-100 text-brand-primary">Sign up</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
