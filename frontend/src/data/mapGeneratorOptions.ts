export type MapEngine = 'native' | 'gemini'
export type GeminiModelMode = 'auto' | 'pinned'
export type OutputStyle = 'color' | 'black_white'
export type MapVersion = 'player' | 'dm'
export type MapResolution = 'standard' | 'high'
export type GridMode = 'square' | 'hex' | 'none'

export const GEMINI_MODEL_OPTIONS = [
  { id: 'auto', label: 'Auto (latest supported)' },
  { id: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image / Nano Banana 2' },
  { id: 'gemini-3-pro-image', label: 'Gemini 3 Pro Image' },
] as const

export function resolveGeminiModel(mode: GeminiModelMode, pinnedModel: string): string {
  if (mode === 'pinned' && pinnedModel) return pinnedModel
  return 'auto-latest-supported'
}

export function buildGeminiMapPrompt(input: {
  climate: string
  notes: string
  outputStyle: OutputStyle
  gridMode: GridMode
  mapVersion: MapVersion
  settlements: number
  roads: number
  mountains: number
  water: number
  forest: number
  desert: number
  swamp: number
  castles: number
  ruins: number
  towers: number
  ports: number
  dungeons: number
}) {
  const styleLine =
    input.outputStyle === 'black_white'
      ? 'Render as high-contrast black-and-white fantasy cartography suitable for printing.'
      : 'Render as a vivid high-fantasy color tabletop map.'

  const versionLine =
    input.mapVersion === 'dm'
      ? 'Include secret landmarks and DM-facing cues in a subtle, readable way.'
      : 'Do not include secret DM-only information.'

  return [
    'Generate a top-down fantasy tabletop regional map.',
    styleLine,
    versionLine,
    `Terrain emphasis: mountains ${input.mountains}, water ${input.water}, forest ${input.forest}, desert ${input.desert}, swamp ${input.swamp}.`,
    `Settlements ${input.settlements}, roads ${input.roads}, castles ${input.castles}, ruins ${input.ruins}, towers ${input.towers}, ports ${input.ports}, dungeons ${input.dungeons}.`,
    `Climate: ${input.climate}.`,
    `Grid mode: ${input.gridMode}.`,
    `Notes: ${input.notes || 'None'}.`,
  ].join(' ')
}
