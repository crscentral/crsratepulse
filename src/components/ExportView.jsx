import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

export default function ExportView({ activeProperty }) {
  const [reportType, setReportType] = useState('rates'); // 'rates' | 'parity' | 'recommendations'
  const [dateRange, setDateRange] = useState('14'); // '7' | '14' | '30' | 'custom'
  const [format, setFormat] = useState('csv'); // 'csv' | 'pdf'
  
  // Progress states
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);

  const handleExport = (e) => {
    e.preventDefault();
    if (exporting) return;

    setExporting(true);
    setProgress(0);
    setDownloadReady(false);

    // Simulate export generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          setDownloadReady(true);
          triggerFileDownload();
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const triggerFileDownload = () => {
    // Generate text/csv content dynamically based on inputs
    const filename = `ratepulse_${activeProperty.name.toLowerCase().replace(/ /g, '_')}_${reportType}_report.${format}`;
    let content = '';

    if (format === 'csv') {
      if (reportType === 'rates') {
        content = "Date,Room Type,Direct Rate,Booking.com,Agoda,Expedia\n" +
                  `2026-07-02,Deluxe Room,${activeProperty.id === 'prop-azure' ? '4800,4850,4200,4900' : '90,92,90,95'}\n` +
                  `2026-07-01,Deluxe Room,${activeProperty.id === 'prop-azure' ? '4700,4700,4700,4750' : '88,90,88,90'}\n` +
                  `2026-06-30,Deluxe Room,${activeProperty.id === 'prop-azure' ? '4700,4800,4750,4800' : '88,88,88,88'}\n`;
      } else if (reportType === 'parity') {
        content = "Channel,Room Type,Direct Rate,OTA Rate,Difference %,Severity\n" +
                  `Agoda,Deluxe Room,${activeProperty.id === 'prop-azure' ? '4800,4200,12.5%,High' : '90,90,0%,At Parity'}\n` +
                  `Expedia,Premium Suite,${activeProperty.id === 'prop-azure' ? '6900,6800,1.4%,OK' : '150,145,3.3%,OK'}\n`;
      } else {
        content = "Recommendation ID,Room Type,Action Title,Rationale,Confidence\n" +
                  `rec-01,Deluxe Room,Raise Deluxe Room rate by 8% on Expedia & Agoda,Siam Sands raised Deluxe rates by 10%,High\n` +
                  `rec-02,Premium Suite,Fix Agoda Parity Violation,Agoda undercuts direct website rate by $15,High\n`;
      }
    } else {
      // Dummy PDF metadata representation
      content = `%PDF-1.4\n%RatePulse Report - ${activeProperty.name} - ${reportType.toUpperCase()}\nDate Range: Last ${dateRange} Days\nFormat: PDF`;
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/pdf;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="export-card">
      <div className="page-title-row">
        <h1 className="page-title">Generate Data Reports</h1>
        <p className="page-subtitle">Export rates histories, channel compliance audits, and recommendations as clean CSV or PDF sheets</p>
      </div>

      <div className="panel-card">
        <form onSubmit={handleExport}>
          {/* Report Type */}
          <div className="export-group">
            <label className="form-label">1. Choose Report Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="reportType" 
                  value="rates" 
                  checked={reportType === 'rates'}
                  onChange={() => setReportType('rates')}
                  className="radio-input"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} style={{ color: 'var(--primary-color)' }} />
                  <div>
                    <strong>Competitor Rate Logs</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Daily pricing values across all channels and properties</div>
                  </div>
                </div>
              </label>

              <label className="radio-label">
                <input 
                  type="radio" 
                  name="reportType" 
                  value="parity" 
                  checked={reportType === 'parity'}
                  onChange={() => setReportType('parity')}
                  className="radio-input"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--status-critical)' }} />
                  <div>
                    <strong>Rate Parity Violation Logs</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>OTA undercuts list audit sheet</div>
                  </div>
                </div>
              </label>

              <label className="radio-label">
                <input 
                  type="radio" 
                  name="reportType" 
                  value="recommendations" 
                  checked={reportType === 'recommendations'}
                  onChange={() => setReportType('recommendations')}
                  className="radio-input"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--status-warning)' }} />
                  <div>
                    <strong>Smart Pricing Action Plans</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Action items for revenue management adjustments</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

          {/* Date range & format grid */}
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">2. Select Date Range</label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
              >
                <option value="7">Last 7 Days</option>
                <option value="14">Last 14 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="custom">Current Month (Jul 2026)</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">3. Export Format</label>
              <select 
                value={format} 
                onChange={(e) => setFormat(e.target.value)}
                className="form-select"
              >
                <option value="csv">CSV Spreadsheet (.csv)</option>
                <option value="pdf">Adobe PDF Report (.pdf)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            {!exporting && !downloadReady && (
              <button 
                type="submit" 
                className="btn-action-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <Download size={18} />
                <span>Generate & Download Report</span>
              </button>
            )}

            {exporting && (
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Compiling report data ({progress}%)...
                </span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {downloadReady && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  backgroundColor: 'var(--status-ok-bg)', 
                  color: 'var(--status-ok)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <CheckCircle2 size={24} style={{ color: 'var(--status-ok)', flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Export Complete!</strong>
                  <span style={{ fontSize: '12px' }}>Your report file has been generated and downloaded.</span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
