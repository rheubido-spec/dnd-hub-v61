export type WeaponRecord = {
  name: string
  category: 'Simple Melee' | 'Simple Ranged' | 'Martial Melee' | 'Martial Ranged'
  cost: string
  damage: string
  weight: string
  properties: string
}

export type ArmorRecord = {
  name: string
  category: 'Light Armor' | 'Medium Armor' | 'Heavy Armor' | 'Shield'
  cost: string
  ac: string
  strength?: string
  stealth?: string
  weight: string
}

export type GearRecord = {
  name: string
  category: string
  cost: string
  weight: string
  details: string
}

export type MountRecord = {
  name: string
  cost: string
  speed: string
  carrying_capacity: string
  size: string
  details: string
}

export const WEAPONS: WeaponRecord[] = [
  { name: 'Club', category: 'Simple Melee', cost: '1 sp', damage: '1d4 bludgeoning', weight: '2 lb.', properties: 'Light' },
  { name: 'Dagger', category: 'Simple Melee', cost: '2 gp', damage: '1d4 piercing', weight: '1 lb.', properties: 'Finesse, light, thrown (20/60)' },
  { name: 'Greatclub', category: 'Simple Melee', cost: '2 sp', damage: '1d8 bludgeoning', weight: '10 lb.', properties: 'Two-handed' },
  { name: 'Handaxe', category: 'Simple Melee', cost: '5 gp', damage: '1d6 slashing', weight: '2 lb.', properties: 'Light, thrown (20/60)' },
  { name: 'Javelin', category: 'Simple Melee', cost: '5 sp', damage: '1d6 piercing', weight: '2 lb.', properties: 'Thrown (30/120)' },
  { name: 'Light Hammer', category: 'Simple Melee', cost: '2 gp', damage: '1d4 bludgeoning', weight: '2 lb.', properties: 'Light, thrown (20/60)' },
  { name: 'Mace', category: 'Simple Melee', cost: '5 gp', damage: '1d6 bludgeoning', weight: '4 lb.', properties: 'â€”' },
  { name: 'Quarterstaff', category: 'Simple Melee', cost: '2 sp', damage: '1d6 bludgeoning', weight: '4 lb.', properties: 'Versatile (1d8)' },
  { name: 'Sickle', category: 'Simple Melee', cost: '1 gp', damage: '1d4 slashing', weight: '2 lb.', properties: 'Light' },
  { name: 'Spear', category: 'Simple Melee', cost: '1 gp', damage: '1d6 piercing', weight: '3 lb.', properties: 'Thrown (20/60), versatile (1d8)' },
  { name: 'Light Crossbow', category: 'Simple Ranged', cost: '25 gp', damage: '1d8 piercing', weight: '5 lb.', properties: 'Ammunition (80/320), loading, two-handed' },
  { name: 'Dart', category: 'Simple Ranged', cost: '5 cp', damage: '1d4 piercing', weight: '1/4 lb.', properties: 'Finesse, thrown (20/60)' },
  { name: 'Shortbow', category: 'Simple Ranged', cost: '25 gp', damage: '1d6 piercing', weight: '2 lb.', properties: 'Ammunition (80/320), two-handed' },
  { name: 'Sling', category: 'Simple Ranged', cost: '1 sp', damage: '1d4 bludgeoning', weight: 'â€”', properties: 'Ammunition (30/120)' },
  { name: 'Battleaxe', category: 'Martial Melee', cost: '10 gp', damage: '1d8 slashing', weight: '4 lb.', properties: 'Versatile (1d10)' },
  { name: 'Flail', category: 'Martial Melee', cost: '10 gp', damage: '1d8 bludgeoning', weight: '2 lb.', properties: 'â€”' },
  { name: 'Glaive', category: 'Martial Melee', cost: '20 gp', damage: '1d10 slashing', weight: '6 lb.', properties: 'Heavy, reach, two-handed' },
  { name: 'Greataxe', category: 'Martial Melee', cost: '30 gp', damage: '1d12 slashing', weight: '7 lb.', properties: 'Heavy, two-handed' },
  { name: 'Greatsword', category: 'Martial Melee', cost: '50 gp', damage: '2d6 slashing', weight: '6 lb.', properties: 'Heavy, two-handed' },
  { name: 'Halberd', category: 'Martial Melee', cost: '20 gp', damage: '1d10 slashing', weight: '6 lb.', properties: 'Heavy, reach, two-handed' },
  { name: 'Lance', category: 'Martial Melee', cost: '10 gp', damage: '1d12 piercing', weight: '6 lb.', properties: 'Reach, special' },
  { name: 'Longsword', category: 'Martial Melee', cost: '15 gp', damage: '1d8 slashing', weight: '3 lb.', properties: 'Versatile (1d10)' },
  { name: 'Maul', category: 'Martial Melee', cost: '10 gp', damage: '2d6 bludgeoning', weight: '10 lb.', properties: 'Heavy, two-handed' },
  { name: 'Morningstar', category: 'Martial Melee', cost: '15 gp', damage: '1d8 piercing', weight: '4 lb.', properties: 'â€”' },
  { name: 'Pike', category: 'Martial Melee', cost: '5 gp', damage: '1d10 piercing', weight: '18 lb.', properties: 'Heavy, reach, two-handed' },
  { name: 'Rapier', category: 'Martial Melee', cost: '25 gp', damage: '1d8 piercing', weight: '2 lb.', properties: 'Finesse' },
  { name: 'Scimitar', category: 'Martial Melee', cost: '25 gp', damage: '1d6 slashing', weight: '3 lb.', properties: 'Finesse, light' },
  { name: 'Shortsword', category: 'Martial Melee', cost: '10 gp', damage: '1d6 piercing', weight: '2 lb.', properties: 'Finesse, light' },
  { name: 'Trident', category: 'Martial Melee', cost: '5 gp', damage: '1d6 piercing', weight: '4 lb.', properties: 'Thrown (20/60), versatile (1d8)' },
  { name: 'War Pick', category: 'Martial Melee', cost: '5 gp', damage: '1d8 piercing', weight: '2 lb.', properties: 'â€”' },
  { name: 'Warhammer', category: 'Martial Melee', cost: '15 gp', damage: '1d8 bludgeoning', weight: '2 lb.', properties: 'Versatile (1d10)' },
  { name: 'Whip', category: 'Martial Melee', cost: '2 gp', damage: '1d4 slashing', weight: '3 lb.', properties: 'Finesse, reach' },
  { name: 'Blowgun', category: 'Martial Ranged', cost: '10 gp', damage: '1 piercing', weight: '1 lb.', properties: 'Ammunition (25/100), loading' },
  { name: 'Hand Crossbow', category: 'Martial Ranged', cost: '75 gp', damage: '1d6 piercing', weight: '3 lb.', properties: 'Ammunition (30/120), light, loading' },
  { name: 'Heavy Crossbow', category: 'Martial Ranged', cost: '50 gp', damage: '1d10 piercing', weight: '18 lb.', properties: 'Ammunition (100/400), heavy, loading, two-handed' },
  { name: 'Longbow', category: 'Martial Ranged', cost: '50 gp', damage: '1d8 piercing', weight: '2 lb.', properties: 'Ammunition (150/600), heavy, two-handed' },
  { name: 'Net', category: 'Martial Ranged', cost: '1 gp', damage: 'â€”', weight: '3 lb.', properties: 'Special, thrown (5/15)' },
]

