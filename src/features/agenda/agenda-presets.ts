import type { AgendaSection } from '@/types';

let nextId = 1;
function uid() {
  return `preset-${nextId++}`;
}

export function getDefaultSections(): AgendaSection[] {
  nextId = 1;
  return [
    {
      id: uid(),
      title: 'Introductions',
      timeSlot: '',
      duration: 15,
      subItems: [
        'Welcome and team introductions',
        'Overview of agenda and objectives',
      ],
      enabled: true,
      isCustom: false,
      order: 0,
    },
    {
      id: uid(),
      title: 'Dashboard Navigation & Role Overview',
      timeSlot: '',
      duration: 45,
      subItems: [
        'Home dashboard and KPI portlets',
        'Role-based navigation and centers',
        'Saved searches and reporting overview',
        'Personalization and preferences',
      ],
      enabled: true,
      isCustom: false,
      order: 1,
    },
    {
      id: uid(),
      title: 'Item Management',
      timeSlot: '',
      duration: 20,
      subItems: [
        'Item types and item records',
        'Inventory management and stock levels',
      ],
      enabled: true,
      isCustom: false,
      order: 2,
    },
    {
      id: uid(),
      title: 'Customer and Order Management',
      timeSlot: '',
      duration: 20,
      subItems: [
        'Customer records and CRM overview',
        'Sales order creation and workflow',
        'Fulfillment and invoicing',
        'Payment application and collections',
      ],
      enabled: true,
      isCustom: false,
      order: 3,
    },
    {
      id: uid(),
      title: 'Purchasing',
      timeSlot: '',
      duration: 20,
      subItems: [
        'Purchase order creation and approval',
        'Receiving and vendor bill processing',
      ],
      enabled: true,
      isCustom: false,
      order: 4,
    },
    {
      id: uid(),
      title: 'Accounting',
      timeSlot: '',
      duration: 20,
      subItems: [
        'General ledger and chart of accounts',
        'Financial statements and reporting',
        'Period close process',
      ],
      enabled: true,
      isCustom: false,
      order: 5,
    },
    {
      id: uid(),
      title: 'Wrap-up & Next Steps',
      timeSlot: '',
      duration: 40,
      subItems: [
        'Q&A and open discussion',
        'Review action items and next steps',
      ],
      enabled: true,
      isCustom: false,
      order: 6,
    },
  ];
}

export const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
];
