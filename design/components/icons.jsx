/* global React */
// Minimal stroke icons — Lucide-style 16px default
const Icon = ({ d, size = 16, fill = 'none', stroke = 'currentColor', strokeWidth = 1.6, children }) => (
  <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Icon>,
  List: (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
  Note: (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/></Icon>,
  Kanban: (p) => <Icon {...p}><rect x="3" y="3" width="6" height="14" rx="1"/><rect x="10" y="3" width="6" height="10" rx="1"/><rect x="17" y="3" width="4" height="7" rx="1"/></Icon>,
  Habit: (p) => <Icon {...p}><path d="M20 7L9 18l-5-5"/></Icon>,
  Finance: (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Close: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  Filter: (p) => <Icon {...p}><path d="M3 6h18M7 12h10M11 18h2"/></Icon>,
  Grid: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Icon>,
  Table: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></Icon>,
  Gallery: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="12" y="3" width="9" height="8" rx="1"/><rect x="12" y="13" width="9" height="8" rx="1"/></Icon>,
  Lines: (p) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h18"/></Icon>,
  Star: (p) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>,
  Pin: (p) => <Icon {...p}><path d="M12 17v5M9 10.76V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4.76l1.5 2.24a1 1 0 0 1-.83 1.55H7.33a1 1 0 0 1-.83-1.55z"/></Icon>,
  Bold: (p) => <Icon {...p}><path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/></Icon>,
  Italic: (p) => <Icon {...p}><path d="M19 4h-9M14 20H5M15 4 9 20"/></Icon>,
  Quote: (p) => <Icon {...p}><path d="M3 21c3 0 7-1 7-8V5H3v8h3c0 4-3 4-3 4zm11 0c3 0 7-1 7-8V5h-7v8h3c0 4-3 4-3 4z"/></Icon>,
  Code: (p) => <Icon {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></Icon>,
  Link: (p) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>,
  Image: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></Icon>,
  Flag: (p) => <Icon {...p}><path d="M4 22V4a1 1 0 0 1 1-1h13l-3 5 3 5H5"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  Dots: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></Icon>,
  Logo: (p) => <Icon {...p}><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><circle cx="17" cy="17" r="4"/></Icon>,
  Pen: (p) => <Icon {...p}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Icon>,
  Phone: (p) => <Icon {...p}><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  Flame: (p) => <Icon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c0-2 1-3 3-4-1.5-1-3-1.5-2.5-5-2 1.5-4 3-4 6.5 0 0 .5 0 1 0z"/><path d="M12 22a8 8 0 0 0 8-8c0-5-4-7-4-10 0 0-2 2-3 3s-3 3-3 6c-2-1-3.5-2-3.5-4 0 0-2 3-2 5a8 8 0 0 0 7.5 8z"/></Icon>,
  CalendarCheck: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4M9 14l2 2 4-4"/></Icon>,
  TrendUp: (p) => <Icon {...p}><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></Icon>,
  CreditCard: (p) => <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Icon>,
};

window.Icons = Icons;