export const ARMOR: ArmorRecord[] = [
  { name: 'Padded', category: 'Light Armor', cost: '5 gp', ac: '11 + Dex', stealth: 'Disadvantage', weight: '8 lb.' },
  { name: 'Leather', category: 'Light Armor', cost: '10 gp', ac: '11 + Dex', weight: '10 lb.' },
  { name: 'Studded Leather', category: 'Light Armor', cost: '45 gp', ac: '12 + Dex', weight: '13 lb.' },
  { name: 'Hide', category: 'Medium Armor', cost: '10 gp', ac: '12 + Dex (max 2)', weight: '12 lb.' },
  { name: 'Chain Shirt', category: 'Medium Armor', cost: '50 gp', ac: '13 + Dex (max 2)', weight: '20 lb.' },
  { name: 'Scale Mail', category: 'Medium Armor', cost: '50 gp', ac: '14 + Dex (max 2)', stealth: 'Disadvantage', weight: '45 lb.' },
  { name: 'Breastplate', category: 'Medium Armor', cost: '400 gp', ac: '14 + Dex (max 2)', weight: '20 lb.' },
  { name: 'Half Plate', category: 'Medium Armor', cost: '750 gp', ac: '15 + Dex (max 2)', stealth: 'Disadvantage', weight: '40 lb.' },
  { name: 'Ring Mail', category: 'Heavy Armor', cost: '30 gp', ac: '14', stealth: 'Disadvantage', weight: '40 lb.' },
  { name: 'Chain Mail', category: 'Heavy Armor', cost: '75 gp', ac: '16', strength: 'Str 13', stealth: 'Disadvantage', weight: '55 lb.' },
  { name: 'Splint', category: 'Heavy Armor', cost: '200 gp', ac: '17', strength: 'Str 15', stealth: 'Disadvantage', weight: '60 lb.' },
  { name: 'Plate', category: 'Heavy Armor', cost: '1500 gp', ac: '18', strength: 'Str 15', stealth: 'Disadvantage', weight: '65 lb.' },
  { name: 'Shield', category: 'Shield', cost: '10 gp', ac: '+2 AC', weight: '6 lb.' },
]

