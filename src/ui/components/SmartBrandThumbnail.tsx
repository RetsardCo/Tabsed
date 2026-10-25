import React from 'react';
import { SmartFavicon } from './BrandIcons';
import { Globe, FileText, Code2, Sparkles, Database, Box, Terminal, Cpu, Lock } from 'lucide-react';

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

  React.useEffect(() => {
    setImgError(false);
  }, [thumbnailUrl]);

  const isPlaceholder = !thumbnailUrl ||
    thumbnailUrl.trim() === '' ||
    thumbnailUrl.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB');

  // If a real screenshot exists and loads successfully
  if (!isPlaceholder && !imgError) {
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

  // Rich realistic website screenshot fallback mockup
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: meta.bg,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Mini Browser Chrome Header Bar */}
      <div
        style={{
          height: '24px',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          flexShrink: 0,
          zIndex: 3
        }}
      >
        {/* Window controls (left) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.75)' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.75)' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.75)' }} />
        </div>

        {/* Address bar mockup (center) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '4px',
            padding: '1px 8px',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.85)',
            maxWidth: '190px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <Lock size={9} style={{ flexShrink: 0, opacity: 0.8 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {domain || 'web'}
          </span>
        </div>

        {/* Empty space on right for balance */}
        <div style={{ width: '28px' }} />
      </div>

      {/* Realistic Webpage Screenshot Content Surface */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {renderRealisticWebpageContent(meta.icon, meta, domain, url, title, faviconUrl)}
      </div>
    </div>
  );
};

