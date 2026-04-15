import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import { PageHero } from '../components/PageHero'
import type { MapProject } from '../types'
import {
  buildGeminiMapPrompt,
  GEMINI_MODEL_OPTIONS,
  type GeminiModelMode,
  type GridMode,
  type MapEngine,
  type MapResolution,
  type MapVersion,
  type OutputStyle,
} from '../data/mapGeneratorOptions'

type MapForm = {
  mapName: string
  seedPhrase: string
  climate: string
  terrainNotes: string
  mountains: number
  water: number
  forest: number
  desert: number
  swamp: number
  settlements: number
  roads: number
  castles: number
  ruins: number
  towers: number
  ports: number
  dungeons: number
  gridMode: GridMode
  engine: MapEngine
  geminiModelMode: GeminiModelMode
  geminiPinnedModel: string
  outputStyle: OutputStyle
  mapVersion: MapVersion
  resolution: MapResolution
}

type SavedMap = MapForm & {
  id: string
  createdAt: string
  resolvedModel: string
  promptPreview: string
}
type BackendMapProject = {
  id: number
  name: string
  summary: string
  map_data: Record<string, unknown>
  created_at: string
  updated_at: string
}
const initialForm: MapForm = {
  mapName: 'New Frontier',
  seedPhrase: '',
  climate: 'Temperate',
  terrainNotes: '',
  mountains: 4,
  water: 5,
  forest: 5,
  desert: 1,
  swamp: 1,
  settlements: 4,
  roads: 3,
  castles: 1,
  ruins: 1,
  towers: 1,
  ports: 1,
  dungeons: 1,
  gridMode: 'hex',
  engine: 'native',
  geminiModelMode: 'auto',
  geminiPinnedModel: 'gemini-3.1-flash-image-preview',
  outputStyle: 'color',
  mapVersion: 'dm',
  resolution: 'high',
}
function backendMapToSavedMap(project: BackendMapProject): SavedMap {
  const data = project.map_data ?? {}

  return {
    id: String(project.id),
    mapName: typeof data.mapName === 'string' ? data.mapName : project.name,
    seedPhrase: typeof data.seedPhrase === 'string' ? data.seedPhrase : '',
    climate: typeof data.climate === 'string' ? data.climate : 'Temperate',
    terrainNotes: typeof data.terrainNotes === 'string' ? data.terrainNotes : '',
    mountains: typeof data.mountains === 'number' ? data.mountains : 4,
    water: typeof data.water === 'number' ? data.water : 5,
    forest: typeof data.forest === 'number' ? data.forest : 5,
    desert: typeof data.desert === 'number' ? data.desert : 1,
    swamp: typeof data.swamp === 'number' ? data.swamp : 1,
    settlements: typeof data.settlements === 'number' ? data.settlements : 4,
    roads: typeof data.roads === 'number' ? data.roads : 3,
    castles: typeof data.castles === 'number' ? data.castles : 1,
    ruins: typeof data.ruins === 'number' ? data.ruins : 1,
    towers: typeof data.towers === 'number' ? data.towers : 1,
    ports: typeof data.ports === 'number' ? data.ports : 1,
    dungeons: typeof data.dungeons === 'number' ? data.dungeons : 1,
    gridMode: data.gridMode === 'square' ? 'square' : 'hex',
    engine: data.engine === 'gemini' ? 'gemini' : 'native',
    geminiModelMode: data.geminiModelMode === 'pinned' ? 'pinned' : 'auto',
    geminiPinnedModel:
      typeof data.geminiPinnedModel === 'string'
        ? data.geminiPinnedModel
        : 'gemini-3.1-flash-image-preview',
    outputStyle:
      data.outputStyle === 'sepia' || data.outputStyle === 'grayscale' ? data.outputStyle : 'color',
    mapVersion:
      data.mapVersion === 'player' || data.mapVersion === 'annotated' ? data.mapVersion : 'dm',
    resolution:
      data.resolution === 'medium' || data.resolution === 'ultra' ? data.resolution : 'high',
    createdAt: project.created_at,
    resolvedModel:
      typeof data.resolvedModel === 'string'
        ? data.resolvedModel
        : typeof data.engine === 'string'
          ? data.engine
          : 'native',
    promptPreview: typeof data.promptPreview === 'string' ? data.promptPreview : project.summary,
  }
}
function mapPreviewStyle(form: MapForm) {
  return {
    background:
      form.outputStyle === 'black_white'
        ? 'linear-gradient(180deg, #f5f5f5 0%, #d9d9d9 100%)'
        : 'linear-gradient(180deg, #314b39 0%, #203449 45%, #8f7d4d 100%)',
  }
}

