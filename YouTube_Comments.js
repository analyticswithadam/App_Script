//"oauthScopes": ["https://www.googleapis.com/auth/spreadsheets.currentonly", "https://www.googleapis.com/auth/script.external_request", "https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/documents"]

function getYouTubeComments() {
  const apiKey = 'ENTER YOUTUBE API KEY'; // Replace with your API key
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Read and trim the video ID from cell B3
  let videoId = sheet.getRange('B3').getValue().trim(); // Remove any whitespace and ensure no extra characters
  
  // Ensure videoId does not contain any extra characters like backticks or quotes
  videoId = videoId.replace(/[`'"]/g, ""); // Removes any backticks, single or double quotes if present
  
  const maxResults = 100; // Number of comments to fetch in one API call (max 100)
  let nextPageToken = ''; // Used for pagination
  let comments = [];
  
  // Clear content from row 5 downwards
  sheet.getRange('4:5000').clearContent(); // Adjust the range as needed
  
  do {
    // Construct the API URL
    let url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&key=${apiKey}&pageToken=${nextPageToken}`;
    
    // Fetch the data from YouTube API
    let response = UrlFetchApp.fetch(url);
    let result = JSON.parse(response.getContentText());
    
    // Extract comments and push to the array
    result.items.forEach(item => {
      let comment = item.snippet.topLevelComment.snippet.textDisplay;
      let author = item.snippet.topLevelComment.snippet.authorDisplayName;
      let publishedAt = item.snippet.topLevelComment.snippet.publishedAt;
      comments.push([author, comment, publishedAt]);
    });
    
    // Set nextPageToken for pagination
    nextPageToken = result.nextPageToken;
    
  } while (nextPageToken);

  // Log the comments or insert into Google Sheets
  Logger.log(comments);
  insertCommentsToSheet(comments);
}

// Helper function to insert comments into Google Sheets
function insertCommentsToSheet(comments) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Insert header at row 5 and apply formatting
  const headerRange = sheet.getRange(5, 1, 1, 3);
  headerRange.setValues([['Author', 'Comment', 'Published At']]);
  headerRange.setFontWeight('bold'); // Make headers bold
  headerRange.setBackground('#f0f0f0'); // Light grey background for headers
  headerRange.setHorizontalAlignment('center'); // Center align headers
  
  // Insert comments starting from row 5
  if (comments.length > 0) {
    sheet.getRange(6, 1, comments.length, comments[0].length).setValues(comments);
  }
}

function auth() {
  cache = CacheService.getUserCache();
  token = ScriptApp.getOAuthToken();  
  cache.put("token", token);
}

function formatReport() {
  auth();
  project = 'ENTER PROJECT';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aggSheet = ss.getSheetByName('Comments');
  var reportSheet = ss.getSheetByName('Report') || ss.insertSheet('Report');
  reportSheet.clear();

  var aggData = aggSheet.getDataRange().getValues(); 

  cache = CacheService.getUserCache();
  token = cache.get("token");
  if (token == "") return "ERROR";
  Logger.log(`Token = ${token}`);
  url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`  
  data = {
    contents: {
      role: "USER",
      parts: { "text": "I will provide you with YouTube Comments assess the sentiment in 5 sections. 1. Overall Sentiment of the video with positive, negative and neutral proportions stated along with 100 word overall summary. 2: Postive Sentiment - Summarise the positive sentiment and provide three reference tweets. Following the same pattern for Negative and Neutral in 3 and 4. 5: Suggestions for video improvement - Provide three key point to improve the next video we make based on the comments." + ' Do not include the video title. Do not create seperate sections for the reference tweets. Only reffer to the data provided. Full Data:' + aggData}
    },  
    generation_config: {
      temperature: 1,
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
            .setBackground('#1c4587') // Dark Blue 3 background
            .setFontColor('#FFFFFF'); // Set text color to white
    } else if (text.startsWith('## ')) {
        // Handle H2 titles
        text = text.replace('## ', '');
        cell.setValue(text)
            .setFontWeight('bold')
            .setFontSize(16)
            .setBackground('#1c4587') // Dark Blue 3 background
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
            .setBackground('#1c4587') // Dark Blue 3 background
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

