import React, { useEffect, useState } from 'react';
import { ratesService } from '../ratesService';
import { AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

export default function RateParityView({ activeProperty, onViewChange, convert, currencySymbol, selectedCurrency }) {
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState([]);
  
  const loadParityData = async () => {
    if (!activeProperty) return;
    setLoading(true);
    try {
      const data = await ratesService.getParityViolations(activeProperty.id);
      setViolations(data);
    } catch (err) {
      console.error('Error loading parity violations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParityData();
  }, [activeProperty]);

  if (!activeProperty) return null;

  // Counts by severity
  const highCount = violations.filter(v => v.severity === 'high').length;
  const mediumCount = violations.filter(v => v.severity === 'medium').length;
  const okCount = violations.filter(v => v.severity === 'ok').length;

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Rate Parity Diagnostics</h1>
          <p className="page-subtitle">Track cases where OTAs are undercutting your direct-booking website rate</p>
        </div>
        <button 
          onClick={loadParityData} 
          className="btn-action-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} />
          <span>Scan Parity</span>
        </button>
      </div>

      {/* Severity summaries */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-critical)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ color: 'var(--status-critical)' }}>Critical Undercuts</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value">{highCount}</div>
          <div className="kpi-desc">OTA rate undercuts Direct rate by &gt;= 10%</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ color: 'var(--status-warning)' }}>Medium Undercuts</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value">{mediumCount}</div>
          <div className="kpi-desc">OTA rate undercuts Direct rate by 5% to 9%</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-ok)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ color: 'var(--status-ok)' }}>At Parity / OK</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--status-ok-bg)', color: 'var(--status-ok)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">{violations.length === 0 ? 'Healthy' : okCount}</div>
          <div className="kpi-desc">OTA rate at parity or undercuts by &lt; 5%</div>
        </div>
      </div>

      {/* Violations list */}
      <div className="panel-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Parity Violations Log</h3>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Scanning distribution channels...</p>
          </div>
        ) : violations.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={48} style={{ color: 'var(--status-ok)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Excellent Rate Parity!</h3>
            <p>No OTA channels are undercutting your direct rates currently.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>OTA Channel</th>
                  <th>Room Type</th>
                  <th>Direct Rate</th>
                  <th>OTA Price</th>
                  <th>Undercut Value</th>
                  <th>Undercut %</th>
                  <th>Severity</th>
                  <th>Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {violations.map(violation => (
                  <tr key={violation.id}>
                    <td>
                      <span className="tag-ota">
                        <span className={`badge-ota ${violation.channel.toLowerCase().replace('.com', '')}`}>
                          {violation.channel.replace('.com', '')}
                        </span>
                        <span>{violation.channel}</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{violation.roomType}</td>
                    <td>
                      <a
                        href={ratesService.getBookingUrl(activeProperty.name, 'Hotel Website')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rate-link"
                        style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed var(--text-muted)' }}
                        title="View direct website price"
                      >
                        {currencySymbol}{convert(violation.directRate, activeProperty.currency)}
                      </a>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--status-critical)' }}>
                      <a
                        href={ratesService.getBookingUrl(activeProperty.name, violation.channel)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rate-link"
                        style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed var(--text-muted)' }}
                        title={`View on ${violation.channel}`}
                      >
                        {currencySymbol}{convert(violation.otaRate, activeProperty.currency)}
                      </a>
                    </td>
                    <td>
                      {currencySymbol}{convert(violation.difference, activeProperty.currency)}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {violation.percentage}%
                    </td>
                    <td>
                      <span className={`tag-severity ${violation.severity}`}>
                        {violation.severity}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => onViewChange('recommendations')}
                        className="btn-action-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
                      >
                        <span>View Smart Pricing Action</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="panel-card" style={{ marginTop: '24px', backgroundColor: 'rgba(59, 130, 246, 0.02)', border: '1px dashed var(--border-color)' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Why does Rate Parity matter?</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          When online travel agencies (OTAs) list prices lower than your direct brand website, travelers will book through the OTA. 
          This forces you to pay high commission percentages (15-22%) and reduces your net operating margins. 
          Use the <strong>Smart Pricing</strong> view to check recommendations to restore parity by raising OTA rates or adjusting direct pricing incentives.
        </p>
      </div>
    </div>
  );
}
