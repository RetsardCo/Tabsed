import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { Header } from './ui/components/Header';
import { VaultSyncService } from './core/vault/vault-sync';
import { Sidebar } from './ui/components/Sidebar';
import { TabGrid } from './ui/components/TabGrid';
import { TabCompactList } from './ui/components/TabCompactList';
import { TabDetailedList } from './ui/components/TabDetailedList';
import { DetailInspector } from './ui/components/DetailInspector';
import { SaveTabsModal } from './ui/components/SaveTabsModal';
import { OnboardingWizard } from './ui/components/OnboardingWizard';
import { StorageModal } from './ui/components/StorageModal';
import { DuplicatesModal } from './ui/components/DuplicatesModal';
import { RestoreQueueModal } from './ui/components/RestoreQueueModal';
import { SettingsModal } from './ui/components/SettingsModal';
import { HelpDiagnosticsModal } from './ui/components/HelpDiagnosticsModal';
import { ConfirmationModal } from './ui/components/ConfirmationModal';
import { ArchiveSearchModal } from './ui/components/ArchiveSearchModal';
import { BackupModal } from './ui/components/BackupModal';
import { PortableVaultModal } from './ui/components/PortableVaultModal';
import { SavedTabItem, Collection, ViewMode, GroupMode, UserPreferences, Tag } from './ui/types';
import { AvailabilityChecker } from './core/transaction/availability-checker';
import { TrashManager } from './core/vault/trash-manager';
import { unpackAllSessionItems, groupTabsBySession, extractDomainFromUrl } from './core/vault/unpack-sessions';

const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'inbox', name: 'Inbox', description: 'Default incoming tab bucket', accentColor: '#2563eb', itemCount: 4 },
  { id: 'research', name: 'Deep Research', description: 'Academic papers and articles', accentColor: '#7c3aed', itemCount: 2 },
  { id: 'dev', name: 'Web Dev & Tauri', description: 'Development reference & documentation', accentColor: '#059669', itemCount: 3 },
  { id: 'design', name: 'Design Inspiration', description: 'UI/UX benchmarks and mockups', accentColor: '#ea580c', itemCount: 2 }
];

