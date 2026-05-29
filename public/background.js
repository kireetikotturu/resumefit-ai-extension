let storedResume = null;
let storedFileName = null;
let storedResult = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_SCORE") {
    callApi(message, sendResponse);
    return true;
  }

  if (message.type === "RESUME") {
    storedResume = message.base64;
    storedFileName = message.fileName;
    storedResult = null;

    sendResponse("Resume Stored");
    return true;
  }

  if (message.type === "GET_RESULT") {
    sendResponse({
      result: storedResult,
      fileName: storedFileName,
    });

    return true;
  }

  if (message.type === "CLEAR_RESULT") {
    storedResult = null;
    storedResume = null;
    storedFileName = null;

    sendResponse("Cleared");
    return true;
  }
});

async function callApi(message, sendResponse) {
  if (!storedResume) {
    sendResponse("Upload Resume");
    return;
  }

  try {
    const apiData = await fetch(
      "https://resumefit-ai-backend-qew8.onrender.com/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jd: message.discription,
          base64: storedResume,
        }),
      }
    );

    const data = await apiData.json();

    storedResult = data.response;

    // Convert score to percentage
    if (storedResult && storedResult.score !== undefined) {
      storedResult.score =
        storedResult.score <= 1
          ? Math.round(storedResult.score * 100)
          : Math.round(storedResult.score);
    }

    sendResponse(`${storedResult.score}%`);
  } catch (err) {
    console.error(err);
    sendResponse("Server Error");
  }
}