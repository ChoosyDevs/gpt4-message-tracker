const { getGptVersion } = require("./utility-functions.js");

// Initialize global variables
let windowDuration = 3 * 60 * 60 * 1000; // 3 hours
let max_num_requests = 40;

// Function to reset the request count if the current time exceeds the window duration
function checkAndReset() {
    // console.log in seconds till reset
    console.log(
        "Seconds till reset:",
        (windowDuration -
            (Date.now() - localStorage.getItem("first_message_timestamp"))) /
            1000
    );

    if (
        Date.now() - localStorage.getItem("first_message_timestamp") >
        windowDuration
    ) {
        localStorage.setItem("request_count", 0);
        localStorage.setItem("first_message_timestamp", Date.now());

        console.log("Count reset. Next reset scheduled in 3 hours.");
    }
    let requestCount = parseInt(localStorage.getItem("request_count"));
    // check if request count is null
    if (!requestCount) {
        requestCount = 0;
        localStorage.setItem("request_count", 0);
    }

    // chrome.browserAction.setBadgeText({text: requestCount.toString() + "/" + max_num_requests.toString()});
    updateBadgeCount(requestCount);
}

// Function to send the current count to the content script
function updateBadgeCount(newCount) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { updateBadge: newCount });
        }
    });
}

// Function to track GPT-4 requests and increment the request count
function trackGPT4Request(details) {
    if (
        details.url.includes("https://chat.openai.com/backend-api/conversation")
    ) {
        checkAndReset();
        let requestCount = parseInt(localStorage.getItem("request_count"));
        if (!requestCount) {
            requestCount = 0;
        }
        requestCount++;
        localStorage.setItem("request_count", requestCount);

        console.log("GPT-4 request count incremented:", requestCount);
        // chrome.browserAction.setBadgeText({text: requestCount.toString() + "/" + max_num_requests.toString()});
        updateBadgeCount(requestCount);
    }
}

// Event listener for web requests, calls trackGPT4Request function
chrome.webRequest.onBeforeRequest.addListener(
    trackGPT4Request,
    { urls: ["https://chat.openai.com/backend-api/conversation"] },
    ["requestBody"]
);

// Set an interval to call checkAndReset function every SECOND
setInterval(checkAndReset, 1 * 1000);

console.log("GPT-4 Request Tracker background script loaded and running.");
