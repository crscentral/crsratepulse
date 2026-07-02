// RatePulse Data Service Layer
// This file acts as the single data-service module for the dashboard.
// It can easily be modified to fetch from a real backend/API instead of local/seeded data.

// Helper to generate a random number within range
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate 14 days of historical rate data leading up to today
const generateRateHistory = (properties) => {
  const history = {};
  const today = new Date();

  properties.forEach(prop => {
    history[prop.id] = [];
    // Generate data for each room type
    prop.roomTypes.forEach(roomType => {
      // Base rate for this property / room type
      let baseRate = prop.id === 'prop-azure' 
        ? (roomType === 'Deluxe Room' ? 140 : roomType === 'Premium Suite' ? 220 : 350)
        : (roomType === 'Deluxe Room' ? 90 : roomType === 'Premium Suite' ? 150 : 240);

      // Channels
      const channels = [
        'Hotel Website', 'Agoda', 'Booking.com', 'Trip.com', 'Expedia', 
        'Traveloka', 'MakeMyTrip', 'Airbnb', 'HRS', 'Trivago', 
        'Tripadvisor', 'Lastminute', 'Skyscaner', 'Bluepillow', 'Cleartrip', 
        'Priceline', 'Vio.com', 'Hutchgo', 'Klook'
      ];

      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Is it a weekend? (Friday/Saturday)
        const isWeekend = date.getDay() === 5 || date.getDay() === 6;
        const weekendPremium = isWeekend ? 1.2 : 1.0;

        // Generate rates for this property's channels
        const propertyRates = {};
        channels.forEach(ch => {
          let chRate = Math.round(baseRate * weekendPremium * (1 + (randomRange(-3, 3) / 100)));
          propertyRates[ch] = chRate;
        });

        // Generate rates for competitors
        const competitorRates = {};
        prop.competitors.forEach(comp => {
          competitorRates[comp] = {};
          channels.forEach(ch => {
            // Competitors might have slightly different prices
            let compBase = baseRate * (1 + (randomRange(-15, 15) / 100));
            let compRate = Math.round(compBase * weekendPremium * (1 + (randomRange(-3, 3) / 100)));
            competitorRates[comp][ch] = compRate;
          });
        });

        history[prop.id].push({
          date: dateStr,
          roomType,
          propertyRates,
          competitorRates
        });
      }
    });
  });

  return history;
};

// Seed properties
let properties = [
  {
    id: 'prop-azure',
    name: 'Azure Beach Resort',
    location: 'Phuket, Thailand',
    rooms: 68,
    currency: 'THB',
    currencySymbol: '฿',
    roomTypes: ['Deluxe Room', 'Premium Suite', 'Heritage Villa'],
    competitors: ['Lagoon Vista Resort', 'Andaman Breeze', 'Patong Cove Hotel', 'Siam Sands']
  },
  {
    id: 'prop-dhavara',
    name: 'Dhavara Boutique Hotel',
    location: 'Vientiane, Laos',
    rooms: 26,
    currency: 'USD',
    currencySymbol: '$',
    roomTypes: ['Deluxe Room', 'Premium Suite', 'Heritage Villa'],
    competitors: [
      'Lanith Boutique Hotel',
      'Settha Palace Hotel',
      'Salana Boutique Hotel',
      'Ansara Hotel',
      'Green Park Boutique Hotel',
      'Lao Poet House',
      'Crowne Plaza Vientiane',
      'Landmark Mekong Riverside',
      'Muong Thanh Luxury Vientiane',
      'Somadevi Vientiane Hotel'
    ]
  }
];

// Initialize rate history
let rateHistory = generateRateHistory(properties);

