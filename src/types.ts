export interface EmailProvider {
  id: string;
  name: string;
  buttonText: string;
  bgColor: string;
  hoverColor: string;
  iconBg: string;
  textColor: string;
  brandColor: string;
}

export type SecurityStep = 'CHOOSE_PROVIDER' | 'OAUTH_FLOW' | 'OAUTH_CONSENT' | 'ACCESS_GRANTED';

export interface RSVPRecord {
  id: string;
  name: string;
  email: string;
  status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  guests: number;
  note: string;
  timestamp: string;
}

export interface InvitationTemplate {
  id: string;
  title: string;
  host: string;
  date: string;
  time: string;
  location: string;
  balloonColor1: string;
  balloonColor2: string;
  primaryColor: string;
  emoji: string;
}
