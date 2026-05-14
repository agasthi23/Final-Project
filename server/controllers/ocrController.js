// server/controllers/ocrController.js
import Tesseract from 'tesseract.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Use dynamic import for pdf-parse (ES module compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to parse bill text
const parseBillText = (text) => {
  console.log("📝 Parsing bill text...");
  
  // Electricity (CEB)
  if (text.includes('CEB e-Bill') || text.includes('kWh') || text.includes('Import')) {
    console.log("✅ Detected: Electricity bill");
    
    let month = "04";
    let year = "2026";
    let monthDisplay = "April 2026";
    
    let monthMatch = text.match(/Billing Month\s*\|\s*(\d{4})-(\w+)/i);
    if (!monthMatch) {
      const dateMatch = text.match(/(\d{4})-(\d{2})-\d{2}/);
      if (dateMatch) {
        year = dateMatch[1];
        month = dateMatch[2];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthDisplay = `${monthNames[parseInt(month) - 1]} ${year}`;
      }
    } else {
      year = monthMatch[1];
      const monthName = monthMatch[2];
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const monthIndex = monthNames.findIndex(m => m === monthName);
      if (monthIndex !== -1) {
        month = String(monthIndex + 1).padStart(2, '0');
        monthDisplay = `${monthNames[monthIndex].charAt(0) + monthNames[monthIndex].slice(1).toLowerCase()} ${year}`;
      }
    }
    
    let units = 0;
    let unitsMatch = text.match(/Import\s*:?\s*(\d+)\s*kWh/i);
    if (!unitsMatch) {
      unitsMatch = text.match(/=\s*(\d+)\s*Units?/i);
    }
    if (unitsMatch) units = parseInt(unitsMatch[1]);
    
    let amount = 0;
    let amountMatch = text.match(/Monthly Bill\s*:?\s*Rs?\.?\s*([\d,]+\.?\d*)/i);
    if (!amountMatch) {
      amountMatch = text.match(/Monthly Bill\s*:?\s*([\d,]+\.?\d*)\s*LKR/i);
    }
    if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    
    if (amount > 0) {
      return {
        utility: 'Electricity',
        month: `${year}-${month}`,
        monthDisplay: monthDisplay,
        year: year,
        monthNum: month,
        units: units,
        amount: amount
      };
    }
  }
  
  // Water (NWSDB)
  if (text.includes('NWSDB') || text.includes('Water Board') || text.includes('National Water Supply')) {
    console.log("✅ Detected: Water bill");
    
    let month = "04";
    let year = "2026";
    let monthDisplay = "April 2026";
    let units = 0;
    let amount = 0;
    
    // ----- METHOD 1: Extract from Period (e.g., "Period : 20-09-2025 to 21-10-2025")
    const periodMatch = text.match(/Period\s*:?\s*\d{2}-(\d{2})-(\d{4})\s*to\s*\d{2}-(\d{2})-(\d{4})/i);
    if (periodMatch) {
      // End date gives the billing month
      const endMonth = periodMatch[3]; // month from end date (10 for October)
      const endYear = periodMatch[4];   // year from end date
      month = endMonth;
      year = endYear;
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      monthDisplay = `${monthNames[parseInt(month) - 1]} ${year}`;
      console.log(`   Period detected: ${monthDisplay}`);
    }
    
    // ----- METHOD 2: Extract from "BILLING MONTH" if available
    if (!periodMatch) {
      const monthMatch = text.match(/BILLING MONTH\s*:?\s*(\d{4})\s*(\w+)/i);
      if (monthMatch) {
        year = monthMatch[1];
        const monthName = monthMatch[2];
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthIndex = monthNames.findIndex(m => m === monthName.toUpperCase());
        if (monthIndex !== -1) {
          month = String(monthIndex + 1).padStart(2, '0');
          monthDisplay = `${monthNames[monthIndex].charAt(0) + monthNames[monthIndex].slice(1).toLowerCase()} ${year}`;
        }
      }
    }
    
    // ----- EXTRACT UNITS from "Consumption : 132 - 111 = 21"
    const unitsMatch = text.match(/Consumption\s*:?\s*\d+\s*-\s*\d+\s*=\s*(\d+)/i);
    if (unitsMatch) {
      units = parseInt(unitsMatch[1]);
      console.log(`   Units detected: ${units}`);
    }
    
    // ----- EXTRACT AMOUNT from "Water Charge (Rs) : 2417.03"
    let amountMatch = text.match(/Water Charge\s*\(Rs\)\s*:?\s*([\d,]+\.?\d*)/i);
    if (!amountMatch) {
      // Alternative: "Monthly Charges : Rs. 2417.03"
      amountMatch = text.match(/Monthly Charges\s*:?\s*Rs?\.?\s*([\d,]+\.?\d*)/i);
    }
    if (!amountMatch) {
      // Alternative: "Total Due : Rs. 2358.95"
      amountMatch = text.match(/Total Due\s*:?\s*Rs?\.?\s*([\d,]+\.?\d*)/i);
    }
    if (!amountMatch) {
      // Fallback: "Monthly Bill : Rs. XXXX"
      amountMatch = text.match(/Monthly Bill\s*:?\s*Rs?\.?\s*([\d,]+\.?\d*)/i);
    }
    
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      console.log(`   Amount detected: Rs. ${amount}`);
    }
    
    if (amount > 0) {
      return {
        utility: 'Water',
        month: `${year}-${month}`,
        monthDisplay: monthDisplay,
        year: year,
        monthNum: month,
        units: units,
        amount: amount
      };
    }
    
    console.log("   Could not extract amount from water bill");
    return null;
  }
  
  return null;
};

// Main extraction endpoint
export const extractBillFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;
    let extractedText = "";
    
    console.log(`Processing ${fileType} file...`);
    
    // Handle PDF files
    if (fileType === 'application/pdf') {
      console.log("📄 Extracting text from PDF...");
      // Dynamic import for pdf-parse (works with ES modules)
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
      console.log(`PDF extracted ${extractedText.length} characters`);
    }
    
    // Handle Images (PNG, JPG, JPEG)
    else if (fileType.startsWith('image/')) {
      console.log("🖼️ Performing OCR on image...");
      const result = await Tesseract.recognize(fileBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      extractedText = result.data.text;
      console.log(`OCR extracted ${extractedText.length} characters`);
    }
    
    else {
      return res.status(400).json({ error: "Unsupported file type. Please upload PDF or image." });
    }
    
    // Parse the extracted text
    const parsedData = parseBillText(extractedText);
    
    if (parsedData) {
      console.log("✅ Successfully parsed bill data:", parsedData);
      res.json({
        success: true,
        extractedText: extractedText.substring(0, 500),
        parsed: parsedData
      });
    } else {
      console.log("❌ Could not parse bill data from extracted text");
      res.json({
        success: false,
        extractedText: extractedText.substring(0, 500),
        error: "Could not extract bill data. Please try copy-paste method."
      });
    }
    
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ error: error.message });
  }
};

export { upload };