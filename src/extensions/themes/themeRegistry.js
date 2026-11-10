/**
 * Theme Registry
 * Loads all theme packages matching Hue & View format and bundles their raw CSS for runtime injection
 */

// Aggressive Red
import aggressiveRedVariables from './aggressive-red/variables.css?raw';
import aggressiveRedLight from './aggressive-red/lightMode.css?raw';
import aggressiveRedDark from './aggressive-red/darkMode.css?raw';
import aggressiveRedElements from './aggressive-red/elements.css?raw';
import aggressiveRedComponents from './aggressive-red/components.css?raw';

// Black Forest
import blackForestVariables from './black-forest/variables.css?raw';
import blackForestLight from './black-forest/lightMode.css?raw';
import blackForestDark from './black-forest/darkMode.css?raw';
import blackForestElements from './black-forest/elements.css?raw';
import blackForestComponents from './black-forest/components.css?raw';

// Classy Kimono
import classyKimonoVariables from './classy-kimono/variables.css?raw';
import classyKimonoLight from './classy-kimono/lightMode.css?raw';
import classyKimonoDark from './classy-kimono/darkMode.css?raw';
import classyKimonoElements from './classy-kimono/elements.css?raw';
import classyKimonoComponents from './classy-kimono/components.css?raw';

// Cyberpunk Neon
import cyberpunkNeonVariables from './cyberpunk-neon/variables.css?raw';
import cyberpunkNeonLight from './cyberpunk-neon/lightMode.css?raw';
import cyberpunkNeonDark from './cyberpunk-neon/darkMode.css?raw';
import cyberpunkNeonElements from './cyberpunk-neon/elements.css?raw';
import cyberpunkNeonComponents from './cyberpunk-neon/components.css?raw';

// devOrbit Default
import devorbitVariables from './devorbit-default/variables.css?raw';
import devorbitLight from './devorbit-default/lightMode.css?raw';
import devorbitDark from './devorbit-default/darkMode.css?raw';
import devorbitElements from './devorbit-default/elements.css?raw';
import devorbitComponents from './devorbit-default/components.css?raw';

// Emerald Forest
import emeraldForestVariables from './emerald-forest/variables.css?raw';
import emeraldForestLight from './emerald-forest/lightMode.css?raw';
import emeraldForestDark from './emerald-forest/darkMode.css?raw';
import emeraldForestElements from './emerald-forest/elements.css?raw';
import emeraldForestComponents from './emerald-forest/components.css?raw';

// German Engineering
import germanEngineeringVariables from './german-engineering/variables.css?raw';
import germanEngineeringLight from './german-engineering/lightMode.css?raw';
import germanEngineeringDark from './german-engineering/darkMode.css?raw';
import germanEngineeringElements from './german-engineering/elements.css?raw';
import germanEngineeringComponents from './german-engineering/components.css?raw';

// Nordic Frost
import nordicFrostVariables from './nordic-frost/variables.css?raw';
import nordicFrostLight from './nordic-frost/lightMode.css?raw';
import nordicFrostDark from './nordic-frost/darkMode.css?raw';
import nordicFrostElements from './nordic-frost/elements.css?raw';
import nordicFrostComponents from './nordic-frost/components.css?raw';

// Ocean Breeze
import oceanBreezeVariables from './ocean-breeze/variables.css?raw';
import oceanBreezeLight from './ocean-breeze/lightMode.css?raw';
import oceanBreezeDark from './ocean-breeze/darkMode.css?raw';
import oceanBreezeElements from './ocean-breeze/elements.css?raw';
import oceanBreezeComponents from './ocean-breeze/components.css?raw';

// Paper Pen
import paperPenVariables from './paper-pen/variables.css?raw';
import paperPenLight from './paper-pen/lightMode.css?raw';
import paperPenDark from './paper-pen/darkMode.css?raw';
import paperPenElements from './paper-pen/elements.css?raw';
import paperPenComponents from './paper-pen/components.css?raw';

// Precision Blueprint
import precisionBlueprintVariables from './precision-blueprint/variables.css?raw';
import precisionBlueprintLight from './precision-blueprint/lightMode.css?raw';
import precisionBlueprintDark from './precision-blueprint/darkMode.css?raw';
import precisionBlueprintElements from './precision-blueprint/elements.css?raw';
import precisionBlueprintComponents from './precision-blueprint/components.css?raw';

// Professional Blue
import professionalBlueVariables from './professional-blue/variables.css?raw';
import professionalBlueLight from './professional-blue/lightMode.css?raw';
import professionalBlueDark from './professional-blue/darkMode.css?raw';
import professionalBlueElements from './professional-blue/elements.css?raw';
import professionalBlueComponents from './professional-blue/components.css?raw';

// Solar Sunset
import solarSunsetVariables from './solar-sunset/variables.css?raw';
import solarSunsetLight from './solar-sunset/lightMode.css?raw';
import solarSunsetDark from './solar-sunset/darkMode.css?raw';
import solarSunsetElements from './solar-sunset/elements.css?raw';
import solarSunsetComponents from './solar-sunset/components.css?raw';

