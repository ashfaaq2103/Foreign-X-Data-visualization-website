// Function to display numerical data and prediction data graph
// Parameters:
// - numDates: Array of dates for numerical data
// - num: Array of numerical data values
// - predictionDates: Array of dates for predicted data
// - prediction: Array of predicted data values
function displayGraph(
  numDates,
  num,
  predictionDates,
  prediction,
) {
  // Layout options for the graph
  layout = {
    plot_bgcolor: "#111111",
    paper_bgcolor: "#111111",
    xaxis: {
      gridcolor: "grey", // Set grid line color for x-axis
      title: {
        font: {
          color: "grey", // Set axis title color
        },
      },
      tickfont: {
        // Set color for axis tick labels
        color: "white",
      },
    },
    yaxis: {
      gridcolor: "grey", // Set grid line color for y-axis
      title: {
        font: {
          color: "grey", // Set axis title color
        },
      },
      tickfont: {
        // Set color for axis tick labels
        color: "white",
      },
    },
    showlegend: true,
    legend: {
      font: {
        color: "white", // Change the font color of the legend text
      },
    },
  };
  // Data for the graph
  var data = [
    {
      x: numDates,
      y: num,
      type: "scatter", // Change to 'line' for a line plot
      mode: "line",
      name: "Original Data",
      marker: {
        color: "yellow", // Set marker color (optional)
        font: 8,
      },
    },
    {
      x: predictionDates,
      y: prediction,
      type: "scatter", // Change to 'line' for a line plot
      mode: "line",
      name: "Predicted Data",
      marker: {
        color: "red", // Set marker color (optional)
        font: 10,
      },
    },
  ];

  // Plot the graph
  Plotly.newPlot("grapDiv", data, layout);
}

// Function to display a pie chart
// Parameters:
// - sentimentData: Array containing sentiment counts (positive, negative, neutral) for different currencies
function displayPie(sentimentData) {
  // Get the element to render the pie chart
  var pieDiv = document.getElementById("pie_chart");

  // Define the trace for the pie chart
  var traceA = {
    type: "pie",
    values: sentimentData,
    labels: ["Positive", "Negative", "Neutral"],
  };

  // Data for the pie chart
  var data = [traceA];

  // Layout options for the pie chart
  var layout = {
    paper_bgcolor: "#111111",
  };

  // Plot the pie chart
  Plotly.plot(pieDiv, data, layout);
}

// WebSocket connection to server
let connection = new WebSocket(
  "wss://t1iwgofpwd.execute-api.us-east-1.amazonaws.com/production/"
);

// When connection is established
connection.onopen = function (event) {
  // Send message to server
  let msgObject = {
    action: "sendMessage", // Used for routing in API Gateway
  };
  // Send message
  connection.send(JSON.stringify(msgObject));
};

// Process incoming messages from the server
connection.onmessage = function (msg) {
  processData(msg.data);
  console.log("message received"); 
};


