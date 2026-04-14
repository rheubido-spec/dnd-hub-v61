from __future__ import annotations

from sqlalchemy.orm import Session
from app.models.models import ReferenceMaterial, SourceRegistry

OPEN_SOURCES = [
    {
        "source_key": "dndbeyond_srd",
        "display_name": "D&D Beyond SRD 5.2.1",
        "base_url": "https://www.dndbeyond.com/srd",
        "license_name": "CC-BY-4.0",
        "trust_level": "official",
        "is_official": True,
        "is_open_content": True,
        "is_import_enabled": True,
        "import_notes": "Use official SRD 5.2.1 / Creative Commons material only.",
        "source_metadata": {"categories": ["race", "class", "subclass", "background", "alignment"], "attribution": "This work includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License."},
    },
    {
        "source_key": "app_curated",
        "display_name": "D&D Hub Curated Builder Options",
        "base_url": "https://localhost",
        "license_name": "App-curated planning taxonomy",
        "trust_level": "internal",
        "is_official": False,
        "is_open_content": True,
        "is_import_enabled": True,
        "import_notes": "Fantasy planning tags used for campaign building UX.",
        "source_metadata": {"categories": ["campaign_theme", "campaign_setting", "campaign_mood", "party_focus"]},
    },
    {
        "source_key": "5etools_catalog_only",
        "display_name": "5etools (catalog only; import disabled)",
        "base_url": "https://5e.tools/",
        "license_name": "Unverified for bulk ingestion in this project",
        "trust_level": "review",
        "is_official": False,
        "is_open_content": False,
        "is_import_enabled": False,
        "import_notes": "Stored only as a registry record. Bulk ingestion is disabled until the operator independently verifies license and permission for each dataset.",
        "source_metadata": {"status": "manual_review_required"},
    },
]

SRD_LINEAGES = ["Dragonborn", "Dwarf", "Elf", "Gnome", "Half-Elf", "Half-Orc", "Halfling", "Human", "Tiefling"]
SRD_CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"]
SRD_BACKGROUNDS = ["Acolyte", "Criminal", "Entertainer", "Folk Hero", "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage", "Sailor", "Soldier", "Urchin"]
SRD_SUBCLASSES = {
    "Barbarian": ["Berserker"],
    "Bard": ["College of Lore"],
    "Cleric": ["Knowledge Domain", "Life Domain", "Light Domain", "Nature Domain", "Tempest Domain", "Trickery Domain", "War Domain"],
    "Druid": ["Circle of the Land", "Circle of the Moon"],
    "Fighter": ["Battle Master", "Champion", "Eldritch Knight"],
    "Monk": ["Way of the Four Elements", "Way of Shadow", "Way of the Open Hand"],
    "Paladin": ["Oath of Devotion", "Oath of the Ancients", "Oath of Vengeance"],
    "Ranger": ["Beast Master", "Hunter"],
    "Rogue": ["Arcane Trickster", "Assassin", "Thief"],
    "Sorcerer": ["Draconic Bloodline", "Wild Magic"],
    "Warlock": ["Archfey Patron", "Fiend Patron", "Great Old One Patron"],
    "Wizard": ["School of Abjuration", "School of Conjuration", "School of Divination", "School of Enchantment", "School of Evocation", "School of Illusion", "School of Necromancy", "School of Transmutation"],
}
ALIGNMENTS = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"]

CAMPAIGN_THEMES = ["High Fantasy", "Heroic Quest", "Courtly Intrigue", "Dark Fantasy", "Gothic Horror", "Planar Mystery", "Sword and Sorcery", "Mythic War", "Ancient Ruins", "Arcane Academy"]
CAMPAIGN_SETTINGS = ["Homebrew Realm", "Forgotten Realms", "Greyhawk", "Dragonlance", "Eberron", "Ravenloft", "Spelljammer", "Planescape", "Wild Frontier", "Crystal Archipelago"]
CAMPAIGN_MOODS = ["Epic", "Mystical", "Political", "Exploration", "Survival", "Horror", "Whimsical", "Wartime"]
PARTY_TAGS = ["New players", "Roleplay heavy", "Tactical combat", "Sandbox", "One-shot ready", "Long campaign"]


def slugify(value: str) -> str:
    return value.lower().replace(" ", "-").replace("/", "-")


