export const STAFF = [
  { name: 'Dominic', code: 'HOD' },
  { name: 'Sarkaut', code: 'SAI' },
  { name: 'Patrik', code: 'PAI' },
  { name: 'Laura', code: 'LIR' },
  { name: 'Dietmar', code: 'NAD' },
  { name: 'Philipp', code: 'GEL' },
  { name: 'Imke', code: 'IMK' },
] as const;

export const COMPANIES = [
  { id: 'SEI', name: 'Servus',        color: '#4da3db', textColor: '#ffffff' },
  { id: 'ROB', name: 'Robotunits',    color: '#607d8b', textColor: '#ffffff' },
  { id: 'HIF', name: 'Heron',         color: '#2c5282', textColor: '#ffffff' },
  { id: 'CNC', name: 'CNC Technik',   color: '#e53e3e', textColor: '#ffffff' },
  { id: 'VEG', name: 'Vertic Greens', color: '#38a169', textColor: '#ffffff' },
  { id: 'EIH', name: 'Einheit',       color: '#a3cf58', textColor: '#ffffff' },
  { id: 'SCH', name: 'Schnecko',      color: '#fdf2e9', textColor: '#1a202c' },
] as const;

export const DURATION_OPTIONS = [
  { label: '15 min',  minutes: 15  },
  { label: '30 min',  minutes: 30  },
  { label: '45 min',  minutes: 45  },
  { label: '1 Std',   minutes: 60  },
  { label: '1½ Std',  minutes: 90  },
  { label: '2 Std',   minutes: 120 },
  { label: '2½ Std',  minutes: 150 },
  { label: '3 Std',   minutes: 180 },
  { label: '4 Std',   minutes: 240 },
  { label: '5 Std',   minutes: 300 },
  { label: '6 Std',   minutes: 360 },
  { label: '7 Std',   minutes: 420 },
  { label: '8 Std',   minutes: 480 },
] as const;

export type CompanyId = typeof COMPANIES[number]['id'];
export type StaffCode = typeof STAFF[number]['code'];
