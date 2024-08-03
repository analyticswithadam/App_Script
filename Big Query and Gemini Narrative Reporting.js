project = 'ADD Google Cloud PROJECT NAME HERE';

function auth() {
  cache = CacheService.getUserCache();
  token = ScriptApp.getOAuthToken();  
  cache.put("token", token);
}

function fetchBigQueryData() {
  var projectId = 'superdataworld';
  var query = 'SELECT category,SUM(CASE WHEN Year_Created = 2021 THEN count ELSE 0 END) AS Count_2021, SUM(CASE WHEN Year_Created = 2022 THEN count ELSE 0 END) AS Count_2022,SUM(CASE WHEN Year_Created = 2023 THEN count ELSE 0 END) AS Count_2023,FROM(SELECT category,SOURCE,EXTRACT(YEAR FROM created_date) AS Year_Created,COUNT(unique_key) AS count FROM `bigquery-public-data.san_francisco_311.311_service_requests`WHERE EXTRACT(YEAR FROM created_date) IN (2021, 2022, 2023) GROUP BY ALL) GROUP BY ALL ORDER BY category; '
 
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
  var values = rows.map(row => row.f.map(cell => cell.v));
  // Get the next empty row in the sheet
  var lastRow = sheet.getLastRow();
  // Append all rows at once
  if (values.length > 0) {
    sheet.getRange(lastRow + 1, 1, values.length, values[0].length).setValues(values);
 }
}

function formatReport() {
  auth();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rawSheet = ss.getSheetByName('RawData');
  var reportSheet = ss.getSheetByName('Report') || ss.insertSheet('Report');
  reportSheet.clear();

  var rawData = rawSheet.getDataRange().getValues();

  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent`  
  data = {
    contents: {
      role: "USER",
      parts: { "text": "You are a public policy expert. I providing you with three years of 311 service request data from San Francisco. Write a report commenting on improvements and negative movements from the period in question, include the absolute and percentage movement of categories in the discussion, do not include a table. Finish with a five point plan of where we need to put resources. Focus only on the data provided and double check calculations" + rawData}
    },  
    generation_config: {
      temperature: 0.3,
      topP: 1,
      maxOutputTokens: 1000        
    }
  }
  const options = {
    method: "post",
    contentType: 'application/json',   
    headers: {
     Authorization: `Bearer ${token}`,
    },
    payload: JSON.stringify(data)
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() == 200) {
    json = JSON.parse(response.getContentText());
    answer = json.candidates[0].content.parts[0].text;
    Logger.log(answer);

// Format the Markdown in Sheets     
var lines = answer.split('\n');
  var rowIndex = 1;

  lines.forEach(function(line) {
    var cell = reportSheet.getRange(rowIndex, 1);
    var text = line.trim();
    
    if (text.startsWith('### ')) {
      // Handle H3 titles
      text = text.replace('### ', '');
      cell.setValue(text)
          .setFontWeight('bold')
          .setFontSize(14)
          .setBackground('#efefef');
    } else if (text.startsWith('## ')) {
      // Handle H2 titles
      text = text.replace('## ', '');
      cell.setValue(text)
          .setFontWeight('bold')
          .setFontSize(16)
          .setBackground('#efefef');
     } 
      else if (text.startsWith('* ')) {
      // Handle H2 titles
      text = text.replace('* ', '');
      text = text.replace('**', '');
      text = text.replace('**', '');
      cell.setValue(text)
    }
     else if (text.startsWith('**')) {
      // Handle H2 titles
      text = text.replace('**', '');
      text = text.replace('**', '');
      cell.setValue(text)
          .setFontWeight('bold')
          .setFontSize(12)
          .setBackground('#efefef');
    } else if (text.startsWith('# ')) {
      // Handle H1 titles
      text = text.replace('# ', '');
      cell.setValue(text)
          .setFontWeight('bold')
          .setFontSize(18)
          .setBackground('#CFE2F3');
    } else {
      // Handle regular text with potential bold sections
      var richTextBuilder = SpreadsheetApp.newRichTextValue().setText(text);
      var regex = /\*\*(.*?)\*\*/g;
      var match;
      var lastIndex = 0;
      
      while ((match = regex.exec(text)) !== null) {
        richTextBuilder.setTextStyle(match.index, match.index + match[0].length, 
                                     SpreadsheetApp.newTextStyle().setBold(true).build());
        lastIndex = match.index + match[0].length;
      }
      
      // Remove markdown bold indicators
      text = text.replace(/\*\*/g, '');
      richTextBuilder.setText(text);
      
      cell.setRichTextValue(richTextBuilder.build());

    }
    
    cell.setWrap(true);
    rowIndex++;
  });

  // Set column width and enable text wrapping
  reportSheet.setColumnWidth(1, 1100);
  reportSheet.getRange(1, 1, rowIndex, 1).setWrap(true);

  // Add some indent to the left edge of the page
  reportSheet.insertColumnBefore(1);
  reportSheet.setColumnWidth(1, 50); // Add a narrow column for left margin

  // Autofit rows
  reportSheet.autoResizeRows(1, rowIndex);

    return answer;
  }
  Logger.log("ERROR");
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Run Report')
    .addItem('Refresh Data', 'fetchBigQueryData')
    .addItem('Refresh Report and Data', 'generateReport')
    .addItem('Refresh Report', 'formatReport')
    .addItem('Authenticate', 'auth')
    .addToUi();
}

function generateReport() {
  auth();
  fetchBigQueryData();
  formatReport();
}
