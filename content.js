// This is an example and may need adjustments based on the actual ChatGPT UI
function injectSquare() {
    const targetDiv = document.querySelector('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col > div.w-full.pt-2.md\\:pt-0.dark\\:border-white\\/20.md\\:border-transparent.md\\:dark\\:border-transparent.md\\:w-\\[calc\\(100\\%-\\.5rem\\)\\] > form > div');

    if (targetDiv) {
        const square = document.createElement('div');
        square.style.width = '50px';
        square.style.height = '100%';
        square.style.backgroundColor = 'transparent';
        square.style.position = 'absolute';
        square.style.left = '100%'; // Position to the right of the target div
        square.style.bottom = '0';
        square.style.marginLeft = '10px';
        square.style.maxHeight = '52px';
        square.style.border = '1px solid #555561';
        square.style.borderRadius = '25%'; // If the send button is rounded
        square.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'; // Example shadow
        square.style.fontSize = '1rem';
           


        // Add text container inside the square
        const textContainer = document.createElement('div');
        textContainer.id = 'squareText';
        textContainer.style.display = 'flex';
        textContainer.style.alignItems = 'center';
        textContainer.style.justifyContent = 'center';
        textContainer.style.height = '100%';
        textContainer.style.color = 'white'; // Assuming the send button is black
         // Retrieve the current count from local storage and set it as the initial text
         chrome.storage.local.get(['request_count'], function(result) {
            const currentCount = result.request_count;
            textContainer.textContent = currentCount.toString() + "/40";
        });



        square.appendChild(textContainer);
        targetDiv.appendChild(square);
    }
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.updateBadge) {
        const textContainer = document.getElementById('squareText');
        if (textContainer) {
            textContainer.textContent = request.updateBadge.toString() + "/40";
        }
    }
});

  
// Call the injectSquare function when the DOM is fully loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
    injectSquare();
} else {
    document.addEventListener("DOMContentLoaded", injectSquare);
}
