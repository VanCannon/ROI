/**
 * API Endpoint: Save Sales JSON
 * Saves lead data from the ROI form to the Sales/ directory
 */

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.email || !data.country || !data.employees || !data.annual_revenue || !data.considering_identity_security) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build filename from email prefix and timestamp
    const emailPrefix = data.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${emailPrefix}_${timestamp}.json`;

    // Save to Sales/ directory (relative to project root's parent)
    const salesDir = resolve(process.cwd(), '..', 'Sales');
    await mkdir(salesDir, { recursive: true });
    const filePath = join(salesDir, filename);

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return new Response(
      JSON.stringify({ success: true, filename }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error saving sales data:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
