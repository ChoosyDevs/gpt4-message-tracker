// Initialize global variables
let windowDuration = 3 * 60 * 60 * 1000; // 3 hours
let max_num_requests = 40;

// Function to reset the request count if the current time exceeds the window duration
function checkAndReset() {
    console.log("Checking and resetting request count...");
    chrome.storage.local.get(
        ["first_message_timestamp", "request_count"],
        function (data) {
            console.log("Data in checkAndReset:", data);
            let firstMessageTimestamp = data.first_message_timestamp;

            if (!firstMessageTimestamp) {
                chrome.storage.local.set({
                    first_message_timestamp: Date.now() - windowDuration - 1,
                });
                firstMessageTimestamp = Date.now() - windowDuration - 1;
            }

            const timePassed = Date.now() - firstMessageTimestamp;
            console.log(
                "Seconds till reset:",
                (windowDuration - timePassed) / 1000
            );

            if (timePassed > windowDuration) {
                chrome.storage.local.set({ request_count: 0 }, function () {
                    console.log(
                        "3 hours have passed, resetting request count..."
                    );

                    updateBadgeCount(0);
                    return;
                });
            }

            // let requestCount = data.request_count;
            // updateBadgeCount(requestCount);
        }
    );
}

// Function to update the badge count
function updateBadgeCount(newCount) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0 && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { updateBadge: newCount });
        }
    });
}

// Function to track GPT-4 requests and increment the request count
function trackGPT4Request(details) {
    console.log("Tracking GPT-4 request details:", details);
    if (
        details.url.includes("https://chat.openai.com/backend-api/conversation")
    ) {
        let requestBody = null;
        if (
            details.requestBody &&
            details.requestBody.raw &&
            details.requestBody.raw[0] &&
            details.requestBody.raw[0].bytes
        ) {
            let rawBytes = details.requestBody.raw[0].bytes;
            let jsonString = new TextDecoder("utf-8").decode(
                new Uint8Array(rawBytes)
            );
            try {
                requestBody = JSON.parse(jsonString);
            } catch (e) {
                console.error("Error parsing JSON: ", e);
            }
        } else {
            console.error("Expected properties not found in details object");
        }

        let model = requestBody && requestBody.model;
        console.log("Model:", model);
        // if model is not gpt 3.5
        if (model && !model.includes("text-davinci")) {
            chrome.storage.local.get(["request_count"], function (data) {
                try {
                    console.log("GPT-4 data:", data, typeof data.request_count);
                    chrome.storage.local.set(
                        {
                            request_count: data.request_count + 1,
                            first_message_timestamp:
                                data.request_count === 0
                                    ? Date.now()
                                    : data.first_message_timestamp,
                        },
                        function () {
                            console.log(
                                "GPT-4 request count incremented:",
                                data.request_count + 1
                            );
                            updateBadgeCount(data.request_count + 1);
                        }
                    );
                } catch (error) {
                    console.error(
                        "An error occurred inside the if (model && model.includes...) block",
                        error
                    );
                }
            });
        }
    }
}

// Set up a chrome alarm to periodically execute checkAndReset
chrome.alarms.create("resetAlarm", { periodInMinutes: 0.01 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "resetAlarm") {
        checkAndReset();
    }
});

// Event listener for web requests, calls trackGPT4Request function
chrome.webRequest.onBeforeRequest.addListener(
    trackGPT4Request,
    { urls: ["https://chat.openai.com/backend-api/conversation"] },
    ["requestBody"]
);

// Listener for messages from content scripts or other parts of your extension
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.url) {
//         console.log("Current URL:", message.url);
//     }
// });

// Initial setup
checkAndReset();
console.log("GPT-4 Request Tracker service worker script loaded and running.");
