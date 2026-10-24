import React from 'react';
import { Globe } from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const NotionIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path
      d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.458-.84c.373 0 .187-.373.093-.466L16.486 1.83c-.466-.373-1.026-.653-2.053-.56L3.433 2.156c-.56.047-.653.373-.466.56l1.492 1.492zm.84 3.918v12.966c0 .746.373 1.026 1.12 1.026l12.77-.746c.746 0 .933-.56.933-1.12V7.193c0-.653-.28-1.026-.933-.933l-13.05.84c-.56.047-.84.373-.84 1.026zm11.938.84c.093.466 0 .933-.466.933l-.746.093v9.048c-.466.28-.933.466-1.4.466-.653 0-.933-.187-1.492-.84l-4.29-6.81v6.903l1.306.28s0 .746-.84.746l-2.89.187c-.093-.187 0-.746.373-.84l.84-.187V9.712L8.277 9.62c-.093-.28 0-.84.56-.84l3.172-.187 4.57 7.09V9.06l-1.12-.093c-.093-.466.187-.84.653-.84l2.146-.187z"
      fill="#000000"
    />
  </svg>
);

export const ChatGptIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path
      d="M20.5 10.2a5.8 5.8 0 0 0-.5-4.4 6 6 0 0 0-5.3-3.1 5.7 5.7 0 0 0-4.6 2.3A5.9 5.9 0 0 0 6 6.3a6 6 0 0 0-3.9 4.3 5.9 5.9 0 0 0 .9 5.2 5.9 5.9 0 0 0 .5 4.4 6 6 0 0 0 5.3 3.1 5.7 5.7 0 0 0 4.6-2.3 5.9 5.9 0 0 0 4.1-1.3 6 6 0 0 0 3.9-4.3 5.9 5.9 0 0 0-.9-5.2zm-7.7 10.9a4.6 4.6 0 0 1-2.9-1.1l.1-.1 4.5-2.6a.7.7 0 0 0 .4-.6v-6.3l1.9 1.1a.1.1 0 0 1 .1.1v5.1a4.6 4.6 0 0 1-4.1 4.4zm-7.3-3.7a4.6 4.6 0 0 1-.6-3.1l.1.1 4.5 2.6a.7.7 0 0 0 .7 0l5.5-3.2v2.2a.1.1 0 0 1 0 .1l-4.4 2.6a4.6 4.6 0 0 1-5.8-1.3zm-1.8-7.9a4.6 4.6 0 0 1 2.3-2l-.1.1v5.2a.7.7 0 0 0 .4.6l5.5 3.2-1.9 1.1a.1.1 0 0 1-.1 0L5.3 12a4.6 4.6 0 0 1-1.6-2.5zm13.1-.7l-5.5-3.2 1.9-1.1a.1.1 0 0 1 .1 0l4.4 2.5a4.6 4.6 0 0 1 1.7 5.6 4.6 4.6 0 0 1-2.2 2v-5.2a.7.7 0 0 0-.4-.6zm3 4.8a4.6 4.6 0 0 1 .6 3.1l-.1-.1-4.5-2.6a.7.7 0 0 0-.7 0l-5.5 3.2v-2.2a.1.1 0 0 1 0-.1l4.4-2.6a4.6 4.6 0 0 1 5.8 1.3zm-8.8-1.5l-2.4-1.4 2.4-1.4 2.4 1.4-2.4 1.4z"
      fill="#10a37f"
    />
  </svg>
);

export const YouTubeIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <rect width="24" height="24" rx="5" fill="#FF0000" />
    <path d="M9.75 16.5l6-4.5-6-4.5v9z" fill="#FFFFFF" />
  </svg>
);

export const FigmaIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4z" fill="#0ACF83"/>
    <path d="M4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z" fill="#A259FF"/>
    <path d="M4 4c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z" fill="#F24E1E"/>
    <path d="M12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0z" fill="#FF7262"/>
    <circle cx="16" cy="12" r="4" fill="#1ABCFE"/>
  </svg>
);

export const GitHubIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      fill="#181717"
    />
  </svg>
);

export const UnityIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path
      d="M10.82 2.2a.8.8 0 0 1 .76 0l9.6 5.54a.8.8 0 0 1 .4.69v11.08a.8.8 0 0 1-.4.69l-9.6 5.54a.8.8 0 0 1-.76 0l-9.6-5.54a.8.8 0 0 1-.4-.69V8.43a.8.8 0 0 1 .4-.69l9.6-5.54z"
      fill="#222C37"
    />
    <path
      d="M12 5.5l5.5 9.5h-11L12 5.5zm0 3.2l-3.3 5.7h6.6L12 8.7z"
      fill="#FFFFFF"
    />
  </svg>
);

