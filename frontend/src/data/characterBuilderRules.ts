export type RulesetId = 'srd2014' | 'srd2024'
export type LoadoutMode = 'starting_equipment' | 'starting_gold'

export const RULESET_LABELS: Record<RulesetId, string> = {
  srd2014: '2014 SRD 5.1',
  srd2024: '2024 SRD 5.2.1',
}

export const RULESET_LINKS: Record<RulesetId, string> = {
  srd2014: 'https://www.dndbeyond.com/srd',
  srd2024: 'https://www.dndbeyond.com/sources/dnd/free-rules',
}

export const LEVEL_OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1)

const CLASS_GOLD_NOTES_2014: Record<string, string> = {
  Barbarian: '2d4 Ã— 10 gp',
  Bard: '5d4 Ã— 10 gp',
  Cleric: '5d4 Ã— 10 gp',
  Druid: '2d4 Ã— 10 gp',
  Fighter: '5d4 Ã— 10 gp',
  Monk: '5d4 gp',
  Paladin: '5d4 Ã— 10 gp',
  Ranger: '5d4 Ã— 10 gp',
  Rogue: '4d4 Ã— 10 gp',
  Sorcerer: '3d4 Ã— 10 gp',
  Warlock: '4d4 Ã— 10 gp',
  Wizard: '4d4 Ã— 10 gp',
}

const CLASS_GOLD_NOTES_2024: Record<string, string> = {
  Barbarian: 'Use class/background coins from the 2024 open rules equipment step.',
  Bard: 'Use class/background coins from the 2024 open rules equipment step.',
  Cleric: 'Use class/background coins from the 2024 open rules equipment step.',
  Druid: 'Use class/background coins from the 2024 open rules equipment step.',
  Fighter: 'Use class/background coins from the 2024 open rules equipment step.',
  Monk: 'Use class/background coins from the 2024 open rules equipment step.',
  Paladin: 'Use class/background coins from the 2024 open rules equipment step.',
  Ranger: 'Use class/background coins from the 2024 open rules equipment step.',
  Rogue: 'Use class/background coins from the 2024 open rules equipment step.',
  Sorcerer: 'Use class/background coins from the 2024 open rules equipment step.',
  Warlock: 'Use class/background coins from the 2024 open rules equipment step.',
  Wizard: 'Use class/background coins from the 2024 open rules equipment step.',
}

const EQUIPMENT_NOTES_2014: Record<string, string> = {
  Barbarian: 'Use the SRD 2014 barbarian starting equipment package or starting gold.',
  Bard: 'Use the SRD 2014 bard starting equipment package or starting gold.',
  Cleric: 'Use the SRD 2014 cleric starting equipment package or starting gold.',
  Druid: 'Use the SRD 2014 druid starting equipment package or starting gold.',
  Fighter: 'Use the SRD 2014 fighter starting equipment package or starting gold.',
  Monk: 'Use the SRD 2014 monk starting equipment package or starting gold.',
  Paladin: 'Use the SRD 2014 paladin starting equipment package or starting gold.',
  Ranger: 'Use the SRD 2014 ranger starting equipment package or starting gold.',
  Rogue: 'Use the SRD 2014 rogue starting equipment package or starting gold.',
  Sorcerer: 'Use the SRD 2014 sorcerer starting equipment package or starting gold.',
  Warlock: 'Use the SRD 2014 warlock starting equipment package or starting gold.',
  Wizard: 'Use the SRD 2014 wizard starting equipment package or starting gold.',
}

const EQUIPMENT_NOTES_2024: Record<string, string> = {
  Barbarian: 'Use the 2024 open-rules barbarian package together with background equipment.',
  Bard: 'Use the 2024 open-rules bard package together with background equipment.',
  Cleric: 'Use the 2024 open-rules cleric package together with background equipment.',
  Druid: 'Use the 2024 open-rules druid package together with background equipment.',
  Fighter: 'Use the 2024 open-rules fighter package together with background equipment.',
  Monk: 'Use the 2024 open-rules monk package together with background equipment.',
  Paladin: 'Use the 2024 open-rules paladin package together with background equipment.',
  Ranger: 'Use the 2024 open-rules ranger package together with background equipment.',
  Rogue: 'Use the 2024 open-rules rogue package together with background equipment.',
  Sorcerer: 'Use the 2024 open-rules sorcerer package together with background equipment.',
  Warlock: 'Use the 2024 open-rules warlock package together with background equipment.',
  Wizard: 'Use the 2024 open-rules wizard package together with background equipment.',
}

export function proficiencyBonusForLevel(level: number): number {
  if (level >= 17) return 6
  if (level >= 13) return 5
  if (level >= 9) return 4
  if (level >= 5) return 3
  return 2
}

export function buildLoadoutSummary(
  ruleset: RulesetId,
  loadoutMode: LoadoutMode,
  className: string,
  backgroundName: string,
  level: number,
): string[] {
  const lines: string[] = [
    `Ruleset: ${RULESET_LABELS[ruleset]}`,
    `Class: ${className}`,
    `Background: ${backgroundName}`,
    `Level: ${level}`,
    `Proficiency Bonus: +${proficiencyBonusForLevel(level)}`,
  ]

  if (loadoutMode === 'starting_gold') {
    lines.push(
      ruleset === 'srd2014'
        ? `Starting Gold: ${CLASS_GOLD_NOTES_2014[className] ?? 'Use the class-based SRD 2014 starting gold roll.'}`
        : `Starting Gold / Coins: ${CLASS_GOLD_NOTES_2024[className] ?? 'Use the 2024 open-rules equipment step coins for the chosen class and background.'}`,
    )
  } else {
    lines.push(
      ruleset === 'srd2014'
        ? `Starting Equipment: ${EQUIPMENT_NOTES_2014[className] ?? 'Use the SRD 2014 class equipment package.'}`
        : `Starting Equipment: ${EQUIPMENT_NOTES_2024[className] ?? 'Use the 2024 class package plus background equipment.'}`,
    )
  }

  lines.push(
    ruleset === 'srd2024'
      ? '2024 note: class/background equipment and coins are resolved under the 2024 open-rules character creation flow.'
      : '2014 note: class-based starting equipment or starting gold follows the SRD 5.1 baseline.',
  )

  return lines
}

export function buildCharacterSheetExport(input: {
  name: string
  lineage: string
  charClass: string
  background: string
  alignment: string
  level: number
  ruleset: RulesetId
  loadoutMode: LoadoutMode
  customBackstory: string
}) {
  return {
    exported_at: new Date().toISOString(),
    name: input.name,
    lineage: input.lineage,
    char_class: input.charClass,
    background: input.background,
    alignment: input.alignment,
    level: input.level,
    ruleset: input.ruleset,
    ruleset_label: RULESET_LABELS[input.ruleset],
    loadout_mode: input.loadoutMode,
    proficiency_bonus: proficiencyBonusForLevel(input.level),
    custom_backstory: input.customBackstory,
    loadout_summary: buildLoadoutSummary(
      input.ruleset,
      input.loadoutMode,
      input.charClass,
      input.background,
      input.level,
    ),
  }
}
