
// appsscript.json

{
  "timeZone": "Europe/Dublin",
  "dependencies": {
  },
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/cloud-platform"
  ],
  "runtimeVersion": "V8"
}






// code.js



project = 'REPLACE WITH PROJECT ID';

function auth() {
  cache = CacheService.getUserCache();
  token = ScriptApp.getOAuthToken();  
  cache.put("token", token);
}

function askGemini(inputText) {
  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.0-pro:generateContent`  
  data = {
    contents: {
      role: "USER",
      parts: { "text": inputText }
    },  
    generation_config: {
      temperature: 0.3,
      topP: 1,
      maxOutputTokens: 256        
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
    return answer;
  }
  return "ERROR";
}


function translate(inputText) {
  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.0-pro:generateContent`  
  textWithInstruction = "translate to Spanish: " + inputText;
  data = {
    contents: {
      role: "USER",
      parts: { "text": textWithInstruction }
    },  
    generation_config: {
      temperature: 0.3,
      topP: 1,
      maxOutputTokens: 256        
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
    return answer;
  }
  return "ERROR";
}


function report(inputText) {
  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.0-pro:generateContent`  
  prompt = "Role: You are a financial analyst and you are required to summarise the key insights of given numerical tables.Task: Step 1: List important, but no more than five, highlights from the figures provided in the given table.Step 2:  Write a paragraph about the main movers of net income comparing each year from the figures provided. (For a dataset with three years of figures compare Year 1 to Year 2 and Year 2 to Year 3) Further Instructions: Please write in a professional and business-neutral tone similar to the financial times.The summary should only be based on the information presented in the table and only contain facts form that table."
  text = prompt + inputText;
  data = {
    contents: {
      role: "USER",
      parts: { "text": text }
    },  
    generation_config: {
      temperature: 0.3,
      topP: 1,
      maxOutputTokens: 2000        
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
    return answer;
  }
  return "ERROR";
}

function reported(cellRange) {
  const sheet = SpreadsheetApp.getActiveSheet();
  // Get the values from the cell range
  const values = sheet.getRange(cellRange).getValues();

  // Check if the range is empty or doesn't have headers
  if (!values || !values.length || !values[0].length) {
    return "ERROR: Empty range or missing headers";
  }

  // Build the markdown table header row
  let markdownTable = "|";
  for (const header of values[0]) {
    markdownTable += ` ${header} |`;
  }
  markdownTable += "\n";

  // Add a separator line
  markdownTable += "|";
  for (let i = 0; i < values[0].length; i++) {
    markdownTable += " --- |";
  }
  markdownTable += "\n";

  // Build the remaining rows
  for (let i = 1; i < values.length; i++) {
    markdownTable += "|";
    for (const value of values[i]) {
      markdownTable += ` ${value} |`;
    }
    markdownTable += "\n";
  }

  // Call the original translate function with the markdown table
  return report(markdownTable);
}
