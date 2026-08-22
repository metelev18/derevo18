import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';
import { portfolioAssets } from './portfolio-assets.mjs';

const assets = {
  'logo.webp': 'https://static.tildacdn.com/tild3961-3666-4565-a632-386532353866/logo_1.png',
  'hero.webp': 'https://static.tildacdn.com/tild6331-6134-4664-b932-346435623061/NlqMhyanaoA.jpg',
  'material-log.webp': 'https://static.tildacdn.com/tild6461-3737-4538-b333-326338386130/3.png',
  'material-glued.webp': 'https://static.tildacdn.com/tild6335-3866-4333-b039-306364653238/2.png',
  'material-profiled.webp': 'https://static.tildacdn.com/tild6462-6661-4435-a235-303364373563/1.png',
  'material-cedar.webp': 'https://static.tildacdn.com/tild3539-6337-4865-a336-303836363339/photo.png',
  'project-podshivalovo.webp': 'https://static.tildacdn.com/stor3938-3734-4366-b263-313632663535/34256161.jpg',
  'project-bars.webp': 'https://static.tildacdn.com/stor3338-6535-4161-b663-343030376365/93ca40efeb424c6830ba0b783109e9e9.png',
  'project-solnechniy.webp': 'https://static.tildacdn.com/stor3361-3865-4563-b731-376130313463/0fb8f1d60224d83b2c2cfa91251d6579.jpg',
  'project-svetliy-terem.webp': 'https://static.tildacdn.com/stor3164-3132-4562-a364-653230646463/c7710c4f933a309a7320f2718de40d98.jpg',
  'project-dubrava.webp': 'https://static.tildacdn.com/stor3137-6131-4465-b235-616338393831/1853c7c4496dc5e64e2d364133671e54.jpg',
  'project-scandic.webp': 'https://static.tildacdn.com/stor6131-3231-4634-b333-623338373362/e6080e9d4bf5924778dcb24f8b506b28.jpg',
  'about-carpentry.webp': 'https://static.tildacdn.com/tild3865-3461-4066-b934-623530633439/IMG_1752.jpg',
  'about-interior.webp': 'https://static.tildacdn.com/tild3832-6562-4564-a532-393939363730/q_CShading_LightMix_.jpg',
  'about-roofers.webp': 'https://static.tildacdn.com/tild6537-6634-4662-b963-323134633333/full-shot-roofers-wo.png',
  'promo-bg.webp': 'https://static.tildacdn.com/tild3865-3037-4639-a262-613066303031/photo_2024-01-19_122.jpeg',
  'director.webp': 'https://static.tildacdn.com/tild6663-3837-4237-b434-393466613938/9Cly6K2WRN4.jpg',
  'portfolio-1.webp': 'https://static.tildacdn.com/tild3439-3232-4763-a136-646635653438/photo_2024-09-13_07-.jpg',
  'portfolio-2.webp': 'https://static.tildacdn.com/tild3539-3861-4234-b761-383531646662/photo_2024-09-13_07-.jpg',
  'portfolio-3.webp': 'https://static.tildacdn.com/tild6361-6466-4233-a437-366336303861/photo_2024-09-15_19-.jpg',
  'portfolio-4.webp': 'https://static.tildacdn.com/tild3561-3066-4731-a532-336638303134/photo_2024-09-15_19-.jpg',
  'portfolio-5.webp': 'https://static.tildacdn.com/tild3861-3732-4430-a636-613437623734/3IrsQWLzYoM-17005036.jpg',
  'portfolio-6.webp': 'https://static.tildacdn.com/tild3366-3832-4865-b263-653333383466/yLSgAnOh9zY-17005038.jpg',
  'review-1.webp': 'https://static.tildacdn.com/tild3634-3463-4961-b736-386532656562/g7eH6d1r2yc.jpg',
  'review-2.webp': 'https://static.tildacdn.com/tild3535-6433-4435-a432-313439326665/photo_2024-09-15_19-.jpg',
  'review-3.webp': 'https://static.tildacdn.com/tild3166-3665-4938-a266-326530333164/photo_2024-09-06_08-.jpg',
  'review-4.webp': 'https://static.tildacdn.com/tild3161-6338-4263-b238-353636396637/_viber_2024-05-17_11.jpg',
  'review-5.webp': 'https://static.tildacdn.com/tild6261-3633-4465-b738-643164363535/3IrsQWLzYoM-17005036.jpg',
  'review-6.webp': 'https://static.tildacdn.com/tild6136-3533-4933-b664-373239393334/IMG-27d403a4ac99e9af.jpg',
  'news-1.webp': 'https://static.tildacdn.com/tild3531-6365-4436-a433-373266366463/21.jpg',
  'news-2.webp': 'https://static.tildacdn.com/tild3566-3330-4761-b865-643037323530/__28-5-2024_154311_d.jpeg',
  'news-3.webp': 'https://static.tildacdn.com/tild3465-3834-4735-b364-636664306138/V2NUwlAZnkw.jpg',
  'news-4.webp': 'https://static.tildacdn.com/tild3132-3564-4937-b138-363035306539/_viber_2022-11-10_10.jpg',
  'news-5.webp': 'https://static.tildacdn.com/tild3862-3536-4439-a534-326162303861/E5YrR8emoXI.jpg',
  'news-6.webp': 'https://static.tildacdn.com/tild3739-6432-4332-a231-656539616164/_viber_2024-02-27_12.jpg',
  'contact-building.webp': 'https://static.tildacdn.com/tild6434-3933-4537-a162-326335643765/image.jpg',
  'history-house-1.webp': 'https://static.tildacdn.com/tild3361-3462-4763-a339-323038326534/_viber_2024-01-31_14.jpg',
  'history-house-2.webp': 'https://static.tildacdn.com/tild3530-6130-4031-b838-636361313835/_viber_2024-01-25_12.jpg',
  'catalog-house-tet-a-tet.webp': 'https://static.tildacdn.com/stor6532-6137-4461-b266-636365373861/83462250.png',
  'catalog-house-semejnyj.webp': 'https://static.tildacdn.com/stor3531-6139-4461-b632-383239353031/61830118.png',
  'catalog-house-svetlyj.webp': 'https://static.tildacdn.com/stor6531-3136-4132-a563-663661663262/76339157.png',
  'catalog-house-sakura.webp': 'https://static.tildacdn.com/stor6332-3863-4736-b738-383536663430/61583993.jpg',
  'catalog-house-pomeste.webp': 'https://static.tildacdn.com/stor3731-6464-4534-b432-313438306437/46848533.png',
  'catalog-house-mechta.webp': 'https://static.tildacdn.com/stor3030-3731-4234-a661-373266666535/85105199.jpg',
  'catalog-house-krasnaya-shapochka.webp': 'https://static.tildacdn.com/stor6163-3135-4265-b336-383830663237/96900472.png',
  'catalog-house-komfort.webp': 'https://static.tildacdn.com/stor3665-3665-4165-b763-663966333738/10910111.jpg',
  'catalog-house-dom-kompakt.webp': 'https://static.tildacdn.com/stor3132-6439-4636-a135-316231343132/71879547.jpg',
  'catalog-house-dom-kompakt-2.webp': 'https://static.tildacdn.com/stor3466-3634-4961-b331-636433366561/26697497.jpg',
  'catalog-house-dom-idilliya.webp': 'https://static.tildacdn.com/stor6437-3934-4137-b464-366161316666/45623933.jpg',
  'catalog-house-dom-dymka.webp': 'https://static.tildacdn.com/stor6164-3161-4564-b366-616232313239/90364580.jpg',
  'catalog-house-dom-dushevnyj.webp': 'https://static.tildacdn.com/stor3166-6664-4736-b737-623139626138/82079496.png',
  'catalog-house-dom-banya-sosnovaya.webp': 'https://static.tildacdn.com/stor6238-6532-4533-b065-656237383566/53010445.jpg',
  'catalog-house-dom-banya-kompleks.webp': 'https://static.tildacdn.com/stor6661-6662-4863-b962-323735636135/89934040.jpg',
  'catalog-house-dom-grafit.webp': 'https://static.tildacdn.com/stor3164-3131-4962-b836-626663326538/21389803.jpg',
  'catalog-house-dom-vesthill.webp': 'https://static.tildacdn.com/stor3063-6434-4565-b836-323161633535/50966537.jpg',
  'catalog-house-dom-bezmyatezhnost.webp': 'https://static.tildacdn.com/stor3435-6330-4333-a662-393562663062/56415543.jpg',
  'catalog-house-dom-astra.webp': 'https://static.tildacdn.com/stor3433-3764-4263-a361-316632363239/40093339.png',
  'catalog-house-dom-astra-2.webp': 'https://static.tildacdn.com/stor6363-3766-4162-b230-666239636263/30459423.jpg',
  'catalog-house-rodnye-penaty.webp': 'https://static.tildacdn.com/stor6230-6463-4630-b133-333462383431/31719598.jpg',
  'catalog-sauna-banya-s-hozblokom.webp': 'https://static.tildacdn.com/stor3932-3937-4365-b036-303132623937/49076402.jpg',
  'catalog-sauna-uslada.webp': 'https://static.tildacdn.com/stor3331-3163-4038-b366-643962346562/72352390.png',
  'catalog-sauna-evropa.webp': 'https://static.tildacdn.com/stor6233-3036-4365-a639-306566323264/207dc82eaad31012c2533102c97e33c9.jpg',
  'catalog-sauna-zdravnitsa.webp': 'https://static.tildacdn.com/stor3664-6361-4339-b063-333038323630/ec008b5054a3bfef32d0f1708e42db1e.jpg',
  'catalog-sauna-udachnaya.webp': 'https://static.tildacdn.com/stor6665-3062-4334-b231-323765613633/95773588.png',
  'catalog-sauna-solnechnaya.webp': 'https://static.tildacdn.com/stor3464-3632-4933-a132-633031333865/56303716.png',
  'catalog-sauna-lesnaya.webp': 'https://static.tildacdn.com/stor6162-6362-4639-a166-306435636231/51340628.jpg',
  'catalog-sauna-klassika.webp': 'https://static.tildacdn.com/stor3432-3338-4938-b235-663932313036/68556301.jpg',
  'catalog-sauna-zagorodnaya.webp': 'https://static.tildacdn.com/stor3362-3332-4433-a465-633031303237/64911893.png',
  'catalog-sauna-zharkaya.webp': 'https://static.tildacdn.com/stor3533-3366-4565-b639-353862366663/37559997.jpg',
  'catalog-sauna-banya-ohotnika.webp': 'https://static.tildacdn.com/stor3934-6161-4165-b964-346563373965/84472590.jpg',
  'catalog-sauna-dikaya-rubka.webp': 'https://static.tildacdn.com/stor3039-6636-4639-a163-316635316366/51704167.jpg',
  'catalog-sauna-boyarynya.webp': 'https://static.tildacdn.com/stor6230-6538-4364-b437-343832616236/57467145.jpg',
  'catalog-sauna-rodnaya.webp': 'https://static.tildacdn.com/stor3935-6338-4133-b830-616161313361/71462943.png',
  'og.jpg': 'https://static.tildacdn.com/tild6333-6536-4137-b535-616462623932/Frame_279.png',
  ...portfolioAssets,
};

