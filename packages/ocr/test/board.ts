import sharp from 'sharp';

export async function createBoard({ columns = 5, background = 20 } = {}) {
  const tiles: string[] = [];
  const left = (600 - columns * 70 + 6) / 2;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < columns; col++) {
      const x = left + col * 70;
      const y = 160 + row * 70;
      tiles.push(`<rect x="${x}" y="${y}" width="60" height="60" fill="none" stroke="#777" stroke-width="3"/>`);
    }
  }
  return sharp(Buffer.from(`<svg width="600" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="1000" fill="rgb(${background},${background},${background})"/>
    <rect x="10" y="30" width="580" height="90" rx="30" fill="#444"/>
    <circle cx="300" cy="75" r="20" fill="none" stroke="white" stroke-width="4"/>
    ${tiles.join('')}
  </svg>`)).removeAlpha().png().toBuffer();
}