// Soothing Green
import soothingGreenVariables from './soothing-green/variables.css?raw';
import soothingGreenLight from './soothing-green/lightMode.css?raw';
import soothingGreenDark from './soothing-green/darkMode.css?raw';
import soothingGreenElements from './soothing-green/elements.css?raw';
import soothingGreenComponents from './soothing-green/components.css?raw';

// Tokyo Vibes
import tokyoVibesVariables from './tokyo-vibes/variables.css?raw';
import tokyoVibesLight from './tokyo-vibes/lightMode.css?raw';
import tokyoVibesDark from './tokyo-vibes/darkMode.css?raw';
import tokyoVibesElements from './tokyo-vibes/elements.css?raw';
import tokyoVibesComponents from './tokyo-vibes/components.css?raw';

// Winter Crystals
import winterCrystalsVariables from './winter-crystals/variables.css?raw';
import winterCrystalsLight from './winter-crystals/lightMode.css?raw';
import winterCrystalsDark from './winter-crystals/darkMode.css?raw';
import winterCrystalsElements from './winter-crystals/elements.css?raw';
import winterCrystalsComponents from './winter-crystals/components.css?raw';

export const THEME_DEFINITIONS = {
  'theme-devorbit-default': {
    id: 'theme-devorbit-default',
    slug: 'devorbit-default',
    name: 'devOrbit Azure Space',
    author: 'devOrbit Core',
    description: 'Electric Orbit Blue (#0084ff) and Midnight Slate dark tones.',
    previewColors: ['#0084ff', '#38bdf8', '#090d16', '#0d1220'],
    css: [devorbitVariables, devorbitLight, devorbitDark, devorbitElements, devorbitComponents].join('\n\n'),
  },
  'theme-aggressive-red': {
    id: 'theme-aggressive-red',
    slug: 'aggressive-red',
    name: 'Aggressive Red',
    author: 'Hue & View',
    description: 'High energy crimson palette (#d50000) with bold accents and sharp corners.',
    previewColors: ['#d50000', '#ff1744', '#140404', '#880e4f'],
    css: [aggressiveRedVariables, aggressiveRedLight, aggressiveRedDark, aggressiveRedElements, aggressiveRedComponents].join('\n\n'),
  },
  'theme-black-forest': {
    id: 'theme-black-forest',
    slug: 'black-forest',
    name: 'Black Forest',
    author: 'Hue & View',
    description: 'Deep forest pine slate tones (#37474f) and vibrant lime accent (#8bc34a).',
    previewColors: ['#37474f', '#8bc34a', '#102027', '#263238'],
    css: [blackForestVariables, blackForestLight, blackForestDark, blackForestElements, blackForestComponents].join('\n\n'),
  },
  'theme-classy-kimono': {
    id: 'theme-classy-kimono',
    slug: 'classy-kimono',
    name: 'Classy Kimono',
    author: 'Hue & View',
    description: 'Rich royal purple (#7b1fa2) paired with delicate cherry rose (#f06292).',
    previewColors: ['#7b1fa2', '#f06292', '#4a148c', '#512da8'],
    css: [classyKimonoVariables, classyKimonoLight, classyKimonoDark, classyKimonoElements, classyKimonoComponents].join('\n\n'),
  },
  'theme-cyberpunk-neon': {
    id: 'theme-cyberpunk-neon',
    slug: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    author: 'Hue & View',
    description: 'High-contrast electric cyan (#00f0ff) and hot magenta (#ff007f).',
    previewColors: ['#00f0ff', '#ff007f', '#ffe600', '#ff2a6d'],
    css: [cyberpunkNeonVariables, cyberpunkNeonLight, cyberpunkNeonDark, cyberpunkNeonElements, cyberpunkNeonComponents].join('\n\n'),
  },
  'theme-emerald-forest': {
    id: 'theme-emerald-forest',
    slug: 'emerald-forest',
    name: 'Emerald Forest',
    author: 'Hue & View',
    description: 'Natural forest greens (#2e7d32) with sunlit chartreuse highlights (#c0ca33).',
    previewColors: ['#2e7d32', '#c0ca33', '#1b5e20', '#33691e'],
    css: [emeraldForestVariables, emeraldForestLight, emeraldForestDark, emeraldForestElements, emeraldForestComponents].join('\n\n'),
  },
  'theme-german-engineering': {
    id: 'theme-german-engineering',
    slug: 'german-engineering',
    name: 'German Engineering',
    author: 'Hue & View',
    description: 'Industrial charcoal slate (#37474f) with amber gold precision (#fbc02d).',
    previewColors: ['#37474f', '#fbc02d', '#1976d2', '#263238'],
    css: [germanEngineeringVariables, germanEngineeringLight, germanEngineeringDark, germanEngineeringElements, germanEngineeringComponents].join('\n\n'),
  },
  'theme-nordic-frost': {
    id: 'theme-nordic-frost',
    slug: 'nordic-frost',
    name: 'Nordic Frost',
    author: 'Hue & View',
    description: 'Crisp Scandinavian glacial blue (#0284c7) and warm amber contrast (#d97706).',
    previewColors: ['#0284c7', '#d97706', '#38bdf8', '#64748b'],
    css: [nordicFrostVariables, nordicFrostLight, nordicFrostDark, nordicFrostElements, nordicFrostComponents].join('\n\n'),
  },
  'theme-ocean-breeze': {
    id: 'theme-ocean-breeze',
    slug: 'ocean-breeze',
    name: 'Ocean Breeze',
    author: 'Hue & View',
    description: 'Refreshing aquatic turquoise (#00bcd4) and playful coral pink (#ff4081).',
    previewColors: ['#00bcd4', '#ff4081', '#0097a7', '#0288d1'],
    css: [oceanBreezeVariables, oceanBreezeLight, oceanBreezeDark, oceanBreezeElements, oceanBreezeComponents].join('\n\n'),
  },
  'theme-paper-pen': {
    id: 'theme-paper-pen',
    slug: 'paper-pen',
    name: 'Paper Pen',
    author: 'Hue & View',
    description: 'Classic ink blue (#1e3a8a) on refined slate with warm crimson (#b91c1c).',
    previewColors: ['#1e3a8a', '#b91c1c', '#292524', '#475569'],
    css: [paperPenVariables, paperPenLight, paperPenDark, paperPenElements, paperPenComponents].join('\n\n'),
  },
  'theme-precision-blueprint': {
    id: 'theme-precision-blueprint',
    slug: 'precision-blueprint',
    name: 'Precision Blueprint',
    author: 'Hue & View',
    description: 'Architectural royal blueprint (#3b82f6) with vibrant rose calipers (#f43f5e).',
    previewColors: ['#3b82f6', '#f43f5e', '#2563eb', '#9333ea'],
    css: [precisionBlueprintVariables, precisionBlueprintLight, precisionBlueprintDark, precisionBlueprintElements, precisionBlueprintComponents].join('\n\n'),
  },
  'theme-professional-blue': {
    id: 'theme-professional-blue',
    slug: 'professional-blue',
    name: 'Professional Blue',
    author: 'Hue & View',
    description: 'Corporate sapphire (#1e88e5) and sky blue (#42a5f5) on executive navy.',
    previewColors: ['#1e88e5', '#42a5f5', '#0d47a1', '#1565c0'],
    css: [professionalBlueVariables, professionalBlueLight, professionalBlueDark, professionalBlueElements, professionalBlueComponents].join('\n\n'),
  },
  'theme-solar-sunset': {
    id: 'theme-solar-sunset',
    slug: 'solar-sunset',
    name: 'Solar Sunset',
    author: 'Hue & View',
    description: 'Warm glowing terracotta orange (#ff5722) and golden amber dusk (#ff9800).',
    previewColors: ['#ff5722', '#ff9800', '#d84315', '#f4511e'],
    css: [solarSunsetVariables, solarSunsetLight, solarSunsetDark, solarSunsetElements, solarSunsetComponents].join('\n\n'),
  },
  'theme-soothing-green': {
    id: 'theme-soothing-green',
    slug: 'soothing-green',
    name: 'Soothing Green',
    author: 'Hue & View',
    description: 'Calming botanical jade (#43a047) and soft herbal mint (#81c784).',
    previewColors: ['#43a047', '#81c784', '#1b5e20', '#2e7d32'],
    css: [soothingGreenVariables, soothingGreenLight, soothingGreenDark, soothingGreenElements, soothingGreenComponents].join('\n\n'),
  },
  'theme-tokyo-vibes': {
    id: 'theme-tokyo-vibes',
    slug: 'tokyo-vibes',
    name: 'Tokyo Vibes',
    author: 'Hue & View',
    description: 'Neon nightlife cherry blossom (#ff4081), Shibuya gold (#ffd740), and denim blue.',
    previewColors: ['#ff4081', '#ffd740', '#303f9f', '#448aff'],
    css: [tokyoVibesVariables, tokyoVibesLight, tokyoVibesDark, tokyoVibesElements, tokyoVibesComponents].join('\n\n'),
  },
  'theme-winter-crystals': {
    id: 'theme-winter-crystals',
    slug: 'winter-crystals',
    name: 'Winter Crystals',
    author: 'Hue & View',
    description: 'Frozen crystal azure (#0288d1) with sparkling frosty pink (#ff80ab).',
    previewColors: ['#0288d1', '#ff80ab', '#01579b', '#0277bd'],
    css: [winterCrystalsVariables, winterCrystalsLight, winterCrystalsDark, winterCrystalsElements, winterCrystalsComponents].join('\n\n'),
  },
};
