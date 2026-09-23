import React, { useRef, useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import "jspdf-autotable";

const Bill = ({ order, onClose }) => {
  const billRef = useRef();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/profile/${order.user}`
        );
        setUser(res.data);
      } catch (error) {
        // profile fetch is optional for the bill header
      }
    };

    if (order?.user) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.user]);

  const downloadPDF = async () => {
  const element = billRef.current;
  const scale = 2; // must match html2canvas scale below

  // 1) Capture the whole bill as one tall canvas (as before)
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#fff",
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  // px -> mm conversion factor, based on the captured canvas width
  const pxToMm = pdfWidth / canvas.width;
  const pageHeightPx = pdfHeight / pxToMm; // how many source px fit on one A4 page

  // 2) Get the Y position (in canvas px) of every table row's TOP and BOTTOM,
  //    relative to the billRef element, then scale to canvas pixels.
  const elementRect = element.getBoundingClientRect();
  const rows = Array.from(element.querySelectorAll("table tbody tr"));

  const rowBoundaries = rows.map((row) => {
    const r = row.getBoundingClientRect();
    return {
      top: (r.top - elementRect.top) * scale,
      bottom: (r.bottom - elementRect.top) * scale,
    };
  });

  const totalHeightPx = canvas.height;

  // 3) Build a list of "safe" cut points: never cut inside a row.
  //    Walk down the page in pageHeightPx chunks, but if the natural
  //    cut point would land inside a row, pull the cut back to that
  //    row's top instead.
  const cutPoints = [0];
  let cursor = 0;

  while (cursor < totalHeightPx) {
    let idealEnd = Math.min(cursor + pageHeightPx, totalHeightPx);

    // does idealEnd fall inside some row?
    const collidingRow = rowBoundaries.find(
      (rb) => idealEnd > rb.top && idealEnd < rb.bottom
    );

    if (collidingRow) {
      // pull the break back to the top of that row
      idealEnd = collidingRow.top;
    }

    // Safety net: if pulling back collapses the page (e.g. one row
    // taller than a full page), just force the original break so we
    // don't get stuck in an infinite loop.
    if (idealEnd <= cursor) {
      idealEnd = Math.min(cursor + pageHeightPx, totalHeightPx);
    }

    cutPoints.push(idealEnd);
    cursor = idealEnd;
  }

  // 4) Render each slice onto its own canvas, then add as its own PDF page.
  //    This avoids the "shift the same full image" trick, which is what
  //    was causing rows to appear duplicated/misaligned across pages.
  for (let i = 0; i < cutPoints.length - 1; i++) {
    const sliceStart = cutPoints[i];
    const sliceEnd = cutPoints[i + 1];
    const sliceHeightPx = sliceEnd - sliceStart;

    if (sliceHeightPx <= 0) continue;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const ctx = pageCanvas.getContext("2d");
    // white background so no transparent/black gaps show up
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    ctx.drawImage(
      canvas,
      0, sliceStart, canvas.width, sliceHeightPx, // source rect
      0, 0, canvas.width, sliceHeightPx            // dest rect
    );

    const imgData = pageCanvas.toDataURL("image/png");
    const imgHeightMm = sliceHeightPx * pxToMm;

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightMm);
  }

  pdf.save(`Invoice-${order.invoiceNumber}.pdf`);
};

  if (!user) return <p>Loading bill...</p>;

  return (
    <div>
      <div
        ref={billRef}
        style={{
          padding: "30px",
          width: "780px",
          margin: "auto",
          background: "#fff",
          color: "#000",
          fontFamily: "Arial",
          border: "1px solid #ddd",
        }}
      >
        {/* ===== HEADER ===== */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ textAlign: "left" }}>{user.logo && (
            <img
              crossOrigin="anonymous"   // 🔥 VERY IMPORTANT
              src={`http://localhost:5000/uploads/${user.logo}?t=${Date.now()}`}
              alt="Logo"
              style={{ width: "175px", marginBottom: "8px" }}
            />
          )}
          </div>

          <div><h2 style={{ margin: "5px 0" }}>
            {user.businessName || "Your Business Name"}
          </h2></div>

          <h4 style={{ marginBottom: "10px", marginTop: "5px", letterSpacing: "1px" }}>
            TAX INVOICE
          </h4>
        </div>

        {/* ===== CUSTOMER + INVOICE ROW ===== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            fontSize: "14px"
          }}
        >
          <div>
            <strong>Bill To</strong><br />
            <div style={{ marginTop: "10px" }}> <strong>Customer Name : </strong> {order.customerName}<br /></div>

            <div style={{ marginTop: "5px" }}> <strong>Mobile No. : </strong> {order.mobile}</div>
          </div>

          <div style={{ textAlign: "right" }}>
           <div style={{ marginBottom: "10px" }}>
  <strong>Invoice No:</strong> INV-{String(order.invoiceNumber).padStart(6, "0")}
  <br />
</div>
            <strong >Date:</strong>{" "}
            {new Date(order.createdAt).toLocaleDateString()}<br />
            <div style={{ marginTop: "5px" }}><strong>Payment Mode:</strong> {order.paymentMode}</div>
          </div>
        </div>

        {/* ===== PRODUCT TABLE ===== */}
        <table
          width="100%"
          style={{
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "13px",
            marginTop: "30px"
          }}
        >
          <thead>
            <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #000" }}>
              <th style={{ padding: "8px" }}>#</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Product</th>
              <th style={{ padding: "8px" }}>Part No</th>
              <th style={{ padding: "8px", textAlign: "center" }}>MRP(₹)</th>
              <th style={{ padding: "8px", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "8px", textAlign: "center" }}>Total(₹)</th>
              <th style={{ padding: "8px", textAlign: "center" }}>Discount%</th>
              <th style={{ padding: "8px", textAlign: "center" }}>Discount(₹)</th>
              <th style={{ padding: "8px", textAlign: "center" }}>Final Price(₹)</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Amount(₹)</th>
            </tr>
          </thead>

          <tbody>
            {order.products.map((item, index) => {
              const mrp = item.price || 0;
              const quantity = item.quantity || 0;

              const discountPer = item.discountPercent || 0;

              // Total price before discount
              const totalPrice = mrp * quantity;

              // Discount per piece (percentage based)
              const discountPerPiece = (mrp * discountPer) / 100;

              // Total discount (per piece × quantity)
              const discountRup = discountPerPiece * quantity;

              // Final price after discount
              const finalPrice = totalPrice - discountRup;

              const amount = finalPrice;

              return (
                <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px", textAlign: "center" }}>
                    {index + 1}
                  </td>

                  <td style={{ padding: "6px" }}>
                    {item.name}
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    {item.partNumber}
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    ₹{Number(mrp).toFixed(2)}
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    {item.quantity}
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    ₹{Number(totalPrice).toFixed(2)}
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    {discountPer}%
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    ₹{discountRup}
                  </td>

                  <td style={{ padding: "6px", textAlign: "center" }}>
                    ₹{Number(finalPrice).toFixed(2)}
                  </td>

                  <td style={{ padding: "6px", textAlign: "right" }}>
                    ₹{Number(amount).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ===== AMOUNT SECTION ===== */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <table
            style={{
              width: "100%",
              fontSize: "14px",
              borderCollapse: "separate",
              borderSpacing: "0 8px",   // 🔥 vertical gap between rows
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "1px 0" }}>Total Amount :</td>
                <td style={{ textAlign: "right", padding: "1px 0" }}>
                  ₹ {Number(order.totalAmount).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ padding: "1px 0" }}> Extra Discount :</td>
                <td style={{ textAlign: "right", padding: "1px 0" }}>
                  ₹ {Number(order.discount).toFixed(2)}
                </td>
              </tr>

              <tr style={{ fontWeight: "bold" }}>
                <td
                  style={{
                    padding: "8px 0",
                    borderTop: "2px solid #000",
                  }}
                >
                  Final Amount :
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "8px 0",
                    borderTop: "2px solid #000",
                  }}
                >
                  ₹ {Number(order.finalAmount).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ padding: "1px 0" }}>Paid Amount :</td>
                <td style={{ textAlign: "right", padding: "1px 0" }}>
                  ₹ {Number(order.paidAmount).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ padding: "1px 0" }}>Remaining Amount :</td>
                <td style={{ textAlign: "right", padding: "1px 0" }}>
                  ₹ {Number(order.remainingAmount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* ===== SIGNATURE ===== */}
        <div
          style={{
            marginTop: "60px",
            textAlign: "right",
            fontSize: "14px"
          }}
        >
          For {user.businessName}
          <br /><br />
          Authorized Signatory
        </div>
      </div>

      {/* ===== BUTTONS ===== */}
      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <button
          onClick={downloadPDF}
          style={{
            padding: "10px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            width: "150px"
          }}
        >
          Print / Save PDF
        </button>

        <button
          onClick={onClose}
          style={{
            padding: "10px 20px",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            width: "150px"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Bill; 