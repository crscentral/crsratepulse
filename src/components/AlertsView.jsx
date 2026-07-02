import React, { useEffect, useState } from 'react';
import { ratesService } from '../ratesService';
import { Bell, RefreshCw, Eye, CheckCheck, Trash2 } from 'lucide-react';

export default function AlertsView({ activeProperty, refreshAlertBadge }) {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'

  const loadAlerts = async () => {
    if (!activeProperty) return;
    setLoading(true);
    try {
      const data = await ratesService.getAlerts(activeProperty.id);
      setAlerts(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [activeProperty]);

  const handleMarkRead = async (id) => {
    await ratesService.markAlertRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    if (refreshAlertBadge) refreshAlertBadge();
  };

  const handleMarkAllRead = async () => {
    await ratesService.markAllAlertsRead(activeProperty?.id);
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    if (refreshAlertBadge) refreshAlertBadge();
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    // Read/Unread filter
    if (filter === 'unread' && a.read) return false;
    if (filter === 'read' && !a.read) return false;

    // Severity filter
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;

    return true;
  });

  if (!activeProperty) return null;

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Notification & Alerts Log</h1>
          <p className="page-subtitle">Historical log of competitor rate movements, local demand shocks, and channel anomalies</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleMarkAllRead} 
            className="btn-action-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CheckCheck size={14} />
            <span>Mark All Read</span>
          </button>
          <button 
            onClick={loadAlerts} 
            className="btn-action-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">State:</span>
          <div className="segmented-control">
            <button 
              className={`segmented-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Alerts ({alerts.length})
            </button>
            <button 
              className={`segmented-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({alerts.filter(a => !a.read).length})
            </button>
            <button 
              className={`segmented-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Read ({alerts.filter(a => a.read).length})
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Severity:</span>
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="form-select"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Alerts list */}
      <div className="panel-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading alerts log...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No alerts match your active filters.</p>
          </div>
        ) : (
          <div className="alert-list">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item severity-${alert.severity} ${!alert.read ? 'unread' : ''}`}
              >
                <div className="alert-content">
                  <div className="alert-title-row">
                    <span className="alert-title-text">{alert.title}</span>
                    <span className={`tag-severity ${alert.severity}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {alert.severity}
                    </span>
                    {!alert.read && <span className="alert-dot"></span>}
                  </div>
                  <p className="alert-desc">{alert.detail}</p>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                
                {!alert.read && (
                  <div>
                    <button 
                      onClick={() => handleMarkRead(alert.id)}
                      className="btn-icon-check"
                      title="Mark as read"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
