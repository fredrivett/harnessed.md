import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../../lib/og';

export async function getStaticPaths() {
  const companies = await getCollection('companies');
  return companies.map((company) => ({
    params: { slug: company.id.replace(/^\d+-/, '') },
    props: { company },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { company } = props as Awaited<ReturnType<typeof getStaticPaths>>[number]['props'];

  const png = await generateOgImage(
    company.data.name,
    company.data.description,
  );

  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
