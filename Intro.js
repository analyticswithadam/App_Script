function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Adams Menu')
    .addItem('Insert the date', 'insertDate')
    .addToUi();
}

function insertDate() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var cell = sheet.getRange('B2');
  cell.setValue(new Date());
}
