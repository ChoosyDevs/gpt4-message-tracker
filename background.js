// Initialize global variables
let requestCount = 0;
let first_message_timestamp = Date.now() - 24 * 60 * 60 * 1000; 
let windowDuration = 60 * 1000; // 1 min 

// Function to reset the request count if the current time exceeds the window duration
function checkAndReset() {
    // console.log in seconds till reset
    console.log("Seconds till reset:", (windowDuration - (Date.now() - first_message_timestamp)) / 1000);
   
    if (Date.now() - first_message_timestamp > windowDuration) {
        requestCount = 0;
        chrome.browserAction.setBadgeText({text: requestCount.toString()});
        first_message_timestamp = Date.now();
        console.log("Count reset. Next reset scheduled in 3 hours.");
    }
}

// Function to track GPT-4 requests and increment the request count
function trackGPT4Request(details) {
    console.log("Request detected:", details.url);
    if (details.url.includes('https://chat.openai.com/backend-api/conversation')) {
        checkAndReset();
        requestCount++;
        console.log("GPT-4 request count incremented:", requestCount);
        chrome.browserAction.setBadgeText({text: requestCount.toString()});
    }
}

// Event listener for web requests, calls trackGPT4Request function
chrome.webRequest.onBeforeRequest.addListener(
    trackGPT4Request,
    {urls: ["https://chat.openai.com/backend-api/conversation"]},
    ["requestBody"]
);

// Event listener for extension startup, calls checkAndReset function
chrome.runtime.onStartup.addListener(function() {
    checkAndReset();
});

// Event listener for extension installation, calls checkAndReset function
chrome.runtime.onInstalled.addListener(function() {
    checkAndReset();
});

// Event listener for tab updates (reload), calls checkAndReset function
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        checkAndReset();
    }
});

// Set an interval to call checkAndReset function every SECOND
setInterval(checkAndReset, 1 * 1000);

console.log("GPT-4 Request Tracker background script loaded and running.");