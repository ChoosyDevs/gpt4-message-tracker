// Initialize global variables
let windowDuration = 3 * 60 * 60 * 1000; // 3 hours
let max_num_requests = 40;

// Function to reset the request count if the current time exceeds the window duration
function checkAndReset() {
    chrome.storage.local.get(
        ["first_message_timestamp", "request_count"],
        function (data) {
            let firstMessageTimestamp = data.first_message_timestamp;

            if (!firstMessageTimestamp) {
                chrome.storage.local.set({
                    first_message_timestamp: Date.now() - windowDuration - 1,
                });
                firstMessageTimestamp = Date.now() - windowDuration - 1;
            }

            const timePassed = Date.now() - firstMessageTimestamp;

            if (timePassed > windowDuration) {
                chrome.storage.local.set({ request_count: 0 }, function () {
                    console.log(
                        "3 hours have passed, resetting request count..."
                    );

                    updateBadgeCount(0);
                    return;
                });
            }
        }
    );
}

// Function to update the badge count
function updateBadgeCount(newCount) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0 && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                actionType: "updateCount",
                newCount: newCount,
            });
        }
    });
}

// Function to update the time left
function updateTimeLeft(firstMessageTimestamp) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0 && tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                actionType: "updateTime",
                firstMessageTimestamp: firstMessageTimestamp,
            });
        }
    });
}

// Function to track GPT-4 requests and increment the request count
function trackGPT4Request(details) {
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

        // if model is not gpt 3.5
        if (model && !model.includes("text-davinci")) {
            chrome.storage.local.get(["request_count"], function (data) {
                try {
                    chrome.storage.local.set(
                        {
                            request_count: data.request_count + 1,
                            first_message_timestamp:
                                data.request_count === 0
                                    ? Date.now()
                                    : data.first_message_timestamp,
                        },
                        function () {
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

// Set up a chrome alarm to periodically
chrome.alarms.create("updateTime", { periodInMinutes: 0.1 });
chrome.alarms.create("resetAlarm", { periodInMinutes: 0.01 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "resetAlarm") {
        checkAndReset();
    }
    if (alarm.name === "updateTime") {
        chrome.storage.local.get(["first_message_timestamp"], function (data) {
            updateTimeLeft(data.first_message_timestamp);
        });
    }
});

// Event listener for web requests, calls trackGPT4Request function
chrome.webRequest.onBeforeRequest.addListener(
    trackGPT4Request,
    { urls: ["https://chat.openai.com/backend-api/conversation"] },
    ["requestBody"]
);

// Initial setup
checkAndReset();
