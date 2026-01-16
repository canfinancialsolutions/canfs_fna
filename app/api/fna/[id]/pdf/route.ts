npm uninstall pdfkit @types/pdfki
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { default: PDFDocument } = await import('pdfkit');

  const doc = new PDFDocument({ autoFirstPage: false });
  doc.addPage().fontSize(16).text(`FNA PDF for ID: ${params.id}`);

  const chunks: Buffer[] = [];
  const stream = doc as unknown as NodeJS.ReadableStream;

  await new Promise<void>((resolve, reject) => {
    stream.on('data', (c) => chunks.push(Buffer.from(c)));
    stream.on('end', resolve);
    stream.on('error', reject);
    doc.end();
  });

  const pdf = Buffer.concat(chunks);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="fna-${params.id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
