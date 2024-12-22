function onOpen() {
  // Add a custom menu to the spreadsheet.
  SpreadsheetApp.getUi()
      .createMenu('Formatting')
      .addSubMenu(SpreadsheetApp.getUi().createMenu('Apply Style')
          .addItem('Company Style', 'applyCompanyStyle')
          .addItem('McDonalds Style', 'applyMcDonaldsStyle')
          .addItem('Coca-Cola Style', 'applyCocaColaStyle'))
      .addToUi();
}  
  
   function applyCompanyStyle() {
  // Get the active spreadsheet and sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  // Get the last row and column to dynamically select the data range
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  // Define the header range (assuming headers are in the first row)
  const headerRange = sheet.getRange(1, 1, 1, lastColumn);

  // Apply header formatting
  headerRange.setBackground('#e0e0e0'); // Light gray background
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Roboto');
  headerRange.setFontColor('#333333'); // Dark gray text
  headerRange.setHorizontalAlignment('center');

  // Define the data range (excluding headers)
  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);

  // Apply data formatting
  dataRange.setFontFamily('Roboto');
  dataRange.setFontColor('#555555'); // Medium gray text

  // Example of formatting a specific column (e.g., Sales column)
  const salesColumnIndex = 3; // Assuming "Sales" is the 3rd column
  const salesColumnRange = sheet.getRange(2, salesColumnIndex, lastRow - 1, 1);
  salesColumnRange.setNumberFormat('$#,##0.00'); // Currency format

  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, lastColumn);

  Logger.log('Google style formatting applied!');
}

      function applyMcDonaldsStyle() {
  // Get the active spreadsheet and sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  // Get the last row and column
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  // Define the header range
  const headerRange = sheet.getRange(1, 1, 1, lastColumn);

  // Apply header formatting
  headerRange.setBackground('#FFC72C'); // McDonald's Yellow
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial'); // A commonly available bold font
  headerRange.setFontColor('#D9001B'); // McDonald's Red
  headerRange.setHorizontalAlignment('center');

  // Apply red alternating row background for data
  for (let i = 2; i <= lastRow; i++) {
    const rowRange = sheet.getRange(i, 1, 1, lastColumn);
    if (i % 2 === 0) { // Even rows
      rowRange.setBackground('#FFE0B2'); // Lighter Yellow
    } else { // Odd rows
      rowRange.setBackground('#FFF3E0'); // Very light orange/beige
    }
    rowRange.setFontFamily('Arial');
    rowRange.setFontColor('#000000'); // Black text
  }

  // Format the Sales column with a red border
  const salesColumnIndex = 3;
  const salesColumnRange = sheet.getRange(1, salesColumnIndex, lastRow, 1);
  salesColumnRange.setBorder(true, true, true, true, false, false, '#D9001B', SpreadsheetApp.BorderStyle.SOLID_THICK); // Top, left, bottom, right, no inner vertical/horizontal, red, thick

  // Auto-resize columns
  sheet.autoResizeColumns(1, lastColumn);

  Logger.log('McDonald\'s style formatting applied!');
}

function applyCocaColaStyle() {
  // Get the active spreadsheet and sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  // Get the last row and column
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  // Define the header range
  const headerRange = sheet.getRange(1, 1, 1, lastColumn);

  // Apply header formatting - Coca-Cola Red and White
  headerRange.setBackground('#CC0000'); // Coca-Cola Red (approximate)
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial'); // A clean, readable font
  headerRange.setFontColor('white');
  headerRange.setHorizontalAlignment('center');

  // Apply alternating row backgrounds - White and Very Light Gray
  for (let i = 2; i <= lastRow; i++) {
    const rowRange = sheet.getRange(i, 1, 1, lastColumn);
    if (i % 2 === 0) { // Even rows
      rowRange.setBackground('white');
    } else { // Odd rows
      rowRange.setBackground('#f0f0f0'); // Very light gray
    }
    rowRange.setFontFamily('Arial');
    rowRange.setFontColor('black');
  }

  // Format the Sales column (assuming it's the 3rd column) with a subtle red border
  const salesColumnIndex = 3;
  const salesColumnRange = sheet.getRange(1, salesColumnIndex, lastRow, 1);
  salesColumnRange.setBorder(false, false, false, true, false, false, '#CC0000', SpreadsheetApp.BorderStyle.SOLID_THIN); // Right border, thin red

  // Auto-resize columns
  sheet.autoResizeColumns(1, lastColumn);

  Logger.log('Coca-Cola style formatting applied!');
}