function renderRealisticWebpageContent(
  icon: string,
  meta: ReturnType<typeof getBrandMetadata>,
  domain: string,
  url: string,
  title: string,
  faviconUrl?: string | null
) {
  const cleanTitle = (title || domain || 'Web Document').replace(/^https?:\/\//, '');

  if (icon === 'youtube') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0f0f0f', padding: '8px 12px', gap: '8px', overflow: 'hidden' }}>
        {/* YouTube Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '5px solid #ffffff' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>YouTube</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#222222', borderRadius: '12px', padding: '2px 8px', width: '40%' }}>
            <span style={{ fontSize: '9px', color: '#888888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Search</span>
          </div>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: meta.accent }} />
        </div>

        {/* Video Player & Up Next Split */}
        <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0 }}>
          {/* Main Video Viewport */}
          <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Play triangle */}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid #ffffff', marginLeft: '2px' }} />
              </div>
              {/* Video Progress Bar */}
              <div style={{ position: 'absolute', bottom: '6px', left: '8px', right: '8px', height: '3px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                <div style={{ width: '42%', height: '100%', backgroundColor: '#ef4444', borderRadius: '2px' }} />
              </div>
            </div>
            {/* Title & Channel Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cleanTitle}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>{domain} • 420K views</span>
                <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#ffffff', color: '#000000', padding: '1px 6px', borderRadius: '10px' }}>Subscribe</span>
              </div>
            </div>
          </div>
          {/* Right Up Next Cards */}
          <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: '#18181b', padding: '3px', borderRadius: '4px' }}>
                <div style={{ width: '36px', height: '22px', backgroundColor: '#27272a', borderRadius: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '2px', width: '85%' }} />
                  <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (icon === 'github' || icon === 'code') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117', color: '#c9d1d9', padding: '8px 12px', gap: '6px', overflow: 'hidden' }}>
        {/* Repo Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #21262d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <SmartFavicon domain={domain} url={url} faviconUrl={faviconUrl} size={13} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#58a6ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {domain} / {cleanTitle.slice(0, 24)}
            </span>
            <span style={{ fontSize: '9px', padding: '0 4px', border: '1px solid #30363d', borderRadius: '8px', color: '#8b949e' }}>Public</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontSize: '9px', backgroundColor: '#21262d', padding: '1px 6px', borderRadius: '4px', border: '1px solid #30363d', color: '#c9d1d9' }}>★ Star 32.4k</span>
          </div>
        </div>
        {/* Branch & Commit Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#161b22', padding: '3px 8px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '10px' }}>
          <span style={{ color: '#8b949e', fontWeight: 600 }}>branch: main</span>
          <span style={{ color: '#58a6ff', fontSize: '9px' }}>Latest commit: 7f8a92b</span>
        </div>
        {/* File Table Mock */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', overflow: 'hidden' }}>
          {['src', 'tests', 'package.json', 'README.md'].map((file, i) => (
            <div key={file} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 8px', borderBottom: i < 3 ? '1px solid #21262d' : 'none', fontSize: '10px' }}>
              <span style={{ color: '#c9d1d9', fontWeight: 500 }}>{file}</span>
              <span style={{ color: '#8b949e', fontSize: '9px' }}>feat: update architecture</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (icon === 'docs' || icon === 'sheets' || icon === 'form' || icon === 'file') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b', color: '#f8fafc', overflow: 'hidden' }}>
        {/* Doc Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', backgroundColor: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <SmartFavicon domain={domain} url={url} faviconUrl={faviconUrl} size={13} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta.badge} — {cleanTitle.slice(0, 22)}
            </span>
          </div>
          <span style={{ fontSize: '9px', backgroundColor: meta.accent, color: '#ffffff', padding: '1px 8px', borderRadius: '10px', fontWeight: 600 }}>Share</span>
        </div>
        {/* Document Body & Sidebar */}
        <div style={{ flex: 1, display: 'flex', padding: '8px 10px', gap: '10px', minHeight: 0 }}>
          <div style={{ width: '25%', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: meta.accent, textTransform: 'uppercase' }}>Outline</span>
            {['Overview', 'Specifications', 'Architecture', 'Milestones'].map((sec, idx) => (
              <span key={sec} style={{ fontSize: '9px', color: idx === 0 ? '#ffffff' : '#94a3b8', fontWeight: idx === 0 ? 600 : 400 }}>{sec}</span>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <div style={{ height: '10px', backgroundColor: '#ffffff', borderRadius: '2px', width: '70%' }} />
            <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '2px', width: '95%' }} />
            <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: '2px', width: '88%' }} />
            <div style={{ marginTop: '2px', padding: '6px 8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: `3px solid ${meta.accent}`, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '9px', color: meta.accent, fontWeight: 600 }}>{domain}</span>
              <span style={{ fontSize: '9px', color: '#cbd5e1', lineHeight: 1.3 }}>{cleanTitle}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (icon === 'chatgpt' || icon === 'gemini' || icon === 'ai') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#18181b', color: '#f4f4f5', overflow: 'hidden' }}>
        {/* Chat Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid #27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SmartFavicon domain={domain} url={url} faviconUrl={faviconUrl} size={13} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f4f4f5' }}>{meta.badge}</span>
          </div>
          <span style={{ fontSize: '9px', color: '#a1a1aa' }}>GPT-4o / Reasoning</span>
        </div>
        {/* Messages Feed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 10px', minHeight: 0 }}>
          {/* User message */}
          <div style={{ alignSelf: 'flex-end', backgroundColor: '#27272a', padding: '4px 8px', borderRadius: '10px 10px 2px 10px', fontSize: '9px', color: '#f4f4f5', maxWidth: '80%' }}>
            {cleanTitle.slice(0, 48)}
          </div>
          {/* AI Response Card */}
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', maxWidth: '92%' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: meta.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={10} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#27272a', padding: '6px 8px', borderRadius: '2px 10px 10px 10px', border: '1px solid #3f3f46' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Analysis &amp; Summary</span>
              <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '2px', width: '90%' }} />
              <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '2px', width: '75%' }} />
              <span style={{ fontSize: '9px', color: meta.accent, fontWeight: 500 }}>{domain}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General / Default Webpage Layout
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Site Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <SmartFavicon domain={domain} url={url} faviconUrl={faviconUrl} size={13} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {domain || meta.badge}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>Docs</span>
          <span style={{ fontSize: '9px', backgroundColor: 'var(--accent-color, #2563eb)', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Visit</span>
        </div>
      </div>
      {/* Hero Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', gap: '6px', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cleanTitle}
          </span>
          <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', width: '85%' }} />
          <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '2px', width: '60%' }} />
        </div>
        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: meta.accent, opacity: 0.8 }} />
              <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '2px', width: '70%' }} />
              <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