export const GoogleDocsIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#4285F4"/>
    <path d="M14 2v6h6l-6-6z" fill="#A1C2FA"/>
    <path d="M8 13h8M8 17h5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BehanceIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <rect width="24" height="24" rx="4" fill="#0057FF" />
    <path
      d="M7.8 7.5H4v9h4c1.8 0 2.8-.8 2.8-2.2 0-.9-.5-1.5-1.3-1.8.6-.3 1-.9 1-1.7 0-1.5-1-2.1-2.7-2.1zm-1.8 3.3h1.4c.6 0 1 .2 1 .7s-.4.7-1 .7H6v-1.4zm1.5 4H6v-1.6h1.5c.7 0 1.1.2 1.1.8 0 .6-.4.8-1.1.8zm7.5-5.3c-2.3 0-3.6 1.6-3.6 3.8 0 2.3 1.3 3.8 3.7 3.8 1.6 0 2.7-.8 3.1-2.1h-1.8c-.2.5-.7.8-1.3.8-.9 0-1.5-.6-1.6-1.5h4.9c0-.2.1-.5.1-.7 0-2.3-1.4-4.1-3.5-4.1zm-1.5 3c.1-.8.6-1.5 1.5-1.5.8 0 1.4.7 1.4 1.5h-2.9zm-.1-4h3.2v1h-3.2v-1z"
      fill="#FFFFFF"
    />
  </svg>
);

export const AmazonIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <rect width="24" height="24" rx="4" fill="#131921" />
    <path
      d="M13.8 15.6c-.2-.2-.5-.3-.9-.3-.5 0-.9.2-1.2.5-.3.4-.4.8-.4 1.3 0 .5.1.9.4 1.2.3.3.7.5 1.2.5.4 0 .7-.1.9-.3.2-.2.4-.4.5-.7v-1.8c-.2-.2-.3-.4-.5-.4zm2.4-2.8h-1.8v.8c-.3-.3-.7-.6-1.1-.7-.4-.2-.9-.3-1.4-.3-.9 0-1.7.3-2.3.9-.6.6-.9 1.4-.9 2.4s.3 1.8.9 2.4c.6.6 1.4.9 2.3.9.5 0 1-.1 1.4-.3.4-.2.8-.5 1.1-.8v.9h1.8v-6.7z"
      fill="#FFFFFF"
    />
    <path
      d="M5.5 19.5c3.2 2.1 7.4 2.2 10.9.7.4-.2.3-.6-.1-.5-3.1 1.3-6.8 1.1-9.6-.7-.4-.2-.7.2-.3.5z"
      fill="#FF9900"
    />
    <path d="M16.8 19.8c.3-.4.8-.9 1-1.3.1-.3-.2-.5-.4-.3-.6.5-1.3.9-1.9 1-.2 0-.2.3 0 .4.4.2.9.2 1.3.2z" fill="#FF9900"/>
  </svg>
);

export const BlenderIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#EA7600"/>
    <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
    <circle cx="12" cy="12" r="3" fill="#265787"/>
    <circle cx="12" cy="5" r="1.5" fill="#FFFFFF"/>
  </svg>
);

export const ItchIoIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <rect width="24" height="24" rx="4" fill="#FA5C5C" />
    <path d="M6 10h12v4H6z" fill="#FFFFFF" />
    <circle cx="8.5" cy="12" r="1.2" fill="#FA5C5C" />
    <circle cx="15.5" cy="12" r="1.2" fill="#FA5C5C" />
    <path d="M11 11h2v2h-2z" fill="#FA5C5C" />
  </svg>
);

