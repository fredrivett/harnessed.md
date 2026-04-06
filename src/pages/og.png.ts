import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { generateOgImage } from '../lib/og';

export const GET: APIRoute = async () => {
  const home = await getEntry('pages', 'home');
  if (!home) throw new Error('Missing pages/home entry');

  const png = await generateOgImage(
    'harnessed.md',
    home.data.description,
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
