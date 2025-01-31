const axios = require('axios'); // Axios for making HTTP requests
const fs = require('fs'); // File system module for file operations

let studentID = 'M00826931';

// URL where student data is available
let url = 'https://y2gtfx0jg3.execute-api.us-east-1.amazonaws.com/prod/';

// Fetch student data from the specified URL
axios.get(url + studentID)
    .then(response => {
        // Extract all data from the response
        let allData = response.data;

        // Separate train and test data
        let trainData = {
            start: allData.start,
            target: allData.target.slice(0, 400)
        };

        // Calculate start date for the test data
        let startDate = new Date(allData.start);
        startDate.setHours(startDate.getHours() + (allData.target.length - 100));
        let formattedStart = startDate.toISOString().slice(0, 19).replace('T', ' ');

        // Prepare data for endpoint (last 100 data points)
        let endpointData = {
            start: formattedStart,
            target: allData.target.slice(allData.target.length - 100, allData.target.length)
        };

        // Convert data to JSON strings
        let trainJsonData = JSON.stringify(trainData);
        let testJsonData = JSON.stringify(allData);
        let testEndpointData = JSON.stringify(endpointData);

        // Write JSON data to files
        fs.writeFileSync('synthetic_data_train.json', trainJsonData);
        fs.writeFileSync('synthetic_data_test.json', testJsonData);
        fs.writeFileSync('synthetic_data_endpoint.json', testEndpointData);

        console.log('Done');
    })
    .catch(error => {
        // Handle errors during data fetching
        console.error('Error fetching student data:', error);
    });
