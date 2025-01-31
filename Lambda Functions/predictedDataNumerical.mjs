import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime"; // Importing AWS SDK modules
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"; // Importing DynamoDB client
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb"; // Importing DynamoDB commands

// Create SageMakerRuntimeClient
const client = new SageMakerRuntimeClient({});

// Create new DynamoDB client
const ddbClient = new DynamoDBClient();

/**
 * Lambda function handler for processing the request.
 * @param {Object} event - The event data.
 * @param {Object} context - The execution context.
 * @returns {Object} The Lambda function response.
 */
export async function handler(event, context) {
    for (let record of event.Records) {
        if (record.eventName === "INSERT") {
            const numberOfItems = await getNumberOfItems(); // Get the total number of items in the CurrencyTable
            if (numberOfItems >= 500) {
                try {
                    const { eurPredictionsArray, murPredictionsArray, gbpPredictionsArray, jpyPredictionsArray, cadPredictionsArray, last100Items } = await getAllDataFromTable("CurrencyTable");
                    await insertPredictions(eurPredictionsArray, murPredictionsArray, gbpPredictionsArray, jpyPredictionsArray, cadPredictionsArray, last100Items);
                    return {
                        statusCode: 200,
                    };
                } catch (error) {
                    console.error("Error:", error);
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ error: "An error occurred" }),
                    };
                }
            }
        }
    }
}

/**
 * Inserts predictions into the numericalPredictionTable.
 * @param {number[]} eurPredictionsArray - Array of EUR predictions.
 * @param {number[]} murPredictionsArray - Array of MUR predictions.
 * @param {number[]} gbpPredictionsArray - Array of GBP predictions.
 * @param {number[]} jpyPredictionsArray - Array of JPY predictions.
 * @param {number[]} cadPredictionsArray - Array of CAD predictions.
 * @param {Object[]} last100Items - Last 100 items from the CurrencyTable.
 */
async function insertPredictions(eurPredictionsArray, murPredictionsArray, gbpPredictionsArray, jpyPredictionsArray, cadPredictionsArray, last100Items) {
    const baseDate = new Date(last100Items[last100Items.length - 1].DateExtracted);
    for (let i = 0; i < eurPredictionsArray.length; i++) {
        const predictionDate = baseDate.toISOString().split('T')[0]; // Extract date only (YYYY-MM-DD)
        const params = {
            TableName: "numericalPredictionTable",
            Item: {
                DateExtracted: predictionDate, // String format for DynamoDB
                CAD: cadPredictionsArray[i],
                GBP: gbpPredictionsArray[i],
                JPY: jpyPredictionsArray[i],
                MUR: murPredictionsArray[i],
                EUR: eurPredictionsArray[i]
            },
        };

        try {
            await ddbClient.send(new PutCommand(params)); // Insert prediction into DynamoDB
        } catch (error) {
            console.error(`Error inserting prediction for date ${predictionDate}:`, error);
        }

        // Update baseDate for the next iteration
        baseDate.setDate(baseDate.getDate() + 1); // Add 1 day to the date
    }
}

/**
 * Retrieves the total number of items in the CurrencyTable.
 * @returns {number} The total number of items in the CurrencyTable.
 */
async function getNumberOfItems() {
    try {
        const params = {
            TableName: "CurrencyTable"
        };
        const { Items } = await ddbClient.send(new ScanCommand(params)); // Scan the CurrencyTable
        const totalItems = Items.length;

        return totalItems; // Return the total count
    } catch (error) {
        throw error;
    }
}

/**
 * Retrieves the last 100 items from the specified table and separates data by currency.
 * @param {string} tableName - The name of the table to retrieve data from.
 * @returns {Object} The predictions and last 100 items separated by currency.
 */
async function getAllDataFromTable(tableName) {
    try {
        const params = {
            TableName: tableName
        };
        const { Items } = await ddbClient.send(new ScanCommand(params)); // Scan the specified table

        // Sort Items by DateExtracted in ascending order (oldest first)
        Items.sort((item1, item2) => {
            const date1 = new Date(item1.DateExtracted);
            const date2 = new Date(item2.DateExtracted);
            return date1.getTime() - date2.getTime();
        });

        // Extract only the last 100 elements (ascending order)
        const last100Items = Items.slice(-100);

        // Separate data by features (EUR, CAD, GBP, JPY, MUR)
        const features = {
            EUR: [],
            CAD: [],
            GBP: [],
            JPY: [],
            MUR: [],
        };

        for (const item of last100Items) {
            features.EUR.push(item.EUR);
            features.CAD.push(item.CAD);
            features.GBP.push(item.GBP);
            features.JPY.push(item.JPY);
            features.MUR.push(item.MUR);
        }

        // Get the start date from the first element (assuming dates are consistent)
        const startDate = last100Items[0].DateExtracted;

        // Format start date to YYYY-MM-DD 00:00:00
        const formattedStartDate = `${startDate.substring(0, 10)} 00:00:00`;

        // Prepare the data structure for each currency
        const currencyData = {
            EUR: { start: formattedStartDate, targets: features.EUR },
            CAD: { start: formattedStartDate, targets: features.CAD },
            GBP: { start: formattedStartDate, targets: features.GBP },
            JPY: { start: formattedStartDate, targets: features.JPY },
            MUR: { start: formattedStartDate, targets: features.MUR },
        };

        const predictions = {};
        // Loop through each currency and call invokeEndpoint
        for (const currency in currencyData) {
            const data = {
                "instances": [
                    {
                        "start": currencyData[currency].start,
                        "target": currencyData[currency].targets,
                    }
                ],
                "configuration":
                {
                    "num_samples": 50,
                    "output_types": ["mean", "quantiles", "samples"],
                    "quantiles": ["0.1", "0.9"]
                }
            };

            predictions[currency] = await invokeEndpoint(`Training${currency}endpoint`, JSON.stringify(data)); // Invoke SageMaker endpoint
        }

        // Parse predictions arrays
        const eurPredictionsArray = parsePredictionsString(predictions.EUR);
        const murPredictionsArray = parsePredictionsString(predictions.MUR);
        const gbpPredictionsArray = parsePredictionsString(predictions.GBP);
        const jpyPredictionsArray = parsePredictionsString(predictions.JPY);
        const cadPredictionsArray = parsePredictionsString(predictions.CAD);

        return { eurPredictionsArray, murPredictionsArray, gbpPredictionsArray, jpyPredictionsArray, cadPredictionsArray, last100Items };
    } catch (error) {
        throw error;
    }
}

/**
 * Parses the predictions string into an array of numbers.
 * @param {string} predictionsString - The string containing predictions.
 * @returns {number[]} The array of parsed predictions.
 */
function parsePredictionsString(predictionsString) {
    return predictionsString.slice(1, -1).split(",").map(str => parseFloat(str));
}

/**
 * Invokes the SageMaker endpoint with the provided data.
 * @param {string} TrainingEndpoint - The name of the SageMaker endpoint.
 * @param {string} data - The data to send to the endpoint.
 * @returns {Promise<string>} The predictions from the SageMaker endpoint.
 */
async function invokeEndpoint(TrainingEndpoint, data) {

    // Create and send command with data
    const command = new InvokeEndpointCommand({
        EndpointName: TrainingEndpoint,
        Body: data,
        ContentType: "application/json",
        Accept: "application/json"
    });
    const response = await client.send(command);
    let predictions = JSON.parse(Buffer.from(response.Body).toString('utf8'));
    return (JSON.stringify(predictions.predictions[0].mean));
}