const outputDir = join(process.cwd(), 'public', 'media');
await mkdir(outputDir, { recursive: true });

const requestedArgs = process.argv.slice(2).filter((name) => name !== '--');
const syncCatalog = requestedArgs.includes('catalog');
const syncPortfolio = requestedArgs.includes('portfolio');
const requestedNames = new Set(requestedArgs.filter((name) => name !== 'catalog' && name !== 'portfolio'));
const knownNames = new Set([...Object.keys(assets), 'montserrat.ttf']);
for (const requestedName of requestedNames) {
  if (!knownNames.has(requestedName)) throw new Error(`Unknown asset: ${requestedName}`);
}
const selectedAssets = requestedNames.size === 0 && !syncCatalog && !syncPortfolio
  ? Object.entries(assets)
  : Object.entries(assets).filter(([name]) => requestedNames.has(name)
    || (syncCatalog && name.startsWith('catalog-'))
    || (syncPortfolio && name.startsWith('portfolio-work-')));

for (const [name, url] of selectedAssets) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const source = Buffer.from(await response.arrayBuffer());
  const pipeline = sharp(source).rotate().resize({ width: 1800, withoutEnlargement: true });
  const output = extname(name) === '.jpg'
    ? await pipeline.jpeg({ quality: 86, mozjpeg: true }).toBuffer()
    : await pipeline.webp({ quality: 84, effort: 5 }).toBuffer();
  await writeFile(join(outputDir, name), output);
  process.stdout.write(`${name}\n`);
}

const fontDir = join(process.cwd(), 'public', 'fonts');
if ((requestedNames.size === 0 && !syncCatalog && !syncPortfolio) || requestedNames.has('montserrat.ttf')) {
  await mkdir(fontDir, { recursive: true });
  const fontResponse = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf');
  if (!fontResponse.ok) throw new Error(`${fontResponse.status} Montserrat`);
  await writeFile(join(fontDir, 'montserrat.ttf'), Buffer.from(await fontResponse.arrayBuffer()));
  process.stdout.write('montserrat.ttf\n');
}
