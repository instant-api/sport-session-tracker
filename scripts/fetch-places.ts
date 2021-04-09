import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fse from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

main().catch(console.error);

async function main(): Promise<void> {
  const target = path.resolve(process.cwd(), 'data');

  const LINKS = [
    'https://fr.wikipedia.org/wiki/Parc_de_la_Feyssine',
    'https://fr.wikipedia.org/wiki/Parc_de_Montjuzet',
    'https://fr.wikipedia.org/wiki/Parc_de_la_T%C3%AAte_d%27or',
    'https://fr.wikipedia.org/wiki/Parc_des_Buttes-Chaumont',
    'https://fr.wikipedia.org/wiki/Bois_de_Vincennes',
    'https://fr.wikipedia.org/wiki/Bois_de_Boulogne',
    'https://fr.wikipedia.org/wiki/Parc_Bor%C3%A9ly',
    'https://fr.wikipedia.org/wiki/Parc_de_Belleville',
    'https://fr.wikipedia.org/wiki/Champ-de-Mars_(Paris)',
    'https://fr.wikipedia.org/wiki/Parc_de_la_Villette',
    'https://fr.wikipedia.org/wiki/Parc_de_Bercy',
    'https://fr.wikipedia.org/wiki/Parc_bordelais',
    'https://fr.wikipedia.org/wiki/Parc_Barbieux',
    'https://fr.wikipedia.org/wiki/Parc_du_Grand-Blottereau',
    'https://fr.wikipedia.org/wiki/Parc_de_la_Citadelle_(Strasbourg)',
    'https://fr.wikipedia.org/wiki/Jardin_des_Plantes_(Toulouse)',
    'https://fr.wikipedia.org/wiki/Parc_de_Majolan',
  ];

  const items = [];

  for await (const link of LINKS) {
    console.log(link);
    const res = await fetch(link);
    const content = await res.text();
    const $ = cheerio.load(content);
    const name = $('h1').text();
    const meta = $('meta[property="og:image"]');
    const image = meta.attr('content')!;
    const side = $('.infobox_v2');
    const geo = side.find('a[data-lat]');
    const slug = slugify(name);
    const imagePath = path.resolve(target, 'places', slug + '.jpg');
    await download(image, imagePath);

    items.push({
      name,
      slug: slugify(name),
      lat: parseFloat(geo.attr('data-lat') ?? ''),
      lng: parseFloat(geo.attr('data-lon') ?? ''),
      image: `/places/${slug}.jpg`,
    });
    await wait(1000);
  }

  const dataFile = path.resolve(target, 'places.json');
  await fse.writeJSON(dataFile, items);
}

function slugify(str: string): string {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaeeeeiiiioooouuuunc------';
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

async function download(url: string, target: string) {
  if (fse.existsSync(target)) {
    console.warn(`./${path.relative(process.cwd(), target)} already exist !`);
    return;
  }
  await fse.ensureDir(path.dirname(target));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }
  await streamPipeline(response.body, fse.createWriteStream(target));
}
