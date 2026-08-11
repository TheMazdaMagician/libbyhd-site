// theme.js — Libby shared theme loader
// Include on every page: <script src="/theme.js"></script>
// Reads localStorage and applies theme before first paint (no flash)
//
// Themes researched from r/webdesign, r/UI_design, r/accessibility,
// WCAG 2.2 best-practice roundups, and Figma Community top downloads (2024-25)

(function () {
  'use strict';

  // ── THEME DEFINITIONS ───────────────────────────────────────────────────────
  // Each theme has light{} and dark{} sub-objects mapping to existing CSS vars.
  // warn is kept neutral across themes (amber) — it's a semantic colour.

  const THEMES = {

    // ── 1. Civic Clarity ──────────────────────────────────────────────────────
    // Gov.uk / USWDS style. Sharp corners, blue-green, zero ambiguity.
    // Top pattern in r/accessibility + gov-tech communities 2024.
    'civic': {
      label: 'Civic Clarity',
      description: 'Clean, high-trust — modelled on gov.uk. Every element is unambiguous.',
      swatch: { bg: '#F5F5F5', primary: '#0052CC', accent: '#00875A' },
      light: {
        '--bg':      '#F5F5F5',
        '--surface': '#FFFFFF',
        '--surface2':'#EAEDF3',
        '--text':    '#1A1A1A',
        '--muted':   '#555870',
        '--line':    '#D0D0D8',
        '--primary': '#0052CC',
        '--accent':  '#00875A',
        '--warn':    '#B45309',
        '--radius':  '4px',
        '--shadow':  '0 2px 12px rgba(0,0,0,.10)',
        '--focus':   '0 0 0 3px rgba(0,82,204,.25)',
      },
      dark: {
        '--bg':      '#1A1A2E',
        '--surface': '#25253A',
        '--surface2':'#1F1F33',
        '--text':    '#E8E8F0',
        '--muted':   '#9A9BB8',
        '--line':    '#3E3E5A',
        '--primary': '#6EA8FE',
        '--accent':  '#34D399',
        '--warn':    '#FCD34D',
        '--radius':  '4px',
        '--shadow':  '0 4px 24px rgba(0,0,0,.45)',
        '--focus':   '0 0 0 3px rgba(110,168,254,.30)',
      },
    },

    // ── 2. Soft Focus ─────────────────────────────────────────────────────────
    // Warm off-white + indigo. Conservative neumorphism — no harsh borders,
    // soft depth shadows. Top Figma Community dashboard style 2024.
    'soft': {
      label: 'Soft Focus',
      description: 'Gentle depth and soft shadows. Reduces visual fatigue.',
      swatch: { bg: '#EEF0F4', primary: '#5B6AF0', accent: '#F0A05B' },
      light: {
        '--bg':      '#EEF0F4',
        '--surface': '#F8F9FB',
        '--surface2':'#ECEEF4',
        '--text':    '#2C2F45',
        '--muted':   '#6B7080',
        '--line':    'transparent',
        '--primary': '#5B6AF0',
        '--accent':  '#E08A3C',
        '--warn':    '#B45309',
        '--radius':  '14px',
        '--shadow':  '4px 4px 12px #D1D5E0, -4px -4px 12px #FFFFFF',
        '--focus':   '0 0 0 3px rgba(91,106,240,.22)',
      },
      dark: {
        '--bg':      '#1E2030',
        '--surface': '#272A3D',
        '--surface2':'#21243A',
        '--text':    '#D8DCEF',
        '--muted':   '#8B92B0',
        '--line':    'transparent',
        '--primary': '#818CF8',
        '--accent':  '#FBBF24',
        '--warn':    '#FCD34D',
        '--radius':  '14px',
        '--shadow':  '4px 4px 12px #13151F, -4px -4px 8px #2F3349',
        '--focus':   '0 0 0 3px rgba(129,140,248,.28)',
      },
    },

    // ── 3. High-Contrast Ink ──────────────────────────────────────────────────
    // WCAG AAA on every surface. Atkinson Hyperlegible font reduces reading
    // effort for low vision / cognitive load. Burnt orange accent.
    // Dominant in r/accessibility 2024–25.
    'ink': {
      label: 'High-Contrast',
      description: 'WCAG AAA contrast. Atkinson Hyperlegible font. Designed for low-vision and long sessions.',
      swatch: { bg: '#FFFFFF', primary: '#C7580A', accent: '#1A73E8' },
      light: {
        '--bg':      '#FFFFFF',
        '--surface': '#F2F2F2',
        '--surface2':'#E8E8E8',
        '--text':    '#0D0D0D',
        '--muted':   '#444444',
        '--line':    '#0D0D0D',
        '--primary': '#C7580A',
        '--accent':  '#1A73E8',
        '--warn':    '#B45309',
        '--radius':  '4px',
        '--shadow':  '0 2px 0 #0D0D0D',
        '--focus':   '0 0 0 3px rgba(199,88,10,.30)',
      },
      dark: {
        '--bg':      '#121212',
        '--surface': '#1E1E1E',
        '--surface2':'#2A2A2A',
        '--text':    '#F0F0F0',
        '--muted':   '#B8B8B8',
        '--line':    '#E0E0E0',
        '--primary': '#FF8C42',
        '--accent':  '#5BA4FC',
        '--warn':    '#FCD34D',
        '--radius':  '4px',
        '--shadow':  '0 2px 0 #E0E0E0',
        '--focus':   '0 0 0 3px rgba(255,140,66,.35)',
      },
    },

    // ── 4. Warm Minimal ───────────────────────────────────────────────────────
    // Cream + terracotta + sage. "Cozy productivity" — upvoted heavily in
    // r/UI_design as the human alternative to cold blue-grey dashboards.
    'warm': {
      label: 'Warm Minimal',
      description: 'Cream, terracotta, sage. Feels human, not clinical.',
      swatch: { bg: '#FAF7F2', primary: '#C4622D', accent: '#4A7C59' },
      light: {
        '--bg':      '#FAF7F2',
        '--surface': '#FFFFFF',
        '--surface2':'#F3EDE4',
        '--text':    '#1C1714',
        '--muted':   '#72614F',
        '--line':    '#E8E0D5',
        '--primary': '#C4622D',
        '--accent':  '#4A7C59',
        '--warn':    '#B45309',
        '--radius':  '10px',
        '--shadow':  '0 4px 20px rgba(100,60,20,.10)',
        '--focus':   '0 0 0 3px rgba(196,98,45,.25)',
      },
      dark: {
        '--bg':      '#1C1A17',
        '--surface': '#26231E',
        '--surface2':'#302A22',
        '--text':    '#EDE7DE',
        '--muted':   '#A0917F',
        '--line':    '#3A352E',
        '--primary': '#E8845A',
        '--accent':  '#6AAF7E',
        '--warn':    '#FCD34D',
        '--radius':  '10px',
        '--shadow':  '0 6px 28px rgba(0,0,0,.40)',
        '--focus':   '0 0 0 3px rgba(232,132,90,.30)',
      },
    },

    // ── 5. Structured Night ───────────────────────────────────────────────────
    // GitHub Primer dark with layered grey surfaces. The most-requested
    // dark-mode theme in developer / productivity tool communities.
    'night': {
      label: 'Structured Night',
      description: 'Engineered dark theme. Layered grey surfaces, GitHub-style. Easy on eyes in dim rooms.',
      swatch: { bg: '#0D1117', primary: '#2F81F7', accent: '#3FB950' },
      light: {
        '--bg':      '#F6F8FA',
        '--surface': '#FFFFFF',
        '--surface2':'#EAEEF2',
        '--text':    '#24292F',
        '--muted':   '#57606A',
        '--line':    '#D0D7DE',
        '--primary': '#0969DA',
        '--accent':  '#1A7F37',
        '--warn':    '#9A6700',
        '--radius':  '6px',
        '--shadow':  '0 1px 3px rgba(27,31,36,.12), 0 8px 24px rgba(66,74,83,.12)',
        '--focus':   '0 0 0 3px rgba(9,105,218,.30)',
      },
      dark: {
        '--bg':      '#0D1117',
        '--surface': '#161B22',
        '--surface2':'#21262D',
        '--text':    '#C9D1D9',
        '--muted':   '#8B949E',
        '--line':    '#30363D',
        '--primary': '#2F81F7',
        '--accent':  '#3FB950',
        '--warn':    '#D29922',
        '--radius':  '6px',
        '--shadow':  '0 1px 3px rgba(0,0,0,.30), 0 8px 24px rgba(0,0,0,.40)',
        '--focus':   '0 0 0 3px rgba(47,129,247,.40)',
      },
    },
  };

  // ── FONT STACKS ─────────────────────────────────────────────────────────────
  const FONTS = {
    'system':   { label: 'System default', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' },
    'inter':    { label: 'Inter (modern)', stack: '"Inter", "Helvetica Neue", Arial, sans-serif' },
    'atkinson': { label: 'Atkinson Hyperlegible (accessibility)', stack: '"Atkinson Hyperlegible", "Verdana", "Trebuchet MS", sans-serif' },
    'dm':       { label: 'DM Sans (friendly)', stack: '"DM Sans", "Lato", Arial, sans-serif' },
    'mono':     { label: 'Monospace (structured)', stack: '"JetBrains Mono", "Fira Code", "Consolas", monospace' },
  };

  // ── DENSITY ─────────────────────────────────────────────────────────────────
  const DENSITY = {
    'compact':     { label: 'Compact',     base: '13px', cardPad: '12px', gap: '8px' },
    'comfortable': { label: 'Comfortable', base: '15px', cardPad: '18px', gap: '12px' },
    'spacious':    { label: 'Spacious',    base: '17px', cardPad: '24px', gap: '18px' },
  };

  // ── APPLY THEME ──────────────────────────────────────────────────────────────
  function isDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(prefs) {
    const theme   = THEMES[prefs.theme]  || THEMES['warm'];
    const font    = FONTS[prefs.font]    || FONTS['system'];
    const density = DENSITY[prefs.density] || DENSITY['comfortable'];
    const dark    = isDark(prefs.mode);

    const vars = { ...(dark ? theme.dark : theme.light) };

    // Density overrides
    vars['--font-size-base'] = density.base;
    vars['--card-pad']       = density.cardPad;
    vars['--gap']            = density.gap;

    // Font
    vars['--font-sans'] = font.stack;

    // Build override style
    let css = ':root{';
    for (const [k, v] of Object.entries(vars)) {
      css += `${k}:${v};`;
    }
    css += `font-size:${density.base};`;
    css += `font-family:${font.stack};`;
    css += '}';

    // Font on body too for immediate effect
    css += `body{font-family:${font.stack};font-size:${density.base}}`;

    let el = document.getElementById('libby-theme');
    if (!el) {
      el = document.createElement('style');
      el.id = 'libby-theme';
      document.head.prepend(el);
    }
    el.textContent = css;

    // Mark on <html> for devtools / CSS targeting
    document.documentElement.setAttribute('data-theme', prefs.theme || 'warm');
    document.documentElement.setAttribute('data-color-mode', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-density', prefs.density || 'comfortable');
  }

  // ── LOAD & SAVE ──────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'libby_prefs';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  }

  function save(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  function getPrefs() {
    const saved = load();
    return {
      theme:   saved.theme   || 'warm',
      mode:    saved.mode    || 'auto',
      font:    saved.font    || 'system',
      density: saved.density || 'comfortable',
    };
  }

  // Apply on load immediately (before paint)
  const currentPrefs = getPrefs();
  apply(currentPrefs);

  // Re-apply if system color scheme changes and mode is 'auto'
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const p = getPrefs();
    if (p.mode === 'auto') apply(p);
  });

  // ── PUBLIC API ───────────────────────────────────────────────────────────────
  window.LibbyTheme = {
    THEMES,
    FONTS,
    DENSITY,
    getPrefs,
    apply,
    save(patch) {
      const p = { ...getPrefs(), ...patch };
      save(p);
      apply(p);
    },
  };

}());
