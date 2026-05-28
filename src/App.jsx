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
        setResult(response.result);
        setResumeName(response.fileName);
      }
    });
  }, [])

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
    })

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
    <div className="w-[360px] p-4 bg-gray-50 min-h-screen font-sans">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <p className="text-lg font-semibold mb-3 text-gray-700">Upload Resume</p>
        <p className='text-sm text-green-500 font-bold'>{resumeUploded}</p>
        <input type='file' onChange={(e) => { setFile(e.target.files[0]); setResumeName(e.target.files[0].name) }} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-10 cursor-pointer" />
        <input type='submit' value="Upload" className="mt-4 w-full bg-blue-600 text-white text-mb py-2 rounded-lg hover:bg-blue-700 transition duration-200 cursor-pointer" />
      </form>


      {result &&
        <div className="mt-6 bg-white p-4 rounded-xl shadow-md border border-gray-200 overflow-auto">
          <p>Resume: <span className="text-gray-700 font-bold">{resumeName}</span></p>
          <div className='flex justify-between mb-3 text-xl font-bold'>
            <h3 className="text-blue-600">Score: {result.score}%</h3>
            <p className={`${result.score > 79 ? "text-green-500" : result.score > 60 ? "text-orange-500" : "text-red-500"}`}>{result.score > 79 ? "High" : result.score > 60 ? "Medium" : "Low"}</p>
          </div>


          <div className="mb-4">
            <p className="font-semibold text-green-600 mb-2">Matched Keywords</p>
            {result.matched_keywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.matched_keywords.map((keyword, i) => (
                  <span key={i} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md">
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No keywords matched.</p>
            )}
          </div>

          <div className='mb-4'>
            <p className="font-semibold text-red-600 mb-2">Missing Keywords</p>
            {result.missing_keywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map((keyword, i) => (
                  <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md">{keyword}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No missing keywords.</p>
            )}
          </div>

          <div className='text-gray-500 text-sm'>{result.reason}</div>
        </div>
      }

      {result &&
        <button onClick={() => {
          chrome.runtime.sendMessage({ type: "CLEAR_RESULT" });
          setResult(null);
          setFile(null);
          setResume("");
        }} className="mt-5 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-200 cursor-pointer">Remove resume</button>
      }
    </div>
  )
}

export default App