function resolveModel(form: MapForm): string {
  if (form.engine === 'native') return 'native-generator'
  if (form.geminiModelMode === 'pinned') return form.geminiPinnedModel || 'gemini-3.1-flash-image-preview'
  return 'auto-latest-supported'
}

export function MapsPage() {
  const [form, setForm] = useState<MapForm>(initialForm)
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([])
  const [message, setMessage] = useState('')

  const promptPreview = useMemo(
    () =>
      buildGeminiMapPrompt({
        climate: form.climate,
        notes: form.terrainNotes,
        outputStyle: form.outputStyle,
        gridMode: form.gridMode,
        mapVersion: form.mapVersion,
        settlements: form.settlements,
        roads: form.roads,
        mountains: form.mountains,
        water: form.water,
        forest: form.forest,
        desert: form.desert,
        swamp: form.swamp,
        castles: form.castles,
        ruins: form.ruins,
        towers: form.towers,
        ports: form.ports,
        dungeons: form.dungeons,
      }),
    [form],
  )

  function updateField(key: keyof MapForm, value: string | number) {
    setForm((current) => ({ ...current, [key]: value } as MapForm))
  }

  function generateMap() {
    const resolvedModel = resolveModel(form)
    const next: SavedMap = {
      ...form,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toLocaleString(),
      resolvedModel,
      promptPreview,
    }
    setSavedMaps((current) => [next, ...current])
    setMessage(
      form.engine === 'native'
        ? 'Native map project generated and saved.'
        : `Gemini render request prepared using ${resolvedModel}.`,
    )
  }

  function exportMap(map: SavedMap, mode: 'color' | 'black_white') {
    const filename = `${map.mapName.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${mode}.txt`
    const content = [
      `Map: ${map.mapName}`,
      `Created: ${map.createdAt}`,
      `Engine: ${map.engine}`,
      `Resolved Model: ${map.resolvedModel}`,
      `Output Style: ${mode}`,
      `Version: ${map.mapVersion}`,
      `Grid: ${map.gridMode}`,
      '',
      'Prompt Preview:',
      map.promptPreview,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function printMap(map: SavedMap) {
    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>${map.mapName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #000; background: #fff; }
            h1 { margin-bottom: 8px; }
            .meta { margin-bottom: 16px; }
            .box { border: 2px solid #000; min-height: 500px; display:flex; align-items:center; justify-content:center; text-align:center; padding: 20px; }
            .notes { margin-top: 20px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${map.mapName}</h1>
          <div class="meta">
            Engine: ${map.engine} | Model: ${map.resolvedModel} | Version: ${map.mapVersion} | Style: ${map.outputStyle}
          </div>
          <div class="box">
            Printable map placeholder for ${map.mapName}<br/>
            Export style: ${map.outputStyle === 'black_white' ? 'Black & White' : 'Color'}
          </div>
          <div class="notes"><strong>Prompt Preview</strong>\n${map.promptPreview}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="page-shell stack">
      <PageHero
        variant="dashboard"
        imageSrc="/art/maps-banner.png"
        imageAlt="A fantasy cartographer table with maps and tools"
        eyebrow="Map Studio V62"
        title="Map Generator"
        description="Choose the built-in map engine or an optional Gemini high-quality render path, then export or print in color or black and white."
        tags={['Native Generator', 'Gemini Render', 'Color/B&W', 'Print & Export']}
      />

      <section className="grid two-col">
        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Generator controls</p>
              <h2>Create a map</h2>
              <p>Use Native Generator for fast structured output or Gemini for a higher-quality render workflow.</p>
            </div>
          </div>

          {message ? <div className="notice">{message}</div> : null}

          <div className="form-grid">
            <div className="form-section stack">
              <h3>Engine and output</h3>
              <div className="condition-toggle-row">
                {(['native', 'gemini'] as MapEngine[]).map((engine) => (
                  <button
                    key={engine}
                    type="button"
                    className={`button-link secondary condition-toggle ${form.engine === engine ? 'is-on' : ''}`}
                    onClick={() => updateField('engine', engine)}
                  >
                    {engine === 'native' ? 'Native Generator' : 'Gemini Render'}
                  </button>
                ))}
              </div>

              <div className="condition-toggle-row">
                {(['color', 'black_white'] as OutputStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`button-link secondary condition-toggle ${form.outputStyle === style ? 'is-on' : ''}`}
                    onClick={() => updateField('outputStyle', style)}
                  >
                    {style === 'color' ? 'Color' : 'Black & White'}
                  </button>
                ))}
              </div>

              <div className="condition-toggle-row">
                {(['dm', 'player'] as MapVersion[]).map((version) => (
                  <button
                    key={version}
                    type="button"
                    className={`button-link secondary condition-toggle ${form.mapVersion === version ? 'is-on' : ''}`}
                    onClick={() => updateField('mapVersion', version)}
                  >
                    {version === 'dm' ? 'DM Version' : 'Player Version'}
                  </button>
                ))}
              </div>

              <div className="form-inline">
                <label>
                  Grid
                  <select value={form.gridMode} onChange={(e) => updateField('gridMode', e.target.value as GridMode)}>
                    <option value="hex">Hex</option>
                    <option value="square">Square</option>
                    <option value="none">None</option>
                  </select>
                </label>

                <label>
                  Resolution
                  <select value={form.resolution} onChange={(e) => updateField('resolution', e.target.value as MapResolution)}>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              {form.engine === 'gemini' ? (
                <div className="stack">
                  <div className="condition-toggle-row">
                    {(['auto', 'pinned'] as GeminiModelMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`button-link secondary condition-toggle ${form.geminiModelMode === mode ? 'is-on' : ''}`}
                        onClick={() => updateField('geminiModelMode', mode)}
                      >
                        {mode === 'auto' ? 'Auto (latest supported)' : 'Pinned Model'}
                      </button>
                    ))}
                  </div>

                  {form.geminiModelMode === 'pinned' ? (
                    <label>
                      Pinned Gemini model
                      <select
                        value={form.geminiPinnedModel}
                        onChange={(e) => updateField('geminiPinnedModel', e.target.value)}
                      >
                        {GEMINI_MODEL_OPTIONS.filter((item) => item.id !== 'auto').map((item) => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="form-section stack">
              <h3>Map details</h3>
              <div className="form-inline">
                <label>
                  Map name
                  <input value={form.mapName} onChange={(e) => updateField('mapName', e.target.value)} />
                </label>
                <label>
                  Seed phrase
                  <input value={form.seedPhrase} onChange={(e) => updateField('seedPhrase', e.target.value)} />
                </label>
                <label>
                  Climate
                  <input value={form.climate} onChange={(e) => updateField('climate', e.target.value)} />
                </label>
              </div>

              <label>
                Terrain / feature notes
                <textarea value={form.terrainNotes} onChange={(e) => updateField('terrainNotes', e.target.value)} />
              </label>

              <div className="form-inline">
                <label>Mountains<input type="number" value={form.mountains} onChange={(e) => updateField('mountains', Number(e.target.value) || 0)} /></label>
                <label>Water<input type="number" value={form.water} onChange={(e) => updateField('water', Number(e.target.value) || 0)} /></label>
                <label>Forest<input type="number" value={form.forest} onChange={(e) => updateField('forest', Number(e.target.value) || 0)} /></label>
                <label>Desert<input type="number" value={form.desert} onChange={(e) => updateField('desert', Number(e.target.value) || 0)} /></label>
                <label>Swamp<input type="number" value={form.swamp} onChange={(e) => updateField('swamp', Number(e.target.value) || 0)} /></label>
              </div>

              <div className="form-inline">
                <label>Settlements<input type="number" value={form.settlements} onChange={(e) => updateField('settlements', Number(e.target.value) || 0)} /></label>
                <label>Roads<input type="number" value={form.roads} onChange={(e) => updateField('roads', Number(e.target.value) || 0)} /></label>
                <label>Castles<input type="number" value={form.castles} onChange={(e) => updateField('castles', Number(e.target.value) || 0)} /></label>
                <label>Ruins<input type="number" value={form.ruins} onChange={(e) => updateField('ruins', Number(e.target.value) || 0)} /></label>
                <label>Towers<input type="number" value={form.towers} onChange={(e) => updateField('towers', Number(e.target.value) || 0)} /></label>
                <label>Ports<input type="number" value={form.ports} onChange={(e) => updateField('ports', Number(e.target.value) || 0)} /></label>
                <label>Dungeons<input type="number" value={form.dungeons} onChange={(e) => updateField('dungeons', Number(e.target.value) || 0)} /></label>
              </div>
            </div>

            <div className="form-section stack">
              <h3>Generation preview</h3>
              <div className="chip-row">
                <span className="tag">{form.engine === 'native' ? 'Native Generator' : 'Gemini Render'}</span>
                <span className="tag">{form.outputStyle === 'color' ? 'Color' : 'Black & White'}</span>
                <span className="tag">{form.mapVersion === 'dm' ? 'DM Version' : 'Player Version'}</span>
                <span className="tag">{form.gridMode}</span>
                <span className="tag">{resolveModel(form)}</span>
              </div>

              <div className="map-preview-box" style={mapPreviewStyle(form)}>
                <div className="map-preview-inner">
                  <h3>{form.mapName}</h3>
                  <p>{form.engine === 'native' ? 'Structured native generation preview' : 'Gemini render prompt preview'}</p>
                  <small>{promptPreview}</small>
                </div>
              </div>
            </div>

            <div className="action-row">
              <button type="button" onClick={generateMap}>Generate map</button>
            </div>
          </div>
        </article>

        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Saved projects</p>
              <h2>Generated maps</h2>
              <p>Export text placeholders now, then wire image export/print to your preferred backend image pipeline later.</p>
            </div>
          </div>

          {savedMaps.length === 0 ? <div className="notice">No maps generated yet.</div> : null}

          <div className="stack">
            {savedMaps.map((map) => (
              <div key={map.id} className="list-item stack">
                <div className="section-heading">
                  <div>
                    <strong>{map.mapName}</strong>
                    <div className="chip-row">
                      <span className="tag">{map.engine}</span>
                      <span className="tag">{map.outputStyle === 'color' ? 'Color' : 'Black & White'}</span>
                      <span className="tag">{map.mapVersion}</span>
                      <span className="tag">{map.gridMode}</span>
                      <span className="tag">{map.resolvedModel}</span>
                    </div>
                  </div>
                  <span className="field-hint">{map.createdAt}</span>
                </div>

                <div className="map-preview-box compact" style={mapPreviewStyle(map)}>
                  <div className="map-preview-inner">
                    <h3>{map.mapName}</h3>
                    <small>{map.promptPreview}</small>
                  </div>
                </div>

                <div className="action-row">
                  <button type="button" onClick={() => exportMap(map, 'color')}>Export Color</button>
                  <button type="button" className="button-link secondary" onClick={() => exportMap(map, 'black_white')}>Export B&W</button>
                  <button type="button" className="button-link secondary" onClick={() => printMap(map)}>Print</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
