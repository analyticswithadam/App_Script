// Appscript.json

{
  "timeZone": "Europe/Dublin",
  "dependencies": {
    "enabledAdvancedServices": [{
      "userSymbol": "BigQuery",
      "serviceId": "bigquery",
      "version": "v2"
    }]
  },
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": ["https://www.googleapis.com/auth/spreadsheets.currentonly", "https://www.googleapis.com/auth/script.external_request", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/presentations"],
  "runtimeVersion": "V8"
}




// Script.JS

project = 'GoogleCloudProjectNameHERE';

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
  
  var values = sheet.getRange("C5:C11").getValues().flat();
  var validationRange = sheet.getRange("E5:E11");

  var validationValues = [];
  var validationBackgrounds = [];
  var errorMessage = "";
  
  for (var i = 0; i < 7; i++) {
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
    var5: values[4],
    var6: values[5],
    var7: values[6]
  };
}


function fetchBigQueryData() {
  var input = pullVariables()
  Logger.log(input);
  var projectId = project;

  var query = `SELECT extract(year from date) as year, category_name, item_description, vendor_name, COUNT(*) as num_trans, ROUND(SUM(sale_dollars),2) as sales_in_usd, ROUND(SUM(state_bottle_cost * bottles_sold),2) as cost FROM \`bigquery-public-data.iowa_liquor_sales.sales\` Where EXTRACT(year FROM date) IN (${input.var1}, ${input.var2}) AND category_name IN ('${input.var3}','${input.var4}','${input.var5}') AND city = '${input.var6}' Group by ALL Order BY 5 desc;`
 
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
  var aggSheet = ss.getSheetByName('Category');
  var aggSheet2 = ss.getSheetByName('Vendor');
  var reportSheet = ss.getSheetByName('Output') || ss.insertSheet('Output');
  reportSheet.clear();

  var aggData = aggSheet.getDataRange().getValues(); // Pivot Data
  var aggData2 = aggSheet2.getDataRange().getValues(); // Pivot Data

  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent`  
  data = {
    contents: {
      role: "USER",
      parts: { "text": `${input.var7}` + ' Only reffer to the data provided do not make anything up. This is the Aggregated data:'+ aggData2 + '---- This is the Full Data:' + aggData}
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
    var commentary = reportSheet.getRange("J3");
    commentary.setValue(answer);
    commentary.setWrap(true);
  }
  else{
  Logger.log("ERROR");
  }
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Run Report')
    .addItem('Refresh Data', 'fetchBigQueryData')
    .addItem('Refresh Report and Transfer to Chart', 'generateReport')
    .addItem('Refresh Report', 'formatReport')
    .addItem('Authenticate', 'auth')
    .addItem('Transfer Charts to Deck','transferCharts')
    .addToUi();
}


function transferCharts() {
  // Open the Google Slides deck where you want to transfer the charts
  var slidesDeck = SlidesApp.openById("1zS2VBQwungFdf-pktG1qdNiHzmeXPlgTO18CKe903bU");

  // Open the 'Output' sheet from the active Google Sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Output');

  // Get the first slide
  var slide = slidesDeck.getSlides()[0];

  // Clear existing images and text boxes on the slide except the header icon
  var elements = slide.getPageElements();
  elements.forEach(function(element) {
    var topPosition = element.getTop();

    if (element.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
      // Remove images that are below the header (assuming header is within top 150 pixels)
      if (topPosition > 99) {
        element.remove();
      }
    } else if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
      // Remove text boxes that are below the header
      if (topPosition > 99) {
        element.remove();
      }
    }
  });

  // Get the chart from the sheet and insert it into the slide
  var charts = sheet.getCharts();
  if (charts.length > 0) {
    var chart = charts[0]; // Get the first chart (assuming it's the only one)

    // Get the chart as a blob image
    var image = chart.getAs('image/png');

    // Insert the image into the slide
    slide.insertImage(image).setLeft(30)
         .setTop(100)
         .setWidth(400)
         .setHeight(250);;
  } else {
    Logger.log('No charts found on the sheet.');
  }

  // Get the narrative from cell J3
  var narrative = sheet.getRange('J3').getValue();

  // Insert the narrative into the slide as a text box
  if (narrative) {
    var textBox = slide.insertTextBox(narrative);
    // Adjust the position and size of the text box as needed
    textBox.setLeft(450);
    textBox.setTop(140);
    textBox.setWidth(200);
    textBox.setHeight(150);

    // Optional: Set text style
    var textRange = textBox.getText();
    textRange.getTextStyle().setFontSize(8);
  } else {
    Logger.log('No narrative found in cell J3.');
  }

  // Show a confirmation message
  SpreadsheetApp.getUi().alert('Chart and Narrative Transferred to Slide 1');
}

function generateReport() {
  auth();
  fetchBigQueryData();
  formatReport();
  transferCharts();
}