export const ADVENTURING_GEAR: GearRecord[] = [
  { name: 'Backpack', category: 'Containers', cost: '2 gp', weight: '5 lb.', details: 'Carries up to 1 cubic foot or 30 pounds of gear.' },
  { name: 'Bedroll', category: 'Travel', cost: '1 gp', weight: '7 lb.', details: 'Basic camping bedding.' },
  { name: 'Crowbar', category: 'Utility', cost: '2 gp', weight: '5 lb.', details: 'Advantage on Strength checks where leverage helps.' },
  { name: 'Grappling Hook', category: 'Travel', cost: '2 gp', weight: '4 lb.', details: 'Hook for climbing or snagging.' },
  { name: 'Healerâ€™s Kit', category: 'Medical', cost: '5 gp', weight: '3 lb.', details: 'Ten uses to stabilize a dying creature.' },
  { name: 'Lantern, Hooded', category: 'Lighting', cost: '5 gp', weight: '2 lb.', details: 'Can be shuttered to reduce light.' },
  { name: 'Rations (1 day)', category: 'Travel', cost: '5 sp', weight: '2 lb.', details: 'Dry preserved food for one day.' },
  { name: 'Rope, Hempen (50 feet)', category: 'Travel', cost: '1 gp', weight: '10 lb.', details: 'Standard rope.' },
  { name: 'Torch', category: 'Lighting', cost: '1 cp', weight: '1 lb.', details: 'Bright flame for 1 hour.' },
  { name: 'Waterskin', category: 'Containers', cost: '2 sp', weight: '5 lb. (full)', details: 'Holds water for travel.' },
]

export const MOUNTS = [
  { name: 'Camel', cost: '50 gp', speed: '50 ft.', carrying_capacity: '480 lb.', size: 'Large', details: 'Well suited for desert travel.' },
  { name: 'Donkey or Mule', cost: '8 gp', speed: '40 ft.', carrying_capacity: '420 lb.', size: 'Medium', details: 'Pack animal suited for hauling.' },
  { name: 'Horse, Riding', cost: '75 gp', speed: '60 ft.', carrying_capacity: '480 lb.', size: 'Large', details: 'Common personal mount.' },
  { name: 'Pony', cost: '30 gp', speed: '40 ft.', carrying_capacity: '225 lb.', size: 'Medium', details: 'Common mount for Small creatures.' },
  { name: 'Warhorse', cost: '400 gp', speed: '60 ft.', carrying_capacity: '540 lb.', size: 'Large', details: 'Battle-trained heavy mount.' },
] as const

export type GearCategorySlug = 'weapons' | 'armor' | 'adventuring-gear' | 'mounts'

export const GEAR_CATEGORY_META: Record<GearCategorySlug, { title: string; subtitle: string; tags: string[] }> = {
  weapons: { title: 'Weapons', subtitle: 'Damage, properties, cost, and weight for SRD open-content weapons.', tags: ['damage', 'properties', 'cost', 'weight'] },
  armor: { title: 'Armor', subtitle: 'Armor Class, Strength requirements, stealth notes, cost, and weight.', tags: ['AC', 'Strength', 'stealth', 'weight'] },
  'adventuring-gear': { title: 'Adventuring Gear', subtitle: 'Everyday tools, travel gear, containers, lighting, and utility equipment.', tags: ['tools', 'travel', 'containers', 'utility'] },
  mounts: { title: 'Mounts', subtitle: 'Mount cost, speed, size, carrying capacity, and travel notes.', tags: ['speed', 'size', 'capacity', 'travel'] },
}
