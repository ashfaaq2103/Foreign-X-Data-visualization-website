/**
 * Function to retrieve all connection IDs from the WebSocketClients table.
 * @returns {Array} An array of connection IDs.
 */
// Import library and scan command
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Create client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Returns all of the connection IDs
export async function getConnectionIds() {
    const scanCommand = new ScanCommand({
        TableName: "WebSocketClients"
    });

    const response  = await docClient.send(scanCommand);
    return response.Items;
}

/**
 * Function to retrieve prediction data from the numericalPredictionTable.
 * @returns {Array} An array of prediction data.
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
 * Function to retrieve numerical data from the CurrencyTable.
 * @returns {Array} An array of numerical data.
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
 * Function to retrieve sentiment data from the SentimentDataTable.
 * @returns {Array} An array of sentiment data.
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
 * Function to delete the specified connection ID from the WebSocketClients table.
 * @param {string} connectionId - The connection ID to delete.
 * @returns {Promise} A promise indicating the success or failure of the operation.
 */
// Deletes the specified connection ID
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
