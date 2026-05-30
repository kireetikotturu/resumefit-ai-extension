import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState("");
  const [animateScore, setAnimateScore] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_RESULT" }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.result) {
        setResult(normalizeScore(response.result));
        setResumeName(response.fileName || "");
        setResumeUploaded("Resume uploaded successfully");
        setTimeout(() => setAnimateScore(true), 100);
      }
    });
  }, []);

  function normalizeScore(res) {
    if (!res) return res;
    return {
      ...res,
      score: res.score <= 1 ? Math.round(res.score * 100) : Math.round(res.score),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { alert("Upload the resume"); return; }
    const base64 = await blobToBase64(file);
    chrome.runtime.sendMessage(
      { type: "RESUME", base64, fileName: file.name },
      (response) => {
        if (chrome.runtime.lastError) { alert("Extension error - try reloading"); return; }
        setResumeUploaded("Resume uploaded successfully");
        setResult(null);
        setAnimateScore(false);
      }
    );
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  function handleClear() {
    chrome.runtime.sendMessage({ type: "CLEAR_RESULT" });
    setResult(null);
    setFile(null);
    setResumeUploaded("");
    setResumeName("");
    setAnimateScore(false);
  }

  const scoreColor = result
    ? result.score >= 80
      ? { ring: '#22c55e', text: '#16a34a', bg: '#f0fdf4' }
      : result.score >= 60
      ? { ring: '#f59e0b', text: '#d97706', bg: '#fffbeb' }
      : { ring: '#ef4444', text: '#dc2626', bg: '#fef2f2' }
    : null;

  return (
    <div style={{
      width: 380,
      minHeight: '100vh',
      background: '#f8f9fb',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: #ffffff; border-radius: 16px; border: 1px solid #eaecf0; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .btn-primary { width: 100%; background: #111827; color: #fff; border: none; border-radius: 12px; padding: 13px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.2s, transform 0.1s; letter-spacing: 0.01em; }
        .btn-primary:hover { background: #1f2937; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-danger { width: 100%; background: #fff; color: #ef4444; border: 1.5px solid #fecaca; border-radius: 12px; padding: 13px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-danger:hover { background: #fef2f2; }
        .file-input { display: block; width: 100%; font-size: 13px; color: #6b7280; cursor: pointer; }
        .file-input::file-selector-button { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 500; cursor: pointer; margin-right: 12px; font-family: inherit; transition: background 0.15s; }
        .file-input::file-selector-button:hover { background: #e9eaec; }
        .tag { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 12px; font-weight: 500; margin: 3px; }
        .tag-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .tag-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .score-ring { transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1); }
        .fade-in { animation: fadeUp 0.4s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .divider { height: 1px; background: #f0f1f3; margin: 16px 0; }
        .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 10px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, background: '#111827', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>ResumeFit AI</h1>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>ATS Compatibility Analyzer</p>
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="section-label">Resume</p>

        {resumeUploaded && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '9px 13px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{resumeUploaded}</span>
          </div>
        )}

        <input
          type="file"
          accept=".pdf"
          className="file-input"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setResumeName(e.target.files[0]?.name || "");
          }}
          style={{ marginBottom: 14 }}
        />

        <button className="btn-primary" onClick={handleSubmit} type="button">
          Upload Resume
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in">

          {/* Score Card */}
          <div className="card" style={{ marginBottom: 14, textAlign: 'center' }}>

            {resumeName && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, textAlign: 'left' }}>
                  <div style={{ width: 34, height: 34, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Analyzed file</p>
                    <p style={{ fontSize: 13, color: '#111827', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumeName}</p>
                  </div>
                </div>
                <div className="divider" />
              </>
            )}

            {/* SVG Score Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="#f0f1f3" strokeWidth="8"/>
                  <circle
                    cx="55" cy="55" r="46"
                    fill="none"
                    stroke={scoreColor.ring}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={animateScore ? `${2 * Math.PI * 46 * (1 - result.score / 100)}` : `${2 * Math.PI * 46}`}
                    className="score-ring"
                    transform="rotate(-90 55 55)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: scoreColor.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{result.score}%</span>
                </div>
              </div>
              <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: scoreColor.text }}>
                {result.score >= 80 ? 'Excellent Match' : result.score >= 60 ? 'Good Match' : 'Needs Improvement'}
              </p>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>ATS Compatibility Score</p>
            </div>
          </div>

          {/* Keywords Card */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <p className="section-label" style={{ color: '#16a34a' }}>✓ Matched Keywords</p>
              {result.matched_keywords?.length > 0 ? (
                <div>{result.matched_keywords.map((kw, i) => (
                  <span key={i} className="tag tag-green">{kw}</span>
                ))}</div>
              ) : (
                <p style={{ fontSize: 12, color: '#9ca3af' }}>No matched keywords found</p>
              )}
            </div>

            <div className="divider" />

            <div>
              <p className="section-label" style={{ color: '#dc2626' }}>✗ Missing Keywords</p>
              {result.missing_keywords?.length > 0 ? (
                <div>{result.missing_keywords.map((kw, i) => (
                  <span key={i} className="tag tag-red">{kw}</span>
                ))}</div>
              ) : (
                <p style={{ fontSize: 12, color: '#9ca3af' }}>No missing keywords</p>
              )}
            </div>
          </div>

          {/* Analysis Card */}
          <div className="card" style={{ marginBottom: 14 }}>
            <p className="section-label">AI Analysis</p>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, fontWeight: 400 }}>{result.reason}</p>
          </div>

          <button className="btn-danger" onClick={handleClear}>Remove Resume</button>
        </div>
      )}
    </div>
  );
}

export default App;
