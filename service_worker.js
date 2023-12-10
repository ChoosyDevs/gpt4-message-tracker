// Initialize global variables
let windowDuration = 3 * 60 * 60 * 1000; // 3 hours
let max_num_requests = 40;

// Function to reset the request count if the current time exceeds the window duration
function checkAndReset() {
    chrome.storage.local.get(['first_message_timestamp', 'request_count'], function(data) {
        let firstMessageTimestamp = data.first_message_timestamp;
        let requestCount = data.request_count || 0;

        if (!firstMessageTimestamp) {
            chrome.storage.local.set({ 'first_message_timestamp': Date.now() });
            firstMessageTimestamp = Date.now();
        }

        const timePassed = Date.now() - firstMessageTimestamp;
        console.log("Seconds till reset:", (windowDuration - timePassed) / 1000);

        if (timePassed > windowDuration) {
            chrome.storage.local.set({ 'request_count': 0, 'first_message_timestamp': Date.now() });
            console.log("Count reset. Next reset scheduled in 3 hours.");
            requestCount = 0;
        }

        updateBadgeCount(requestCount);
    });
}

// Function to update the badge count
function updateBadgeCount(newCount) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { updateBadge: newCount });
        }
    });
}

// Function to track GPT-4 requests and increment the request count
function trackGPT4Request(details) {
    console.log("Tracking GPT-4 request details:",details);
    if (details.url.includes("https://chat.openai.com/backend-api/conversation")) {
        let requestBody = null;
        if (details.requestBody && details.requestBody.raw && details.requestBody.raw[0] && details.requestBody.raw[0].bytes) {
            let rawBytes = details.requestBody.raw[0].bytes;
            let jsonString = new TextDecoder("utf-8").decode(new Uint8Array(rawBytes));
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
        if (model && model.includes("gpt-4")) {
            chrome.storage.local.get(['request_count'], function(data) {
                console.log("GPT-4 data:", data)
                let requestCount = data.request_count || 0;
                requestCount++;
                chrome.storage.local.set({ 'request_count': requestCount });

                console.log("GPT-4 request count incremented:", requestCount);
                updateBadgeCount(requestCount);
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.url) {
        console.log("Current URL:", message.url);
    }
});

// Initial setup
checkAndReset();
console.log("GPT-4 Request Tracker service worker script loaded and running.");
