import React, { useEffect, useState } from 'react';
import { ratesService } from '../ratesService';
import { RefreshCw, Calendar, Sparkles } from 'lucide-react';

export default function HeatmapView({ activeProperty, convert, currencySymbol, selectedCurrency }) {
  const [loading, setLoading] = useState(true);
  const [roomType, setRoomType] = useState('Deluxe Room');
  
  // Find standard dates in the 14-day history
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [matrixData, setMatrixData] = useState([]);
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(0);

  const channels = [
    'Hotel Website', 'Agoda', 'Booking.com', 'Trip.com', 'Expedia', 
    'Traveloka', 'MakeMyTrip', 'Airbnb', 'HRS', 'Trivago', 
    'Tripadvisor', 'Lastminute', 'Skyscaner', 'Bluepillow', 'Cleartrip', 
    'Priceline', 'Vio.com', 'Hutchgo', 'Klook'
  ];

  const loadHeatmapData = async () => {
    if (!activeProperty) return;
    setLoading(true);
    try {
      const history = await ratesService.getRatesHistory(activeProperty.id, roomType);
      
      // Extract unique dates from history
      const dates = history.map(h => h.date);
      setAvailableDates(dates);
      
      // Set default selected date to the latest day if not set
      let targetDate = selectedDate;
      if (!targetDate && dates.length > 0) {
        targetDate = dates[dates.length - 1];
        setSelectedDate(targetDate);
      }

      const activeDay = history.find(h => h.date === targetDate) || history[history.length - 1];
      
      if (activeDay) {
        // Compile hotel rows: Your Property + each Competitor
        const rows = [];
        
        // 1. Focus Hotel
        rows.push({
          name: `★ ${activeProperty.name}`,
          isFocus: true,
          rates: activeDay.propertyRates
        });

        // 2. Competitors
        activeProperty.competitors.forEach(comp => {
          rows.push({
            name: comp,
            isFocus: false,
            rates: activeDay.competitorRates[comp] || {}
          });
        });

        // Calculate min & max rates across the active matrix cells to build gradient
        let min = Infinity;
        let max = -Infinity;
        rows.forEach(r => {
          channels.forEach(ch => {
            const val = r.rates[ch];
            if (val && val > 0) {
              if (val < min) min = val;
              if (val > max) max = val;
            }
          });
        });

        setMinRate(min === Infinity ? 0 : min);
        setMaxRate(max === -Infinity ? 0 : max);
        setMatrixData(rows);
      }
    } catch (err) {
      console.error('Error loading heatmap matrix data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmapData();
  }, [activeProperty, roomType, selectedDate]);

  // Map cell rate value to background color gradient
  const getCellColorStyle = (rate) => {
    if (!rate || minRate === maxRate) return {};
    
    // Calculate ratio position
    const ratio = (rate - minRate) / (maxRate - minRate);

    // Green -> Gold/Orange -> Red
    let bg = '';
    if (ratio < 0.35) {
      bg = '#55c27c'; // Low (Green)
    } else if (ratio < 0.7) {
      bg = '#f5a65b'; // Mid (Orange/Gold)
    } else {
      bg = '#eb5463'; // High (Red)
    }

    return {
      backgroundColor: bg,
      color: '#ffffff',
      fontWeight: '600',
      textAlign: 'center'
    };
  };

  if (!activeProperty) return null;

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Market Rate Position Heatmap</h1>
          <p className="page-subtitle">Cross-property comparison matrix colored by market pricing distribution</p>
        </div>
        <button 
          onClick={loadHeatmapData} 
          className="btn-action-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Heatmap</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Room Type:</span>
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

        <div className="filter-group">
          <span className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            <span>Select Date:</span>
          </span>
          <select 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-select"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            {availableDates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        {minRate > 0 && maxRate > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <span className="filter-label">Price Range:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#55c27c', fontWeight: 600 }}>Low</span>
              <div style={{
                width: '80px',
                height: '10px',
                borderRadius: '5px',
                background: 'linear-gradient(to right, #55c27c, #f5a65b, #eb5463)'
              }}></div>
              <span style={{ color: '#eb5463', fontWeight: 600 }}>High</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {currencySymbol}{convert(minRate, activeProperty?.currency)} - {currencySymbol}{convert(maxRate, activeProperty?.currency)}
            </span>
          </div>
        )}
      </div>

      {/* Heatmap Matrix Table */}
      <div className="panel-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Compiling monthly rate indices...</p>
          </div>
        ) : matrixData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No competitor rate data configured.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-card)', zIndex: 2 }}>Hotel</th>
                  {channels.map(ch => (
                    <th key={ch} style={{ textAlign: 'center', minWidth: '110px', fontSize: '10px' }}>
                      {ch === 'Hotel Website' ? 'WEBSITE' : ch.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map(row => (
                  <tr 
                    key={row.name}
                    style={row.isFocus ? { backgroundColor: 'rgba(59, 130, 246, 0.03)', fontWeight: 600 } : {}}
                  >
                    <td 
                      style={{ 
                        position: 'sticky', 
                        left: 0, 
                        backgroundColor: row.isFocus ? 'rgba(235, 244, 255, 0.95)' : 'var(--bg-card)', 
                        zIndex: 1,
                        fontWeight: row.isFocus ? 700 : 500,
                        color: row.isFocus ? 'var(--primary-color)' : 'var(--text-primary)'
                      }}
                    >
                      {row.name}
                    </td>
                    {channels.map(ch => {
                      const rate = row.rates[ch];
                      return (
                        <td 
                          key={ch} 
                          style={{ 
                            textAlign: 'center',
                            padding: '8px'
                          }}
                        >
                          {rate ? (
                            <a
                              href={ratesService.getBookingUrl(row.name, ch)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'inherit', textDecoration: 'none' }}
                              title={`View ${row.name} on ${ch}`}
                            >
                              <div 
                                style={{ 
                                  ...getCellColorStyle(rate),
                                  padding: '6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {convert(rate, activeProperty?.currency)}
                              </div>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
        * Cells are color-coded based on overall price positioning on the selected date: Green cells represent the lowest rates in the market set, Yellow/Orange represent moderate rates, and Red cells represent premium peak pricing.
      </div>
    </div>
  );
}
