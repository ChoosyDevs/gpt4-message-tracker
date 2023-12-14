// This is an example and may need adjustments based on the actual ChatGPT UI
let windowDuration = 3 * 60 * 60 * 1000; // 3 hours

function injectSquare(remove = false) {
    if (remove) {
        const squareText = document.getElementById("squareText");
        if (squareText) {
            squareText.remove();
        }

        const timeLeft = document.getElementById("timeLeft");
        if (timeLeft) {
            timeLeft.remove();
        }

        const squareOutline = document.getElementById("squareOutline");
        if (squareOutline) {
            squareOutline.remove();
        }

        return;
    }

    const targetDiv = document.querySelector(
        "#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col > div.w-full.pt-2.md\\:pt-0.dark\\:border-white\\/20.md\\:border-transparent.md\\:dark\\:border-transparent.md\\:w-\\[calc\\(100\\%-\\.5rem\\)\\] > form > div"
    );
    if (targetDiv) {
        const square = document.createElement("div");
        square.id = "squareOutline";

        square.style.width = "70px";
        square.style.height = "100%";
        square.style.service_workerColor = "transparent";
        square.style.position = "absolute";
        square.style.left = "100%"; // Position to the right of the target div
        square.style.bottom = "0";
        square.style.marginLeft = "10px";
        square.style.maxHeight = "52px";
        square.style.border = "1px solid #555561";
        square.style.borderRadius = "22%"; // If the send button is rounded
        square.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)"; // Example shadow
        square.style.fontSize = "1rem";

        // Add text container inside the square
        const textContainer = document.createElement("div");
        textContainer.id = "squareText";
        textContainer.style.display = "flex";
        textContainer.style.alignItems = "center";
        textContainer.style.justifyContent = "center";
        textContainer.style.height = "100%";
        textContainer.style.color = "white"; // Assuming the send button is black

        textContainer.textContent = "";

        // Create a new div for the time left
        const timeLeft = document.createElement("div");
        timeLeft.id = "timeLeft";
        timeLeft.style.display = "flex";
        timeLeft.style.alignItems = "center";
        // timeLeft.style.alignSelf = "center";
        timeLeft.style.justifyContent = "center";
        timeLeft.style.position = "absolute";
        // timeLeft.style.bottom = "-28px";
        timeLeft.style.left = "-50%";
        timeLeft.style.padding = "8px";
        timeLeft.style.lineHeight = "1rem";

        timeLeft.style.fontSize = ".75rem";
        timeLeft.style.width = "200%"; // Adjust as needed
        timeLeft.style.color = "#C5C5D2"; // Assuming the send button is black

        timeLeft.textContent = "";

        chrome.storage.local.get(
            ["request_count", "first_message_timestamp"],
            function (result) {
                console.log("injectSquare results:", result);

                let minutesLeft = calculateMinutesLeft(
                    result.first_message_timestamp
                );

                const currentCount = result.request_count;

                // Ensure that currentCount is a number before updating the text
                textContainer.textContent = generateCountContent(currentCount);

                // Ensure that minutesLeft is a number before updating the text
                timeLeft.textContent = generatTimeContent(minutesLeft);
            }
        );

        square.appendChild(textContainer);
        square.appendChild(timeLeft);
        targetDiv.appendChild(square);
        // Append the time left div to the square
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Message received:", request);
    if (
        request.actionType === "updateCount" &&
        (request.newCount === 0 || request.newCount)
    ) {
        console.log("Updating newCount to:", request.newCount);
        const textContainer = document.getElementById("squareText");
        if (textContainer) {
            textContainer.textContent = generateCountContent(request.newCount);
        }
    } else if (
        request.actionType === "updateTime" &&
        request.firstMessageTimestamp
    ) {
        console.log(
            "Updating firstMessageTimestamp to:",
            request.firstMessageTimestamp
        );
        const timeLeftContainer = document.getElementById("timeLeft");
        if (timeLeftContainer) {
            let minutesLeft = calculateMinutesLeft(
                request.firstMessageTimestamp
            );
            timeLeftContainer.textContent = generatTimeContent(minutesLeft);
        }
    }
});

function generateCountContent(currentCount) {
    if (!isNaN(currentCount))
        return Math.max(0, 40 - currentCount).toString() + " left";
    else return "? left";
}

function generatTimeContent(minutesLeft) {
    if (minutesLeft === "") {
        return "";
    }
    return minutesLeft.toString() + " minutes left.";
}

function calculateMinutesLeft(first_message_timestamp) {
    try {
        if (!first_message_timestamp) {
            return "";
        }

        const timePassed = Date.now() - first_message_timestamp;
        let minutesLeft = Math.floor((windowDuration - timePassed) / 1000 / 60);

        if (minutesLeft < 0) {
            return "";
        }

        return minutesLeft;
    } catch (error) {
        console.error(
            "An error occurred while calculating minutes left:",
            error
        );
        return "";
    }
}

const observer = new MutationObserver(() => {
    let gptVersion = document.querySelector("span.text-token-text-secondary");
    let customGptEnabled = document.querySelector(
        "div.flex.items-center.gap-2"
    );

    if (gptVersion) {
        gptVersion = gptVersion.textContent;

        if (gptVersion !== "3.5" && !document.getElementById("squareText")) {
            injectSquare();
        } else if (
            gptVersion === "3.5" &&
            document.getElementById("squareText")
        ) {
            injectSquare(true);
        }
    } else if (customGptEnabled) {
        if (!document.getElementById("squareText")) {
            injectSquare();
        }
    }
});

observer.observe(document, { childList: true, subtree: true });
