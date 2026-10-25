import React from 'react';
import { SmartFavicon } from './BrandIcons';
import { Globe, FileText, Code2, Sparkles, Database, Box, Terminal, Cpu } from 'lucide-react';

interface SmartBrandThumbnailProps {
  domain: string;
  url: string;
  title: string;
  faviconUrl?: string | null;
  thumbnailUrl?: string | null;
}

/**
 * Returns brand styling details based on domain & URL pattern
 */
function getBrandMetadata(domain: string, url: string, title: string) {
  const d = (domain || '').toLowerCase();
  const u = (url || '').toLowerCase();
  const t = (title || '').toLowerCase();

  // Local / PDF files
  if (u.startsWith('file://') || u.endsWith('.pdf') || t.includes('.pdf')) {
    return {
      bg: 'linear-gradient(135deg, #1e1b2e 0%, #2e1065 100%)',
      accent: '#c084fc',
      badge: 'PDF Document',
      icon: 'file'
    };
  }

  // Google ecosystem
  if (d.includes('docs.google.com/forms') || t.includes('form')) {
    return {
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
      accent: '#818cf8',
      badge: 'Google Forms',
      icon: 'form'
    };
  }
  if (d.includes('docs.google.com/spreadsheets') || t.includes('sheet') || t.includes('.xlsx')) {
    return {
      bg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
      accent: '#34d399',
      badge: 'Google Sheets',
      icon: 'sheets'
    };
  }
  if (d.includes('docs.google.com') || t.includes('google doc')) {
    return {
      bg: 'linear-gradient(135deg, #172554 0%, #1d4ed8 100%)',
      accent: '#60a5fa',
      badge: 'Google Docs',
      icon: 'docs'
    };
  }
  if (d.includes('gemini') || t.includes('gemini')) {
    return {
      bg: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #312e81 100%)',
      accent: '#38bdf8',
      badge: 'Google Gemini',
      icon: 'gemini'
    };
  }
  if (d.includes('youtube')) {
    return {
      bg: 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)',
      accent: '#f87171',
      badge: 'YouTube',
      icon: 'youtube'
    };
  }

  // AI & Machine Learning
  if (d.includes('chatgpt') || d.includes('openai')) {
    return {
      bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
      accent: '#10a37f',
      badge: 'OpenAI ChatGPT',
      icon: 'chatgpt'
    };
  }
  if (d.includes('deepseek')) {
    return {
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      accent: '#38bdf8',
      badge: 'DeepSeek AI',
      icon: 'ai'
    };
  }
  if (d.includes('huggingface')) {
    return {
      bg: 'linear-gradient(135deg, #451a03 0%, #b45309 100%)',
      accent: '#fbbf24',
      badge: 'Hugging Face',
      icon: 'ai'
    };
  }
  if (d.includes('ollama')) {
    return {
      bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
      accent: '#ffffff',
      badge: 'Ollama',
      icon: 'ai'
    };
  }

  // Developer Ecosystem
  if (d.includes('github')) {
    return {
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      accent: '#94a3b8',
      badge: 'GitHub',
      icon: 'github'
    };
  }
  if (d.includes('docker')) {
    return {
      bg: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
      accent: '#38bdf8',
      badge: 'Docker',
      icon: 'docker'
    };
  }
  if (d.includes('react') || t.includes('react')) {
    return {
      bg: 'linear-gradient(135deg, #082f49 0%, #0369a1 100%)',
      accent: '#61dafb',
      badge: 'React',
      icon: 'code'
    };
  }
  if (d.includes('rust-lang') || d.includes('crates.io')) {
    return {
      bg: 'linear-gradient(135deg, #431407 0%, #9a3412 100%)',
      accent: '#fb923c',
      badge: 'Rust Language',
      icon: 'code'
    };
  }
  if (d.includes('unity')) {
    return {
      bg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      accent: '#e2e8f0',
      badge: 'Unity Engine',
      icon: 'unity'
    };
  }
  if (d.includes('notion')) {
    return {
      bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
      accent: '#f4f4f5',
      badge: 'Notion Workspace',
      icon: 'notion'
    };
  }
  if (d.includes('figma')) {
    return {
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
      accent: '#a855f7',
      badge: 'Figma Design',
      icon: 'figma'
    };
  }

  // Government / Education / SDGs
  if (d.includes('gov') || d.includes('depdev') || d.includes('ched') || d.includes('lto')) {
    return {
      bg: 'linear-gradient(135deg, #142e47 0%, #1e40af 100%)',
      accent: '#60a5fa',
      badge: 'Official Portal',
      icon: 'gov'
    };
  }
  if (d.includes('open3dlab')) {
    return {
      bg: 'linear-gradient(135deg, #31135e 0%, #6b21a8 100%)',
      accent: '#d8b4fe',
      badge: 'Open3DLab Props',
      icon: 'box'
    };
  }

  // Dynamic fallback based on domain hash
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = (hash << 5) - hash + d.charCodeAt(i);
    hash |= 0;
  }
  const hues = [
    { bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', accent: '#60a5fa' },
    { bg: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)', accent: '#c084fc' },
    { bg: 'linear-gradient(135deg, #064e3b 0%, #134e4a 100%)', accent: '#34d399' },
    { bg: 'linear-gradient(135deg, #18181b 0%, #292524 100%)', accent: '#a8a29e' },
    { bg: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)', accent: '#f59e0b' },
    { bg: 'linear-gradient(135deg, #4c0519 0%, #831843 100%)', accent: '#f43f5e' }
  ];
  const choice = hues[Math.abs(hash) % hues.length];

  return {
    bg: choice.bg,
    accent: choice.accent,
    badge: d || 'Web Document',
    icon: 'globe'
  };
}

export const SmartBrandThumbnail: React.FC<SmartBrandThumbnailProps> = ({
  domain,
  url,
  title,
  faviconUrl,
  thumbnailUrl
}) => {
  const [imgError, setImgError] = React.useState(false);
  const meta = getBrandMetadata(domain, url, title);

  // If a real screenshot exists and loads successfully
  if (thumbnailUrl && !imgError) {
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        onError={() => setImgError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    );
  }

  // Umark-style rich domain brand card surface
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: meta.bg,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      {/* Subtle ambient radial highlight */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          height: '100px',
          borderRadius: '50%',
          background: meta.accent,
          filter: 'blur(45px)',
          opacity: 0.22,
          pointerEvents: 'none'
        }}
      />

      {/* Grid line watermark pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      />

      {/* Center Brand Icon / Vector */}
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 20px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
          zIndex: 1,
          marginBottom: '8px'
        }}
      >
        <SmartFavicon
          domain={domain}
          url={url}
          faviconUrl={faviconUrl}
          size={24}
        />
      </div>

      {/* Center Brand Pill / Title */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.9)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2px 10px',
          letterSpacing: '0.2px',
          zIndex: 1,
          maxWidth: '85%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {meta.badge}
      </div>
    </div>
  );
};
