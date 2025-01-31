import axios from 'axios';
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime"; // Importing AWS SDK modules
import Plotly from 'plotly';

let studentID = 'M00826931';

// URL where student data is available
let url = 'https://y2gtfx0jg3.execute-api.us-east-1.amazonaws.com/prod/';

const PLOTLY_USERNAME = 'a.hobass';
const PLOTLY_KEY = '2cJ1CbTVh80fLUNoPHr6';

let plotly = Plotly(PLOTLY_USERNAME, PLOTLY_KEY); // Initialize Plotly with authentication details

// Create SageMakerRuntimeClient
const client = new SageMakerRuntimeClient({});

// Data structure to be sent to endpoint
const endpointData = {
    "instances": [{
        "start": "2024-03-21 06:00:00",
        "target": [73.36924099661353,76.45868038048944,75.58449655948642,77.15615623393015,75.74495429806534,73.8088086918108,76.93436612258496,80.86088188919727,79.95387891347539,81.71279492544078,81.16928101946628,83.84567950275608,88.7233011108118,87.6522093005888,86.26663553073693,88.62461053943252,91.20704207200485,86.88437206689208,81.61420768776253,81.97947983153948,83.92662358973935,83.36640485815778,80.57122458284503,81.35971533390905,77.97547530678052,74.64511167441454,80.3727682036535,77.11163938248887,78.1329873509062,83.8725445270531,85.48370826437062,85.28108339415391,81.3270747250054,85.0004051930628,90.82747137879596,90.86984261235904,87.81212470812825,92.15530056905406,94.5739674180872,89.21457336963176,93.87402089074841,89.86932322207434,92.76166010121435,89.66193501867424,84.38407712935337,80.92697733117792,84.26460105973557,80.36430959386577,78.04278345176311,80.6114439774182,85.11616066564305,79.97232163365842,85.70048653424475,80.39448687480755,81.7164167448566,87.92765946535016,89.31769933175708,90.6240010345292,91.08629965488305,90.0341314947018,97.04410399231628,89.36570533390818,97.5185097321324,92.18081239152262,92.27867109218533,95.43808244811844,94.71510617355918,94.87861494040519,89.24748871457689,91.4579151085551,87.02236741695307,88.38735519073822,85.37969556956396,85.25980051210145,83.90944785663822,82.65422762426313,87.81945143377554,82.46005468636343,88.84071789627674,90.54608009691886,88.11691761147871,95.24702156582886,98.26717666393299,95.30336082237552,95.10775502936629,101.18565084647507,100.68031780852564,98.87827146564155,99.96300322603717,93.60535937090985,97.69078128180377,96.06025919336665,88.69713693572443,87.33621075985624,90.68068415555112,86.21387753363985,89.60834106315106,91.39711103399127,86.64852827082925,90.21868634522573]
    }],
    "configuration": {
        "num_samples": 50,
        "output_types": ["mean", "quantiles", "samples"],
        "quantiles": ["0.1", "0.9"]
    }
};

/**
 * Calls the SageMaker endpoint and retrieves predictions.
 * @returns {Promise<Object>} The predictions from the SageMaker endpoint.
 */
async function invokeEndpoint() {
    // Create and send command with data
    const command = new InvokeEndpointCommand({
        EndpointName: "SyntheticFinalModel",
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    });
    const response = await client.send(command);

    // Parse response data
    let predictions = JSON.parse(Buffer.from(response.Body).toString('utf8'));

    return predictions; // Return predictions
}

/**
 * Lambda handler function for processing the request.
 * @param {Object} event - The event data.
 * @returns {Object} The Lambda function response.
 */
export async function handler(event) {
    let predictions = await invokeEndpoint(); // Invoke endpoint
    let mean = (JSON.stringify(predictions.predictions[0].mean));
    let firstQuantile = (JSON.stringify(predictions.predictions[0].quantiles["0.1"]));
    let lastQuantile = (JSON.stringify(predictions.predictions[0].quantiles["0.9"]));

    try {
        // Get synthetic data
        let yValues = (await axios.get(url + studentID)).data.target;
        let yValues1 = mean.split(",");
        let yValues2 = firstQuantile.split(",");
        let yValues3 = lastQuantile.split(",");

        // Add basic X values for plot
        let xValues = [];
        let xValues1 = [];
        let xValues2 = [];
        let xValues3 = [];

        for (let i = 0; i < yValues.length; ++i) {
            xValues.push(1 + i);
        }

        for (let i = 0; i < yValues1.length; ++i) {
            xValues1.push(500 + i);
            xValues2.push(500 + i);
            xValues3.push(500 + i);
        }

        // Call function to plot data
        let plotResult = await plotData(studentID, xValues, yValues, xValues1, yValues1, xValues2, yValues2, xValues3, yValues3);
        console.log("Plot for student '" + studentID + "' available at: " + plotResult.url);

        return {
            statusCode: 200,
            body: "Ok"
        };
    } catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Error plotting data for student ID: " + studentID
        };
    }
}

/**
 * Plots the specified data.
 * @param {string} studentID - The ID of the student.
 * @param {number[]} xValues - The X values for the plot.
 * @param {number[]} yValues - The Y values for the original data.
 * @param {number[]} xValues1 - The X values for the mean predicted data.
 * @param {number[]} yValues1 - The Y values for the mean predicted data.
 * @param {number[]} xValues2 - The X values for the first quantile predicted data.
 * @param {number[]} yValues2 - The Y values for the first quantile predicted data.
 * @param {number[]} xValues3 - The X values for the second quantile predicted data.
 * @param {number[]} yValues3 - The Y values for the second quantile predicted data.
 * @returns {Promise<Object>} The plot result.
 */
async function plotData(studentID, xValues, yValues, xValues1, yValues1, xValues2, yValues2, xValues3, yValues3) {
    // Original Data structure for plot
    let studentData = {
        x: xValues,
        y: yValues,
        type: "scatter",
        mode: 'line',
        name: "Original Data",
        marker: {
            color: 'rgb(219, 64, 82)',
            size: 12
        }
    };

    // Mean predicted Data structure for plot
    let meanpredictedData = {
        x: xValues1,
        y: yValues1,
        type: "scatter",
        mode: 'line',
        name: "Mean",
        marker: {
            color: 'rgb(0,0,255)',
            size: 12
        }
    };

    // First Quantile predicted structure for plot
    let firstQuantilepredictedData = {
        x: xValues2,
        y: yValues2,
        type: "scatter",
        mode: 'line',
        name: "First Quantile",
        marker: {
            color: 'rgb(0,155,0)',
            size: 12
        }
    };

    // Second Quantile predicted structure for plot
    let secondQuantilepredictedData = {
        x: xValues3,
        y: yValues3,
        type: "scatter",
        mode: 'line',
        name: "Second Quantile",
        marker: {
            color: 'rgb(240,230,140)',
            size: 12
        }
    };

    let data = [studentData, meanpredictedData, firstQuantilepredictedData, secondQuantilepredictedData]; // Array of data traces for the plot

    // Layout configuration for the plot
    let layout = {
        title: "Synthetic Data for Student " + studentID,
        font: {
            size: 25
        },
        xaxis: {
            title: 'Time (hours)'
        },
        yaxis: {
            title: 'Value'
        }
    };

    let graphOptions = {
        layout: layout,
        filename: "date-axes",
        fileopt: "overwrite"
    };

    // Wrap Plotly callback in a promise
    return new Promise((resolve, reject) => {
        plotly.plot(data, graphOptions, function (err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
}
