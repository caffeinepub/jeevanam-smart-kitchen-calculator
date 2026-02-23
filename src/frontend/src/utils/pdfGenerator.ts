import type { Ingredient } from '../backend';

interface StoreIssueSlip {
  date: string;
  recipeName: string;
  productionQuantity: number;
  ingredients: Ingredient[];
}

// Helper function to format numbers with minimal decimal places
const formatNumber = (value: number): string => {
  return parseFloat(value.toFixed(3)).toString();
};

export async function generatePDF(
  slip: StoreIssueSlip,
  formatQuantity: (value: number, unit: string) => string
) {
  // Create a printable HTML content
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Store Issue Slip - ${slip.recipeName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #6B4423;
            border-bottom: 3px solid #D87056;
            padding-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          .info-item {
            padding: 10px;
            background: #F5F1E8;
            border-radius: 8px;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #D87056;
            color: white;
            font-weight: bold;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 60px;
          }
          .signature-line {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 40px;
          }
          .signature-label {
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Store Issue Slip</h1>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${new Date().toLocaleDateString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Recipe Name</div>
            <div class="info-value">${slip.recipeName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Production Quantity</div>
            <div class="info-value">${slip.productionQuantity} portions</div>
          </div>
        </div>

        <h2>Required Ingredients</h2>
        <table>
          <thead>
            <tr>
              <th>Ingredient</th>
              <th style="text-align: right;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${slip.ingredients
              .map(
                (ing) => `
              <tr>
                <td>${ing.name}</td>
                <td style="text-align: right; font-weight: bold;">${formatQuantity(ing.quantityPerPortion, ing.unit)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="signature-label">Prepared By</div>
            <div class="signature-line"></div>
          </div>
          <div>
            <div class="signature-label">Approved By</div>
            <div class="signature-line"></div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Create a blob and download
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `store-issue-slip-${slip.recipeName}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