// Seed alerts
let alerts = [
  {
    id: 'alert-1',
    propertyId: 'prop-azure',
    severity: 'high',
    title: 'Parity Breach: Agoda',
    detail: 'Agoda is undercutting Direct rate by 12% on Deluxe Room (฿4,200 vs ฿4,800).',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
    read: false
  },
  {
    id: 'alert-2',
    propertyId: 'prop-azure',
    severity: 'medium',
    title: 'Competitor Price Drop: Siam Sands',
    detail: 'Siam Sands lowered Premium Suite rate by 15% on Booking.com for next weekend.',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hrs ago
    read: false
  },
  {
    id: 'alert-3',
    propertyId: 'prop-dhavara',
    severity: 'high',
    title: 'Parity Breach: Expedia',
    detail: 'Expedia undercutting Direct rate by 8% on Heritage Villa ($220 vs $240).',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hrs ago
    read: false
  },
  {
    id: 'alert-4',
    propertyId: 'prop-azure',
    severity: 'low',
    title: 'Demand Spike Detected',
    detail: 'High occupancy forecast in Phuket region for Nov 14-16. Competitor rates rising.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    read: true
  },
  {
    id: 'alert-5',
    propertyId: 'prop-dhavara',
    severity: 'medium',
    title: 'Competitor Price Hike: Settha Palace',
    detail: 'Settha Palace Hotel raised Deluxe Room rate to $115 on all channels.',
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
    read: true
  }
];

// Seed recommendations
let recommendations = [
  {
    id: 'rec-1',
    propertyId: 'prop-azure',
    title: 'Raise Deluxe Room rate by 8% on Expedia & Agoda',
    roomType: 'Deluxe Room',
    rationale: 'Siam Sands and Andaman Breeze have raised their rates by 10% for next weekend. Demand signals are strong with regional events, and your rate is currently the lowest in the competitor set.',
    impact: 'Estimated revenue increase of ฿18,500 over 3 days.',
    confidence: 'High'
  },
  {
    id: 'rec-2',
    propertyId: 'prop-azure',
    title: 'Fix Agoda Parity Violation (Premium Suite)',
    roomType: 'Premium Suite',
    rationale: 'Agoda is currently selling the Premium Suite at ฿6,200, which undercuts your direct rate of ฿6,900. This violates parity and shifts direct bookings to OTAs.',
    impact: 'Reclaim ฿2,100 in direct booking margins per booking.',
    confidence: 'High'
  },
  {
    id: 'rec-3',
    propertyId: 'prop-dhavara',
    title: 'Increase Deluxe Room rate by 5%',
    roomType: 'Deluxe Room',
    rationale: 'Competitor set average for Deluxe Room is $105, while Dhavara is priced at $90. Increasing rate to $95 keeps you competitive while capturing more margin.',
    impact: 'Estimated monthly margin increase of $450.',
    confidence: 'Medium'
  },
  {
    id: 'rec-4',
    propertyId: 'prop-dhavara',
    title: 'Implement 10% discount on Heritage Villa for mid-week stay',
    roomType: 'Heritage Villa',
    rationale: 'Competitor occupancy for boutique villas is dropping. Offering a targeted 10% discount for Tuesday-Wednesday bookings will stimulate mid-week demand.',
    impact: 'Expected villa occupancy increase of 15%.',
    confidence: 'Medium'
  }
];

