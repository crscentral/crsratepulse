import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, UserCheck, UserX, Search, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminPanel({ adminUser, useMockMode, mockProfiles, updateMockProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved'
  const [search, setSearch] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (useMockMode) {
        setProfiles(mockProfiles);
      } else {
        // Fetch real profiles from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('requested_at', { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
      }
    } catch (err) {
      console.error('Error fetching admin profiles:', err);
      setErrorMsg('Failed to load registered profiles. Please check your administrative privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [useMockMode, mockProfiles]);

  const handleApprove = async (profileId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (useMockMode) {
        updateMockProfile(profileId, { approved: true, approved_at: new Date().toISOString() });
        setSuccessMsg('User approved successfully (Simulated).');
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            approved: true,
            approved_at: new Date().toISOString(),
            approved_by: adminUser.id
          })
          .eq('id', profileId);

        if (error) throw error;
        setSuccessMsg('User approved successfully.');
        fetchProfiles();
      }
    } catch (err) {
      console.error('Error approving user:', err);
      setErrorMsg(err.message || 'Approval action failed.');
    }
  };

  const handleReject = async (profileId) => {
    if (!window.confirm('Are you sure you want to reject and delete this registration request?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (useMockMode) {
        updateMockProfile(profileId, null); // remove/reject
        setSuccessMsg('User rejected successfully (Simulated).');
      } else {
        // Since profile belongs to auth.users, in a production system we might delete the profile
        // or just set approved = false (which is default). Here, we can delete the profile row.
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profileId);

        if (error) throw error;
        setSuccessMsg('User registration request rejected/removed.');
        fetchProfiles();
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setErrorMsg(err.message || 'Rejection action failed.');
    }
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    // Exclude the admin logged in
    if (p.id === adminUser?.id) return false;

    // Apply approved/pending filter
    if (filter === 'pending' && p.approved) return false;
    if (filter === 'approved' && !p.approved) return false;

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.email || '').toLowerCase().includes(q) ||
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.hotel_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Admin Approval Panel</h1>
          <p className="page-subtitle">Manage client subscription registrations and grant dashboard access</p>
        </div>
        <button 
          onClick={fetchProfiles} 
          disabled={loading} 
          className="btn-action-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--status-ok-bg)', color: 'var(--status-ok)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: 'var(--status-critical-bg)', color: 'var(--status-critical)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Filter Status:</span>
          <div className="segmented-control">
            <button 
              className={`segmented-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending Approval ({profiles.filter(p => !p.approved && p.id !== adminUser?.id).length})
            </button>
            <button 
              className={`segmented-btn ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              Approved ({profiles.filter(p => p.approved && p.id !== adminUser?.id).length})
            </button>
            <button 
              className={`segmented-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Accounts
            </button>
          </div>
        </div>

        <div className="filter-group">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search email, name or hotel..."
              className="form-input"
              style={{ paddingLeft: '36px', width: '260px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Retrieving registrations database...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ marginBottom: '12px' }} />
            <p>No profiles found matching the active filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Contact</th>
                  <th>Hotel Property</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.full_name || 'No Name Provided'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.hotel_name || 'N/A'}</div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(p.requested_at).toLocaleDateString()} at {new Date(p.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className={`tag-severity ${p.approved ? 'ok' : 'medium'}`}>
                        {p.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="action-cell">
                      {!p.approved && (
                        <button 
                          onClick={() => handleApprove(p.id)}
                          className="btn-approve"
                          title="Approve registration"
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        onClick={() => handleReject(p.id)}
                        className="btn-reject"
                        title="Reject or remove registration"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
