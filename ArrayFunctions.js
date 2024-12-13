function basicArrayFunctions(){
  let fruits = ["Apple", "Banana", "Orange"];
  Logger.log(fruits);
  let array_len = fruits.length;
  Logger.log("Number of fruits: " + array_len);

  // pop() removes the last element and returns it
  let removedFruit = fruits.pop();
  Logger.log("Removed fruit: " + removedFruit);  // Logs: "Removed fruit: Orange"
  Logger.log("Fruits after pop: " + fruits);     // Logs: "Fruits after pop: Apple,Banana"

  // Add a new elements
  fruits.push("Grape");
  Logger.log("Fruits unsorted: " + fruits);
  fruits.sort(); // Sort Function
  Logger.log("Fruits sorted: " + fruits); 
  fruits.reverse(); // Reverse Sort Functions
  Logger.log("Fruits reversed: " + fruits);

}

// Function the Arrays of Arrays pulled from a Google Sheet
function sheetArrayFunctions() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Raw Data");
  let data = sheet.getDataRange().getValues(); // dynamically detects the data range and returns the value
  Logger.log(data);
  let header = data.shift(); // Shift Removed the first element from an Array and Returns it
  Logger.log(header);
  Logger.log(data);

  // Filter Function
  let fruitsOnly = data.filter(
    row => row[1] === "Fruit");
  Logger.log(fruitsOnly);

  // Map Function to each row
 let updatedData = fruitsOnly.map(row => {
   row[2] *= 1.10; // Increase price by 10%
   return row;
  });
  Logger.log(updatedData);

  // ForEach - Perform Operation on each row 
  updatedData.forEach(row => row[1] = "fruits");

  // Insert header row back at the start
  updatedData.unshift(header);

  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportSheet = ss.getSheetByName("Fruit Report");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("Fruit Report");
  }

  // Clear old data and write the new data
  reportSheet.clear();
  reportSheet.getRange(1, 1,  updatedData.length, updatedData[0].length).setValues(updatedData);

  Logger.log("Report generated successfully!");
}

/**
 * Sample of Data 
 * 
  Product Name	Category	Price	Stock	Supplier
  Apple	Fruit	1	50	FreshFarms Ltd
  Banana	Fruit	0.8	100	TropicalCo
  Bell Pepper	Vegetable	1.4	25	FreshFarms Ltd
  Blueberry	Fruit	2.5	20	FreshFarms Ltd
  Broccoli	Vegetable	1.2	50	GreenLeaf Farms
  Carrots	Vegetable	0.9	80	GreenLeaf Farms
  Dish Soap	Household	1.5	40	HomeEssentials Inc
 * 
 
 */
