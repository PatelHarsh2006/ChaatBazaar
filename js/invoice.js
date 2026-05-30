// ===== PDF Invoice & Print Receipt Generator Module =====

window.invoiceGenerator = (() => {
  // Ensure jsPDF is loaded on demand
  async function ensureJsPDFLoaded() {
    if (window.jspdf && window.jspdf.jsPDF) {
      return window.jspdf.jsPDF;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error("jsPDF loaded but namespace not resolved."));
        }
      };
      script.onerror = () => reject(new Error("Failed to load jsPDF library."));
      document.head.appendChild(script);
    });
  }

  // Retrieve order details from localStorage
  function getOrderById(orderId) {
    try {
      const orders = JSON.parse(localStorage.getItem('chaatOrders')) || [];
      return orders.find(o => o.id === orderId);
    } catch (error) {
      console.error("Error loading order for invoice:", error);
      return null;
    }
  }

  // Format currency helper
  function formatCurrency(num) {
    return `INR ${parseFloat(num).toFixed(2)}`;
  }

  // Generate and Download PDF Invoice
  async function downloadPDF(orderId) {
    const order = getOrderById(orderId);
    if (!order) {
      alert("Error: Order not found!");
      return;
    }

    try {
      const JsPDFClass = await ensureJsPDFLoaded();
      const doc = new JsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 Layout width: 210mm, height: 297mm
      // Margins: Left 15mm, Right 15mm, Top 15mm
      const leftMargin = 15;
      const rightMargin = 195;
      let y = 20;

      // 1. Header Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(230, 74, 25); // Brand Orange
      doc.text("ChaatBazaar", leftMargin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Authentic Indian Street Food Delivered Hot!", leftMargin, y + 5);

      // Invoice metadata
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text("INVOICE / RECEIPT", 125, y + 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Invoice No: INV-${order.id}`, 125, y + 8);
      doc.text(`Date: ${order.date}`, 125, y + 13);

      y += 22;

      // Draw Separator Line
      doc.setDrawColor(230, 74, 25);
      doc.setLineWidth(0.8);
      doc.line(leftMargin, y, rightMargin, y);

      y += 10;

      // 2. Vendor and Customer Info Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("FROM:", leftMargin, y);
      doc.text("DELIVERY DETAILS:", 110, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      // Vendor address
      doc.text([
        "ChaatBazaar Central Kitchen",
        "India Gate Counter #4",
        "New Delhi, 110001",
        "Phone: +91 98765 43210",
        "Email: support@ChaatBazaar.com"
      ], leftMargin, y + 5);

      // Customer delivery info
      const address = order.deliveryAddress;
      const addrLines = [];
      if (address) {
        addrLines.push(`Source: ${address.source === 'geolocation' ? 'GPS Coordinates' : 'Manual Entry'}`);
        addrLines.push(`Latitude: ${address.latitude.toFixed(5)}`);
        addrLines.push(`Longitude: ${address.longitude.toFixed(5)}`);
        if (order.deliveryDistance) {
          addrLines.push(`Distance: ${order.deliveryDistance.toFixed(2)} km`);
        }
      } else {
        addrLines.push("Self-Pickup / Standard Counter Delivery");
      }
      doc.text(addrLines, 110, y + 5);

      y += 35;

      // 3. Itemized Items Table Header
      doc.setFillColor(245, 245, 245);
      doc.rect(leftMargin, y, rightMargin - leftMargin, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text("Item Description", leftMargin + 3, y + 5.5);
      doc.text("Qty", 125, y + 5.5, { align: "center" });
      doc.text("Unit Price", 155, y + 5.5, { align: "right" });
      doc.text("Total", rightMargin - 3, y + 5.5, { align: "right" });

      y += 8;

      // Draw items
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      
      order.items.forEach(ci => {
        // Draw row line separator
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(leftMargin, y + 8, rightMargin, y + 8);

        // Render Item details
        doc.text(ci.item.name, leftMargin + 3, y + 5);
        doc.text(ci.quantity.toString(), 125, y + 5, { align: "center" });
        doc.text(formatCurrency(ci.item.price), 155, y + 5, { align: "right" });
        doc.text(formatCurrency(ci.item.price * ci.quantity), rightMargin - 3, y + 5, { align: "right" });

        y += 8;
      });

      y += 5;

      // 4. Summary Totals Section
      const startX = 110;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      
      // Calculate original subtotal if not stored explicitly
      const subtotalVal = order.subtotal || order.items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
      
      doc.text("Subtotal:", startX, y + 5);
      doc.text(formatCurrency(subtotalVal), rightMargin - 3, y + 5, { align: "right" });
      y += 6;

      if (order.discount && order.discount > 0) {
        doc.setTextColor(200, 50, 50);
        doc.text("Discount Applied:", startX, y + 5);
        doc.text(`-${formatCurrency(order.discount)}`, rightMargin - 3, y + 5, { align: "right" });
        doc.setTextColor(80, 80, 80);
        y += 6;
      }

      // Add mock GST tax (e.g. 5%)
      const taxRate = 0.05;
      const taxableAmount = subtotalVal - (order.discount || 0);
      const gstVal = taxableAmount * taxRate;
      doc.text("GST (5%):", startX, y + 5);
      doc.text(formatCurrency(gstVal), rightMargin - 3, y + 5, { align: "right" });
      y += 6;

      // Double Line under totals
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(startX, y + 2, rightMargin, y + 2);
      y += 7;

      // Grand Total
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text("Total Amount Paid:", startX, y + 5);
      doc.text(formatCurrency(taxableAmount + gstVal), rightMargin - 3, y + 5, { align: "right" });
      
      // Show points earned if present
      if (order.pointsEarned && order.pointsEarned > 0) {
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(40, 167, 69); // Green
        doc.text(`🌟 Points Earned: +${order.pointsEarned} loyalty points!`, startX, y + 5);
      }

      y += 25;

      // 5. Thank You Footer Section
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("Thank you for choosing ChaatBazaar! Come back soon.", 105, y, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("This receipt was generated client-side and acts as a valid proof of purchase.", 105, y + 5, { align: "center" });

      // Save PDF File
      doc.save(`ChaatBazaar_Invoice_${order.id}.pdf`);

    } catch (err) {
      console.error("Failed to generate PDF invoice:", err);
      alert("Error generating PDF invoice. Falling back to native printing...");
      printReceipt(orderId);
    }
  }

  // Print Receipt natively using media print stylesheet
  function printReceipt(orderId) {
    const order = getOrderById(orderId);
    if (!order) {
      alert("Error: Order not found!");
      return;
    }

    const printContainerId = "print-invoice-receipt";
    let printContainer = document.getElementById(printContainerId);
    if (printContainer) printContainer.remove();

    printContainer = document.createElement("div");
    printContainer.id = printContainerId;

    // Calculate subtotal, GST, and totals
    const subtotalVal = order.subtotal || order.items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
    const taxRate = 0.05;
    const taxableAmount = subtotalVal - (order.discount || 0);
    const gstVal = taxableAmount * taxRate;
    const grandTotal = taxableAmount + gstVal;

    let itemsRowsHtml = "";
    order.items.forEach(ci => {
      itemsRowsHtml += `
        <tr>
          <td>${ci.item.name}</td>
          <td style="text-align: center;">${ci.quantity}</td>
          <td style="text-align: right;">₹${ci.item.price.toFixed(2)}</td>
          <td style="text-align: right;">₹${(ci.item.price * ci.quantity).toFixed(2)}</td>
        </tr>
      `;
    });

    printContainer.innerHTML = `
      <div class="print-receipt-box">
        <div class="receipt-header">
          <h1>ChaatBazaar</h1>
          <p class="subtitle">Authentic Indian Street Food Delivered Hot!</p>
          <hr/>
          <h2>INVOICE / RECEIPT</h2>
        </div>
        
        <div class="receipt-meta">
          <div>
            <strong>Invoice Number:</strong> INV-${order.id}<br/>
            <strong>Date:</strong> ${order.date}<br/>
            <strong>Status:</strong> Completed / Paid
          </div>
          <div style="margin-top: 10px;">
            <strong>From:</strong> ChaatBazaar Central Kitchen, India Gate, New Delhi<br/>
            <strong>Delivery:</strong> ${order.deliveryAddress ? `GPS Coordinates (${order.deliveryAddress.latitude.toFixed(4)}, ${order.deliveryAddress.longitude.toFixed(4)})` : 'Self-Counter Pickup'}
          </div>
        </div>

        <table class="receipt-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #333; background: #f0f0f0;">
              <th style="text-align: left; padding: 6px;">Item Description</th>
              <th style="text-align: center; padding: 6px; width: 10%;">Qty</th>
              <th style="text-align: right; padding: 6px; width: 20%;">Price</th>
              <th style="text-align: right; padding: 6px; width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <div class="receipt-summary" style="margin-top: 20px; float: right; width: 50%;">
          <table style="width: 100%;">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${subtotalVal.toFixed(2)}</td>
            </tr>
            ${order.discount ? `
            <tr style="color: #e64a19;">
              <td>Discount Applied:</td>
              <td style="text-align: right;">-₹${order.discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td>GST (5%):</td>
              <td style="text-align: right;">₹${gstVal.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold; border-top: 1px solid #333; font-size: 1.1rem;">
              <td style="padding-top: 6px;">Grand Total:</td>
              <td style="text-align: right; padding-top: 6px;">₹${grandTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <div style="clear: both;"></div>

        ${order.pointsEarned ? `
        <div style="margin-top: 15px; color: #28a745; font-weight: bold; text-align: right;">
          🌟 Loyalty Points Earned: +${order.pointsEarned} pts
        </div>
        ` : ''}

        <div class="receipt-footer" style="text-align: center; margin-top: 40px; font-style: italic; color: #666; font-size: 0.9rem;">
          <p>Thank you for choosing ChaatBazaar! Visit us again soon.</p>
          <p style="font-size: 0.75rem;">This client-side document represents a valid print proof of purchase.</p>
        </div>
      </div>
    `;

    document.body.appendChild(printContainer);

    // Call native browser print
    window.print();

    // Remove printed element once print window closes/finishes
    window.addEventListener("afterprint", () => {
      const el = document.getElementById(printContainerId);
      if (el) el.remove();
    }, { once: true });
  }

  return {
    downloadPDF,
    printReceipt
  };
})();