// Seeded items matching the exact reference mockup (media_1792854826085_115606ec.jpg)
const INITIAL_ITEMS: SavedTabItem[] = [
  {
    id: 'mock_1',
    vaultId: 'default',
    itemType: 'session',
    title: 'Game Development Hub',
    url: 'https://notion.so/workspace/gamedev-hub',
    normalizedUrl: 'https://notion.so/workspace/gamedev-hub',
    domain: 'notion.so',
    faviconUrl: 'https://www.notion.so/front-static/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Game development resources, tutorials, Unity docs, asset stores, and project ideas.',
    isFavorite: true,
    collectionIds: ['dev', 'inbox'],
    tags: ['Planning', 'Game Dev', 'Notes'],
    tabCount: 12,
    archiveSizeBytes: 342 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_1_1', title: 'Unity Documentation — Scripting API & Architecture', url: 'https://docs.unity.com/', domain: 'unity.com', faviconUrl: 'https://unity.com/favicon.ico' },
      { id: 'sub_1_2', title: 'Blender — 3D for everyone and open pipeline', url: 'https://www.blender.org/', domain: 'blender.org', faviconUrl: 'https://www.blender.org/favicon.ico' },
      { id: 'sub_1_3', title: 'Free Game Assets & Textures — Itch.io Collections', url: 'https://itch.io/game-assets', domain: 'itch.io', faviconUrl: 'https://itch.io/favicon.ico' },
      { id: 'sub_1_4', title: 'Game Design Notes — Mechanics and Level Flow', url: 'https://notion.so/gamedesign', domain: 'notion.so', faviconUrl: 'https://www.notion.so/front-static/favicon.ico' },
      { id: 'sub_1_5', title: 'Pixel Art References — Visual Palette & Moodboards', url: 'https://pinterest.com/pin/pixelart', domain: 'pinterest.com', faviconUrl: 'https://pinterest.com/favicon.ico' },
      { id: 'sub_1_6', title: 'Godot Engine 4 Documentation — Getting Started & Nodes', url: 'https://docs.godotengine.org/en/stable/', domain: 'godotengine.org', faviconUrl: 'https://godotengine.org/favicon.ico' },
      { id: 'sub_1_7', title: 'Shadertoy — Real-time GLSL Shader Experiments', url: 'https://www.shadertoy.com/browse', domain: 'shadertoy.com', faviconUrl: 'https://www.shadertoy.com/favicon.ico' },
      { id: 'sub_1_8', title: 'OpenGameArt.org — Free 2D Sprites, Tilesets & Sounds', url: 'https://opengameart.org/', domain: 'opengameart.org', faviconUrl: 'https://opengameart.org/favicon.ico' },
      { id: 'sub_1_9', title: 'GDC Vault — Architecture & Procedural Generation', url: 'https://www.gdcvault.com/', domain: 'gdcvault.com', faviconUrl: 'https://www.gdcvault.com/favicon.ico' },
      { id: 'sub_1_10', title: 'Kenney — Thousands of Free Game Assets & Audio', url: 'https://kenney.nl/assets', domain: 'kenney.nl', faviconUrl: 'https://kenney.nl/favicon.ico' },
      { id: 'sub_1_11', title: 'Freesound — Creative Commons Audio & Foley Effects', url: 'https://freesound.org/', domain: 'freesound.org', faviconUrl: 'https://freesound.org/favicon.ico' },
      { id: 'sub_1_12', title: 'Figma — Game UI Components & HUD Design System', url: 'https://www.figma.com/@gamedev-hud', domain: 'figma.com', faviconUrl: 'https://static.figma.com/app/icon/1/favicon.ico' }
    ]
  },
  {
    id: 'mock_2',
    vaultId: 'default',
    itemType: 'session',
    title: 'ChatGPT — Project Ideas',
    url: 'https://chat.openai.com/c/ideas-research',
    normalizedUrl: 'https://chat.openai.com/c/ideas-research',
    domain: 'chat.openai.com',
    faviconUrl: 'https://chatgpt.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Chrome',
    profileLabel: 'Work',
    savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Brainstormed feature list and technical specifications for desktop tab saving.',
    isFavorite: false,
    collectionIds: ['research'],
    tags: ['AI', 'Research', 'Writing'],
    tabCount: 8,
    archiveSizeBytes: 128 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_2_1', title: 'OpenAI Platform — API Documentation', url: 'https://platform.openai.com/docs', domain: 'openai.com', faviconUrl: 'https://openai.com/favicon.ico' },
      { id: 'sub_2_2', title: 'Anthropic Claude — Prompt Engineering Best Practices', url: 'https://docs.anthropic.com/', domain: 'anthropic.com', faviconUrl: 'https://anthropic.com/favicon.ico' },
      { id: 'sub_2_3', title: 'Hugging Face — Open Source Models & Datasets Hub', url: 'https://huggingface.co/models', domain: 'huggingface.co', faviconUrl: 'https://huggingface.co/favicon.ico' },
      { id: 'sub_2_4', title: 'LangChain — Building Context-Aware Reasoning Agents', url: 'https://python.langchain.com/', domain: 'langchain.com', faviconUrl: 'https://python.langchain.com/favicon.ico' },
      { id: 'sub_2_5', title: 'ArXiv — Attention Is All You Need Paper Archive', url: 'https://arxiv.org/abs/1706.03762', domain: 'arxiv.org', faviconUrl: 'https://arxiv.org/favicon.ico' },
      { id: 'sub_2_6', title: 'GitHub — LLM Inference Engine Benchmarks', url: 'https://github.com/vllm-project/vllm', domain: 'github.com', faviconUrl: 'https://github.githubassets.com/favicons/favicon.png' },
      { id: 'sub_2_7', title: 'DeepSeek — Open Reasoning Models Technical Report', url: 'https://github.com/deepseek-ai', domain: 'github.com', faviconUrl: 'https://github.githubassets.com/favicons/favicon.png' },
      { id: 'sub_2_8', title: 'Weights & Biases — Machine Learning Experiment Tracking', url: 'https://wandb.ai/site', domain: 'wandb.ai', faviconUrl: 'https://wandb.ai/favicon.ico' }
    ]
  },
  {
    id: 'mock_3',
    vaultId: 'default',
    itemType: 'session',
    title: 'Relaxing Music Playlist',
    url: 'https://www.youtube.com/watch?v=ambient-nature',
    normalizedUrl: 'https://www.youtube.com/watch?v=ambient-nature',
    domain: 'youtube.com',
    faviconUrl: 'https://www.youtube.com/s/desktop/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Chrome',
    profileLabel: 'Personal',
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Deep focus background soundscapes for programming sprints.',
    isFavorite: false,
    collectionIds: ['inbox'],
    tags: ['Entertainment', 'Music'],
    tabCount: 6,
    archiveSizeBytes: 210 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_3_1', title: 'Ambient Nature Soundscapes (10h Focus Audio)', url: 'https://www.youtube.com/watch?v=ambient-nature', domain: 'youtube.com', faviconUrl: 'https://www.youtube.com/s/desktop/favicon.ico' },
      { id: 'sub_3_2', title: 'Lofi Hip Hop Radio — Beats to Relax/Study to', url: 'https://music.youtube.com/watch?v=lofi-beats', domain: 'music.youtube.com', faviconUrl: 'https://www.youtube.com/s/desktop/favicon.ico' },
      { id: 'sub_3_3', title: 'Peaceful Piano Instrumental Focus Playlist', url: 'https://open.spotify.com/playlist/peaceful-piano', domain: 'spotify.com', faviconUrl: 'https://open.spotify.com/favicon.ico' },
      { id: 'sub_3_4', title: 'Deep Electronic Concentration Beats', url: 'https://soundcloud.com/discover/deep-focus', domain: 'soundcloud.com', faviconUrl: 'https://soundcloud.com/favicon.ico' },
      { id: 'sub_3_5', title: 'MyNoise — Customized Rain & Storm Audio Generator', url: 'https://mynoise.net/NoiseMachines/rainNoiseGenerator.php', domain: 'mynoise.net', faviconUrl: 'https://mynoise.net/favicon.ico' },
      { id: 'sub_3_6', title: 'Brain.fm — Functional Music to Improve Focus', url: 'https://brain.fm/', domain: 'brain.fm', faviconUrl: 'https://brain.fm/favicon.ico' }
    ]
  },
  {
    id: 'mock_4',
    vaultId: 'default',
    itemType: 'session',
    title: 'UI Design References',
    url: 'https://figma.com/@design-system',
    normalizedUrl: 'https://figma.com/@design-system',
    domain: 'figma.com',
    faviconUrl: 'https://static.figma.com/app/icon/1/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Work',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Windows 11 Mica acrylic styling guidelines and color palettes.',
    isFavorite: false,
    collectionIds: ['design'],
    tags: ['Design', 'Inspiration', 'UI/UX'],
    tabCount: 12,
    archiveSizeBytes: 520 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_4_1', title: 'Figma — Global UI Design System & Tokens', url: 'https://figma.com/@design-system', domain: 'figma.com', faviconUrl: 'https://static.figma.com/app/icon/1/favicon.ico' },
      { id: 'sub_4_2', title: 'Apple Human Interface Guidelines (macOS/iOS)', url: 'https://developer.apple.com/design/human-interface-guidelines', domain: 'apple.com', faviconUrl: 'https://developer.apple.com/favicon.ico' },
      { id: 'sub_4_3', title: 'Material Design 3 — Expressive Dynamic Theming', url: 'https://m3.material.io/', domain: 'material.io', faviconUrl: 'https://m3.material.io/favicon.ico' },
      { id: 'sub_4_4', title: 'Tailwind CSS — Rapid Modern Utility Styling', url: 'https://tailwindcss.com/docs', domain: 'tailwindcss.com', faviconUrl: 'https://tailwindcss.com/favicons/favicon.ico' },
      { id: 'sub_4_5', title: 'Lucide Icons — Clean SVG Icon Library', url: 'https://lucide.dev/icons', domain: 'lucide.dev', faviconUrl: 'https://lucide.dev/favicon.ico' },
      { id: 'sub_4_6', title: 'Dribbble — Frosted Glassmorphism Concepts', url: 'https://dribbble.com/tags/glassmorphism', domain: 'dribbble.com', faviconUrl: 'https://dribbble.com/favicon.ico' },
      { id: 'sub_4_7', title: 'Mobbin — Real Mobile & Desktop UI Flows', url: 'https://mobbin.com/browse/ios/apps', domain: 'mobbin.com', faviconUrl: 'https://mobbin.com/favicon.ico' },
      { id: 'sub_4_8', title: 'UI8 — Curated Design Resources & Kits', url: 'https://ui8.net/', domain: 'ui8.net', faviconUrl: 'https://ui8.net/favicon.ico' },
      { id: 'sub_4_9', title: 'Siteinspire — Minimalist Web Architecture Gallery', url: 'https://siteinspire.com/', domain: 'siteinspire.com', faviconUrl: 'https://siteinspire.com/favicon.ico' },
      { id: 'sub_4_10', title: 'Typewolf — Typography & Font Pairing Guides', url: 'https://typewolf.com/', domain: 'typewolf.com', faviconUrl: 'https://typewolf.com/favicon.ico' },
      { id: 'sub_4_11', title: 'shadcn/ui — Accessible & Customizable UI Primitives', url: 'https://ui.shadcn.com/', domain: 'shadcn.com', faviconUrl: 'https://ui.shadcn.com/favicon.ico' },
      { id: 'sub_4_12', title: 'Framer Motion — Declarative React Animations', url: 'https://www.framer.com/motion/', domain: 'framer.com', faviconUrl: 'https://www.framer.com/favicon.ico' }
    ]
  },
  {
    id: 'mock_5',
    vaultId: 'default',
    itemType: 'session',
    title: 'Open Source Tools',
    url: 'https://github.com/trending/rust',
    normalizedUrl: 'https://github.com/trending/rust',
    domain: 'github.com',
    faviconUrl: 'https://github.githubassets.com/favicons/favicon.png',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Firefox',
    profileLabel: 'default-release',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Useful crates: rusqlite, tauri-plugin-window-state, sha2, tokio.',
    isFavorite: false,
    collectionIds: ['dev'],
    tags: ['Development', 'Tools', 'Productivity'],
    tabCount: 10,
    archiveSizeBytes: 340 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_5_1', title: 'GitHub — Trending Rust Repositories & Crates', url: 'https://github.com/trending/rust', domain: 'github.com', faviconUrl: 'https://github.githubassets.com/favicons/favicon.png' },
      { id: 'sub_5_2', title: 'Rust Programming Language — Fast, Reliable, Safe', url: 'https://www.rust-lang.org/', domain: 'rust-lang.org', faviconUrl: 'https://www.rust-lang.org/static/images/favicon.svg' },
      { id: 'sub_5_3', title: 'Tokio — Asynchronous Runtime for the Rust Language', url: 'https://tokio.rs/', domain: 'tokio.rs', faviconUrl: 'https://tokio.rs/favicon.ico' },
      { id: 'sub_5_4', title: 'Tauri 2.0 — Build Faster and More Secure Desktop Apps', url: 'https://tauri.app/', domain: 'tauri.app', faviconUrl: 'https://tauri.app/favicon.ico' },
      { id: 'sub_5_5', title: 'SQLite — Self-Contained Serverless SQL Database', url: 'https://sqlite.org/', domain: 'sqlite.org', faviconUrl: 'https://sqlite.org/favicon.ico' },
      { id: 'sub_5_6', title: 'Crates.io — The Rust Package Registry', url: 'https://crates.io/', domain: 'crates.io', faviconUrl: 'https://crates.io/favicon.ico' },
      { id: 'sub_5_7', title: 'Docs.rs — Documentation for Crate Dependencies', url: 'https://docs.rs/', domain: 'docs.rs', faviconUrl: 'https://docs.rs/favicon.ico' },
      { id: 'sub_5_8', title: 'GitHub CLI — Work with GitHub from your CLI', url: 'https://cli.github.com/', domain: 'github.com', faviconUrl: 'https://github.githubassets.com/favicons/favicon.png' },
      { id: 'sub_5_9', title: 'Vite — Next Generation Frontend Tooling', url: 'https://vite.dev/', domain: 'vite.dev', faviconUrl: 'https://vite.dev/logo.svg' },
      { id: 'sub_5_10', title: 'Vitest — Blazing Fast Unit Test Framework', url: 'https://vitest.dev/', domain: 'vitest.dev', faviconUrl: 'https://vitest.dev/favicon.ico' }
    ]
  },
  {
    id: 'mock_6',
    vaultId: 'default',
    itemType: 'session',
    title: 'Unity Game Development',
    url: 'https://unity.com/learn',
    normalizedUrl: 'https://unity.com/learn',
    domain: 'unity.com',
    faviconUrl: 'https://unity.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Shader graphs, physics collision layers, and performance profiling.',
    isFavorite: false,
    collectionIds: ['dev'],
    tags: ['Game Dev', 'Engine', 'Learning'],
    tabCount: 10,
    archiveSizeBytes: 812 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_6_1', title: 'Unity Learn — Tutorials and Project Modules', url: 'https://unity.com/learn', domain: 'unity.com', faviconUrl: 'https://unity.com/favicon.ico' },
      { id: 'sub_6_2', title: 'Unity Scripting Reference & Engine Manual', url: 'https://docs.unity.com/', domain: 'unity.com', faviconUrl: 'https://unity.com/favicon.ico' },
      { id: 'sub_6_3', title: 'Unity Asset Store — 3D Models, Shaders & Tools', url: 'https://assetstore.unity.com/', domain: 'unity.com', faviconUrl: 'https://unity.com/favicon.ico' },
      { id: 'sub_6_4', title: 'Catlike Coding — Math, Shaders, and Custom SRP', url: 'https://catlikecoding.com/unity/tutorials/', domain: 'catlikecoding.com', faviconUrl: 'https://catlikecoding.com/favicon.ico' },
      { id: 'sub_6_5', title: 'Kenney — Public Domain 2D & 3D Game Assets', url: 'https://kenney.nl/assets', domain: 'kenney.nl', faviconUrl: 'https://kenney.nl/favicon.ico' },
      { id: 'sub_6_6', title: 'Mixamo — Character Rigging & Animation Library', url: 'https://mixamo.com/', domain: 'mixamo.com', faviconUrl: 'https://mixamo.com/favicon.ico' },
      { id: 'sub_6_7', title: 'Poly Pizza — Free Low Poly 3D Models', url: 'https://poly.pizza/', domain: 'poly.pizza', faviconUrl: 'https://poly.pizza/favicon.ico' },
      { id: 'sub_6_8', title: 'Freesound — Creative Commons Audio & Foley Effects', url: 'https://freesound.org/', domain: 'freesound.org', faviconUrl: 'https://freesound.org/favicon.ico' },
      { id: 'sub_6_9', title: 'Unity Forum — Developer Discussions & Releases', url: 'https://forum.unity.com/', domain: 'unity.com', faviconUrl: 'https://unity.com/favicon.ico' },
      { id: 'sub_6_10', title: 'Reddit — Game Development Community & Postmortems', url: 'https://reddit.com/r/gamedev', domain: 'reddit.com', faviconUrl: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png' }
    ]
  },
  {
    id: 'mock_7',
    vaultId: 'default',
    itemType: 'session',
    title: 'Thesis Research',
    url: 'https://docs.google.com/document/d/thesis-draft',
    normalizedUrl: 'https://docs.google.com/document/d/thesis-draft',
    domain: 'docs.google.com',
    faviconUrl: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Chrome',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Literature citations, method outlines, and comparative benchmarks.',
    isFavorite: false,
    collectionIds: ['research'],
    tags: ['Research', 'Thesis', 'Notes'],
    tabCount: 8,
    archiveSizeBytes: 210 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_7_1', title: 'Google Docs — Thesis Chapter 3 Draft', url: 'https://docs.google.com/document/d/thesis-draft', domain: 'docs.google.com', faviconUrl: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico' },
      { id: 'sub_7_2', title: 'Google Scholar — Academic Citations & Literature', url: 'https://scholar.google.com/', domain: 'scholar.google.com', faviconUrl: 'https://scholar.google.com/favicon.ico' },
      { id: 'sub_7_3', title: 'arXiv.org — Pre-print Archive in Computer Science', url: 'https://arxiv.org/', domain: 'arxiv.org', faviconUrl: 'https://arxiv.org/favicon.ico' },
      { id: 'sub_7_4', title: 'ACM Digital Library — Peer-Reviewed Computing Research', url: 'https://dl.acm.org/', domain: 'acm.org', faviconUrl: 'https://dl.acm.org/favicon.ico' },
      { id: 'sub_7_5', title: 'IEEE Xplore — Digital Library & Standards', url: 'https://ieeexplore.ieee.org/', domain: 'ieee.org', faviconUrl: 'https://ieeexplore.ieee.org/favicon.ico' },
      { id: 'sub_7_6', title: 'Zotero — Reference Management & BibTeX Exporter', url: 'https://www.zotero.org/', domain: 'zotero.org', faviconUrl: 'https://www.zotero.org/favicon.ico' },
      { id: 'sub_7_7', title: 'Semantic Scholar — AI-Powered Scientific Literature', url: 'https://semanticscholar.org/', domain: 'semanticscholar.org', faviconUrl: 'https://semanticscholar.org/favicon.ico' },
      { id: 'sub_7_8', title: 'Papers with Code — ML Benchmarks & SOTA Models', url: 'https://paperswithcode.com/', domain: 'paperswithcode.com', faviconUrl: 'https://paperswithcode.com/favicon.ico' }
    ]
  },
  {
    id: 'mock_8',
    vaultId: 'default',
    itemType: 'session',
    title: 'Creative Inspiration',
    url: 'https://behance.net/galleries/interaction',
    normalizedUrl: 'https://behance.net/galleries/interaction',
    domain: 'behance.net',
    faviconUrl: 'https://www.behance.net/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Micro-interactions, smooth card hover states, and glassmorphism styling.',
    isFavorite: false,
    collectionIds: ['design'],
    tags: ['Design', 'Creative', 'Reference'],
    tabCount: 8,
    archiveSizeBytes: 430 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_8_1', title: 'Behance — Interaction & Product Design Showcase', url: 'https://behance.net/galleries/interaction', domain: 'behance.net', faviconUrl: 'https://www.behance.net/favicon.ico' },
      { id: 'sub_8_2', title: 'Awwwards — Website Awards & Design Excellence', url: 'https://www.awwwards.com/', domain: 'awwwards.com', faviconUrl: 'https://www.awwwards.com/favicon.ico' },
      { id: 'sub_8_3', title: 'Designboom — Architecture, Art & Technology Magazine', url: 'https://www.designboom.com/', domain: 'designboom.com', faviconUrl: 'https://www.designboom.com/favicon.ico' },
      { id: 'sub_8_4', title: 'It\'s Nice That — Championing Creativity in Art & Design', url: 'https://www.itsnicethat.com/', domain: 'itsnicethat.com', faviconUrl: 'https://www.itsnicethat.com/favicon.ico' },
      { id: 'sub_8_5', title: 'Are.na — Visual Research & Collective Moodboards', url: 'https://www.are.na/', domain: 'are.na', faviconUrl: 'https://www.are.na/favicon.ico' },
      { id: 'sub_8_6', title: 'Land-book — Curated Landing Page Inspiration', url: 'https://land-book.com/', domain: 'land-book.com', faviconUrl: 'https://land-book.com/favicon.ico' },
      { id: 'sub_8_7', title: 'Fonts in Use — An Independent Archive of Typography', url: 'https://www.fontsinuse.com/', domain: 'fontsinuse.com', faviconUrl: 'https://www.fontsinuse.com/favicon.ico' },
      { id: 'sub_8_8', title: 'Mindsparkle Mag — Design & Digital Showcase', url: 'https://mindsparklemag.com/', domain: 'mindsparklemag.com', faviconUrl: 'https://mindsparklemag.com/favicon.ico' }
    ]
  },
  {
    id: 'mock_9',
    vaultId: 'default',
    itemType: 'session',
    title: 'PC Build & Accessories',
    url: 'https://amazon.com/dp/pc-hardware-guide',
    normalizedUrl: 'https://amazon.com/dp/pc-hardware-guide',
    domain: 'amazon.com',
    faviconUrl: 'https://www.amazon.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Personal',
    savedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'GPU power efficiency, mechanical keyboards, and 4K high-refresh monitors.',
    isFavorite: false,
    collectionIds: ['inbox'],
    tags: ['Shopping', 'Hardware', 'PC Setup'],
    tabCount: 7,
    archiveSizeBytes: 190 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_9_1', title: 'Amazon — High Performance PC Hardware Guide', url: 'https://amazon.com/dp/pc-hardware-guide', domain: 'amazon.com', faviconUrl: 'https://www.amazon.com/favicon.ico' },
      { id: 'sub_9_2', title: 'PCPartPicker — Custom System Builder & Compatibility', url: 'https://pcpartpicker.com/list/', domain: 'pcpartpicker.com', faviconUrl: 'https://pcpartpicker.com/favicon.ico' },
      { id: 'sub_9_3', title: 'Tom\'s Hardware — GPU Benchmarks & Hierarchy', url: 'https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html', domain: 'tomshardware.com', faviconUrl: 'https://www.tomshardware.com/favicon.ico' },
      { id: 'sub_9_4', title: 'TechPowerUp — GPU Database & Specifications', url: 'https://www.techpowerup.com/gpu-specs/', domain: 'techpowerup.com', faviconUrl: 'https://www.techpowerup.com/favicon.ico' },
      { id: 'sub_9_5', title: 'RTINGS — Monitor Reviews & Color Accuracy Testing', url: 'https://www.rtings.com/monitor', domain: 'rtings.com', faviconUrl: 'https://www.rtings.com/favicon.ico' },
      { id: 'sub_9_6', title: 'Reddit — PC Building Questions, Troubleshooting & Advice', url: 'https://reddit.com/r/buildapc', domain: 'reddit.com', faviconUrl: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png' },
      { id: 'sub_9_7', title: 'Mechanical Keyboards — Custom Switches & Keycaps', url: 'https://mechanicalkeyboards.com/', domain: 'mechanicalkeyboards.com', faviconUrl: 'https://mechanicalkeyboards.com/favicon.ico' }
    ]
  }
];

