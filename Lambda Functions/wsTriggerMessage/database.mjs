/**
 * Importing library and scan command.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Create client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Retrieves all of the connection IDs.
 * @returns {Promise} A promise that resolves to an array of connection IDs.
 */
export async function getConnectionIds() {
    const scanCommand = new ScanCommand({
        TableName: "WebSocketClients"
    });

    const response = await docClient.send(scanCommand);
    return response.Items;
}

/**
 * Retrieves prediction data from the numericalPredictionTable.
 * @returns {Promise} A promise that resolves to an array of prediction data.
 */
export async function getPredictionData() {
    const scanCommand = new ScanCommand({
        TableName: "numericalPredictionTable"
    });

    const response = await docClient.send(scanCommand);

    // Sort data by date (assuming "DateExtracted" exists)
    response.Items.sort((a, b) => new Date(a.DateExtracted) - new Date(b.DateExtracted));

    return response.Items;
}

/**
 * Retrieves numerical data from the CurrencyTable.
 * @returns {Promise} A promise that resolves to an array of numerical data.
 */
export async function getNumericalData() {
    const scanCommand = new ScanCommand({
        TableName: "CurrencyTable"
    });

    const response = await docClient.send(scanCommand);

    // Sort data by date (assuming a "date" property exists)
    response.Items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return response.Items;
}

/**
 * Retrieves sentiment data from the SentimentDataTable.
 * @returns {Promise} A promise that resolves to an array of sentiment data.
 */
export async function getSentimentData() {
    const scanCommand = new ScanCommand({
        TableName: "SentimentDataTable"
    });

    const response = await docClient.send(scanCommand);

    // Sort data by date (assuming a "TimeStamp" property exists with milliseconds)
    response.Items.sort((a, b) => a.TimeStamp - b.TimeStamp);

    return response.Items;
}

/**
 * Deletes the specified connection ID.
 * @param {string} connectionId - The connection ID to delete.
 * @returns {Promise} A promise that resolves when the connection ID is successfully deleted.
 */
export async function deleteConnectionId(connectionId){
    console.log("Deleting connection Id: " + connectionId);

    const deleteCommand = new DeleteCommand ({
        TableName: "WebSocketClients",
        Key: {
            ConnectionId: connectionId
        }
    });
    return docClient.send(deleteCommand);
}
