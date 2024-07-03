function fetchBigQueryData() {
  var projectId = 'YOURPROJECTHERE';
  var query = 'SELECT unique_key,CAST(created_date AS DATE) AS created_date, status, status_notes, agency_name, category, complaint_type, source FROM `bigquery-public-data.san_francisco_311.311_service_requests` Where extract(year from created_date) = 2024 LIMIT 100;'
  
  //'SELECT * FROM `bigquery-public-data.san_francisco_311.311_service_requests` where agency_name = "Muni Feedback Received Queue" LIMIT 100';

  var request = {
    query: query,
    useLegacySql: false
  };

  var queryResults = BigQuery.Jobs.query(request, projectId);
  var jobId = queryResults.jobReference.jobId;

  var results = BigQuery.Jobs.getQueryResults(projectId, jobId);
  var rows = results.rows;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RawData');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('RawData');
  } else {
    sheet.clear();
  }

  // Set headers
  var headers = results.schema.fields.map(field => field.name);
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#000000').setFontColor('#FFFFFF').setFontWeight('bold');


  // Set Rows
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i].f.map(cell => cell.v);
    sheet.appendRow(row);
  }
}

function formatReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rawSheet = ss.getSheetByName('RawData');
  var reportSheet = ss.getSheetByName('Report') || ss.insertSheet('Report');
  reportSheet.clear();

  var rawData = rawSheet.getDataRange().getValues();

  // Adding KPI boxes
  var data = rawData.slice(1);
  var totalRequests = data.length;
  var closedRequests = data.filter(row => row[2] === 'Closed').length;
  var openRequests = totalRequests - closedRequests;

  // Adding KPIs with professional styling
  var kpiHeaders = [['Report Metrics']];
  var kpis = [
    ['Total Requests', totalRequests],
    ['Closed Requests', closedRequests],
    ['Open Requests', openRequests]
  ];

  // Append KPI headers
  reportSheet.getRange(1, 1, 1, 1).setValues(kpiHeaders);
  var headerRange = reportSheet.getRange(1, 1, 1, 1);
  headerRange.setBackground('#26428b').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(14);
  headerRange.mergeAcross();

  // Append KPI values
  reportSheet.getRange(2, 1, kpis.length, 2).setValues(kpis);
  var kpiRange = reportSheet.getRange(2, 1, kpis.length, 2);
  kpiRange.setBackground('#f1f1f1').setFontColor('#000000').setFontWeight('bold').setFontSize(12);

  // Adding some space before the table
  reportSheet.appendRow([' ']);
  // Add data refreshed timestamp
  reportSheet.appendRow(['']);
  var timestamp = new Date();
  reportSheet.appendRow(['Data refreshed on:', timestamp]);
  var timestampRange = reportSheet.getRange(reportSheet.getLastRow(), 1, 1, 2);
  timestampRange.setBackground('#f1f1f1').setFontColor('#000000').setFontWeight('bold');
  reportSheet.appendRow(['Open Requests']);

 // Filter specific columns to include in the detailed table
  // Specify the columns you want to include by their indices
  // Filter rows based on a specific column value (e.g., only open requests)
  var filteredRows = data.filter(row => row[2] === 'Open');

  // Specify the columns you want to include by their indices
  var columnsToInclude = [1, 2, 4, 5, 6]; 

  var filteredHeaders = columnsToInclude.map(index => rawData[0][index]);
  var filteredData = filteredRows.map(row => columnsToInclude.map(index => row[index]));

  // Append filtered data headers and rows
  reportSheet.appendRow(filteredHeaders);
  reportSheet.getRange(reportSheet.getLastRow() + 1, 1, filteredData.length, filteredData[0].length).setValues(filteredData);

  // Styling the detailed report header
  var detailHeaderRange = reportSheet.getRange(reportSheet.getLastRow() - filteredData.length - 1, 1, 1, filteredData[0].length);
  detailHeaderRange.setBackground('#26428b').setFontColor('#FFFFFF').setFontWeight('bold');

   // Delete "Sheet1" if it exists
  var sheetToDelete = ss.getSheetByName('Sheet1');
  if (sheetToDelete) {
    ss.deleteSheet(sheetToDelete);
    }
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Menu')
    .addItem('Refresh Data', 'generateReport')
    .addToUi();
}

function generateReport() {
  fetchBigQueryData();
  formatReport();
}