export const App: React.FC = () => {
  // Persistence state
  const [items, setItems] = useState<SavedTabItem[]>(() => {
    const saved = localStorage.getItem('tabsed_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const rehydrated = parsed.map(item => {
            const initialMatch = INITIAL_ITEMS.find(init => init.id === item.id);
            if (initialMatch && initialMatch.sessionTabs && (!item.sessionTabs || item.sessionTabs.length < initialMatch.sessionTabs.length)) {
              return { ...item, sessionTabs: initialMatch.sessionTabs, tabCount: initialMatch.tabCount };
            }
            return item;
          });
          return unpackAllSessionItems(rehydrated);
        }
      } catch {}
    }
    return unpackAllSessionItems(INITIAL_ITEMS);
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('tabsed_collections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_COLLECTIONS;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('tabsed_preferences');
    return saved ? JSON.parse(saved) : {
      theme: 'system',
      accent: 'blue',
      customAccentHex: '#2563eb',
      density: 'comfortable',
      micaEnabled: true,
      defaultView: 'grid',
      confirmBeforeBulkClose: true,
      restoreBatchSize: 5,
      restoreBatchDelayMs: 400,
      storageQuotaBytes: 50 * 1024 * 1024 * 1024
    };
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('tabsed_onboarded') === 'true';
  });

  // UI state
  const [currentDestination, setCurrentDestination] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(preferences.defaultView || 'grid');
  const [groupMode, setGroupMode] = useState<GroupMode>('individual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modal dialog states
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalScope, setSaveModalScope] = useState<'window' | 'tab' | 'manual'>('window');
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [archiveSearchModalOpen, setArchiveSearchModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [portableVaultModalOpen, setPortableVaultModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const [syncToast, setSyncToast] = useState<{ message: string; timestamp: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'ready' | 'synced' | 'syncing'>('ready');
  const isInitialVaultLoaded = useRef(false);

  // Load from disk vault on mount
  useEffect(() => {
    let isMounted = true;
    VaultSyncService.loadInitialVaultItems().then(diskItems => {
      if (!isMounted) return;
      isInitialVaultLoaded.current = true;
      if (diskItems && diskItems.length > 0) {
        const unpackedDisk = unpackAllSessionItems(diskItems);
        setItems(prevItems => {
          const diskIds = new Set(unpackedDisk.map(i => i.id));
          const merged = [...unpackedDisk, ...prevItems.filter(p => !diskIds.has(p.id))];
          return merged;
        });
      } else {
        VaultSyncService.persistVaultItems(items);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Sync to local storage & disk vault (only after initial vault load has completed)
  useEffect(() => {
    localStorage.setItem('tabsed_items', JSON.stringify(items));
    if (isInitialVaultLoaded.current) {
      VaultSyncService.persistVaultItems(items);
    }
  }, [items]);

  // Live real-time synchronization listener for incoming extension saves
  useEffect(() => {
    const unsubscribe = VaultSyncService.startLiveSync((updatedItems) => {
      const unpackedUpdated = unpackAllSessionItems(updatedItems);
      setItems(prevItems => {
        const prevIds = new Set(prevItems.map(i => i.id));
        const newIncoming = unpackedUpdated.filter(i => !prevIds.has(i.id));

        if (newIncoming.length > 0) {
          setSyncStatus('synced');
          const first = newIncoming[0];
          const msg = newIncoming.length === 1
            ? `📥 Synced "${first.title || 'Tab'}" from ${first.browserFamily || 'Browser'}`
            : `📥 Synced ${newIncoming.length} tabs from ${first.browserFamily || 'Browser'}`;

          setSyncToast({ message: msg, timestamp: Date.now() });
          setTimeout(() => {
            setSyncToast(null);
            setSyncStatus('ready');
          }, 4500);

          const diskMap = new Map(unpackedUpdated.map(i => [i.id, i]));
          const merged = [
            ...newIncoming,
            ...prevItems.map(p => diskMap.get(p.id) || p)
          ];
          return merged;
        }
        return prevItems;
      });
    }, 1200);

    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem('tabsed_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('tabsed_preferences', JSON.stringify(preferences));

    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (preferences.theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
    }

    root.setAttribute('data-density', preferences.density);
    root.setAttribute('data-mica', preferences.micaEnabled ? 'enabled' : 'disabled');
    root.style.setProperty('--accent-color', preferences.customAccentHex);
  }, [preferences]);

  // Global keyboard shortcuts (Ctrl+K and / for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key === 'Escape') {
        if (confirmDialog) {
          setConfirmDialog(null);
          return;
        }
        if (
          saveModalOpen ||
          storageModalOpen ||
          duplicatesModalOpen ||
          restoreModalOpen ||
          settingsModalOpen ||
          helpModalOpen ||
          archiveSearchModalOpen ||
          backupModalOpen ||
          portableVaultModalOpen
        ) {
          setSaveModalOpen(false);
          setStorageModalOpen(false);
          setDuplicatesModalOpen(false);
          setRestoreModalOpen(false);
          setSettingsModalOpen(false);
          setHelpModalOpen(false);
          setArchiveSearchModalOpen(false);
          setBackupModalOpen(false);
          setPortableVaultModalOpen(false);
          return;
        }
        setSelectedItemId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    confirmDialog,
    saveModalOpen,
    storageModalOpen,
    duplicatesModalOpen,
    restoreModalOpen,
    settingsModalOpen,
    helpModalOpen,
    archiveSearchModalOpen,
    backupModalOpen,
    portableVaultModalOpen
  ]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Destination filter
    if (currentDestination === 'favorites') {
      result = result.filter(i => i.isFavorite && !i.deletedAt);
    } else if (currentDestination === 'trash') {
      result = result.filter(i => Boolean(i.deletedAt));
    } else if (currentDestination === 'recent') {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(i => !i.deletedAt && new Date(i.savedAt).getTime() >= oneWeekAgo);
    } else if (currentDestination === 'browser_edge') {
      result = result.filter(i => !i.deletedAt && i.browserFamily === 'Edge');
    } else if (currentDestination === 'browser_chrome') {
      result = result.filter(i => !i.deletedAt && i.browserFamily === 'Chrome');
    } else if (currentDestination === 'browser_firefox') {
      result = result.filter(i => !i.deletedAt && i.browserFamily === 'Firefox');
    } else if (currentDestination === 'collections') {
      result = result.filter(i => !i.deletedAt && i.collectionIds && i.collectionIds.length > 0);
    } else if (currentDestination.startsWith('col_')) {
      const colId = currentDestination.replace('col_', '');
      result = result.filter(i => i.collectionIds.includes(colId) && !i.deletedAt);
    } else {
      // Default: All active tabs
      result = result.filter(i => !i.deletedAt);
    }

    // Filter Type dropdown filter (favorites, tab, session, reachable)
    if (filterType && filterType !== 'all') {
      if (filterType === 'favorites') {
        result = result.filter(i => i.isFavorite);
      } else if (filterType === 'tab') {
        result = result.filter(i => i.itemType === 'tab' || !i.tabCount || i.tabCount <= 1);
      } else if (filterType === 'session') {
        result = result.filter(i => i.itemType === 'session' || (i.tabCount && i.tabCount > 1));
      } else if (filterType === 'reachable') {
        result = result.filter(i => i.availabilityStatus === 'reachable');
      }
    }

    // Pill Filter (All, Tab, Session, AI, Development, Research, Design, Work)
    if (activeTagFilter && activeTagFilter.toLowerCase() !== 'all') {
      const pill = activeTagFilter.toLowerCase();
      if (pill === 'tab') {
        result = result.filter(i => i.itemType === 'tab' || !i.tabCount || i.tabCount <= 1);
      } else if (pill === 'session') {
        result = result.filter(i => i.itemType === 'session' || (i.tabCount && i.tabCount > 1));
      } else {
        result = result.filter(i =>
          i.tags.some(t => t.toLowerCase().includes(pill)) ||
          i.title.toLowerCase().includes(pill) ||
          i.domain.toLowerCase().includes(pill) ||
          i.notes.toLowerCase().includes(pill)
        );
      }
    }

    // Global Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.url.toLowerCase().includes(q) ||
        i.domain.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'domain') return a.domain.localeCompare(b.domain);
      if (sortBy === 'size') return (b.archiveSizeBytes || 0) - (a.archiveSizeBytes || 0);
      return 0;
    });
  }, [items, currentDestination, activeTagFilter, searchQuery, sortBy, filterType]);

  // Personalization Grouping: Individual Tabs (Default) vs Group by Window Session
  const displayedItems = useMemo(() => {
    if (groupMode === 'session') {
      return groupTabsBySession(filteredItems);
    }
    return filteredItems;
  }, [filteredItems, groupMode]);

  const handleQuickAddUrl = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // Split text into individual lines or whitespace-separated URL candidates
    const lines = trimmed.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    const newItems: SavedTabItem[] = [];
    const now = new Date().toISOString();

    for (const line of lines) {
      const parts = line.split(/\s+/).filter(p => p.startsWith('http://') || p.startsWith('https://') || p.includes('.'));
      const urlsToProcess = parts.length > 0 ? parts : [line];

      for (const raw of urlsToProcess) {
        const normalized = raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('file://')
          ? raw
          : `https://${raw}`;
        const domain = extractDomainFromUrl(normalized);
        const title = domain || 'Saved Web Tab';
        const newItem: SavedTabItem = {
          id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          vaultId: 'default',
          itemType: 'tab',
          title: title,
          url: normalized,
          normalizedUrl: normalized,
          domain: domain,
          faviconUrl: domain ? `https://${domain}/favicon.ico` : null,
          thumbnailUrl: null,
          browserFamily: 'Edge',
          profileLabel: 'Default',
          savedAt: now,
          notes: '',
          isFavorite: false,
          collectionIds: currentDestination.startsWith('col_') ? [currentDestination.replace('col_', '')] : ['inbox'],
          tags: ['Quick Add', 'Web'],
          tabCount: 1,
          archiveSizeBytes: 131072,
          availabilityStatus: 'reachable'
        };
        newItems.push(newItem);
      }
    }

    if (newItems.length > 0) {
      setItems(prev => [...newItems, ...prev]);
      setSelectedItemId(newItems[0].id);
    }
  };

  const selectedItem = useMemo(() => {
    return displayedItems.find(i => i.id === selectedItemId) || items.find(i => i.id === selectedItemId) || null;
  }, [displayedItems, items, selectedItemId]);

  const trashCount = useMemo(() => {
    return items.filter(i => Boolean(i.deletedAt)).length;
  }, [items]);

  const favoritesCount = useMemo(() => {
    return items.filter(i => i.isFavorite && !i.deletedAt).length;
  }, [items]);

  const activeCollections = useMemo(() => {
    return collections.map(col => ({
      ...col,
      itemCount: items.filter(i => i.collectionIds.includes(col.id) && !i.deletedAt).length
    }));
  }, [collections, items]);

  const collectionsCount = useMemo(() => {
    return items.filter(i => !i.deletedAt && i.collectionIds && i.collectionIds.length > 0).length;
  }, [items]);

  const activeItemCount = useMemo(() => items.filter(i => !i.deletedAt).length, [items]);

  const recentCount = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return items.filter(i => !i.deletedAt && new Date(i.savedAt).getTime() >= oneWeekAgo).length;
  }, [items]);

  const edgeCount = useMemo(() => items.filter(i => i.browserFamily === 'Edge' && !i.deletedAt).length, [items]);
  const chromeCount = useMemo(() => items.filter(i => i.browserFamily === 'Chrome' && !i.deletedAt).length, [items]);
  const firefoxCount = useMemo(() => items.filter(i => i.browserFamily === 'Firefox' && !i.deletedAt).length, [items]);

  const storageUsedBytes = useMemo(() => {
    return items.filter(i => !i.deletedAt).reduce((acc, i) => acc + (i.archiveSizeBytes || 128 * 1024), 0);
  }, [items]);

  const duplicatesCount = useMemo(() => {
    const active = items.filter(i => !i.deletedAt);
    const seen = new Set<string>();
    let dupes = 0;
    for (const item of active) {
      const url = item.normalizedUrl || item.url;
      if (seen.has(url)) {
        dupes++;
      } else {
        seen.add(url);
      }
    }
    return dupes;
  }, [items]);

  const brokenLinksCount = useMemo(() => {
    return items.filter(i => !i.deletedAt && (i.availabilityStatus === 'network_error' || i.availabilityStatus === 'timeout')).length;
  }, [items]);

  // Actions

  const handleDeleteSubTab = (parentId: string, subTabId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === parentId) {
        const currentTabs = item.sessionTabs || [];
        const updated = currentTabs.filter(st => st.id !== subTabId);
        return {
          ...item,
          sessionTabs: updated,
          tabCount: updated.length
        };
      }
      return item;
    }));
  };

  const handleMoveItemToCollection = (itemId: string, collectionId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId || item.windowSessionId === itemId) {
        const currentCols = item.collectionIds || [];
        const newCols = currentCols.includes(collectionId)
          ? currentCols
          : [...currentCols, collectionId];
        return { ...item, collectionIds: newCols };
      }
      return item;
    }));
  };

  const handleToggleFavorite = (id: string) => {
    setItems(prev => {
      const targetItem = prev.find(i => i.id === id);
      if (targetItem) {
        return prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item);
      }
      // Target is a windowSessionId
      const sessionTabs = prev.filter(i => i.windowSessionId === id);
      if (sessionTabs.length > 0) {
        const anyFavorite = sessionTabs.some(i => i.isFavorite);
        return prev.map(item => item.windowSessionId === id ? { ...item, isFavorite: !anyFavorite } : item);
      }
      return prev;
    });
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.deletedAt) {
        setConfirmDialog({
          isOpen: true,
          title: 'Permanently Delete Tab?',
          message: `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone and will permanently remove this record from your vault.`,
          confirmLabel: 'Permanently Delete',
          onConfirm: () => {
            setItems(prev => TrashManager.permanentDelete(prev, id));
            if (selectedItemId === id) setSelectedItemId(null);
            setConfirmDialog(null);
          }
        });
      } else {
        setItems(prev => TrashManager.softDelete(prev, id));
        if (selectedItemId === id) setSelectedItemId(null);
      }
      return;
    }

    // Check if it's a windowSessionId
    const sessionTabs = items.filter(i => i.windowSessionId === id);
    if (sessionTabs.length > 0) {
      const anyDeleted = sessionTabs.some(i => i.deletedAt);
      if (anyDeleted) {
        setConfirmDialog({
          isOpen: true,
          title: 'Permanently Delete Session?',
          message: `Are you sure you want to permanently delete all ${sessionTabs.length} tabs in this session? This action cannot be undone.`,
          confirmLabel: 'Permanently Delete All',
          onConfirm: () => {
            setItems(prev => prev.filter(i => i.windowSessionId !== id));
            if (selectedItemId === id) setSelectedItemId(null);
            setConfirmDialog(null);
          }
        });
      } else {
        const now = new Date().toISOString();
        setItems(prev => prev.map(i => i.windowSessionId === id ? { ...i, deletedAt: now } : i));
        if (selectedItemId === id) setSelectedItemId(null);
      }
    }
  };

  const handleRestoreFromTrash = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        return TrashManager.restoreFromTrash(prev, id);
      }
      return prev.map(i => i.windowSessionId === id ? { ...i, deletedAt: null } : i);
    });
    if (currentDestination === 'trash' && selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleEmptyTrash = () => {
    const trashItems = TrashManager.getTrashItems(items);
    if (trashItems.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Empty Trash?',
      message: `Are you sure you want to permanently delete all ${trashItems.length} item${trashItems.length === 1 ? '' : 's'} in the Trash? This action cannot be undone.`,
      confirmLabel: 'Empty Trash',
      onConfirm: () => {
        setItems(prev => TrashManager.emptyTrash(prev));
        if (selectedItem?.deletedAt) {
          setSelectedItemId(null);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setItems(prev => prev.map(item => (item.id === id || item.windowSessionId === id) ? { ...item, notes } : item));
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setItems(prev => prev.map(item => (item.id === id || item.windowSessionId === id) ? { ...item, title } : item));
  };

  const handleAddTag = (id: string, tag: string) => {
    setItems(prev => prev.map(item => (item.id === id || item.windowSessionId === id) && !item.tags.includes(tag) ? { ...item, tags: [...item.tags, tag] } : item));
  };

  const handleRemoveTag = (id: string, tag: string) => {
    setItems(prev => prev.map(item => (item.id === id || item.windowSessionId === id) ? { ...item, tags: item.tags.filter(t => t !== tag) } : item));
  };

  const handleOpenLiveUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCheckAvailability = async (url: string) => {
    const res = await AvailabilityChecker.checkUrl(url);
    setItems(prev => prev.map(item => {
      if (item.url === url) {
        return {
          ...item,
          availabilityStatus: res.category === 'forbidden_scheme' ? 'blocked_uncertain' : res.category,
          availabilityCheckedAt: res.checkedAt
        };
      }
      return item;
    }));
  };

  const handleSaveCompleted = (newTabs: SavedTabItem[]) => {
    setItems(prev => [...newTabs, ...prev]);
    setCollections(prev => prev.map(col => ({
      ...col,
      itemCount: col.itemCount + newTabs.filter(t => t.collectionIds.includes(col.id)).length
    })));
  };

  const handleCheckAllLinks = async () => {
    for (const item of items) {
      if (!item.deletedAt && item.url.startsWith('http')) {
        handleCheckAvailability(item.url);
      }
    }
  };

  const handleMagicOrganize = () => {
    setItems(prev => prev.map(item => {
      const newTags = new Set(item.tags);
      const d = item.domain.toLowerCase();
      if (d.includes('github') || d.includes('rust') || d.includes('unity') || d.includes('tauri')) newTags.add('Development');
      if (d.includes('figma') || d.includes('behance') || d.includes('dribbble')) newTags.add('Design');
      if (d.includes('arxiv') || d.includes('scholar') || d.includes('docs')) newTags.add('Research');
      if (d.includes('youtube') || d.includes('spotify') || d.includes('soundcloud')) newTags.add('Entertainment');
      if (d.includes('notion') || d.includes('linear')) newTags.add('Productivity');
      return { ...item, tags: Array.from(newTags) };
    }));
  };

  // Get destination display title
  const getDestinationTitle = () => {
    if (currentDestination === 'favorites') return 'Favorites';
    if (currentDestination === 'trash') return 'Trash';
    if (currentDestination === 'recent') return 'Recent Tabs';
    if (currentDestination === 'browser_edge') return 'Microsoft Edge Tabs';
    if (currentDestination === 'browser_chrome') return 'Google Chrome Tabs';
    if (currentDestination === 'browser_firefox') return 'Firefox Tabs';
    if (currentDestination === 'collections') return 'All Collections';
    if (currentDestination.startsWith('col_')) {
      const col = collections.find(c => c.id === currentDestination.replace('col_', ''));
      return col ? col.name : 'Collection';
    }
    return 'All Tabs';
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Navigation Sidebar */}
      <Sidebar
        currentDestination={currentDestination}
        onSelectDestination={setCurrentDestination}
        collections={activeCollections}
        collectionsCount={collectionsCount}
        onOpenCreateCollection={() => {
          const name = prompt('Enter new collection name:');
          if (name) {
            const newCol: Collection = {
              id: 'col_' + Date.now(),
              name,
              description: '',
              accentColor: '#2563eb',
              itemCount: 0
            };
            setCollections(prev => [...prev, newCol]);
          }
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenStorage={() => setStorageModalOpen(true)}
        onOpenDuplicates={() => setDuplicatesModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenRestoreQueue={() => setRestoreModalOpen(true)}
        onOpenArchiveSearch={() => setArchiveSearchModalOpen(true)}
        onOpenCheckLinks={handleCheckAllLinks}
        onOpenPortableVault={() => setPortableVaultModalOpen(true)}
        activeItemCount={activeItemCount}
        favoritesCount={favoritesCount}
        trashCount={trashCount}
        recentCount={recentCount}
        edgeCount={edgeCount}
        chromeCount={chromeCount}
        firefoxCount={firefoxCount}
        storageUsedBytes={storageUsedBytes}
        storageLimitBytes={preferences.storageQuotaBytes || (50 * 1024 * 1024 * 1024)}
        duplicatesCount={duplicatesCount}
        brokenLinksCount={brokenLinksCount}
      />

      {/* Main Content Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Header
          title={getDestinationTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          itemCount={displayedItems.length}
          onOpenSaveModal={(scope) => {
            setSaveModalScope(scope || 'window');
            setSaveModalOpen(true);
          }}
          onQuickSave={() => {
            setSaveModalScope('window');
            setSaveModalOpen(true);
          }}
          onMagicAction={handleMagicOrganize}
          isTrash={currentDestination === 'trash'}
          onEmptyTrash={handleEmptyTrash}
          trashCount={trashCount}
          activeTagFilter={activeTagFilter}
          onSelectTagFilter={setActiveTagFilter}
          currentTheme={preferences.theme}
          onToggleTheme={() => {
            const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
            setPreferences(prev => ({ ...prev, theme: nextTheme }));
          }}
          syncStatus={syncStatus}
          groupMode={groupMode}
          onGroupModeChange={setGroupMode}
        />

        {currentDestination === 'trash' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={16} color="var(--danger-color)" />
              <span>
                <strong>Trash:</strong> Items here can be restored to your active library or permanently deleted.
              </span>
            </div>
            {trashCount > 0 && (
              <button
                onClick={handleEmptyTrash}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--danger-color)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} />
                <span>Empty Trash ({trashCount})</span>
              </button>
            )}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Main List / Grid View */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {viewMode === 'grid' && (
              <TabGrid
                items={displayedItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onRestoreItem={handleRestoreFromTrash}
                onOpenLiveUrl={handleOpenLiveUrl}
                isTrash={currentDestination === 'trash'}
                onQuickAddUrl={handleQuickAddUrl}
                groupMode={groupMode}
              />
            )}
            {viewMode === 'compact' && (
              <TabCompactList
                items={displayedItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onRestoreItem={handleRestoreFromTrash}
                onOpenLiveUrl={handleOpenLiveUrl}
                isTrash={currentDestination === 'trash'}
              />
            )}
            {viewMode === 'detailed' && (
              <TabDetailedList
                items={displayedItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onRestoreItem={handleRestoreFromTrash}
                onOpenLiveUrl={handleOpenLiveUrl}
                isTrash={currentDestination === 'trash'}
              />
            )}
          </main>

          {/* Collapsible Detail Inspector (PRD Section 9.4 & Mockup) */}
          {selectedItem && (
            <DetailInspector
              item={selectedItem}
              collections={collections}
              onClose={() => setSelectedItemId(null)}
              onUpdateNotes={handleUpdateNotes}
              onUpdateTitle={handleUpdateTitle}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onOpenLiveUrl={handleOpenLiveUrl}
              onCheckAvailability={handleCheckAvailability}
              onRestoreItem={handleRestoreFromTrash}
              onDeleteItem={handleDeleteItem}
              onToggleFavorite={handleToggleFavorite}
              onDeleteSubTab={handleDeleteSubTab}
              onMoveToCollection={handleMoveItemToCollection}
              isTrash={currentDestination === 'trash'}
            />
          )}
        </div>
      </div>

      {/* Real-time Vault Sync Toast Notification */}
      {syncToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 99999,
            pointerEvents: 'none'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Modals & Dialogs */}
      <SaveTabsModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        collections={collections}
        onSaveCompleted={handleSaveCompleted}
        initialScope={saveModalScope}
      />

      <OnboardingWizard
        isOpen={!hasOnboarded}
        onComplete={() => {
          setHasOnboarded(true);
          localStorage.setItem('tabsed_onboarded', 'true');
        }}
      />

      <StorageModal
        isOpen={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
        storageReport={{
          exactVaultBytes: 12400000000,
          thumbnailsBytes: 6200000000,
          databaseBytes: 1800000000,
          archivesBytes: 3800000000,
          trashBytes: 420000000,
          backupsBytes: 120000000,
          temporaryBytes: 60000000,
          manifestBytes: 4096,
          freeSpaceBytes: 142000000000,
          profileEstimateBytes: null
        }}
        quotaBytes={50 * 1024 * 1024 * 1024}
      />

      <DuplicatesModal
        isOpen={duplicatesModalOpen}
        onClose={() => setDuplicatesModalOpen(false)}
        items={items}
        onDeleteItem={handleDeleteItem}
      />

      <RestoreQueueModal
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        items={items}
      />

      <ArchiveSearchModal
        isOpen={archiveSearchModalOpen}
        onClose={() => setArchiveSearchModalOpen(false)}
        items={items}
        collections={collections}
        onSelectItem={setSelectedItemId}
        onOpenLiveUrl={handleOpenLiveUrl}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        items={items}
        onRestoreBackup={(restored) => setItems(restored)}
      />

      <PortableVaultModal
        isOpen={portableVaultModalOpen}
        onClose={() => setPortableVaultModalOpen(false)}
        items={items}
        collections={collections}
        tags={INITIAL_COLLECTIONS.map(c => ({ id: c.id, name: c.name }))}
        onImportItems={(imported) => setItems(imported)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(newPrefs) => setPreferences(prev => ({ ...prev, ...newPrefs }))}
      />

      <HelpDiagnosticsModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      {confirmDialog && (
        <ConfirmationModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
};