def _make_entries() -> list[dict]:
    entries: list[dict] = []

    for name in SRD_LINEAGES:
        entries.append({
            "source_key": "dndbeyond_srd",
            "source_name": "D&D Beyond SRD 5.2.1",
            "license_name": "CC-BY-4.0",
            "source_url": "https://www.dndbeyond.com/srd",
            "category": "race",
            "name": name,
            "slug": f"dndbeyond-srd-race-{slugify(name)}",
            "summary": f"Official SRD lineage/species option: {name}.",
            "tags": ["official-srd", "character-builder", "lineage"],
            "content": {"display_name": name, "builder_use": "character"},
        })

    for name in SRD_CLASSES:
        entries.append({
            "source_key": "dndbeyond_srd",
            "source_name": "D&D Beyond SRD 5.2.1",
            "license_name": "CC-BY-4.0",
            "source_url": "https://www.dndbeyond.com/srd",
            "category": "class",
            "name": name,
            "slug": f"dndbeyond-srd-class-{slugify(name)}",
            "summary": f"Official SRD class option: {name}.",
            "tags": ["official-srd", "character-builder", "class"],
            "content": {"display_name": name, "builder_use": "character"},
        })


    for class_name, subclass_names in SRD_SUBCLASSES.items():
        for name in subclass_names:
            entries.append({
                "source_key": "dndbeyond_srd",
                "source_name": "D&D Beyond SRD 5.2.1",
                "license_name": "CC-BY-4.0",
                "source_url": "https://www.dndbeyond.com/srd",
                "category": "subclass",
                "name": name,
                "slug": f"dndbeyond-srd-subclass-{slugify(name)}",
                "summary": f"Official SRD subclass option for {class_name}: {name}.",
                "tags": ["official-srd", "character-builder", "subclass", slugify(class_name)],
                "content": {"display_name": name, "builder_use": "character", "class_name": class_name},
            })

    for name in SRD_BACKGROUNDS:
        entries.append({
            "source_key": "dndbeyond_srd",
            "source_name": "D&D Beyond SRD 5.2.1",
            "license_name": "CC-BY-4.0",
            "source_url": "https://www.dndbeyond.com/srd",
            "category": "background",
            "name": name,
            "slug": f"dndbeyond-srd-background-{slugify(name)}",
            "summary": f"Official SRD background option: {name}.",
            "tags": ["official-srd", "character-builder", "background"],
            "content": {"display_name": name, "builder_use": "character"},
        })

    for name in ALIGNMENTS:
        entries.append({
            "source_key": "dndbeyond_srd",
            "source_name": "D&D Beyond SRD 5.2.1",
            "license_name": "CC-BY-4.0",
            "source_url": "https://www.dndbeyond.com/srd",
            "category": "alignment",
            "name": name,
            "slug": f"dndbeyond-srd-alignment-{slugify(name)}",
            "summary": f"Builder alignment option: {name}.",
            "tags": ["official-srd", "character-builder", "alignment"],
            "content": {"display_name": name, "builder_use": "character"},
        })

    for name in CAMPAIGN_THEMES:
        entries.append({
            "source_key": "app_curated",
            "source_name": "D&D Hub Curated Builder Options",
            "license_name": "App-curated planning taxonomy",
            "source_url": "https://localhost",
            "category": "campaign_theme",
            "name": name,
            "slug": f"app-curated-theme-{slugify(name)}",
            "summary": f"Campaign theme helper option: {name}.",
            "tags": ["campaign-builder", "theme"],
            "content": {"display_name": name, "builder_use": "campaign"},
        })

    for name in CAMPAIGN_SETTINGS:
        entries.append({
            "source_key": "app_curated",
            "source_name": "D&D Hub Curated Builder Options",
            "license_name": "App-curated planning taxonomy",
            "source_url": "https://localhost",
            "category": "campaign_setting",
            "name": name,
            "slug": f"app-curated-setting-{slugify(name)}",
            "summary": f"Campaign setting helper option: {name}.",
            "tags": ["campaign-builder", "setting"],
            "content": {"display_name": name, "builder_use": "campaign"},
        })

    for name in CAMPAIGN_MOODS:
        entries.append({
            "source_key": "app_curated",
            "source_name": "D&D Hub Curated Builder Options",
            "license_name": "App-curated planning taxonomy",
            "source_url": "https://localhost",
            "category": "campaign_mood",
            "name": name,
            "slug": f"app-curated-mood-{slugify(name)}",
            "summary": f"Campaign mood helper option: {name}.",
            "tags": ["campaign-builder", "mood"],
            "content": {"display_name": name, "builder_use": "campaign"},
        })

    for name in PARTY_TAGS:
        entries.append({
            "source_key": "app_curated",
            "source_name": "D&D Hub Curated Builder Options",
            "license_name": "App-curated planning taxonomy",
            "source_url": "https://localhost",
            "category": "party_focus",
            "name": name,
            "slug": f"app-curated-party-focus-{slugify(name)}",
            "summary": f"Party focus helper option: {name}.",
            "tags": ["campaign-builder", "party-focus"],
            "content": {"display_name": name, "builder_use": "campaign"},
        })

    return entries


OPEN_REFERENCE_MATERIALS = _make_entries()


def seed_reference_data(db: Session) -> tuple[int, int]:
    source_count = 0
    material_count = 0

    for source in OPEN_SOURCES:
        existing = db.query(SourceRegistry).filter(SourceRegistry.source_key == source["source_key"]).first()
        if not existing:
            db.add(SourceRegistry(**source))
            source_count += 1

    for item in OPEN_REFERENCE_MATERIALS:
        existing = db.query(ReferenceMaterial).filter(ReferenceMaterial.slug == item["slug"]).first()
        if not existing:
            db.add(ReferenceMaterial(**item, edition="5e", is_open_content=True, is_import_enabled=True))
            material_count += 1

    db.commit()
    return source_count, material_count