export const ratesService = {
  // Get all properties
  getProperties: async () => {
    return [...properties];
  },

  // Add a new property
  addProperty: async (property) => {
    const newProp = {
      id: `prop-${Date.now()}`,
      currency: 'USD',
      currencySymbol: '$',
      roomTypes: ['Deluxe Room', 'Premium Suite', 'Heritage Villa'],
      competitors: [],
      ...property
    };
    properties.push(newProp);
    // Generate rate history for the new property
    const newHistory = generateRateHistory([newProp]);
    rateHistory = { ...rateHistory, ...newHistory };
    return newProp;
  },

  // Update property competitor list
  updateCompetitors: async (propertyId, competitorsList) => {
    const propIndex = properties.findIndex(p => p.id === propertyId);
    if (propIndex !== -1) {
      properties[propIndex].competitors = competitorsList;
      // Regenerate rate history to reflect new competitor list
      const singleHistory = generateRateHistory([properties[propIndex]]);
      rateHistory[propertyId] = singleHistory[propertyId];
      return true;
    }
    return false;
  },

  // Get rates history for trailing 14 days
  getRatesHistory: async (propertyId, roomType) => {
    const history = rateHistory[propertyId] || [];
    return history.filter(item => item.roomType === roomType);
  },

  // Get rate comparison table data
  getRateComparison: async (propertyId, roomType) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return null;

    const history = rateHistory[propertyId] || [];
    // Get the latest day's rate entry
    const latestEntries = history.filter(item => item.roomType === roomType);
    if (latestEntries.length === 0) return null;

    const latest = latestEntries[latestEntries.length - 1];
    
    // Structure comparison data:
    // Row 1: Your Property (Direct, Booking.com, Agoda, Expedia)
    // Row 2-N: Competitors (Direct, Booking.com, Agoda, Expedia)
    const channels = [
      'Hotel Website', 'Agoda', 'Booking.com', 'Trip.com', 'Expedia', 
      'Traveloka', 'MakeMyTrip', 'Airbnb', 'HRS', 'Trivago', 
      'Tripadvisor', 'Lastminute', 'Skyscaner', 'Bluepillow', 'Cleartrip', 
      'Priceline', 'Vio.com', 'Hutchgo', 'Klook'
    ];
    const comparison = {
      property: {
        name: prop.name,
        rates: latest.propertyRates
      },
      competitors: prop.competitors.map(compName => {
        const compRates = latest.competitorRates[compName] || {};
        const ratesWithDeltas = {};
        
        channels.forEach(ch => {
          const compRate = compRates[ch] || 0;
          const myRate = latest.propertyRates[ch] || 0;
          ratesWithDeltas[ch] = {
            rate: compRate,
            delta: compRate - myRate // Competitor rate - My rate
          };
        });

        return {
          name: compName,
          rates: ratesWithDeltas
        };
      })
    };

    return comparison;
  },

  // Get Rate Parity Violations
  getParityViolations: async (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return [];

    const history = rateHistory[propertyId] || [];
    // Filter down to the latest rates for each room type
    const latestViolations = [];

    prop.roomTypes.forEach(roomType => {
      const typeHistory = history.filter(item => item.roomType === roomType);
      if (typeHistory.length === 0) return;
      const latest = typeHistory[typeHistory.length - 1];
      
      const directRate = latest.propertyRates['Hotel Website'];
      const otaChannels = [
        'Agoda', 'Booking.com', 'Trip.com', 'Expedia', 'Traveloka', 
        'MakeMyTrip', 'Airbnb', 'HRS', 'Trivago', 'Tripadvisor', 
        'Lastminute', 'Skyscaner', 'Bluepillow', 'Cleartrip', 
        'Priceline', 'Vio.com', 'Hutchgo', 'Klook'
      ];

      otaChannels.forEach(ota => {
        const otaRate = latest.propertyRates[ota];
        if (otaRate < directRate) {
          // Parity violation! OTA is undercutting Direct rate.
          const diff = directRate - otaRate;
          const pct = Math.round((diff / directRate) * 100);
          
          let severity = 'ok';
          if (pct >= 10) severity = 'high';
          else if (pct >= 5) severity = 'medium';

          latestViolations.push({
            id: `parity-${propertyId}-${roomType}-${ota}`,
            roomType,
            channel: ota,
            directRate,
            otaRate,
            difference: diff,
            percentage: pct,
            severity
          });
        }
      });
    });

    return latestViolations;
  },

  // Get pricing recommendations
  getRecommendations: async (propertyId) => {
    return recommendations.filter(rec => rec.propertyId === propertyId);
  },

  // Acknowledge/dismiss recommendation
  dismissRecommendation: async (recId) => {
    recommendations = recommendations.filter(rec => rec.id !== recId);
    return true;
  },

  // Get alerts
  getAlerts: async (propertyId) => {
    if (propertyId) {
      return alerts.filter(a => a.propertyId === propertyId);
    }
    return [...alerts];
  },

  // Mark alert as read
  markAlertRead: async (alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      return true;
    }
    return false;
  },

  // Mark all alerts as read
  markAllAlertsRead: async (propertyId) => {
    alerts.forEach(a => {
      if (!propertyId || a.propertyId === propertyId) {
        a.read = true;
      }
    });
    return true;
  },

  // Search worldwide hotels database (Mock API)
  searchWorldwideHotels: async (query, location) => {
    const db = [
      { name: 'Marina Bay Sands', location: 'Singapore', rooms: 2560, rating: 9.0, avgRate: 524, currency: 'SGD' },
      { name: 'Raffles Hotel', location: 'Singapore', rooms: 115, rating: 9.4, avgRate: 673, currency: 'SGD' },
      { name: 'Fullerton Hotel', location: 'Singapore', rooms: 400, rating: 9.1, avgRate: 427, currency: 'SGD' },
      { name: 'Shangri-La Singapore', location: 'Singapore', rooms: 792, rating: 8.9, avgRate: 347, currency: 'SGD' },
      { name: 'Pan Pacific Singapore', location: 'Singapore', rooms: 790, rating: 8.7, avgRate: 307, currency: 'SGD' },
      { name: 'Burj Al Arab Jumeirah', location: 'Dubai, UAE', rooms: 202, rating: 9.8, avgRate: 1200, currency: 'USD' },
      { name: 'The Plaza New York', location: 'New York, USA', rooms: 282, rating: 9.3, avgRate: 750, currency: 'USD' },
      { name: 'Bellagio Las Vegas', location: 'Las Vegas, USA', rooms: 3933, rating: 9.0, avgRate: 280, currency: 'USD' },
      { name: 'The Savoy London', location: 'London, UK', rooms: 268, rating: 9.4, avgRate: 580, currency: 'USD' },
      { name: 'Mandarin Oriental Bangkok', location: 'Bangkok, Thailand', rooms: 324, rating: 9.6, avgRate: 450, currency: 'USD' }
    ];

    return db.filter(h => {
      const matchName = !query || h.name.toLowerCase().includes(query.toLowerCase());
      const matchLoc = !location || h.location.toLowerCase().includes(location.toLowerCase());
      return matchName && matchLoc;
    });
  },

  // Import a hotel from worldwide database into My Properties
  importWorldwideHotel: async (hotel) => {
    // Check if already exists
    const exists = properties.find(p => p.name.toLowerCase() === hotel.name.toLowerCase());
    if (exists) return exists;

    const newProp = {
      id: `prop-${Date.now()}`,
      name: hotel.name,
      location: hotel.location,
      rooms: hotel.rooms || 50,
      currency: hotel.currency || 'USD',
      currencySymbol: hotel.currency === 'SGD' ? 'S$' : hotel.currency === 'THB' ? '฿' : '$',
      roomTypes: ['Deluxe Room', 'Premium Suite', 'Heritage Villa'],
      competitors: ['Lagoon Vista Resort', 'Andaman Breeze', 'Siam Sands'] // default competitor set
    };
    
    properties.push(newProp);
    
    // Generate rates history for the imported hotel
    const newHistory = generateRateHistory([newProp]);
    rateHistory = { ...rateHistory, ...newHistory };
    
    return newProp;
  },

  // Get active currency symbol helper
  getCurrencySymbol: (currency) => {
    const symbols = {
      USD: '$',
      INR: '₹',
      THB: '฿',
      LAK: '₭',
      EUR: '€',
      SGD: 'S$',
      MYR: 'RM',
      VND: '₫',
      CNY: '¥',
      NPR: '₨',
      JPY: '¥'
    };
    return symbols[currency] || '$';
  },

  // Convert rate value
  convertRate: (amount, fromCurrency, toCurrency) => {
    const exchangeRates = {
      USD: 1.0,
      INR: 83.5,
      THB: 36.4,
      LAK: 21900.0,
      EUR: 0.92,
      SGD: 1.35,
      MYR: 4.71,
      VND: 25450.0,
      CNY: 7.26,
      NPR: 133.6,
      JPY: 161.2
    };
    if (!amount) return 0;
    if (fromCurrency === toCurrency) return amount;
    
    const rateInUSD = amount / (exchangeRates[fromCurrency] || 1.0);
    const converted = rateInUSD * (exchangeRates[toCurrency] || 1.0);
    return Math.round(converted);
  }
};

