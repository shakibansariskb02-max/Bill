const XLSX = require("xlsx");

function parseTextLine(rawLine) {
  let line = rawLine.replace(/\s+/g, " ").trim();

  // Skip headers
if (
  !line ||
  /^sr\s*no/i.test(line) ||
  /^part\s*number/i.test(line) ||
  /^part\s*description/i.test(line)
) {
  return null;
}

// Match: Serial + Part + Description + MRP + GST
const row = line.match(/^(\d{1,4})(\d{8})(.+?)(\d+)(0\.\d{2})$/);

if (row) {
  let [, sr, partNumber, name, mrp] = row;

  name = name.trim();

  // Fix products like "SPRING WASHER M10"
  const m = name.match(/^(.*\bM)(\d*)$/);

  if (m && mrp.length > 1) {
    const digits = mrp.slice(0, -1);

    // Move the digits back into the product name
    name = m[1] + digits;

    // Keep only the last digit as MRP
    mrp = mrp.slice(-1);
  }

  return {
    partNumber,
    name: name.toUpperCase(),
    price: Number(mrp),
  };
}


  const mrpMatch = line.match(
/(\d+(?:\.\d+)?)\s+0\.\d+\s*$/
);
  if (!mrpMatch) return null;

  const price = Number(mrpMatch[1].replace(/,/g, ""));
  if (isNaN(price)) return null;

  line = line.slice(0, mrpMatch.index).trim();
  line = line.replace(/\d{1,2}(?:\.\d+)?\s*%\s*$/, "").trim();
  line = line.replace(/\s\d{4,8}$/, "").trim();

  if (!line) return null;

  let partNumber = "";
  let name = "";
  const match = line.match(/^([A-Z0-9]{6,12})(.*)$/i);

if (!match) return null;

partNumber = match[1].trim();
name = match[2].trim();

  // If a description word got glued onto the END of partNumber
  // (e.g. "03G160333SYNCHRONISER"), peel it off. Real part numbers in
  // this catalog never end in a run of 3+ letters — only description
  // words do — so this is a safe, targeted correction. Loop in case
  // more than one word got glued on.
  

  name = name.replace(/\d{6,8}$/, "").trim();
  partNumber = partNumber.trim();
  name = name.trim();

  if (!partNumber || !name) return null;
  if (partNumber.length > 40) return null;

  return {
    partNumber: partNumber.toUpperCase(),
    name: name.toUpperCase(),
    price,
  };
}

function parseFromText(text) {
  const lines = text.split(/\r?\n/);
  const items = [];

  for (const line of lines) {

  if (line.includes("81020095")) {
    console.log("RAW:");
    console.log(JSON.stringify(line));
  }

  const parsed = parseTextLine(line);

  if (parsed && parsed.partNumber === "81020095") {
    console.log("PARSED:", parsed);
  }

  if (parsed) items.push(parsed);
}

  return items;
}



function parseFromSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  let headerRow = -1;
  let partCol = -1;
  let descCol = -1;
  let mrpCol = -1;

  // Find the header row automatically
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).trim().toLowerCase());

    row.forEach((cell, index) => {

      if (
        cell.includes("part no") ||
        cell.includes("part number") ||
        cell === "part"
      ) {
        partCol = index;
      }

      if (
        cell.includes("description") ||
        cell.includes("part description") ||
        cell.includes("name") ||
        cell.includes("product")
      ) {
        descCol = index;
      }

      if (
        cell === "mrp" ||
        cell.includes("price") ||
        cell.includes("rate") ||
        cell.includes("amount")
      ) {
        mrpCol = index;
      }

    });

    if (partCol !== -1 && descCol !== -1 && mrpCol !== -1) {
      headerRow = i;
      break;
    }
  }

  if (headerRow === -1) return [];

  const items = [];

  for (let i = headerRow + 1; i < rows.length; i++) {

    const row = rows[i];

    const partNumber = String(row[partCol] ?? "").trim();
    const name = String(row[descCol] ?? "").trim();

    const price = parseFloat(
      String(row[mrpCol] ?? "")
        .replace(/,/g, "")
        .replace(/[^\d.]/g, "")
    );

    if (!partNumber || !name || isNaN(price))
      continue;

    items.push({
      partNumber: partNumber.toUpperCase(),
      name: name.toUpperCase(),
      price,
    });
  }

  return items;
}

async function withSuppressedOutput(matchSubstring, fn) {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  const makeFilteredWrite = (originalWrite) => {
    return (chunk, encoding, callback) => {
      const str = typeof chunk === "string" ? chunk : chunk?.toString?.() || "";
      if (str.includes(matchSubstring)) {
        const cb = typeof encoding === "function" ? encoding : callback;
        if (typeof cb === "function") cb();
        return true;
      }
      return originalWrite(chunk, encoding, callback);
    };
  };

  process.stderr.write = makeFilteredWrite(originalStderrWrite);
  process.stdout.write = makeFilteredWrite(originalStdoutWrite);

  try {
    return await fn();
  } finally {
    process.stderr.write = originalStderrWrite;
    process.stdout.write = originalStdoutWrite;
  }
}

async function parseImportFile(buffer, originalName) {
  const ext = (originalName.split(".").pop() || "").toLowerCase();

  if (ext === "pdf") {
    const pdfParseModule = require("pdf-parse");

console.log("pdfParseModule:");
console.log(pdfParseModule);

const pdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : pdfParseModule.default;

console.log("typeof pdfParse =", typeof pdfParse);
    const data = await withSuppressedOutput("TT: undefined function", () =>
      pdfParse(buffer)
    );

    return { items: parseFromText(data.text), sourceType: "pdf" };
  }

  if (ext === "docx") {
  const mammoth = require("mammoth");

  // Extract table text from Word
  const result = await mammoth.extractRawText({ buffer });

  let items = parseFromText(result.value);

  // If the Word file is actually a table, convert it to Excel-like rows
  if (!items.length) {
    const lines = result.value
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);

    items = [];

    for (const line of lines) {

      // Example:
      // 43040051 SPRING WASHER M20 9
      const m = line.match(/^([A-Za-z0-9\-\/]+)\s+(.+?)\s+(\d+(?:\.\d+)?)$/);

      if (!m) continue;

      items.push({
        partNumber: m[1].toUpperCase(),
        name: m[2].toUpperCase(),
        price: Number(m[3]),
      });
    }
  }

  return {
    items,
    sourceType: "docx",
  };
}

  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    return { items: parseFromSpreadsheet(buffer), sourceType: "spreadsheet" };
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF, Word (.docx), Excel (.xlsx/.xls) or CSV file."
  );
}

module.exports = { parseImportFile, parseTextLine, parseFromText, parseFromSpreadsheet };