import React, { useEffect, useState } from 'react';
import { ratesService } from '../ratesService';
import { Home, MapPin, BedDouble, Users, Plus, X, PlusCircle } from 'lucide-react';

export default function PropertiesView({ onPropertyCreated, activePropertyId, onSelectProperty }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Competitors state
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [newCompetitorName, setNewCompetitorName] = useState('');

  // Add Property form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rooms, setRooms] = useState(25);
  const [competitorsInput, setCompetitorsInput] = useState('');

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await ratesService.getProperties();
      setProperties(data);
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleAddCompetitor = async (e, propId) => {
    e.preventDefault();
    if (!newCompetitorName.trim()) return;

    const prop = properties.find(p => p.id === propId);
    if (prop) {
      const updatedComps = [...prop.competitors, newCompetitorName.trim()];
      await ratesService.updateCompetitors(propId, updatedComps);
      setNewCompetitorName('');
      loadProperties();
    }
  };

  const handleRemoveCompetitor = async (propId, compName) => {
    const prop = properties.find(p => p.id === propId);
    if (prop) {
      const updatedComps = prop.competitors.filter(c => c !== compName);
      await ratesService.updateCompetitors(propId, updatedComps);
      loadProperties();
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    // Convert comma-separated competitors to array
    const comps = competitorsInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const newProp = {
      name: name.trim(),
      location: location.trim(),
      rooms: parseInt(rooms) || 10,
      competitors: comps
    };

    try {
      const created = await ratesService.addProperty(newProp);
      
      // Reset form
      setName('');
      setLocation('');
      setRooms(25);
      setCompetitorsInput('');
      setShowAddForm(false);
      
      loadProperties();
      
      // Notify parent app (in case it needs to refresh dropdown selectors)
      if (onPropertyCreated) onPropertyCreated(created);
    } catch (err) {
      console.error('Error creating property:', err);
    }
  };

  return (
    <div>
      <div className="page-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Manage Properties & Competitor Sets</h1>
          <p className="page-subtitle">Configure your hotel profile properties and custom benchmarking competitive indexes</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="btn-action-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Add New Property</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading property registry...</p>
        </div>
      ) : (
        <div className="property-list-grid">
          {properties.map(prop => (
            <div 
              key={prop.id} 
              className="panel-card"
              style={{
                border: prop.id === activePropertyId ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="panel-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Home size={18} style={{ color: 'var(--primary-color)' }} />
                    <span>{prop.name}</span>
                  </h3>
                  
                  <div className="property-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{prop.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BedDouble size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{prop.rooms} Rooms Tracked</span>
                    </div>
                  </div>
                </div>

                {prop.id !== activePropertyId && (
                  <button 
                    onClick={() => onSelectProperty(prop)}
                    className="btn-action-outline"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Set Active Focus
                  </button>
                )}
              </div>

              {/* Competitor Set Section */}
              <div>
                <div className="competitor-set-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} />
                    <span>Competitor Benchmark Set ({prop.competitors.length})</span>
                  </span>
                </div>

                <div className="competitor-tag-list" style={{ marginBottom: '16px' }}>
                  {prop.competitors.map(comp => (
                    <span key={comp} className="competitor-tag">
                      <span>{comp}</span>
                      <button 
                        onClick={() => handleRemoveCompetitor(prop.id, comp)}
                        className="btn-remove-tag"
                        title="Remove competitor"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Inline form to add competitor */}
                <form 
                  onSubmit={(e) => handleAddCompetitor(e, prop.id)}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input 
                    type="text" 
                    placeholder="Add competitor hotel name..."
                    className="form-input"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '12px' }}
                    value={editingPropertyId === prop.id ? newCompetitorName : ''}
                    onFocus={() => setEditingPropertyId(prop.id)}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn-action-outline"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Register Property</h3>
            
            <form onSubmit={handleCreateProperty}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="form-field">
                  <label className="form-label">Property Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Settha Palace Hotel"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Vientiane, Laos"
                    className="form-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Total Room Count</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Competitors (Comma-separated)</label>
                  <textarea 
                    placeholder="e.g. Lanith Hotel, Somadevi Resort, Lao Poet House"
                    className="form-input"
                    style={{ height: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                    value={competitorsInput}
                    onChange={(e) => setCompetitorsInput(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Add initial competitors separated by commas. You can modify them later.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="btn-action-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-action-primary"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
