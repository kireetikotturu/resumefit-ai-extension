let tooltip;

document.addEventListener("mouseup", () => {

    setTimeout(() => {

        const selectedText = window.getSelection().toString().trim();

        if (selectedText.length > 50) {

            createTooltip(selectedText);

        }

    }, 100);

});

document.addEventListener("mousedown", (e) => {

    if (tooltip && !tooltip.contains(e.target)) {

        tooltip.remove();

    }

});

function createTooltip(selectedText) {

    if (tooltip) {

        tooltip.remove();

    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {

        return;

    }

    const range = selection.getRangeAt(0);

    const rect = range.getBoundingClientRect();

    tooltip = document.createElement("div");

    tooltip.innerText = "Check Score";

    tooltip.style.position = "absolute";
    tooltip.style.background = "#2563eb";
    tooltip.style.color = "#ffffff";
    tooltip.style.padding = "10px 16px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.fontSize = "14px";
    tooltip.style.fontWeight = "600";
    tooltip.style.fontFamily = "Segoe UI, sans-serif";
    tooltip.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
    tooltip.style.zIndex = "999999";
    tooltip.style.cursor = "pointer";

    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;

    tooltip.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(tooltip);

    tooltip.onclick = async () => {

        tooltip.innerText = "Loading...";

        try {

            chrome.runtime.sendMessage(
                {
                    type: "CHECK_SCORE",
                    discription: selectedText
                },

                (response) => {

                    if (chrome.runtime.lastError) {

                        console.log(chrome.runtime.lastError);

                        tooltip.innerText = "Extension Error";

                        return;
                    }

                    if (!response) {

                        tooltip.innerText = "No Response";

                        return;
                    }

                    tooltip.innerText = response;

                    setTimeout(() => {

                        tooltip.innerText = "Check Score";

                    }, 4000);

                }
            );

            setTimeout(() => {

                if (tooltip.innerText === "Loading...") {

                    tooltip.innerText = "Server Busy";

                }

            }, 15000);

        } catch (err) {

            console.log(err);

            tooltip.innerText = "Error";
        }

    };

}
