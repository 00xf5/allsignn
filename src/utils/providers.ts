export interface ProviderPortal {
  id: string;
  name: string;
  portalUrl: string;
}

const PROVIDER_PORTALS: Record<string, ProviderPortal> = {
  outlook: {
    id: 'outlook',
    name: 'Outlook',
    portalUrl: 'https://outlook.live.com/mail/',
  },
  office365: {
    id: 'office365',
    name: 'Office 365',
    portalUrl: 'https://www.office.com/',
  },
  yahoo: {
    id: 'yahoo',
    name: 'Yahoo Mail',
    portalUrl: 'https://mail.yahoo.com/',
  },
  aol: {
    id: 'aol',
    name: 'AOL Mail',
    portalUrl: 'https://mail.aol.com/',
  },
  other: {
    id: 'other',
    name: 'Other Mail',
    portalUrl: 'https://mail.google.com/',
  },
  email: {
    id: 'email',
    name: 'Email',
    portalUrl: 'https://outlook.live.com/mail/',
  },
};

export function getProviderPortal(providerId: string): ProviderPortal {
  return PROVIDER_PORTALS[providerId] ?? PROVIDER_PORTALS.other;
}

export function formatNameFromEmail(email: string): string {
  const emailLocal = email.split('@')[0] || '';
  const formatted = emailLocal
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  return formatted || 'there';
}

export function buildWelcomeMessage(email: string, providerId: string): string {
  const name = formatNameFromEmail(email);
  const provider = getProviderPortal(providerId);

  return `Hi ${name}, welcome! You have successfully authenticated via ${provider.name}. Your account is now active and ready to use.`;
}
