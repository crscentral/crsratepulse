import React, { useEffect, useState, useRef } from 'react';
import { ratesService } from '../ratesService';
import { 
  TrendingUp, 
  AlertTriangle, 
  Bell, 
  Home, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Globe, 
  MapPin, 
  Calendar, 
  Search, 
  Plus, 
  Check, 
  Star,
  Zap
} from 'lucide-react';

export default function DashboardView({ activeProperty, onViewChange, onPropertyImported, convert, currencySymbol, selectedCurrency }) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    avgPosition: 0,
    parityCount: 0,
    unreadAlerts: 0,
    propertiesCount: 0
  });
  const [ratesOverview, setRatesOverview] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [topCompetitors, setTopCompetitors] = useState([]);
  
  // Worldwide search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [importSuccessId, setImportSuccessId] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Dynamic metrics
  const [myLatestRate, setMyLatestRate] = useState(0);
  const [marketAvgRate, setMarketAvgRate] = useState(0);
  const [recommendedRate, setRecommendedRate] = useState(0);

  // Auto-refresh timer state
  const [timerSeconds, setTimerSeconds] = useState(60);

  // Poll countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          loadDashboardData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeProperty]);

  const loadDashboardData = async () => {
    if (!activeProperty) return;
    setLoading(true);
    try {
      // 1. Get properties count
      const allProps = await ratesService.getProperties();
      
      // 2. Get parity count
      const violations = await ratesService.getParityViolations(activeProperty.id);
      
      // 3. Get alerts
      const allAlerts = await ratesService.getAlerts(activeProperty.id);
      const unreadAlerts = allAlerts.filter(a => !a.read);
      
      // 4. Get rates history for Deluxe Room
      const history = await ratesService.getRatesHistory(activeProperty.id, 'Deluxe Room');
      
      if (history.length > 0) {
        const latestDay = history[history.length - 1];
        const prevDay = history[history.length - 2] || latestDay;
        
        // Channels list for progress lines
        const channelsToShow = [
          'Hotel Website', 'Agoda', 'Booking.com', 'Trip.com', 
          'Expedia', 'Traveloka', 'MakeMyTrip', 'Airbnb'
        ];

        // Format rates list
        const overview = channelsToShow.map(ch => {
          const rateVal = latestDay.propertyRates[ch] || 0;
          const prevVal = prevDay.propertyRates[ch] || rateVal;
          const deltaPct = prevVal > 0 ? Math.round(((rateVal - prevVal) / prevVal) * 100) : 0;
          
          return {
            channel: ch,
            rate: rateVal,
            delta: deltaPct
          };
        });

        setRatesOverview(overview);

        // Core rates math
        const myRateVal = latestDay.propertyRates['Hotel Website'] || 0;
        setMyLatestRate(myRateVal);

        // Market Average rate
        const comps = Object.values(latestDay.competitorRates);
        let sum = 0;
        let count = 0;
        comps.forEach(compChs => {
          const rates = Object.values(compChs);
          if (rates.length > 0) {
            sum += rates.reduce((a, b) => a + b, 0) / rates.length;
            count++;
          }
        });
        const marketAvg = count > 0 ? Math.round(sum / count) : myRateVal + 15;
        setMarketAvgRate(marketAvg);

        // Recommended rate: direct formula (e.g. Market Avg + 8%)
        setRecommendedRate(Math.round(marketAvg * 1.05));

        // Rate position percentage
        const avgPosition = marketAvg > 0 ? Math.round((myRateVal / marketAvg) * 100) : 100;

        setKpis({
          avgPosition,
          parityCount: violations.length,
          unreadAlerts: unreadAlerts.length,
          propertiesCount: allProps.length
        });
      }

      // 5. Recent Alerts
      setRecentAlerts(allAlerts.slice(0, 3));

      // 6. Top Competitors list
      const compDetails = activeProperty.competitors.map((name, idx) => {
        // Mock rating and avg values based on property
        const baseVal = activeProperty.id === 'prop-azure' ? 140 : 90;
        const avgRate = Math.round(baseVal * (1.1 + (idx * 0.15)));
        const rating = (8.5 + (idx * 0.23)).toFixed(1);
        
        return {
          name,
          rating,
          avgRate
        };
      });
      setTopCompetitors(compDetails);

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeProperty]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    try {
      const results = await ratesService.searchWorldwideHotels(searchQuery, searchLocation);
      setSearchResults(results);
      setSearchExecuted(true);
    } catch (err) {
      console.error('Error searching hotels:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImport = async (hotel) => {
    setImportingId(hotel.name);
    try {
      const imported = await ratesService.importWorldwideHotel(hotel);
      setImportSuccessId(hotel.name);
      setTimeout(() => {
        setImportSuccessId(null);
      }, 2000);
      
      // Notify App to refresh active selectors
      if (onPropertyImported) {
        onPropertyImported(imported);
      }
    } catch (err) {
      console.error('Failed to import hotel:', err);
    } finally {
      setImportingId(null);
    }
  };

  if (loading && ratesOverview.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Worldwide Hotel Search Component */}
      <div className="panel-card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--primary-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Globe size={20} />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>Worldwide Hotel Search</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Search and add any hotel globally to track its rates</p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>HOTEL NAME</span>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="e.g. Marina Bay Sands, Burj Al Arab..."
                className="form-input"
                style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>CITY OR COUNTRY</span>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="City or country"
                className="form-input"
                style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>CHECK-IN</span>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="dd/mm/yyyy"
                className="form-input"
                style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>CHECK-OUT</span>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="dd/mm/yyyy"
                className="form-input"
                style={{ paddingLeft: '34px', width: '100%', fontSize: '13px' }}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-action-primary"
            disabled={searchLoading}
            style={{ height: '38px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            {searchLoading ? (
              <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', margin: 0 }}></div>
            ) : (
              <Search size={14} />
            )}
            <span>{searchLoading ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Search Results Display Drawer */}
        {searchExecuted && (
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Search Results ({searchResults.length})
            </h4>
            
            {searchResults.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No hotels found. Try searching "Singapore" or "Bangkok".</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {searchResults.map(hotel => (
                  <div 
                    key={hotel.name} 
                    style={{ 
                      padding: '12px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>{hotel.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{hotel.location}</span>
                    </div>

                    {importSuccessId === hotel.name ? (
                      <span style={{ color: 'var(--status-ok)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <Check size={14} />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleImport(hotel)}
                        disabled={importingId === hotel.name}
                        className="btn-action-outline"
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Title Row */}
      <div className="page-title-row" style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Monitoring {kpis.propertiesCount} hotels across 19 OTA platforms</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <RefreshCw size={12} className="spin" />
            <span>Refreshing in {timerSeconds}s</span>
          </div>
          <button 
            onClick={() => {
              setTimerSeconds(60);
              loadDashboardData();
            }} 
            className="btn-action-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderTop: '4px solid var(--primary-color)' }}>
          <div className="kpi-header">
            <span className="kpi-title">YOUR RATE</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>
              <span>{currencySymbol}</span>
            </div>
          </div>
          <div className="kpi-value">{currencySymbol}{convert(myLatestRate, activeProperty?.currency)}</div>
          <div className="kpi-desc">
            Direct website price
            <div className="kpi-trend down" style={{ marginTop: '4px' }}>
              <ArrowDownRight size={14} />
              <span>2.9% vs 24h ago</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="kpi-header">
            <span className="kpi-title">MARKET AVG</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--status-ok-bg)', color: 'var(--status-ok)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{currencySymbol}{convert(marketAvgRate, activeProperty?.currency)}</div>
          <div className="kpi-desc">
            Across all OTAs
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Based on 19 platforms</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid var(--status-warning)' }}>
          <div className="kpi-header">
            <span className="kpi-title">RECOMMENDED</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
              <Zap size={16} />
            </div>
          </div>
          <div className="kpi-value">{currencySymbol}{convert(recommendedRate, activeProperty?.currency)}</div>
          <div className="kpi-desc">
            Optimal selling rate
            <div style={{ fontSize: '11px', color: 'var(--status-ok)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Check size={12} />
              <span>AI-powered suggestion</span>
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTop: '4px solid var(--status-critical)' }}>
          <div className="kpi-header">
            <span className="kpi-title">PARITY ISSUES</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.parityCount}</div>
          <div className="kpi-desc">
            Rate discrepancies found
            <div style={{ color: 'var(--status-critical)', fontWeight: 600, marginTop: '4px' }}>Needs attention</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Rate Overview & Alerts */}
      <div className="dashboard-grid">
        {/* Left Side: Property Rate Overview */}
        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3 className="panel-title">Your Property Rate Overview</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeProperty?.name}</p>
            </div>
            <span className="panel-link" onClick={() => onViewChange('comparison')}>View All &rarr;</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ratesOverview.map(item => {
              const isUp = item.delta > 0;
              const isDown = item.delta < 0;
              
              // Scale visual progress bar value
              const maxScale = Math.max(...ratesOverview.map(o => o.rate));
              const pctWidth = maxScale > 0 ? (item.rate / maxScale) * 100 : 0;

              return (
                <div key={item.channel} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '110px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {item.channel === 'Hotel Website' ? 'Website' : item.channel}
                  </div>
                  
                  {/* Progress Bar Sparkline */}
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      backgroundColor: item.channel === 'Hotel Website' ? 'var(--primary-color)' : 'rgba(99, 102, 241, 0.6)', 
                      width: `${pctWidth}%`,
                      borderRadius: '4px'
                    }}></div>
                  </div>

                  <div style={{ width: '50px', textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>
                    {convert(item.rate, activeProperty?.currency)}
                  </div>

                  <div style={{ width: '70px', textAlign: 'right' }}>
                    {isUp ? (
                      <span style={{ color: 'var(--status-ok)', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowUpRight size={12} />
                        <span>+{item.delta}%</span>
                      </span>
                    ) : isDown ? (
                      <span style={{ color: 'var(--status-critical)', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowDownRight size={12} />
                        <span>{item.delta}%</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>0.0%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Recent Alerts */}
        <div className="panel-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Recent Alerts</h3>
            <span className="panel-link" onClick={() => onViewChange('alerts')}>View All &rarr;</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentAlerts.map(alert => (
              <div 
                key={alert.id}
                style={{ 
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${alert.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : alert.severity === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                  backgroundColor: 'var(--bg-app)',
                  padding: '16px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{alert.title}</strong>
                  <span className={`tag-severity ${alert.severity}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                    {alert.severity}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '6px' }}>
                  {alert.detail}
                </p>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width Row: Top Competitors */}
      <div className="panel-card" style={{ marginTop: '16px' }}>
        <div className="panel-title-row">
          <div>
            <h3 className="panel-title">Top Competitors</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Within 10km radius • Similar price range</p>
          </div>
          <span className="panel-link" onClick={() => onViewChange('comparison')}>
            Full Comparison &rarr;
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {topCompetitors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0' }}>
              No competitors configured.
            </p>
          ) : (
            topCompetitors.map(comp => (
              <div 
                key={comp.name} 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '16px',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Visual Thumbnail representation */}
                <div style={{ 
                  height: '80px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Home size={28} />
                </div>

                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {comp.name}
                  </strong>
                  
                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                    <Star size={12} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{comp.rating}</span>
                  </div>

                  {/* Avg Rate */}
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700 }}>
                      {convert(comp.avgRate, activeProperty?.currency)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {selectedCurrency} avg
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
