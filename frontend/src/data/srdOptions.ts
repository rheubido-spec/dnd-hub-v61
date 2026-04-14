export const SRD_LINEAGES = [
  "Dragonborn",
  "Dwarf",
  "Elf",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Halfling",
  "Human",
  "Tiefling",
]

export const SRD_CLASSES = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
]

export const SRD_BACKGROUNDS = [
  "Acolyte",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Hermit",
  "Noble",
  "Outlander",
  "Sage",
  "Sailor",
  "Soldier",
  "Urchin",
]

export const ALIGNMENTS = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
]

export const CAMPAIGN_THEMES = [
  "High Fantasy",
  "Heroic Quest",
  "Courtly Intrigue",
  "Dark Fantasy",
  "Gothic Horror",
  "Planar Mystery",
  "Sword and Sorcery",
  "Mythic War",
  "Ancient Ruins",
  "Arcane Academy",
]

export const CAMPAIGN_SETTINGS = [
  "Homebrew Realm",
  "Forgotten Realms",
  "Greyhawk",
  "Dragonlance",
  "Eberron",
  "Ravenloft",
  "Spelljammer",
  "Planescape",
  "Wild Frontier",
  "Crystal Archipelago",
]

export const CAMPAIGN_MOODS = [
  "Epic",
  "Mystical",
  "Political",
  "Exploration",
  "Survival",
  "Horror",
  "Whimsical",
  "Wartime",
]

export const PARTY_TAGS = [
  "New players",
  "Roleplay heavy",
  "Tactical combat",
  "Sandbox",
  "One-shot ready",
  "Long campaign",
]

export const SRD_SUBCLASSES: Record<string, string[]> = {
  Barbarian: ["Berserker"],
  Bard: ["College of Lore"],
  Cleric: ["Knowledge Domain", "Life Domain", "Light Domain", "Nature Domain", "Tempest Domain", "Trickery Domain", "War Domain"],
  Druid: ["Circle of the Land", "Circle of the Moon"],
  Fighter: ["Battle Master", "Champion", "Eldritch Knight"],
  Monk: ["Way of the Four Elements", "Way of Shadow", "Way of the Open Hand"],
  Paladin: ["Oath of Devotion", "Oath of the Ancients", "Oath of Vengeance"],
  Ranger: ["Beast Master", "Hunter"],
  Rogue: ["Arcane Trickster", "Assassin", "Thief"],
  Sorcerer: ["Draconic Bloodline", "Wild Magic"],
  Warlock: ["Archfey Patron", "Fiend Patron", "Great Old One Patron"],
  Wizard: ["School of Abjuration", "School of Conjuration", "School of Divination", "School of Enchantment", "School of Evocation", "School of Illusion", "School of Necromancy", "School of Transmutation"],
}
