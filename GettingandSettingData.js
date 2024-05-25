function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Functions')
    .addItem('Copy Sheet to New Sheet', 'copyToSheet')
    .addItem('Copy Selection to New Sheet', 'copySelectionToSheet')
    .addItem('Copy Sheet from Other Sheet', 'copyFromOther')
    .addToUi();
}

function copySelectionToSheet(){
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const range = sheet.getActiveRange();
    const data = range.getValues();
    const newSheet = ss.insertSheet();
    const newRange = newSheet.getRange(1,1,range.getNumRows(),range.getNumColumns());
    newRange.setValues(data);
}

function copyToSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(1, 1, lastRow, lastColumn); // Define Full Range with Last Row and Last Column 
  let data = range.getValues(); // Get all values 
  Logger.log(data);
  for (var i = 1; i < data.length; i++) {
    if (data[i][6] == 'ARS') {
      data[i][6] = 'Argentine Peso';
    }
  }
  const newSheet = ss.insertSheet();
  const newRange = newSheet.getRange(1,1,range.getNumRows(),range.getNumColumns());
  newRange.setValues(data);
}

function copyFromOther(){
  const id = "1eVS5x6R70XPbqMfBPfyzktdg2AeVTrPMnkfj1gXTHS4";
  const s = SpreadsheetApp.openById(id);
  const sheet = s.getSheets()[0];
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(1, 1, lastRow, lastColumn); // Define Full Range with Last Row and Last Column 
  const data = range.getValues(); // Get all values 
  Logger.log(data);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const newSheet = ss.insertSheet();
  const newRange = newSheet.getRange(1,1,range.getNumRows(),range.getNumColumns());
  newRange.setValues(data);
}
