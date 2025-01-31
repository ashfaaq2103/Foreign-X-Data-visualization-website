/**
 * Importing necessary functions and modules.
 */
import { getConnectionIds, getPredictionData, getNumericalData, getSentimentData, deleteConnectionId } from './database.mjs';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

/**
 * Retrieves data from various tables and sends it to connected clients.
 * @param {string} domain - The domain name.
 * @param {string} stage - The stage.
 * @returns {Promise[]} An array of promises for sending data to clients.
 */
export async function getDataPromises(domain, stage) {
    // Get connection IDs of clients
    let clientIdArray = await getConnectionIds();
    // Create API Gateway management class.
    const callbackUrl = `https://${domain}/${stage}`;
    const apiGwClient = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });

    // Retrieve data from different tables
    const numericalData = await getNumericalData();
    const predictionData = await getPredictionData();
    const sentimentData = await getSentimentData();

    // Combine data into a single array with titles
    const combinedData = [
        { title: "Numerical Data", data: numericalData },
        { title: "Prediction Data", data: predictionData },
        { title: "Sentiment Data", data: sentimentData },
    ];

    // Prepare promises to send messages
    let msgPromiseArray = clientIdArray.map(async (item) => {
        // Extract connection ID
        const connId = item.ConnectionId;
        try {
            console.log("Sending data to: " + connId);

            // Convert combined data to JSON string
            const messageData = JSON.stringify(combinedData);

            // Create post to connection command
            const postToConnectionCommand = new PostToConnectionCommand({
                ConnectionId: connId,
                Data: messageData,
            });

            // Wait for API Gateway to execute and log result
            await apiGwClient.send(postToConnectionCommand);
        } catch (err) {
            console.log("Failed to send data to: " + connId);

            // Handle specific error (Gone: 410) for disconnected clients
            if (err.statusCode === 410) {
                try {
                    console.log("Deleting connection ID: " + connId);
                    await deleteConnectionId(connId);
                    console.log("Connection ID deleted: " + connId);
                } catch (deleteErr) {
                    console.log("ERROR deleting connectionId: " + JSON.stringify(deleteErr));
                    // You might want to handle deletion errors here (optional)
                }
            } else {
                console.log("UNKNOWN ERROR: " + JSON.stringify(err));
                // Re-throw for other unexpected errors
                throw err;
            }
        }
    });

    return msgPromiseArray;
}
