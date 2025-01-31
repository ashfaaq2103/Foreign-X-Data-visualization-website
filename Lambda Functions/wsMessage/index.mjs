/**
 * Imports the external library with WebSocket functions.
 */
// Import external library with WebSocket functions
import { getDataPromises } from './websocket.mjs'

/**
 * Lambda function handler to handle WebSocket events.
 * @param {object} event - The WebSocket event object.
 * @returns {object} An object containing the response statusCode and body.
 */
export const handler = async (event) => {
    console.log(JSON.stringify(event));
    try {

        // Extract domain and stage from event
        const domain = event.requestContext.domainName;
        const stage = event.requestContext.stage;
        const ConnecID = event.requestContext.connectionId;
        console.log("Domain: " + domain + " stage: " + stage);

        // Get promises to send messages to connected clients
        let sendDataPromises = await getDataPromises(domain, stage, ConnecID);
        console.log(sendDataPromises);
        // Execute promises
        // await Promise.all(sendDataPromises);
    }
    catch(err){
        return { statusCode: 500, body: "Error: " + JSON.stringify(err) };
    }

    // Success
    return { statusCode: 200, body: "Data sent successfully." };
};
