import json
import re

# Instructions
#
# Place the en_us.json file alongside this file and then run it. Easy as pie (;
#
try:
    with open('en_us.json', encoding='utf-8') as f:
        lang = f.read()
except FileNotFoundError:
    print('Please place the en_us.json file in the same directory as this script and try again.')
    exit(1)

lang_json: dict = json.loads(lang)

item_lang_entries = [entry for entry in list(lang_json.keys()) if re.match('(?:item|block).minecraft.[a-z_0-9]+$', entry)]

specific_exclusions = [
    '(?:item|block).minecraft.[a-z_]+_candle_cake',
    '(?:item|block).minecraft.[a-z_]*air',
    '(?:item|block).minecraft.attached_[a-z_]+_stem',
    '(?:item|block).minecraft.[a-z_]+_stem',
    '(?:item|block).minecraft.[a-z_]+_command_block',
    '(?:item|block).minecraft.[a-z_]+_spawn_egg',
    '(?:item|block).minecraft.[a-z_]+_wall_fan',
    '(?:item|block).minecraft.[a-z_]+_wall_[a-z_]+',
    '(?:item|block).minecraft.[a-z_]+_wall_hanging_sign',
    '(?:item|block).minecraft.[a-z_]+_bundle',
    '(?:item|block).minecraft.[a-z_]+_pottery_shard',
    '(?:item|block).minecraft.[a-z_]+_harness',
    '(?:item|block).minecraft.potted_[a-z_]+',
    '(?:item|block).minecraft.[a-z_]+_plant',
    '(?:item|block).minecraft.[a-z_]+_crop',
    'block.minecraft.set_spawn',
    'item.minecraft.potion',
    'item.minecraft.scute',
    'block.minecraft.nether_portal',
    'block.minecraft.player_head',
    'block.minecraft.barrier',
    'block.minecraft.test_[a-z_]+',
    'block.minecraft.moving_piston',
    'block.minecraft.light$',
    'item.minecraft.lodestone_compass',
    "block.minecraft.[a-z]+_cauldron",
    "block.minecraft.bubble_column"
]

for exclusion in specific_exclusions:
    item_lang_entries = [entry for entry in item_lang_entries if not re.match(exclusion, entry)]

specific_overrides = {
    "item.minecraft.music_disc_blocks": "Blocks Music Disc",
    "item.minecraft.music_disc_cat": "Cat Music Disc",
    "item.minecraft.music_disc_chirp": "Chirp Music Disc",
    "item.minecraft.music_disc_creator": "Creator Music Disc",
    "item.minecraft.music_disc_creator_music_box": "Creator Music Box Disc",
    "item.minecraft.music_disc_far": "Far Music Disc",
    "item.minecraft.music_disc_mall": "Mall Music Disc",
    "item.minecraft.music_disc_mellohi": "Mellohi Music Disc",
    "item.minecraft.music_disc_otherside": "Otherside Music Disc",
    "item.minecraft.music_disc_pigstep": "Pigstep Music Disc",
    "item.minecraft.music_disc_precipice": "Precipice Music Disc",
    "item.minecraft.music_disc_relic": "Relic Music Disc",
    "item.minecraft.music_disc_stal": "Stal Music Disc",
    "item.minecraft.music_disc_strad": "Strad Music Disc",
    "item.minecraft.music_disc_tears": "Tears Music Disc",
    "item.minecraft.music_disc_wait": "Wait Music Disc",
    "item.minecraft.music_disc_ward": "Ward Music Disc",
    "item.minecraft.music_disc_5": "5 Music Disc",
    "item.minecraft.music_disc_11": "11 Music Disc",
    "item.minecraft.music_disc_13": "13 Music Disc",
    "item.minecraft.creeper_banner_pattern": "Creeper Banner Pattern",
    "item.minecraft.flow_banner_pattern": "Flow Banner Pattern",
    "item.minecraft.flower_banner_pattern": "Flower Banner Pattern",
    "item.minecraft.globe_banner_pattern": "Globe Banner Pattern",
    "item.minecraft.guster_banner_pattern": "Guster Banner Pattern",
    "item.minecraft.mojang_banner_pattern": "Thing Banner Pattern",
    "item.minecraft.piglin_banner_pattern": "Piglin Banner Pattern",
    "item.minecraft.skull_banner_pattern": "Skull Banner Pattern",

}

lang_items = {}

for entry in item_lang_entries:
    lang_items[entry] = lang_json[entry]

for key, value in specific_overrides.items():
    if key in lang_items:
        lang_items[key] = value

with open('en_us_items.json', encoding='utf-8', mode='w') as f:
    f.write(json.dumps(lang_items, indent=4, ensure_ascii=False))