import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const fontData = readFileSync(
  join(process.cwd(), 'src/assets/fonts/ibm-plex-mono-latin-400-normal.woff')
);

export async function generateOgImage(title: string, subtitle?: string): Promise<Uint8Array> {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          backgroundColor: '#111',
          color: '#e0e0e0',
          fontFamily: 'IBM Plex Mono',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 48,
                fontWeight: 400,
                lineHeight: 1.3,
                marginBottom: subtitle ? 24 : 0,
              },
              children: title,
            },
          },
          ...(subtitle
            ? [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 24,
                      color: '#999',
                      lineHeight: 1.5,
                    },
                    children: subtitle,
                  },
                },
              ]
            : []),
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute' as const,
                bottom: 60,
                left: 80,
                fontSize: 20,
                color: '#666',
              },
              children: 'harnessed.md',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'IBM Plex Mono',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg);
  return resvg.render().asPng();
}
