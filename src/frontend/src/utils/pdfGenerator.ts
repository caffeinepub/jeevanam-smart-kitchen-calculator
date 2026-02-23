// Helper function to format numbers with minimal decimal places
const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return parseFloat(num.toFixed(3)).toString();
};

export function generateStoreIssueSlipPDF(data: {
  date: string;
  recipeName: string;
  productionQuantity: number;
  ingredients: Array<{ name: string; quantity: string | number; unit: string }>;
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Store Issue Slip - ${data.recipeName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: #8B4513;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-item {
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #8B4513;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 60px;
        }
        .signature-line {
          border-top: 1px solid #333;
          padding-top: 10px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Store Issue Slip</h1>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Date:</span> ${data.date}
        </div>
        <div class="info-item">
          <span class="info-label">Recipe:</span> ${data.recipeName}
        </div>
        <div class="info-item">
          <span class="info-label">Production Quantity:</span> ${data.productionQuantity}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th style="text-align: right;">Required Quantity</th>
            <th style="text-align: right;">Unit</th>
          </tr>
        </thead>
        <tbody>
          ${data.ingredients
            .map(
              (ing) => `
            <tr>
              <td>${ing.name}</td>
              <td style="text-align: right;">${formatNumber(ing.quantity)}</td>
              <td style="text-align: right;">${ing.unit}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="signatures">
        <div class="signature-line">Prepared By</div>
        <div class="signature-line">Approved By</div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `store-issue-slip-${data.recipeName}-${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
