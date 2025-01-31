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
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var fs = require('fs').promises;
// Function to retrieve currency data from DynamoDB
/**
 * Retrieves currency data from DynamoDB.
 * @returns A Promise that resolves with an array of currency data objects.
 */
function getCurrencyData() {
    return __awaiter(this, void 0, void 0, function () {
        var client, docClient, command, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new client_dynamodb_1.DynamoDBClient({ region: "us-east-1" });
                    docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
                    command = new lib_dynamodb_1.ScanCommand({
                        TableName: "CurrencyTable",
                        ProjectionExpression: "EUR, JPY, CAD, GBP, MUR, DateExtracted", // Include DateExtracted in the scan
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, docClient.send(command)];
                case 2:
                    data = _a.sent();
                    // Sort the data by DateExtracted in ascending order
                    data.Items.sort(function (a, b) {
                        var dateA = new Date(a.DateExtracted).getTime();
                        var dateB = new Date(b.DateExtracted).getTime();
                        return dateA - dateB;
                    });
                    return [2 /*return*/, data.Items || []];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error getting currency data:", error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Function to separate currency data
/**
 * Separates currency data into individual currencies.
 * @param currencyData An array of currency data objects.
 * @returns An object containing separated currency data.
 */
function separateCurrencies(currencyData) {
    return __awaiter(this, void 0, void 0, function () {
        var startDate, startDateFormatted, separatedData;
        return __generator(this, function (_a) {
            // Sort currency data by DateExtracted in ascending order
            currencyData.sort(function (a, b) {
                var dateA = new Date(a.DateExtracted).getTime();
                var dateB = new Date(b.DateExtracted).getTime();
                return dateA - dateB;
            });
            startDate = new Date(currencyData[0].DateExtracted);
            startDateFormatted = startDate.toISOString().split('T')[0];
            separatedData = {};
            // Iterate over currency data and separate each currency
            currencyData.forEach(function (currency) {
                Object.entries(currency).forEach(function (_a) {
                    var key = _a[0], value = _a[1];
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
            return [2 /*return*/, separatedData];
        });
    });
}
// Function to write currency data to a file
/**
 * Writes currency data to a JSON file.
 * @param currencyData An array of currency data objects.
 * @param currencyCode The currency code indicating the currency to be written to the file.
 * @returns A Promise that resolves once the data is written to the file.
 */
function writeCurrencyToFile(currencyData, currencyCode) {
    return __awaiter(this, void 0, void 0, function () {
        var separatedData, fileName, fileTwo, first400Targets;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, separateCurrencies(currencyData)];
                case 1:
                    separatedData = _a.sent();
                    fileName = "".concat(currencyCode, "_test.json");
                    fileTwo = "".concat(currencyCode, "_train.json");
                    return [4 /*yield*/, fs.writeFile(fileName, JSON.stringify(separatedData[currencyCode]))];
                case 2:
                    _a.sent();
                    first400Targets = separatedData[currencyCode].target.slice(0, 400);
                    return [4 /*yield*/, fs.writeFile(fileTwo, JSON.stringify({ start: separatedData[currencyCode].start, target: first400Targets }))];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Example usage
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var currencyData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getCurrencyData()];
            case 1:
                currencyData = _a.sent();
                return [4 /*yield*/, Promise.all([
                        writeCurrencyToFile(currencyData, 'EUR'),
                        writeCurrencyToFile(currencyData, 'JPY'),
                        writeCurrencyToFile(currencyData, 'CAD'),
                        writeCurrencyToFile(currencyData, 'GBP'),
                        writeCurrencyToFile(currencyData, 'MUR')
                    ])];
            case 2:
                _a.sent();
                console.log("Files created successfully.");
                return [2 /*return*/];
        }
    });
}); })();