// Function to process data received from the server
// Parameters:
// - data: JSON data received from the server
function processData(data) {
  // Parse the received JSON string 
  const combinedData = JSON.parse(data);

  // Initialize arrays to store data
  let predictionDates = [];
  let predictionJPY = [];
  let predictionCAD = [];
  let predictionEUR = [];
  let predictionMUR = [];
  let predictionGBP = [];

  let numDates = [];
  let numJPY = [];
  let numCAD = [];
  let numEUR = [];
  let numMUR = [];
  let numGBP = [];

  let sentimentData = [];

  // Initialize sentiment count arrays for each currency
  let sentimentEUR = [0, 0, 0]; // Initialize with 0 counts for positive, negative, neutral
  let sentimentCAD = [0, 0, 0];
  let sentimentMUR = [0, 0, 0];
  let sentimentGBP = [0, 0, 0];
  let sentimentJPY = [0, 0, 0];

  // Loop through each element in the combined data array
  combinedData.forEach((element) => {
    const title = element.title;
    const elementData = element.data;

    // Sort data based on title
    switch (title) {
      case "Prediction Data":
        elementData.sort(
          (a, b) => new Date(a.DateExtracted) - new Date(b.DateExtracted)
        ); // Sort by DateExtracted
        elementData.forEach((prediction) => {
          predictionDates.push(new Date(prediction.DateExtracted));
          predictionJPY.push(prediction.JPY);
          predictionCAD.push(prediction.CAD);
          predictionEUR.push(prediction.EUR);
          predictionMUR.push(prediction.MUR);
          predictionGBP.push(prediction.GBP);
        });
        break;
      case "Numerical Data":
        elementData.sort(
          (a, b) => new Date(a.DateExtracted) - new Date(b.DateExtracted)
        ); // Sort by date 
        elementData.forEach((numericalData) => {
          numDates.push(new Date(numericalData.DateExtracted)); 
          numJPY.push(numericalData.JPY);
          numCAD.push(numericalData.CAD);
          numEUR.push(numericalData.EUR);
          numMUR.push(numericalData.MUR);
          numGBP.push(numericalData.GBP);
        });
        break;
      case "Sentiment Data":
        sentimentData = elementData;
        sentimentData.forEach((sentiment) => {
          const emotion = sentiment.emotion;
          const currency = sentiment.currentCurrency;
          switch (currency) {
            case "EUR":
              if (emotion === "pos") {
                sentimentEUR[0]++; // Increment positive count
              } else if (emotion === "neg") {
                sentimentEUR[1]++; // Increment negative count
              } else {
                sentimentEUR[2]++; // Increment neutral count
              }
              break;
            case "CAD":
              if (emotion === "pos") {
                sentimentCAD[0]++;
              } else if (emotion === "neg") {
                sentimentCAD[1]++;
              } else {
                sentimentCAD[2]++;
              }
              break;
            case "MUR":
              if (emotion === "pos") {
                sentimentMUR[0]++;
              } else if (emotion === "neg") {
                sentimentMUR[1]++;
              } else {
                sentimentMUR[2]++;
              }
              break;
            case "GBP":
              if (emotion === "pos") {
                sentimentGBP[0]++;
              } else if (emotion === "neg") {
                sentimentGBP[1]++;
              } else {
                sentimentGBP[2]++;
              }
              break;
            case "JPY":
              if (emotion === "pos") {
                sentimentJPY[0]++;
              } else if (emotion === "neg") {
                sentimentJPY[1]++;
              } else {
                sentimentJPY[2]++;
              }
              break;
          }
        });
    }
  });
  // Display graph and pie chart with JPY as default 
  displayGraph(numDates, numJPY, predictionDates, predictionJPY);
  displayPie(sentimentJPY);
  // Event listeners for currency selection
  const selectElement = document.getElementById("currencySelect");
  const selectSentimentElement = document.getElementById("currencySelectSentiment");
  
  // Event listeners for when the currency chosen changes on the front end 
  selectSentimentElement.addEventListener("change", function () {
    const selectedSentimentOption = this.options[this.selectedIndex];
    
    // Send sentiment array based on option chosen 
    switch (selectedSentimentOption.text){
      case "JPY":
        displayPie(sentimentJPY);
        break;
      case "GBP":
        displayPie(sentimentGBP);
        break;
      case "MUR":
        displayPie(sentimentMUR);
        break;
      case "EUR":
        displayPie(sentimentEUR);
        break;
      case "CAD":
        displayPie(sentimentCAD);
        break;
    }
  }); 


  // Event listeners for when the currency chosen changes on the front end 
  selectElement.addEventListener("change", function () {

    const selectedOption = this.options[this.selectedIndex];

    // Send dates and numerical arrays based on option chosen 
    switch (selectedOption.text){
      case "JPY":
        displayGraph(numDates, numJPY, predictionDates, predictionJPY); 
        break;
      case "GBP":
        displayGraph(numDates, numGBP, predictionDates, predictionGBP); 
        break;
      case "MUR":
        displayGraph(numDates, numMUR, predictionDates, predictionMUR); 
        break;
      case "EUR":
        displayGraph(numDates, numEUR, predictionDates, predictionEUR); 
        break;
      case "CAD":
        displayGraph(numDates, numCAD, predictionDates, predictionCAD); 
        break;
    }
  });
}
