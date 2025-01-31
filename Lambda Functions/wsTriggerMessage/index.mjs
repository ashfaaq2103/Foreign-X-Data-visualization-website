/**
 * Importing external library with websocket functions.
 */
import { getDataPromises } from './websocket.mjs'

/**
 * Handles WebSocket events and sends data to connected clients.
 * @param {object} event - The WebSocket event object.
 * @returns {object} The response object indicating success or failure.
 */
export const handler = async (event) => {
    console.log(JSON.stringify(event));
    try {

        // Extract domain and stage from event
        const domain = event.requestContext.domainName;
        const stage = event.requestContext.stage;
        console.log("Domain: " + domain + " stage: " + stage);

        // Get promises to send messages to connected clients
        let sendDataPromises = await getDataPromises(domain, stage);
        console.log(sendDataPromises);

        // Execute promises
        await Promise.all(sendDataPromises);
    }
    catch(err){
        return { statusCode: 500, body: "Error: " + JSON.stringify(err) };
    }

    // Success
    return { statusCode: 200, body: "Data sent successfully." };
};
