function transferSpecificChartsToFirstSlide() {
  // Open the Google Slides deck where you want to transfer the charts
  var slidesDeck = SlidesApp.openById("1Ewx4_F84z4BIciNeOg3HpMMRAUs2NHz9_jG4Qp-NIeY");

  // Open the active Google Sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Get all the charts in the sheet
  var charts = sheet.getCharts();

  // Ensure there are enough charts
  if (charts.length < 4) {
    SpreadsheetApp.getUi().alert('Not enough charts found in the sheet.');
    return;
  }

  // Get the first slide
  var slide = slidesDeck.getSlides()[0];

  // Clear existing images on the slide except the header icon
  var elements = slide.getPageElements();
  elements.forEach(function(element) {
    if (element.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
      var position = element.getLeft();
      var size = element.getWidth();

      // Assuming the header icon is smaller and positioned at the top, we keep it
      if (position > 100 || size > 100) { // Adjust these thresholds based on your actual icon's position and size
        element.remove();
      }
    }
  });

  // Define which chart goes where and its exact size on the slide
  var chartMappings = [
    { chartIndex: 2, left: 50, top: 100, width: 150, height: 100 }, //  -> Top left
    { chartIndex: 1, left: 350, top: 100, width: 150, height: 100 }, // -> Top right
    { chartIndex: 0, left: 50, top: 200, width: 250, height: 150 }, //  -> Bottom left
    { chartIndex: 3, left: 350, top: 200, width: 250, height: 150 } //  -> Bottom right
  ];

  /**
   * This code iterates over each chart mapping in the chartMappings array. For each mapping, it:
   Retrieves the corresponding chart from the charts array.
   Converts the chart into a PNG image.
   Inserts the image onto the slide at a specific position (left, top) and size (width, height) as defined in the chartMappings array.
   The result is that each chart is placed on the slide exactly where and how you want it, based on the parameters defined in chartMappings.
   */

  chartMappings.forEach(function(mapping) {
    var chart = charts[mapping.chartIndex];
    var chartImage = chart.getAs('image/png');
    
    // Insert the chart image into the slide at the specified position and size
    slide.insertImage(chartImage)
         .setLeft(mapping.left)
         .setTop(mapping.top)
         .setWidth(mapping.width)
         .setHeight(mapping.height);
  });

  // Show a confirmation message
  SpreadsheetApp.getUi().alert('Charts Transferred to Slide 1');
}
