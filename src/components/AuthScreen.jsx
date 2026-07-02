import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn, Key, Mail, ShieldAlert, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';

export default function AuthScreen({ onAuthSuccess, useMockMode, toggleMockMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'magic' | 'google'
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hotelName, setHotelName] = useState('');
  
  // States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handle live Supabase SignUp / Login
  const handleLiveAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isLogin) {
        if (authMethod === 'password') {
          // Log in with Email & Password
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          
          // Check profile approval
          const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profError) throw profError;
          onAuthSuccess(data.user, profile);
        } else if (authMethod === 'magic') {
          // Passwordless Magic Link
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: window.location.origin,
            }
          });
          if (error) throw error;
          setMessage({
            type: 'success',
            text: 'Magic link sent! Check your inbox to sign in passwordless.'
          });
        }
      } else {
        // Sign Up with Email & Password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Update profile with names
          // The trigger handled the row creation, now we update full_name and hotel_name
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              hotel_name: hotelName
            })
            .eq('id', data.user.id);
          
          if (updateError) {
            console.warn('Failed to update profile name details:', updateError);
          }

          // Fetch profile row
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          setMessage({
            type: 'success',
            text: 'Registration successful! Your request is pending admin approval.'
          });
          
          // Let client know to transition to pending approval view
          onAuthSuccess(data.user, profile || { approved: false });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Google Auth initiation failed' });
      setLoading(false);
    }
  };

  // Mock Mode quick login options
  const handleMockLogin = (role) => {
    setLoading(true);
    setTimeout(() => {
      let mockUser, mockProfile;
      if (role === 'admin') {
        mockUser = { id: 'mock-admin-id', email: 'info@crscentral.com' };
        mockProfile = {
          id: 'mock-admin-id',
          email: 'info@crscentral.com',
          full_name: 'CRS Admin',
          hotel_name: 'CRS Central HQ',
          approved: true,
          is_admin: true
        };
      } else if (role === 'approved') {
        mockUser = { id: 'mock-client-approved-id', email: 'owner@azurebeach.com' };
        mockProfile = {
          id: 'mock-client-approved-id',
          email: 'owner@azurebeach.com',
          full_name: 'Somsak Phomvihane',
          hotel_name: 'Azure Beach Resort',
          approved: true,
          is_admin: false
        };
      } else {
        mockUser = { id: 'mock-client-pending-id', email: 'manager@dhavara.com' };
        mockProfile = {
          id: 'mock-client-pending-id',
          email: 'manager@dhavara.com',
          full_name: 'Kaysone Dhavara',
          hotel_name: 'Dhavara Boutique Hotel',
          approved: false,
          is_admin: false
        };
      }
      setLoading(false);
      onAuthSuccess(mockUser, mockProfile);
    }, 400);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={28} />
          <span>RatePulse</span>
        </div>
        <div className="sidebar-brand-desc" style={{ marginBottom: '20px', textAlign: 'center' }}>
          CRS Competitive Intelligence
        </div>

        {/* Toggle Mode indicator */}
        <div style={{ marginBottom: '20px' }}>
          <button 
            type="button" 
            onClick={toggleMockMode} 
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: useMockMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Mode: {useMockMode ? 'Simulated Sandbox 🛠️' : 'Live Supabase DB 🟢'} (Click to Toggle)
          </button>
        </div>

        {useMockMode ? (
          <div>
            <h3 className="auth-title">Quick Demo Login</h3>
            <p className="auth-subtitle">Select a pre-seeded account profile role to test the full system dashboard instantly.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => handleMockLogin('admin')}
                className="auth-btn-oauth"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
              >
                <ShieldAlert size={18} className="text-primary" />
                <span>Log in as CRS Admin (info@crscentral.com)</span>
              </button>

              <button 
                type="button" 
                onClick={() => handleMockLogin('approved')}
                className="auth-btn-oauth"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                <span>Log in as Approved Property (Azure Beach)</span>
              </button>

              <button 
                type="button" 
                onClick={() => handleMockLogin('pending')}
                className="auth-btn-oauth"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <Mail size={18} style={{ color: '#f59e0b' }} />
                <span>Log in as Pending Approval (Dhavara Boutique)</span>
              </button>
            </div>
            
            <p style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8' }}>
              Switch to Live Supabase DB Mode to sign up real accounts and connect directly to your custom PostgreSQL schema.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLiveAuth}>
            <h3 className="auth-title">{isLogin ? 'Welcome Back' : 'Request Access'}</h3>
            <p className="auth-subtitle">
              {isLogin ? 'Sign in to access your hotel rate dashboard' : 'Submit registration details for admin approval'}
            </p>

            {message.text && (
              <div 
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  color: message.type === 'error' ? '#ef4444' : '#10b981'
                }}
              >
                {message.text}
              </div>
            )}

            {isLogin && (
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${authMethod === 'password' ? 'active' : ''}`}
                  onClick={() => setAuthMethod('password')}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={`auth-tab ${authMethod === 'magic' ? 'active' : ''}`}
                  onClick={() => setAuthMethod('magic')}
                >
                  Magic Link
                </button>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="auth-input-group">
                  <label className="auth-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. Somsak Phomvihane"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Hotel Name</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. Azure Beach Resort"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                <input
                  type="email"
                  className="auth-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. manager@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {(!isLogin || authMethod === 'password') && (
              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                  <input
                    type="password"
                    className="auth-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              ) : isLogin ? (
                authMethod === 'magic' ? 'Send Magic Link' : 'Log In'
              ) : (
                'Request Access Approval'
              )}
            </button>

            {isLogin && (
              <>
                <div className="auth-divider">OR</div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="auth-btn-oauth"
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#ffffff"
                      d="M21.35,11.1H12v2.7h5.38C17,15.17,15.09,16.8,12,16.8c-3.14,0-5.7-2.56-5.7-5.7s2.56-5.7,5.7-5.7c1.78,0,3.31,0.72,4.42,1.88l2.03-2.03C16.8,3.46,14.6,2.4,12,2.4C6.7,2.4,2.4,6.7,2.4,12s4.3,9.6,9.6,9.6c5.5,0,9.6-3.87,9.6-9.6C21.6,11.75,21.5,11.41,21.35,11.1z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            <div style={{ marginTop: '24px', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>
                {isLogin ? "Don't have an account? " : "Already requested access? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage({ type: '', text: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
