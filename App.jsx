import React, { useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isUploaded, setIsUploaded] = useState(false); // Track upload status

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsUploaded(false); // Reset analysis when new file is selected
    setMessage("");
    setAnalysisResult("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(response.data.message);
      setIsUploaded(true); // Mark upload as successful
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Failed to upload file.");
    }
  };

  const handleSurveyClick = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLScyZPmIzPFQLTxc5kDpE7pBe80gdFlbXSLiFdNehX2ge_Pnbw/viewform",
      "_blank"
    );
  };

  const handleAnalyze = async () => {
    if (!isUploaded) {
      setAnalysisResult("Please upload an image first before analyzing.");
      return;
    }

    setIsProcessing(true); // Show loading message

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.error) {
        setAnalysisResult(data.error);
      } else {
        setAnalysisResult(
          `Skin Type: ${data.skin_type}\n\nRecommendations:\n\n- ${data.recommendations.join("\n\n- ")}`
        );
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisResult("Error connecting to server.");
    } finally {
      setIsProcessing(false); // Hide loading message
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Skin Care Detection Platform</h1>
        <nav>
          <a href="#">Home</a>
          <a href="#">About Us</a>
          <a href="#">Contact</a>
        </nav>
      </header>

      <main>
        <h2>Welcome to Skin Care Services Platform</h2>
        <p>Presenting Your Personal Skin Care Assistant.</p>

        <div className="card">
          <p><strong>Please upload a recent well-lit picture of your skin...</strong></p>
          <input type="file" onChange={handleFileChange} />
          <br />
          <button onClick={handleUpload} style={{ marginTop: "15px" }}>Confirm Upload</button>
          <p>{message}</p>
        </div>

        <div className="card">
          <h3>Take the Survey</h3>
          <p>
            After uploading the Image, Answer a few questions related to your
            Skin Conditions to improve accuracy.
          </p>
          <button onClick={handleSurveyClick}>Press Here For Survey Link</button>
        </div>

        <div className="card">
          <h3>Results</h3>
          <p>Click the button below to view analysis.</p>
          <button onClick={handleAnalyze}>View Analysis</button>
          {isProcessing && (
            <div className="processing-box">
              Analysis is being processed, Please wait while we ensure the best
              Skincare Recommendations...
            </div>
          )}
          <div className="analysis-box">
            <h3>Analysis Result:</h3>
            <pre style={{ fontSize: "14.5px", lineHeight: "1.8" }}>{analysisResult || "Your analysis will appear here."}</pre>
          </div>
        </div>
      </main>

      <footer>
        <p>Software Engineering Project Group 6</p>
        <p>
          Created by 23MIC0008 Dara Karthikeya, 23MIC0062 Dandu Shaik Mahewish,
          23MIC0070 Pendyala Praveen, 23MID0451 Vakiti Vinith
        </p>
      </footer>
    </div>
  );
}

export default App;