export const PinterestIcon: React.FC<IconProps> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <circle cx="12" cy="12" r="12" fill="#E60023"/>
    <path
      d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 3.6 2.2 6.7 5.4 7.9-.1-.7-.1-1.7.02-2.5.1-.7.9-3.8.9-3.8s-.2-.4-.2-1.1c0-1 .6-1.8 1.3-1.8.6 0 .9.5.9 1 0 .6-.4 1.6-.6 2.4-.2.7.4 1.3 1.1 1.3 1.3 0 2.4-1.4 2.4-3.4 0-1.8-1.3-3-3.1-3-2.1 0-3.4 1.6-3.4 3.2 0 .6.2 1.3.6 1.7.1.1.1.2.05.3-.1.2-.2.8-.2.9-.04.2-.1.2-.3.1-1.2-.6-2-2.3-2-3.8 0-3 2.2-5.9 6.4-5.9 3.4 0 6 2.4 6 5.6 0 3.4-2.1 6.1-5.1 6.1-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.8 1.9-1.2 2.5 1.1.3 2.3.5 3.5.5 4.7 0 8.5-3.8 8.5-8.5 0-4.7-3.8-8.5-8.5-8.5z"
      fill="#FFFFFF"
    />
  </svg>
);

export const EdgeIcon: React.FC<IconProps> = ({ size = 17, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M21.94 13.11c-.26-1.55-1.2-3.15-2.7-4.11-1.39-.89-3.08-1.2-4.73-1.01.27-.47.63-.88 1.05-1.22 1.48-1.18 3.51-1.3 5.09-.43l.86-.96C19.67 4.15 17.06 4 15.17 5.08c-.76.43-1.42 1.05-1.92 1.8-.75-.12-1.52-.15-2.28-.08-3.4.31-6.18 2.5-7.25 5.75-.41 1.25-.51 2.6-.28 3.91.43 2.45 2.11 4.54 4.47 5.56 2.37 1.02 5.2.78 7.37-.62 2.76-1.78 4.29-4.83 4.29-8.08 0-.07 0-.14-.01-.21h.38z" fill="#0078D7"/>
    <path d="M12.44 19.8c-3.13 0-5.78-2.03-6.66-4.9-.22-.72-.31-1.47-.28-2.22.46-1.1 1.34-1.97 2.43-2.45 1.09-.48 2.34-.52 3.52-.16 2.05.62 3.58 2.27 4.04 4.34.07.31.11.63.11.95 0 2.45-1.41 4.44-3.16 4.44z" fill="#00BCF2"/>
  </svg>
);

export const ChromeIcon: React.FC<IconProps> = ({ size = 17, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="10" fill="#EA4335"/>
    <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
    <circle cx="12" cy="12" r="4" fill="#4285F4"/>
    <path d="M12 2A10 10 0 0 1 21.6 8.5H12V2z" fill="#34A853"/>
    <path d="M2.4 15.5A10 10 0 0 1 2 12c0-3.3 1.6-6.2 4.1-8L10 10.5l-7.6 5z" fill="#FBBC05"/>
  </svg>
);

export const FirefoxIcon: React.FC<IconProps> = ({ size = 17, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="10" fill="#FF7139"/>
    <path d="M12 2a10 10 0 0 0-7.8 16.3A8 8 0 0 1 12 7c2 0 3.7.8 5 2l1.5-1.5A10 10 0 0 0 12 2z" fill="#FF9400"/>
    <circle cx="12" cy="12" r="5" fill="#0060DF"/>
  </svg>
);

/**
 * Smart Favicon Component that matches known domains with crisp vector SVGs
 */
export const SmartFavicon: React.FC<{
  domain?: string;
  url?: string;
  faviconUrl?: string | null;
  size?: number;
  style?: React.CSSProperties;
}> = ({ domain = '', url = '', faviconUrl, size = 16, style }) => {
  const d = (domain || url).toLowerCase();

  if (d.includes('notion')) return <NotionIcon size={size} style={style} />;
  if (d.includes('openai') || d.includes('chatgpt')) return <ChatGptIcon size={size} style={style} />;
  if (d.includes('youtube')) return <YouTubeIcon size={size} style={style} />;
  if (d.includes('figma')) return <FigmaIcon size={size} style={style} />;
  if (d.includes('github')) return <GitHubIcon size={size} style={style} />;
  if (d.includes('unity')) return <UnityIcon size={size} style={style} />;
  if (d.includes('docs.google') || d.includes('google.com/document')) return <GoogleDocsIcon size={size} style={style} />;
  if (d.includes('behance')) return <BehanceIcon size={size} style={style} />;
  if (d.includes('amazon')) return <AmazonIcon size={size} style={style} />;
  if (d.includes('blender')) return <BlenderIcon size={size} style={style} />;
  if (d.includes('itch.io')) return <ItchIoIcon size={size} style={style} />;
  if (d.includes('pinterest')) return <PinterestIcon size={size} style={style} />;

  if (faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt=""
        style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', ...style }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return <Globe size={size} color="var(--text-muted)" style={style} />;
};
