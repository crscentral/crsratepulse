import React, { useEffect, useState } from 'react';
import { ratesService } from '../ratesService';
import { Search, ChevronDown, RefreshCw } from 'lucide-react';

export default function RateComparisonView({ activeProperty, convert, currencySymbol, selectedCurrency }) {
  const [loading, setLoading] = useState(true);
  const [roomType, setRoomType] = useState('Deluxe Room');
  const [comparison, setComparison] = useState(null);

  const channels = [
    'Hotel Website', 'Agoda', 'Booking.com', 'Trip.com', 'Expedia', 
    'Traveloka', 'MakeMyTrip', 'Airbnb', 'HRS', 'Trivago', 
    'Tripadvisor', 'Lastminute', 'Skyscaner', 'Bluepillow', 'Cleartrip', 
    'Priceline', 'Vio.com', 'Hutchgo', 'Klook'
  ];

  const fetchComparisonData = async () => {
    if (!activeProperty) return;
    setLoading(true);
    try {
      const data = await ratesService.getRateComparison(activeProperty.id, roomType);
      setComparison(data);
    } catch (err) {
      console.error('Error fetching rate comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [activeProperty, roomType]);

  const renderDelta = (delta, sym) => {
    if (delta > 0) {
      return (
        <span className="delta-badge positive" style={{ fontSize: '10px', padding: '1px 4px' }}>
          +{sym}{Math.abs(delta)}
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="delta-badge negative" style={{ fontSize: '10px', padding: '1px 4px' }}>
          -{sym}{Math.abs(delta)}
        </span>
      );
    }
    return <span className="delta-badge equal" style={{ fontSize: '10px', padding: '1px 4px' }}>=</span>;
  };

  if (!activeProperty) return null;

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Rate Comparison Grid</h1>
          <p className="page-subtitle">Compare OTA channels against competitors in real-time</p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--status-ok)', 
            padding: '3px 8px', 
            borderRadius: '12px', 
            fontSize: '11px',
            fontWeight: 600,
            marginTop: '6px'
          }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--status-ok)',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite ease-in-out'
            }}></span>
            Live Google Search Rate Sync: Active (Checked just now)
          </div>
        </div>
        <button 
          onClick={fetchComparisonData} 
          className="btn-action-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Grid</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Selected Room Type:</span>
          <div className="segmented-control">
            {activeProperty.roomTypes.map(type => (
              <button 
                key={type}
                className={`segmented-btn ${roomType === type ? 'active' : ''}`}
                onClick={() => setRoomType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Comparing rates in <strong>{selectedCurrency} ({currencySymbol})</strong>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="panel-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Comparing live competitor rates...</p>
          </div>
        ) : !comparison ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No comparison data available.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-card)', zIndex: 3 }}>Hotel Property</th>
                  {channels.map(ch => (
                    <th key={ch} style={{ textPosition: 'center', minWidth: '120px' }}>
                      <span className="tag-ota" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span className={`badge-ota ${ch.toLowerCase().replace('.com', '').replace(/ /g, '').replace('.', '')}`} style={{ fontSize: '10px' }}>
                          {ch === 'Hotel Website' ? 'Direct' : ch.replace('.com', '')}
                        </span>
                        <span style={{ fontSize: '11px', textTransform: 'none', letterSpacing: 0 }}>{ch}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Your Property Row */}
                <tr style={{ backgroundColor: 'var(--bg-focus-row)', fontWeight: 600 }}>
                  <td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--bg-focus-row)', zIndex: 2 }}>
                    <div style={{ color: 'var(--primary-color)' }}>★ {comparison.property.name}</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Your Property
                    </span>
                  </td>
                  {channels.map(ch => (
                    <td key={ch} style={{ textAlign: 'center', fontWeight: 700 }}>
                      {comparison.property.rates[ch] ? (
                        <a
                          href={ratesService.getBookingUrl(comparison.property.name, ch)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rate-link"
                          style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed var(--text-muted)' }}
                          title={`View on ${ch}`}
                        >
                          {`${currencySymbol}${convert(comparison.property.rates[ch], activeProperty.currency)}`}
                        </a>
                      ) : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Competitor Rows */}
                {comparison.competitors.length === 0 ? (
                  <tr>
                    <td colSpan={channels.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No competitors configured. Go to Properties to configure competitor sets.
                    </td>
                  </tr>
                ) : (
                  comparison.competitors.map(comp => (
                    <tr key={comp.name}>
                      <td style={{ fontWeight: 500, position: 'sticky', left: 0, backgroundColor: 'var(--bg-card)', zIndex: 2 }}>{comp.name}</td>
                      {channels.map(ch => (
                        <td key={ch} style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 600 }}>
                            {comp.rates[ch]?.rate ? (
                              <a
                                href={ratesService.getBookingUrl(comp.name, ch)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rate-link"
                                style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed var(--text-muted)' }}
                                title={`View on ${ch}`}
                              >
                                {`${currencySymbol}${convert(comp.rates[ch].rate, activeProperty.currency)}`}
                              </a>
                            ) : 'N/A'}
                          </div>
                          {comp.rates[ch]?.rate ? renderDelta(convert(comp.rates[ch].delta, activeProperty.currency), currencySymbol) : null}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <span>* Green deltas indicate competitor is priced higher than you (opportunity to raise rate).</span>
        <span>* Red deltas indicate competitor is undercutting you (risk of losing bookings).</span>
      </div>
    </div>
  );
}
