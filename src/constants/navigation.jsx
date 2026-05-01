import React from 'react';

// Icon components for navigation
export const IconDashboard = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="10" height="18" rx="1.5" />
    <rect x="15" y="3" width="6" height="8" rx="1.5" />
    <rect x="15" y="13" width="6" height="8" rx="1.5" />
  </svg>
);

export const IconTracking = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21" />
    <rect x="4" y="13" width="4" height="8" rx="0.5" />
    <rect x="10" y="8" width="4" height="13" rx="0.5" />
    <rect x="16" y="4" width="4" height="17" rx="0.5" />
  </svg>
);

export const IconLibrary = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c0-1.1.9-2 2-2h5c1.1 0 2 .5 3 1.5C13 4.5 14 4 15 4h5c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2h-5c-1 0-2 .4-3 1-1-.6-2-1-3-1H4c-1.1 0-2-.9-2-2V6z" />
    <line x1="12" y1="5.5" x2="12" y2="20.5" />
  </svg>
);

export const IconPartners = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="7" r="3" />
    <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="7" r="3" />
    <path d="M16 14c1-.4 2-.6 3-.4 2.5.5 4 2.7 4 5.4" />
  </svg>
);

export const IconSettings = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconTalos = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M7.5 8H4L2 17h20l-2-9h-3.5" />
    <path d="M10 17v3.5h4V17" />
    <line x1="9" y1="8" x2="9" y2="8.01" strokeWidth={2.5} />
    <line x1="15" y1="8" x2="15" y2="8.01" strokeWidth={2.5} />
  </svg>
);

// Generic icon component for custom paths
export const NavIcon = ({ d, d2, size = 20, strokeW = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

export const IconSchedule = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8" y2="14.01" strokeWidth={2.5} />
    <line x1="12" y1="14" x2="12" y2="14.01" strokeWidth={2.5} />
    <line x1="16" y1="14" x2="16" y2="14.01" strokeWidth={2.5} />
    <line x1="8" y1="18" x2="8" y2="18.01" strokeWidth={2.5} />
    <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth={2.5} />
  </svg>
);

// Navigation items
export const NAV = [
  { id: "home",     icon: <IconDashboard />, tip: "Dashboard" },
  { id: "wall",     icon: <IconTracking />,  tip: "The Wall" },
  { id: "library",  icon: <IconLibrary />,   tip: "Library" },
  { id: "schedule", icon: <IconSchedule />,  tip: "Schedule" },
  { id: "partners", icon: <IconPartners />,  tip: "Partners" },
  { id: "talos",    icon: <IconTalos />,     tip: "TALOS" },
  { id: "settings", icon: <IconSettings />,  tip: "Settings" },
];