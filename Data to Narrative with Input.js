project = 'ENTER GOOGLE CLOUD PROJECT ID HERE';

function auth() {
  cache = CacheService.getUserCache();
  token = ScriptApp.getOAuthToken();  
  cache.put("token", token);
}

function pullVariables() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Input");
  
  if (!sheet) {
    throw new Error("Sheet 'Input' not found");
  }
  
  var values = sheet.getRange("C5:C9").getValues().flat();
  var validationRange = sheet.getRange("E5:E9");

  var validationValues = [];
  var validationBackgrounds = [];
  var errorMessage = "";
  
  for (var i = 0; i < 5; i++) {
    if (values[i]) {
      validationValues.push(["Valid input provided"]);
      validationBackgrounds.push(["#b6d7a8"]); // Light green
    } else {
      validationValues.push(["Error: Input not provided"]);
      validationBackgrounds.push(["#ea9999"]); // Light red
      errorMessage += `Input Field ${i + 1} is empty. `;
    }
  }
  
  validationRange.setValues(validationValues);
  validationRange.setBackgrounds(validationBackgrounds);
  
  if (errorMessage) {
    throw new Error(errorMessage);
  }
  
  return {
    var1: values[0],
    var2: values[1],
    var3: values[2],
    var4: values[3],
    var5: values[4]
  };
}


function fetchBigQueryData() {
  var input = pullVariables()
  Logger.log(input);
  var projectId = project;

  var query = `SELECT extract(year from date) as year, category_name, item_description, vendor_name, COUNT(*) as num_trans, ROUND(SUM(sale_dollars),2) as sales_in_usd, ROUND(SUM(state_bottle_cost * bottles_sold),2) as cost FROM \`bigquery-public-data.iowa_liquor_sales.sales\` Where EXTRACT(year FROM date) IN (${input.var1}, ${input.var2}) AND category_name = '${input.var3}' AND city = '${input.var4}' Group by ALL Order BY 5 desc;`
 
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
  var input = pullVariables()
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rawSheet = ss.getSheetByName('RawData');
  var aggSheet = ss.getSheetByName('Pivot');
  var reportSheet = ss.getSheetByName('Report') || ss.insertSheet('Report');
  reportSheet.clear();

  var rawData = rawSheet.getDataRange().getValues(); // Unpivoted Data - Not Using below
  var aggData = aggSheet.getDataRange().getValues(); // Pivot Data

  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`  
  data = {
    contents: {
      role: "USER",
      parts: { "text": `${input.var5}` + ' Only reffer to the data provided do not make anything up. Full Data:' + aggData}
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
            .setBackground('#083763') // Dark Blue 3 background
            .setFontColor('#FFFFFF'); // Set text color to white
    } else if (text.startsWith('## ')) {
        // Handle H2 titles
        text = text.replace('## ', '');
        cell.setValue(text)
            .setFontWeight('bold')
            .setFontSize(16)
            .setBackground('#083763') // Dark Blue 3 background
            .setFontColor('#FFFFFF'); // Set text color to white
    } else if (text.startsWith('* ')) {
        // Handle bullet points
        text = text.replace('* ', '');
        text = text.replace(/\*\*/g, ''); // Remove all '**'
        cell.setValue(text);
    } else if (text.startsWith('**')) {
        // Handle bold text
        text = text.replace(/\*\*/g, ''); // Remove all '**'
        cell.setValue(text)
            .setFontWeight('bold')
            .setFontSize(12)
            .setBackground('#083763') // Dark Blue 3 background
            .setFontColor('#FFFFFF'); // Set text color to white
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
            richTextBuilder.setTextStyle(match.index, match.index + match[1].length, 
                                         SpreadsheetApp.newTextStyle().setBold(true).build());
            lastIndex = match.index + match[0].length;
        }
        
        // Remove markdown bold indicators
        text = text.replace(/\*\*/g, '');
        richTextBuilder.setText(text);
        
        cell.setRichTextValue(richTextBuilder.build());
    }
    rowIndex++;
});

  // Set column width and enable text wrapping
  reportSheet.setColumnWidth(1, 1250);
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
