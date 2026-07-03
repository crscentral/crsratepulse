import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthScreen from './components/AuthScreen';
import PendingScreen from './components/PendingScreen';
import AdminPanel from './components/AdminPanel';
import DashboardView from './components/DashboardView';
import RateComparisonView from './components/RateComparisonView';
import RateParityView from './components/RateParityView';
import HeatmapView from './components/HeatmapView';
import RecommendationsView from './components/RecommendationsView';
import AlertsView from './components/AlertsView';
import PropertiesView from './components/PropertiesView';
import ExportView from './components/ExportView';
import { ratesService } from './ratesService';

// Icons
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  AlertOctagon, 
  CalendarRange, 
  Lightbulb, 
  Bell, 
  Home, 
  Download, 
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [sessionUser, setSessionUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Navigation
  const [activeView, setActiveView] = useState('dashboard'); // view names matching pages
  
  // Properties lists
  const [properties, setProperties] = useState([]);
  const [activeProperty, setActiveProperty] = useState(null);

  // Unread alerts indicator badge count
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Sidebar expand/collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Currency selection state
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const selectedCurrencySymbol = ratesService.getCurrencySymbol(selectedCurrency);

  // Sync currency with active property country
  useEffect(() => {
    if (activeProperty) {
      setSelectedCurrency(activeProperty.currency);
    }
  }, [activeProperty]);

  // Global currency conversion helper
  const convert = (amount, fromCurrency) => {
    return ratesService.convertRate(amount, fromCurrency || activeProperty?.currency, selectedCurrency);
  };

  // Sandbox/Mock Mode toggles
  const [useMockMode, setUseMockMode] = useState(() => {
    const val = localStorage.getItem('rp_use_mock_mode');
    return val !== 'false'; // defaults to true
  });
  const [mockProfiles, setMockProfiles] = useState([
    {
      id: 'mock-admin-id',
      email: 'info@crscentral.com',
      full_name: 'CRS Admin Manager',
      hotel_name: 'CRS Central Head Office',
      approved: true,
      is_admin: true,
      requested_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
    },
    {
      id: 'mock-client-approved-id',
      email: 'owner@azurebeach.com',
      full_name: 'Somsak Phomvihane',
      hotel_name: 'Azure Beach Resort',
      approved: true,
      is_admin: false,
      requested_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: 'mock-client-pending-id',
      email: 'manager@dhavara.com',
      full_name: 'Kaysone Dhavara',
      hotel_name: 'Dhavara Boutique Hotel',
      approved: false,
      is_admin: false,
      requested_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ]);

  // Load properties list
  const loadProperties = async () => {
    try {
      const data = await ratesService.getProperties();
      setProperties(data);
      if (data.length > 0) {
        // Set default active property focus
        setActiveProperty(data[0]);
      }
    } catch (err) {
      console.error('Error loading properties list:', err);
    }
  };

  // Load active alerts badge counts
  const loadAlertBadgeCount = async () => {
    if (!activeProperty) return;
    try {
      const alerts = await ratesService.getAlerts(activeProperty.id);
      setUnreadAlertsCount(alerts.filter(a => !a.read).length);
    } catch (err) {
      console.error('Error fetching alerts badge counts:', err);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadAlertBadgeCount();
  }, [activeProperty]);

  // Active theme trigger
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live session sync & mock session restore
  useEffect(() => {
    if (useMockMode) {
      const storedUser = localStorage.getItem('rp_mock_session_user');
      const storedProfile = localStorage.getItem('rp_mock_user_profile');
      if (storedUser && storedProfile) {
        setSessionUser(JSON.parse(storedUser));
        setUserProfile(JSON.parse(storedProfile));
      } else {
        setSessionUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setSessionUser(null);
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    // Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setSessionUser(null);
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [useMockMode]);

  // Fetch profiles row from database
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error loading user profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSuccess = (user, profile) => {
    setSessionUser(user);
    setUserProfile(profile);
    if (useMockMode) {
      localStorage.setItem('rp_mock_session_user', JSON.stringify(user));
      localStorage.setItem('rp_mock_user_profile', JSON.stringify(profile));
    }
  };

  const handleSignOut = async () => {
    if (useMockMode) {
      localStorage.removeItem('rp_mock_session_user');
      localStorage.removeItem('rp_mock_user_profile');
      setSessionUser(null);
      setUserProfile(null);
      setActiveView('dashboard');
    } else {
      await supabase.auth.signOut();
    }
  };

  // Mock profile approval trigger
  const handleUpdateMockProfile = (id, updates) => {
    setMockProfiles(prev => {
      if (updates === null) {
        // delete / reject
        return prev.filter(p => p.id !== id);
      }
      return prev.map(p => p.id === id ? { ...p, ...updates } : p);
    });

    // Update active logged in user profile if it changed
    if (userProfile && userProfile.id === id) {
      setUserProfile(prev => {
        const next = { ...prev, ...updates };
        localStorage.setItem('rp_mock_user_profile', JSON.stringify(next));
        return next;
      });
    }
  };

  // Direct approval simulation button triggers from Pending screen
  const handleSimulateAdminApproval = () => {
    if (userProfile) {
      handleUpdateMockProfile(userProfile.id, { approved: true, approved_at: new Date().toISOString() });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#ffffff' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: '20px' }}></div>
        <p style={{ letterSpacing: '0.05em', fontSize: '14px' }}>INITIALIZING RATEPULSE SYSTEM...</p>
      </div>
    );
  }

  // Not Logged In -> Render Auth View
  if (!sessionUser) {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess} 
        useMockMode={useMockMode} 
        toggleMockMode={() => setUseMockMode(!useMockMode)} 
      />
    );
  }

  // Logged In but Not Approved -> Render Pending screen
  if (userProfile && !userProfile.approved) {
    return (
      <PendingScreen 
        user={sessionUser}
        profile={userProfile}
        onApproved={(newProfile) => setUserProfile(newProfile)}
        useMockMode={useMockMode}
        simulateAdminApproval={handleSimulateAdminApproval}
      />
    );
  }

  // Helper to switch page content views
  const renderViewContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView 
            activeProperty={activeProperty} 
            onViewChange={setActiveView} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
            onPropertyImported={(newProp) => {
              setProperties(prev => {
                if (prev.find(p => p.id === newProp.id)) return prev;
                return [...prev, newProp];
              });
              setActiveProperty(newProp);
            }}
          />
        );
      case 'comparison':
        return (
          <RateComparisonView 
            activeProperty={activeProperty} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
          />
        );
      case 'parity':
        return (
          <RateParityView 
            activeProperty={activeProperty} 
            onViewChange={setActiveView} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
          />
        );
      case 'heatmap':
        return (
          <HeatmapView 
            activeProperty={activeProperty} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
          />
        );
      case 'recommendations':
        return (
          <RecommendationsView 
            activeProperty={activeProperty} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
          />
        );
      case 'alerts':
        return <AlertsView activeProperty={activeProperty} refreshAlertBadge={loadAlertBadgeCount} />;
      case 'properties':
        return (
          <PropertiesView 
            onPropertyCreated={(newProp) => {
              setProperties(prev => {
                if (prev.find(p => p.id === newProp.id)) return prev;
                return [...prev, newProp];
              });
              setActiveProperty(newProp);
            }} 
            onPropertyUpdated={(updatedProp) => {
              setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
              setActiveProperty(prev => prev && prev.id === updatedProp.id ? updatedProp : prev);
            }}
            activePropertyId={activeProperty?.id}
            onSelectProperty={setActiveProperty}
          />
        );
      case 'export':
        return (
          <ExportView 
            activeProperty={activeProperty} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
          />
        );
      case 'admin':
        return (
          <AdminPanel 
            adminUser={sessionUser}
            useMockMode={useMockMode}
            mockProfiles={mockProfiles}
            updateMockProfile={handleUpdateMockProfile}
          />
        );
      default:
        return (
          <DashboardView 
            activeProperty={activeProperty} 
            onViewChange={setActiveView} 
            convert={convert}
            currencySymbol={selectedCurrencySymbol}
            selectedCurrency={selectedCurrency}
            onPropertyImported={(newProp) => {
              setProperties(prev => {
                if (prev.find(p => p.id === newProp.id)) return prev;
                return [...prev, newProp];
              });
              setActiveProperty(newProp);
            }}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation bar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
            {!sidebarCollapsed && (
              <div>
                <span>RatePulse</span>
                <span className="sidebar-brand-desc">CRS Revenue Dash</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(true)}
              className="theme-toggle"
              style={{ color: '#94a3b8', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Close Sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-menu">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveView('comparison')}
            className={`sidebar-item ${activeView === 'comparison' ? 'active' : ''}`}
          >
            <ArrowLeftRight size={18} />
            <span>Rate Comparison</span>
          </button>

          <button 
            onClick={() => setActiveView('recommendations')}
            className={`sidebar-item ${activeView === 'recommendations' ? 'active' : ''}`}
          >
            <Lightbulb size={18} />
            <span>Smart Pricing</span>
          </button>

          <button 
            onClick={() => setActiveView('parity')}
            className={`sidebar-item ${activeView === 'parity' ? 'active' : ''}`}
          >
            <AlertOctagon size={18} />
            <span>Rate Parity</span>
          </button>

          <button 
            onClick={() => setActiveView('heatmap')}
            className={`sidebar-item ${activeView === 'heatmap' ? 'active' : ''}`}
          >
            <CalendarRange size={18} />
            <span>Heatmap</span>
          </button>

          <button 
            onClick={() => setActiveView('alerts')}
            className={`sidebar-item ${activeView === 'alerts' ? 'active' : ''}`}
          >
            <Bell size={18} />
            <span>Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="sidebar-badge">{unreadAlertsCount}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveView('properties')}
            className={`sidebar-item ${activeView === 'properties' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Properties</span>
          </button>

          <button 
            onClick={() => setActiveView('export')}
            className={`sidebar-item ${activeView === 'export' ? 'active' : ''}`}
          >
            <Download size={18} />
            <span>Export</span>
          </button>

          {/* Admin panel tab (only visible for administrator accounts) */}
          {userProfile?.is_admin && (
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <button 
                onClick={() => setActiveView('admin')}
                className={`sidebar-item ${activeView === 'admin' ? 'active' : ''}`}
                style={{ color: '#60a5fa' }}
              >
                <ShieldCheck size={18} />
                <span>Admin Approvals</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-info">
            <span className="user-name">{userProfile?.full_name || sessionUser.email}</span>
            <span className="user-role">
              {userProfile?.is_admin ? 'CRS Admin' : userProfile?.hotel_name || 'Hotel Partner'}
            </span>
          </div>
          
          <button onClick={handleSignOut} className="btn-signout">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="main-wrapper">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Collapse/Expand Sidebar Trigger Button */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="theme-toggle"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            
            <div className="header-status">
              <span className="status-dot"></span>
              <span>Live Channel sync active • 60s updates</span>
            </div>
          </div>

          <div className="header-actions">
            {/* Active Property Dropdown Selector */}
            {properties.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus Property:</span>
                <select 
                  className="hotel-selector"
                  value={activeProperty?.id || ''}
                  onChange={(e) => {
                    const match = properties.find(p => p.id === e.target.value);
                    if (match) setActiveProperty(match);
                  }}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Currency Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Currency:</span>
              <select 
                className="hotel-selector"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="THB">THB (฿)</option>
                <option value="LAK">LAK (₭)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="MYR">MYR (RM)</option>
                <option value="VND">VND (₫)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="NPR">NPR (₨)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            {/* Light/Dark Toggle */}
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              title="Toggle color theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: '#e2e8f0' }} />}
            </button>
          </div>
        </header>

        {/* Dynamic page content body */}
        <main className="content-body">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
}
