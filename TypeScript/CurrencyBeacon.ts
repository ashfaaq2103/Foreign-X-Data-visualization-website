import axios from 'axios'; // Axios will handle HTTP requests to web service
import * as dotenv from 'dotenv'; // Module that reads keys from .env file

// Import AWS SDK modules
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Define interface for the structure of CurrencyBeacon data
interface CurrencyBeacon {
    meta: {
        code: number;
        disclaimer: string;
    };
    response: {
        [date: string]: {
            [currency: string]: number;
        };
    };
}

// Define interface for the structure of the data to be stored in DynamoDB
interface CurrencyData {
    DateExtracted: string;
    CAD: number;
    EUR: number;
    MUR: number;
    GBP: number;
    JPY: number;
}

// Create new DynamoDB client and document client
const client: DynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const documentClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

// Global array to store all the downloaded data
let allData: CurrencyData[] = [];

// Copy variables from .env file into environment variables
dotenv.config();

// Function to process CurrencyBeacon data
/**
 * Processes the CurrencyBeacon data and extracts exchange rate information within the specified date range.
 * @param data The CurrencyBeacon data structure containing exchange rate information for different currencies on specific dates.
 * @param startDate A string representing the start date of the data range to be processed.
 * @param endDate A string representing the end date of the data range to be processed.
 * @returns A Promise that resolves once the data processing is complete.
 */
async function processData(data: CurrencyBeacon, startDate: string, endDate: string): Promise<void> {
    let itemCount: number = 0;

    // Loop through each date in the response
    for (const dt in data.response) {
        if (dt >= startDate && dt <= endDate) { // Check if the date is within the specified range
            const dateCurrency = data.response[dt];
            const rowData: CurrencyData = {
                DateExtracted: dt,
                CAD: dateCurrency["CAD"] || 0,
                EUR: dateCurrency["EUR"] || 0,
                MUR: dateCurrency["MUR"] || 0,
                GBP: dateCurrency["GBP"] || 0,
                JPY: dateCurrency["JPY"] || 0,
            };
            allData.push(rowData); // Add data to the global array
            ++itemCount;
        }
    }
    console.log("Items loaded: " + itemCount);
}

// Function to upload data to DynamoDB
/**
 * Uploads exchange rate data to DynamoDB.
 * @param data An array of CurrencyData objects representing the exchange rate data to be uploaded to DynamoDB.
 * @returns A Promise that resolves once the data upload is complete.
 */
async function uploadToDynamoDB(data: CurrencyData[]): Promise<void> {
    // Loop through each item in the data array
    for (const item of data) {
        // Create PutCommand to store item in DynamoDB
        const command: PutCommand = new PutCommand({
            TableName: "CurrencyTable",
            Item: item, // Item to be stored
        });

        // Store data in DynamoDB and handle errors
        try {
            await documentClient.send(command);
        } catch (err) {
            console.error("ERROR uploading data: " + JSON.stringify(err));
        }
    }
}

// Function to download data from CurrencyBeacon API
async function downloadData(): Promise<void> {
    // Create a new Date object to get the current date and time
    const currentDate: Date = new Date();

    // Convert the current date to a string to extract only the date part (YYYY-MM-DD)
    const currentDateString: string = currentDate.toISOString().split('T')[0];

    // Define an array of date ranges, each containing a start date and an end date
    const dateRanges = [
        { startDate: "2024-01-01", endDate: currentDateString },
        { startDate: "2023-01-01", endDate: "2023-06-15" },
        { startDate: "2023-06-16", endDate: "2023-12-31" },
        { startDate: "2022-09-16", endDate: "2022-12-31" }
    ];


    // Loop through each date range and download data
    for (const range of dateRanges) {
        let url: string = "https://api.currencybeacon.com/v1/timeseries?";
        url += "api_key=" + process.env.CURRENCYBEACON_API;
        url += "&base=USD&start_date=" + range.startDate + "&end_date=" + range.endDate + "&symbols=CAD,GBP,JPY,MUR,EUR";

        let data: CurrencyBeacon = (await axios.get(url)).data; // Get data from API

        await processData(data, range.startDate, range.endDate); // Process the downloaded data
    }
}

// Main function to orchestrate the download and upload processes
(async () : Promise <void> => {
    await downloadData(); // Download data
    await uploadToDynamoDB(allData); // Upload data to DynamoDB
})();
