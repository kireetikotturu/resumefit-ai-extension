import { useState } from 'react'
import './App.css'
import { useEffect } from 'react';

function App() {

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [resumeName, setResumeName] = useState();
  const [resumeUploded, setResume] = useState("");

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_RESULT" }, (response) => {
      if (response.result) {

        const updatedResult = {
          ...response.result,
          score:
            response.result.score <= 1
              ? Math.round(response.result.score * 100)
              : Math.round(response.result.score),
        };

        setResult(updatedResult);
        setResumeName(response.fileName);
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      alert("Upload the resume");
      return;
    }

    const base64 = await blobToBase64(file);

    chrome.runtime.sendMessage({
      type: "RESUME",
      base64: base64,
      fileName: file.name
    }, () => {
      setResume("Resume uploaded successfully");
    });

    setResult(null);
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  return (
  <div className="w-[380px] min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-5">

    {/* Header */}
    <div className="mb-6">
      <h1 className="text-2xl font-bold">
        ATS Resume Analyzer
      </h1>

      <p className="text-slate-400 text-sm">
        Upload your resume and get ATS compatibility score
      </p>
    </div>

    {/* Upload Card */}
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          📄
        </div>

        <div>
          <p className="font-semibold">Resume Upload</p>

          <p className="text-xs text-slate-400">
            PDF files supported
          </p>
        </div>
      </div>

      {resumeUploded && (
        <div className="mb-4 bg-green-500/20 border border-green-500 rounded-lg p-2 text-green-300 text-sm">
          {resumeUploded}
        </div>
      )}

      <input
        type="file"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setResumeName(e.target.files[0].name);
        }}
        className="block w-full text-sm text-slate-300
        file:bg-blue-600
        file:text-white
        file:border-none
        file:px-4
        file:py-2
        file:rounded-lg
        file:cursor-pointer
        cursor-pointer"
      />

      <button
        type="submit"
        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 transition-all py-3 rounded-xl font-semibold"
      >
        Upload Resume
      </button>
    </form>

    {/* Results */}
    {result && (
      <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5">

        {/* Resume */}
        <div className="mb-5">
          <p className="text-slate-400 text-sm">
            Uploaded Resume
          </p>

          <p className="font-semibold truncate">
            {resumeName}
          </p>
        </div>

        {/* Score Circle */}
        <div className="flex flex-col items-center mb-6">

          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold border-4
            ${
              result.score >= 80
                ? "border-green-500 text-green-400"
                : result.score >= 60
                ? "border-yellow-500 text-yellow-400"
                : "border-red-500 text-red-400"
            }`}
          >
            {result.score}%
          </div>

          <p
            className={`mt-3 font-semibold
            ${
              result.score >= 80
                ? "text-green-400"
                : result.score >= 60
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {result.score >= 80
              ? "Excellent Match"
              : result.score >= 60
              ? "Average Match"
              : "Needs Improvement"}
          </p>
        </div>

        {/* Keywords Grid */}
        <div className="space-y-5">

          <div>
            <h3 className="font-semibold text-green-400 mb-3">
              ✅ Matched Keywords
            </h3>

            {result.matched_keywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.matched_keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                No matched keywords
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-red-400 mb-3">
              ❌ Missing Keywords
            </h3>

            {result.missing_keywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                No missing keywords
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-blue-400 mb-2">
              AI Analysis
            </h3>

            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 leading-6">
              {result.reason}
            </div>
          </div>
        </div>

      </div>
    )}

    {/* Remove */}
    {result && (
      <button
        onClick={() => {
          chrome.runtime.sendMessage({
            type: "CLEAR_RESULT",
          });

          setResult(null);
          setFile(null);
          setResume("");
        }}
        className="w-full mt-5 bg-red-600 hover:bg-red-700 transition-all py-3 rounded-xl font-semibold"
      >
        Remove Resume
      </button>
    )}
  </div>
);
}

export default App;