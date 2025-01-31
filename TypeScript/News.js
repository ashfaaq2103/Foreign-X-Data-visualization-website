"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//Use Node module for accessing newsapi
var NewsAPI = require("newsapi");
//Axios will handle HTTP requests to web service
//Module that reads keys from .env file
var dotenv = require("dotenv");
//Import AWS modules
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
//Create new DocumentClient
var client = new client_dynamodb_1.DynamoDBClient({ region: "us-east-1" });
var documentClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
//Copy variables in file into environment variables
dotenv.config();
function processData(result, currentCurrency) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, article, date, textData, unixTime, command, response, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    //Output article titles and dates
                    console.log("Number of articles: ".concat(result.articles.length));
                    _i = 0, _a = result.articles;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    article = _a[_i];
                    date = new Date(article.publishedAt);
                    console.log("Unix Time: ".concat(date.getTime(), "; title: ").concat(article.title, "; description: ").concat(article.description));
                    textData = article.title;
                    unixTime = date.getTime();
                    command = new lib_dynamodb_1.PutCommand({
                        TableName: "newsTable",
                        Item: {
                            "unixTime": unixTime,
                            "textTitle": textData,
                            "Currency": currentCurrency
                        }
                    });
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, documentClient.send(command)];
                case 3:
                    response = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _b.sent();
                    console.error("ERROR uploading data: " + JSON.stringify(err_1));
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
//Pulls and logs data from API
function getNews() {
    return __awaiter(this, void 0, void 0, function () {
        var currencies, newsapi, _i, currencies_1, currency, currentCurrency, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currencies = [
                        { currency: "Forex + Canadian" },
                        // { currency: "Forex + CAD" },
                        // { currency: "Forex news + CAD" },
                        // { currency: "CAD currency market news" },
                        // { currency: "Forex trading + Canadian dollar" },
                        //
                        // { currency: "Forex + GBP" },
                        // { currency: "Forex + GBP exchange rate" },
                        // { currency: "Forex news + GBP" },
                        // { currency: "GBP currency market news" },
                        // { currency: "Forex trading + Pound Sterling" },
                        //
                        // { currency: "Forex + Euro" },
                        // { currency: "Forex + EUR exchange rate" },
                        // { currency: "Forex news + EUR" },
                        // { currency: "EUR currency market news" },
                        // { currency: "Forex trading + Euro" },
                        //
                        // { currency: "Forex + JPY" },
                        // { currency: "Forex + JPY exchange rate" },
                        // { currency: "Forex news + JPY" },
                        // { currency: "JPY currency market news" },
                        // { currency: "Forex trading + Japanese Yen" },
                        //
                        // { currency: "Forex + Mauritian" },
                        // { currency: "Forex + MUR exchange rate" },
                        // { currency: "Forex news + MUR" },
                        // { currency: "MUR currency market news" },
                        { currency: "Forex trading + Mauritian Rupees" }
                    ];
                    newsapi = new NewsAPI(process.env.NEWS_API);
                    _i = 0, currencies_1 = currencies;
                    _a.label = 1;
                case 1:
                    if (!(_i < currencies_1.length)) return [3 /*break*/, 7];
                    currency = currencies_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    currentCurrency = "";
                    // Check if the currency string includes "CAD" or "Canadian"
                    if (currency.currency.includes("CAD") || currency.currency.includes("Canadian")) {
                        currentCurrency = "CAD";
                    }
                    else if (currency.currency.includes("MUR") || currency.currency.includes("Mauritian")) {
                        currentCurrency = "MUR";
                    }
                    else if (currency.currency.includes("GBP") || currency.currency.includes("Pound")) {
                        currentCurrency = "GBP";
                    }
                    else if (currency.currency.includes("EUR") || currency.currency.includes("Euro")) {
                        currentCurrency = "EUR";
                    }
                    else {
                        currentCurrency = "JPY";
                    }
                    return [4 /*yield*/, newsapi.v2.everything({
                            q: currency.currency,
                            pageSize: 100,
                            language: 'en'
                        })];
                case 3:
                    result = _a.sent();
                    return [4 /*yield*/, processData(result, currentCurrency)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error("Error fetching news for ".concat(currency.currency, ":"), error_1);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/];
            }
        });
    });
}
getNews();
