/**
 * API Endpoint: Save PDF
 * Saves generated PDF report to the Customers/ directory
 */

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File | null;
    const email = formData.get('email') as string | null;

    if (!pdfFile || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing PDF file or email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build filename
    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Netwrix_ROI_Report_${emailPrefix}_${timestamp}.pdf`;

    // Save to Customers/ directory (relative to project root's parent)
    const customersDir = resolve(process.cwd(), '..', 'Customers');
    await mkdir(customersDir, { recursive: true });
    const filePath = join(customersDir, filename);

    // Read the blob and write to disk
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    return new Response(
      JSON.stringify({ success: true, filename }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error saving PDF:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
