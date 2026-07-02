import React, { useEffect, useState } from 'react';
import { ratesService } from '../ratesService';
import { Lightbulb, TrendingUp, Sparkles, AlertCircle, RefreshCw, ThumbsUp, Check } from 'lucide-react';

export default function RecommendationsView({ activeProperty }) {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState([]);
  const [appliedRecs, setAppliedRecs] = useState(new Set());

  const fetchRecommendations = async () => {
    if (!activeProperty) return;
    setLoading(true);
    try {
      const data = await ratesService.getRecommendations(activeProperty.id);
      setRecs(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [activeProperty]);

  const handleApply = (id) => {
    // Add to applied set to show feedback
    setAppliedRecs(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Simulate dismissing/deleting after a timeout, or keep marked as applied
    setTimeout(() => {
      ratesService.dismissRecommendation(id);
      setRecs(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const handleDismiss = async (id) => {
    await ratesService.dismissRecommendation(id);
    setRecs(prev => prev.filter(r => r.id !== id));
  };

  if (!activeProperty) return null;

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Smart Pricing Recommendations</h1>
          <p className="page-subtitle">Revenue optimization recommendations powered by market intelligence and competitor movement</p>
        </div>
        <button 
          onClick={fetchRecommendations} 
          className="btn-action-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} />
          <span>Update Recommendations</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing market trends and demand forecasts...</p>
        </div>
      ) : recs.length === 0 ? (
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <ThumbsUp size={48} style={{ color: 'var(--status-ok)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>All Set!</h3>
          <p>Your property rates are highly optimized. No active recommendations at this time.</p>
        </div>
      ) : (
        <div className="rec-grid">
          {recs.map(rec => {
            const isApplied = appliedRecs.has(rec.id);
            return (
              <div key={rec.id} className="rec-card" style={{ borderTop: `4px solid ${rec.confidence === 'High' ? 'var(--primary-color)' : 'var(--status-warning)'}`, opacity: isApplied ? 0.7 : 1, transition: 'all 0.3s' }}>
                <div className="rec-badge-row">
                  <span className={`tag-severity ${rec.roomType.replace(' ', '-').toLowerCase()}`} style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {rec.roomType}
                  </span>
                  <span className={`rec-confidence ${rec.confidence.toLowerCase()}`}>
                    {rec.confidence} Confidence
                  </span>
                </div>

                <h3 className="rec-title" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Lightbulb size={20} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{rec.title}</span>
                </h3>

                <p className="rec-rationale">
                  {rec.rationale}
                </p>

                <div className="rec-impact-box">
                  <span className="rec-impact-label">Projected Impact</span>
                  <span className="rec-impact-val">{rec.impact}</span>
                </div>

                <div className="rec-actions">
                  {isApplied ? (
                    <button 
                      className="btn-action-primary" 
                      style={{ backgroundColor: 'var(--status-ok)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      disabled
                    >
                      <Check size={16} />
                      <span>Applied to Channel Manager</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleApply(rec.id)}
                        className="btn-action-primary"
                      >
                        Apply Price Change
                      </button>
                      <button 
                        onClick={() => handleDismiss(rec.id)}
                        className="btn-action-outline"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="panel-card" style={{ marginTop: '32px', backgroundColor: 'rgba(59, 130, 246, 0.02)', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Sparkles size={32} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Automatic Channel Synchronization</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            RatePulse is integrated with your property PMS and Channel Manager APIs. Clicking <strong>Apply Price Change</strong> immediately updates your rates across Direct Booking, Agoda, Booking.com, and Expedia channels simultaneously.
          </p>
        </div>
      </div>
    </div>
  );
}
