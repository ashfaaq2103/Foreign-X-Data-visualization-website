import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, ScanCommand} from "@aws-sdk/lib-dynamodb";
const fs = require('fs').promises;

// Function to retrieve currency data from DynamoDB
/**
 * Retrieves currency data from DynamoDB.
 * @returns A Promise that resolves with an array of currency data objects.
 */
async function getCurrencyData(): Promise<any[]> {
    const client: DynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
    const docClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

    const command = new ScanCommand({
        TableName: "CurrencyTable",
        ProjectionExpression: "EUR, JPY, CAD, GBP, MUR, DateExtracted", // Include DateExtracted in the scan
    });

    try {
        const data = await docClient.send(command);

        // Sort the data by DateExtracted in ascending order
        data.Items.sort((a, b) => {
            const dateA = new Date(a.DateExtracted).getTime();
            const dateB = new Date(b.DateExtracted).getTime();
            return dateA - dateB;
        });

        return data.Items || [];
    } catch (error) {
        console.error("Error getting currency data:", error);
        throw error;
    }
}

// Function to separate currency data
/**
 * Separates currency data into individual currencies.
 * @param currencyData An array of currency data objects.
 * @returns An object containing separated currency data.
 */
async function separateCurrencies(currencyData) {
    // Sort currency data by DateExtracted in ascending order
    currencyData.sort((a, b) => {
        const dateA : number = new Date(a.DateExtracted).getTime();
        const dateB: number = new Date(b.DateExtracted).getTime();
        return dateA - dateB;
    });

    // Find the smallest start date
    const startDate = new Date(currencyData[0].DateExtracted);
    const startDateFormatted = startDate.toISOString().split('T')[0]; // Format as "YYYY-MM-DD"

    // Create a map to store separated currency data
    const separatedData:{} = {};

    // Iterate over currency data and separate each currency
    currencyData.forEach(currency => {
        Object.entries(currency).forEach(([key, value]) => {
            if (key !== "DateExtracted") {
                if (!separatedData[key]) {
                    separatedData[key] = {
                        start: startDateFormatted,
                        target: []
                    };
                }
                separatedData[key].target.push(value);
            }
        });
    });

    return separatedData;
}


// Function to write currency data to a file
/**
 * Writes currency data to a JSON file.
 * @param currencyData An array of currency data objects.
 * @param currencyCode The currency code indicating the currency to be written to the file.
 * @returns A Promise that resolves once the data is written to the file.
 */
async function writeCurrencyToFile(currencyData: any[], currencyCode: string) {
    const separatedData : {} = await separateCurrencies(currencyData);
    const fileName : string = `${currencyCode}_test.json`;
    const fileTwo : string  = `${currencyCode}_train.json`
    await fs.writeFile(fileName, JSON.stringify(separatedData[currencyCode]));

    // Write only the first 400 elements of the 'target' array to fileTwo
    const first400Targets = separatedData[currencyCode].target.slice(0, 400);
    await fs.writeFile(fileTwo, JSON.stringify({ start: separatedData[currencyCode].start, target: first400Targets }));

}


// Example usage
(async () => {
    const currencyData = await getCurrencyData();
    await Promise.all([
        writeCurrencyToFile(currencyData, 'EUR'),
        writeCurrencyToFile(currencyData, 'JPY'),
        writeCurrencyToFile(currencyData, 'CAD'),
        writeCurrencyToFile(currencyData, 'GBP'),
        writeCurrencyToFile(currencyData, 'MUR')
    ]);

    console.log("Files created successfully.");
})();
