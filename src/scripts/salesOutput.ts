/**
 * Sales JSON Output Generator
 * Generates JSON lead data from form answers Q1-Q5 and sends to server API
 */

export interface SalesData {
  email: string;
  country: string;
  employees: number;
  annual_revenue: string;
  considering_identity_security: string;
  timestamp: string;
}

/**
 * Build the sales data object from form inputs
 */
export function buildSalesData(
  email: string,
  country: string,
  employees: number,
  annualRevenue: string,
  consideringIdentitySecurity: string,
): SalesData {
  return {
    email,
    country,
    employees,
    annual_revenue: annualRevenue,
    considering_identity_security: consideringIdentitySecurity,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save sales data to the server (Astro API endpoint)
 */
export async function saveSalesData(data: SalesData): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const response = await fetch('/api/save-sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Failed to save sales data' };
    }

    const result = await response.json();
    return { success: true, filename: result.filename };
  } catch (err) {
    console.error('Error saving sales data:', err);
    return { success: false, error: 'Network error saving sales data' };
  }
}

/**
 * Save PDF to server (Astro API endpoint)
 */
export async function savePDFToServer(pdfBlob: Blob, email: string): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const formData = new FormData();
    const emailPrefix = email.split('@')[0];
    const filename = `Netwrix_ROI_Report_${emailPrefix}.pdf`;
    formData.append('pdf', pdfBlob, filename);
    formData.append('email', email);

    const response = await fetch('/api/save-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Failed to save PDF' };
    }

    const result = await response.json();
    return { success: true, filename: result.filename };
  } catch (err) {
    console.error('Error saving PDF:', err);
    return { success: false, error: 'Network error saving PDF' };
  }
}
