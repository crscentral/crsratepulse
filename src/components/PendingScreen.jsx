import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export default function PendingScreen({ user, profile, onApproved, useMockMode, simulateAdminApproval }) {
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const checkApprovalStatus = async () => {
    if (checking) return;
    setChecking(true);
    setErrorMsg('');

    try {
      if (useMockMode) {
        // Mock mode status check (just logs, does not request Supabase)
        console.log('Mock checking approval for:', user.email);
      } else {
        // Live Supabase status check
        const { data, error } = await supabase
          .from('profiles')
          .select('approved')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data && data.approved) {
          onApproved(data);
        }
      }
    } catch (err) {
      console.error('Error polling approval status:', err);
      setErrorMsg('Could not fetch updated status. Retrying...');
    } finally {
      setChecking(false);
    }
  };

  // Poll status every 8 seconds
  useEffect(() => {
    checkApprovalStatus(); // initial check
    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 8000);

    return () => clearInterval(interval);
  }, [user.id, useMockMode]);

  return (
    <div className="pending-container">
      <div className="pending-card">
        <div className="pending-icon-wrapper">
          <Clock size={32} />
        </div>
        
        <h2 className="pending-title">Account Pending Approval</h2>
        
        <p className="pending-text">
          Hi <strong>{profile?.full_name || user.email}</strong>, thank you for registering with <strong>RatePulse</strong>.
        </p>
        
        <p className="pending-text">
          Your account request for <strong>{profile?.hotel_name || 'your property'}</strong> has been submitted to the admin at <strong>info@crscentral.com</strong>.
          We are verifying your subscription and setting up your dashboard.
        </p>

        {errorMsg && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{errorMsg}</p>
        )}

        <div className="polling-indicator" style={{ marginBottom: '24px' }}>
          <div className="spinner"></div>
          <span>Checking status automatically (polling every 8s)...</span>
        </div>

        <button 
          type="button" 
          onClick={checkApprovalStatus}
          disabled={checking}
          className="btn-action-outline"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <RefreshCw size={14} className={checking ? 'spin' : ''} />
          <span>Refresh Status Now</span>
        </button>

        {/* Demo-helper button to bypass or simulate approval */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            {useMockMode ? "🛠️ DEMO CONTROLS: Click below to simulate admin approval instantly." : "🟢 Supabase: You can simulate approval locally for quick testing."}
          </p>
          <button 
            type="button" 
            onClick={simulateAdminApproval}
            className="btn-action-primary"
            style={{ backgroundColor: '#10b981', border: 'none' }}
          >
            Simulate Admin Approval Action
          </button>
        </div>
      </div>
    </div>
  );
}
