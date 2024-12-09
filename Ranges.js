function logDataRange() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  let range = sheet.getRange(1,1,11,5);
  let data = range.getValues();

  Logger.log(data)
  Logger.log(data[1][0]);
}

function updatePrices(){
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  let range = sheet.getRange(1,1,11,5);
  let data = range.getValues();

  for(let i = 1; i < data.length; i++){
    data[i][2] = data[i][2] * 1.5;
    data[i][0] = "[New Price] " + data[i][0];
  }

  let dataRange2 = sheet.getRange(14,1,11,5);
  dataRange2.setValues(data);
  Logger.log("Successful Run!")

}
