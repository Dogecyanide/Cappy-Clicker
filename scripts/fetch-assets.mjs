import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import sharp from 'sharp';

const wiki = (name) => `mariowiki:${name}`;

async function resolveSource(source) {
  if (!source.startsWith('mariowiki:')) return source;
  const filename = decodeURIComponent(source.slice('mariowiki:'.length));
  const api = new URL('https://www.mariowiki.com/api.php');
  api.search = new URLSearchParams({
    action: 'query', titles: `File:${filename}`, prop: 'imageinfo', iiprop: 'url', format: 'json', origin: '*',
  });
  const response = await fetch(api, { headers: { 'user-agent': 'Cappy-Clicker/2.0 personal fan project' } });
  if (!response.ok) throw new Error(`Could not resolve ${filename}: ${response.status}`);
  const data = await response.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  const resolved = page?.imageinfo?.[0]?.url;
  if (!resolved) throw new Error(`MarioWiki did not return a media URL for ${filename}`);
  return resolved;
}

const assets = [
  ['public/assets/cappy/cappy-hero.svg', wiki('SMO_Art_-_Cappy_%28Vector%29.svg'), 1400],
  ['public/assets/producers/frog.webp', wiki('SMO_Artwork_Frog.png'), 560],
  ['public/assets/producers/bonneton-tailor.webp', wiki('SMO_Artwork_Bonneter_%28Male%29.png'), 560],
  ['public/assets/producers/goomba-stack.webp', wiki('SMO_Art_-_Goomba_Capture.png'), 560],
  ['public/assets/producers/chain-chomp.webp', wiki('Chain_Chomp_Icon_SMO.png'), 560],
  ['public/assets/producers/uproot.webp', wiki('SMO_Artwork_Uproot.png'), 560],
  ['public/assets/producers/jaxi.webp', wiki('SMO_Artwork_Jaxi.png'), 560],
  ['public/assets/producers/lake-boutique.webp', wiki('SMO_Artwork_Lochlady_%28Blue%29.png'), 560],
  ['public/assets/producers/steam-gardener.webp', wiki('SMO_Artwork_Steam_Gardener.png'), 560],
  ['public/assets/producers/new-donk-scooter.webp', wiki('Motor_Scooter_SMO_render.png'), 560],
  ['public/assets/producers/shiverian-racer.webp', wiki('SMO_Artwork_Shiverian_Racer.png'), 560],
  ['public/assets/producers/gushen.webp', wiki('Gushen_Icon_SMO.png'), 560],
  ['public/assets/producers/volbonans.webp', wiki('SMO_Artwork_Volbonans.png'), 560],
  ['public/assets/producers/pokio.webp', wiki('Pokio_Icon_SMO.png'), 560],
  ['public/assets/producers/sherm.webp', wiki('Sherm_Icon_SMO.png'), 560],
  ['public/assets/producers/t-rex.webp', wiki('SMO_Artwork_T-Rex.png'), 560],
  ['public/assets/producers/odyssey-crew.webp', 'https://image-assets.m.nintendo.com/ed06e02b-b173-4bc9-8e59-4614f1f3dea9', 720],
  ['public/assets/producers/sphynx.webp', wiki('SMO_Artwork_Sphynx.png'), 560],
  ['public/assets/producers/broodals.webp', wiki('SMO_Artwork_Broodals.png'), 720],
  ['public/assets/producers/ruined-dragon.webp', wiki('SMORuinedDragonModel.png'), 720],
  ['public/assets/producers/darker-side.webp', wiki('DarkerSide.png'), 720],
  ['public/assets/producers/bobomb-battlefield.webp', wiki('SM64_Artwork_Bob-omb_Battlefield.jpg'), 720],
  ['public/assets/producers/delfino-plaza.webp', wiki('Restored_Delfino_Plaza_HD.png'), 720],
  ['public/assets/producers/super-bell-hill.webp', wiki('SM3DWBF_Screenshot_Super_Bell_Hill.png'), 720],
  ['public/assets/producers/choco-mountain.webp', wiki('MKWorld_Icon_Choco_Mountain.png'), 560],
  ['public/assets/producers/yoshis-island.webp', wiki('NM_SMW2_Yoshis_Island.png'), 720],
  ['public/assets/producers/toad-town.webp', wiki('PMTOK_title_screen_image_4.png'), 720],
  ['public/assets/producers/gusty-garden.webp', wiki('SMG_Welcome_to_Gusty_Garden.png'), 720],
  ['public/assets/producers/comet-observatory.webp', wiki('SMG_Asset_Model_Comet_Observatory.png'), 720],
  ['public/assets/producers/new-donk-power.webp', wiki('SMO_Puzzle_Part_(Metro_Kingdom)_Capture.png'), 560],
  ['public/assets/producers/shine-gate.webp', wiki('FluddshinegateHD.png'), 720],
  ['public/assets/producers/whomps-fortress.webp', wiki("SM64_Artwork_Whomp's_Fortress.jpg"), 720],
  ['public/assets/producers/ricco-harbor.webp', wiki('RiccoHarbor.png'), 720],
  ['public/assets/producers/mount-wario.webp', wiki('MK8_Mount_Wario.png'), 720],
  ['public/assets/producers/honeyhive-galaxy.webp', wiki('Honeyhive_Galaxy.png'), 720],
  ['public/assets/producers/coconut-mall.webp', wiki('MK8D_Wii_Coconut_Mall.png'), 720],
  ['public/assets/producers/rogueport.webp', wiki('PMTTYD_NS_Rogueport_Plaza.jpg'), 720],
  ['public/assets/producers/beanbean-airport.webp', wiki('BeanbeanInternationalAirport-Map-MLSS.png'), 720],
  ['public/assets/producers/luigis-mansion.webp', wiki('LuigiMansion.png'), 720],
  ['public/assets/producers/rainbow-road.webp', wiki('MK8_Rainbow_Road.png'), 720],
  ['public/assets/producers/world-crown.webp', wiki('World_Crown_SM3DW.jpg'), 720],
  ['public/assets/shines/shine-sprite.webp', wiki('SMS_Shine_Sprite_Artwork.png'), 560],
  ['public/assets/misc/odyssey-ship.webp', wiki('SMO_Art_-_Odyssey_Ship.png'), 1000],
  ['public/assets/ui/kingdom-coin.webp', wiki('SMO_Artwork_Coin.png'), 320],
  ['public/assets/moons/power-moon.svg', wiki('SMO_Art_-_Power_Moon_%28Vector%29.svg'), 800],
  ['public/assets/kingdoms/cap.webp', wiki('SMO_Art_-_Cap_Kingdom.jpg'), 2200],
  ['public/assets/kingdoms/cascade.webp', wiki('SMO_Art_-_Cascade_Kingdom.jpg'), 2200],
  ['public/assets/kingdoms/sand.webp', wiki('SMO_Art_-_Sand_Kingdom.jpg'), 2200],
  ['public/assets/kingdoms/wooded.webp', wiki('SMO_Art_-_Wooded_Kingdom.jpg'), 2200],
  ['public/assets/kingdoms/lake.webp', wiki('SMO_Art_-_Lake_Kingdom.jpg'), 2200],
  ['public/assets/kingdoms/metro.webp', wiki('SMO_Art_-_Metro_Kingdom.jpg'), 2200],
  ['public/assets/kingdoms/snow.webp', wiki('SMO_Art_-_Snow_Kingdom.png'), 2200],
  ['public/assets/kingdoms/luncheon.webp', wiki('SMO_Art_-_Luncheon_Kingdom.jpg'), 2200],
  ['public/assets/boo/king-boo.webp', wiki('SMSKingBooModel.png'), 720],
  ['public/assets/boo/slot-machine.webp', wiki('SMS_Screenshot_Slot_Machine.png'), 1000],
  ['public/assets/boo/symbol-pineapple.webp', wiki('SMS_Pineapple_Artwork.png'), 320],
  ['public/assets/boo/symbol-stu.webp', wiki('SMS_Strollin_Stu_Artwork.png'), 320],
  ['public/assets/boo/symbol-boo.webp', wiki('SMS_Asset_Model_Sleepy_Boo.png'), 320],
];

for (const [relativePath, url, maxWidth] of assets) {
  const outputPath = resolve(relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  process.stdout.write(`Fetching ${relativePath}... `);
  const resolvedUrl = await resolveSource(url);
  const response = await fetch(resolvedUrl, { headers: { 'user-agent': 'Mozilla/5.0 Cappy-Clicker/2.0', referer: 'https://www.mariowiki.com/' }, redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${resolvedUrl}`);
  const source = Buffer.from(await response.arrayBuffer());
  if (extname(outputPath) === '.svg') {
    await writeFile(outputPath, source);
  } else {
    await sharp(source, { animated: false })
      .rotate()
      .resize({ width: maxWidth, height: maxWidth > 1000 ? 1300 : maxWidth, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: maxWidth > 1000 ? 78 : 86, effort: 5, alphaQuality: 90 })
      .toFile(outputPath);
  }
  console.log('done');
}

console.log(`Prepared ${assets.length} local runtime assets.`);
