import { DynamoDBClient } from "@aws-sdk/client-dynamodb"; // Importing DynamoDB client
import { PutCommand } from "@aws-sdk/lib-dynamodb"; // Importing DynamoDB PutCommand
import axios from 'axios'; // Importing Axios for HTTP requests

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
            let currency = record.dynamodb.NewImage.Currency.S;
            let text = record.dynamodb.NewImage.textTitle.S;
            let timeStamp = record.dynamodb.NewImage.unixTime.N;

            try {
                const emotionReturned = await tpSentiment(text); // Call the sentiment analysis function
                let params = {
                    TableName: "SentimentDataTable",
                    Item: {
                        TimeStamp: parseInt(timeStamp, 10),
                        emotion: emotionReturned,
                        currentCurrency: currency
                    }
                };
                try {
                    await ddbClient.send(new PutCommand(params)); // Insert sentiment data into DynamoDB
                    console.log("stored");
                    return {
                        statusCode: 200
                    };
                } catch (err) {
                    console.error("Error:", err);
                    return {
                        statusCode: 500
                    };
                }
            } catch (error) {
                console.error("Error:", error);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: "An error occurred" })
                };
            }
        }
    }
}

/**
 * Performs sentiment analysis on the provided text.
 * @param {string} text - The text to analyze.
 * @returns {string} The sentiment label.
 */
async function tpSentiment(text) {
    const url = 'http://text-processing.com/api/sentiment/'; // Text-processing.com API URL
    const response = await axios.post(url, { text }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    const { label } = response.data; // Extracting only the label part
    return label;
}
