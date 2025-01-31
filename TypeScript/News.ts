import * as NewsAPI from 'newsapi'; // Node module for accessing NewsAPI
import * as dotenv from 'dotenv'; // Module to read keys from .env file
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"; // AWS DynamoDB client
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"; // AWS DynamoDB Document Client

// Create new DynamoDB client and document client
const client: DynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const documentClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

// Load environment variables from .env file
dotenv.config();

// Define structure of article returned from NewsAPI
interface Article {
    description: string,
    title: string,
    publishedAt: string
}

// Define structure of data returned from NewsAPI
interface NewsAPIResult {
    articles: Array<Article>
}

// Function to process data obtained from NewsAPI
/**
 * Processes the data obtained from NewsAPI.
 * @param result The result object containing articles retrieved from NewsAPI.
 * @param currentCurrency The current currency associated with the retrieved articles.
 * @returns A Promise that resolves once the data processing is complete.
 */
async function processData(result: NewsAPIResult, currentCurrency: string): Promise<void> {
    // Output article titles and dates
    console.log(`Number of articles: ${result.articles.length}`);
    for (let article of result.articles) {
        const date: Date = new Date(article.publishedAt);
        console.log(`Unix Time: ${date.getTime()}; title: ${article.title}; description: ${article.description}`);
        let textData: string = article.title;

        let unixTime: number = date.getTime();
        // Store timestamp and headlines in DynamoDB
        const command: PutCommand = new PutCommand({
            TableName: "newsTable",
            Item: {
                "unixTime": unixTime,
                "textTitle": textData,
                "Currency": currentCurrency
            }
        });
        // Store data in DynamoDB and handle errors
        try {
            const response = await documentClient.send(command);
        } catch (err) {
            console.error("ERROR uploading data: " + JSON.stringify(err));
        }
    }
}

// Function to fetch and log data from NewsAPI
async function getNews(): Promise<void> {
    // List of currencies to search for
    const currencies: { currency: string }[] = [
        { currency: "Forex + Canadian" },
        { currency: "Forex + CAD" },
        { currency: "Foreign Exchange + Canadian Dollar" },
        { currency: "Foreign Exchange + CAD" },

        { currency: "Forex + MUR" },
        { currency: "Forex + Mauritian" },
        { currency: "Foreign Exchange + Mauritian Rupees" },
        { currency: "Foreign Exchange + MUR" },

        { currency: "Forex + GBP" },
        { currency: "Forex + Pound" },
        { currency: "Foreign Exchange + British Pound" },
        { currency: "Foreign Exchange + GBP" },

        { currency: "Forex + EUR" },
        { currency: "Forex + Euro" },
        { currency: "Foreign Exchange + Euro" },
        { currency: "Foreign Exchange + EUR" },

        { currency: "Forex + JPY" },
        { currency: "Forex + Japanese Yen" },
        { currency: "Foreign Exchange + Japanese Yen" },
        { currency: "Foreign Exchange + JPY" },
    ];

    // Create new instance of NewsAPI class
    const newsapi = new NewsAPI(process.env.NEWS_API);

    // Loop through each currency
    for (const currency of currencies) {
        try {
            let currentCurrency: string = ""; // Initialize currentCurrency variable

            // Determine the current currency based on the string
            if (currency.currency.includes("CAD") || currency.currency.includes("Canadian")) {
                currentCurrency = "CAD";
            } else if (currency.currency.includes("MUR") || currency.currency.includes("Mauritian")) {
                currentCurrency = "MUR";
            } else if (currency.currency.includes("GBP") || currency.currency.includes("Pound")) {
                currentCurrency = "GBP";
            } else if (currency.currency.includes("EUR") || currency.currency.includes("Euro")) {
                currentCurrency = "EUR";
            } else {
                currentCurrency = "JPY";
            }

            // Search NewsAPI for articles related to the current currency
            const result: NewsAPIResult = await newsapi.v2.everything({
                q: currency.currency,
                pageSize: 100,
                language: 'en'
            });

            // Process the obtained data
            await processData(result, currentCurrency);
        } catch (error) {
            console.error(`Error fetching news for ${currency.currency}:`, error);
        }
    }
}

// Call the getNews function to start fetching news
getNews();
