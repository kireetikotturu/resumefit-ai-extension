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
        body: JSON.stringify({
          jd: message.discription,
          base64: storedResume,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await apiData.json();

    // Convert score and save converted value
    storedResult = {
      ...data.response,
      score:
        data.response.score <= 1
          ? Math.round(data.response.score * 100)
          : Math.round(data.response.score),
    };

    sendResponse(`${storedResult.score}%`);
  } catch (err) {
    console.log(err);
    sendResponse("Server Error");
  }
}