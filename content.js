// This is an example and may need adjustments based on the actual ChatGPT UI
function injectSquare(remove = false) {
    if (remove) {
        const squareOutline = document.getElementById("squareOutline");
        if (squareOutline) {
            squareOutline.remove();
        }

        const squareText = document.getElementById("squareText");
        if (squareText) {
            squareText.remove();
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

        chrome.storage.local.get(["request_count"], function (result) {
            console.log("injectSquare results:", result);
            const currentCount = result.request_count;
            // Ensure that currentCount is a number before updating the text
            if (!isNaN(currentCount)) {
                textContainer.textContent =
                    (40 - currentCount).toString() + " left";
            } else {
                // Handle the case where currentCount is not a number
                textContainer.textContent = "";
            }
        });

        square.appendChild(textContainer);
        targetDiv.appendChild(square);
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.updateBadge >= 0) {
        console.log("Updating badge count to:", request.updateBadge);
        const textContainer = document.getElementById("squareText");
        if (textContainer) {
            textContainer.textContent =
                (40 - request.updateBadge).toString() + " left";
        }
    }
});

const observer = new MutationObserver(() => {
    let gptVersion = document.querySelector("span.text-token-text-secondary");
    let customGptEnabled = document.querySelector("div.flex.items-center.gap-2");
    
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
    }
    else if(customGptEnabled) {
        if(!document.getElementById("squareText")) {
            injectSquare();
        } 
    }

});

observer.observe(document, { childList: true, subtree: true });


