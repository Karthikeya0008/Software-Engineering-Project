const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
console.log("Current directory:", __dirname);


const app = express();
const uploadDir = path.join(__dirname, "uploads");


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const corsOptions = {
  origin: "http://localhost:5173", 
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));
app.use(express.json());

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

let lastUploadedFile = "";

// Function to classify the image using Python script
const classifyImage = (imagePath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "classify.py");

    if (!fs.existsSync(pythonScript)) {
      console.error("Python script not found:", pythonScript);
      return reject("Python script is missing.");
    }

    console.log(`Running Python script: ${pythonScript}`);
    console.log(`Image path: ${imagePath}`);

    const pythonProcess = spawn("python", [pythonScript, imagePath]);

    let resultData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      resultData = data.toString();
      console.log("Python Output:", data.toString());
    });

    // pythonProcess.stderr.on("data", (data) => {
    //   errorData += data.toString();
    //   console.error("Python Error:", data.toString());
    // });

    pythonProcess.on("close", (code) => {
      console.log(`Python script exited with code: ${code}`);

      if (errorData) {
        console.error("Python script error:", errorData);
        return reject(errorData.trim());
      }

      try {
        console.log("result data",resultData)
        const parsedResult = JSON.parse(resultData.trim());
        if (!parsedResult.skin_type) {
          throw new Error("Invalid JSON output from Python script.");
        }
        resolve(parsedResult);
      } catch (error) {
        console.error("Failed to parse Python output:", resultData, error);
        reject("Error parsing classification result.");
      }
    });
  });
};


// Upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  lastUploadedFile = path.join(uploadDir, req.file.filename);
  console.log(`File uploaded: ${lastUploadedFile}`);
  res.json({ message: "File uploaded successfully", filename: req.file.filename });
});

// Analyze endpoint
app.get("/analyze", async (req, res) => {
  if (!lastUploadedFile) {
    return res.status(400).json({ error: "No image uploaded yet." });
  }

  try {
    console.log("itsme")
    const result = await classifyImage(lastUploadedFile);
    console.log("testing", result["skin_type"]);
    if (!result || typeof result["skin_type"] !== "string") {
      return res.status(500).json({ error: "Failed to process image." });
    }

    // Mapping ML result to skin type
    const skinTypeMap = {
      Acne: "Acne-Prone Skin",
      DarkCircles: "Dark Circles",
      Dry: "Dry Skin",
      Normal: "Normal Skin",
      Oily: "Oily Skin",
      Wrinkled: "Wrinkled Skin",
    };

    const skinType = skinTypeMap[result["skin_type"]] || "Unknown Skin Type";
    console.log("aaaaaaaaaaaaaaaaaaa",skinType)
    // Recommendations based on skin type
    const recommendationsMap = {
      "Acne-Prone Skin": [
        "Use a salicylic acid or benzoyl peroxide facewash.",
        "Apply a niacinamide serum to control oil.",
        "Use a lightweight moisturizer with hyaluronic acid.",
        "Apply a benzoyl peroxide spot treatment for breakouts.",
        "Use non-comedogenic sunscreen (SPF 30+).",
      ],
      "Dark Circles": [
        "Apply a vitamin C or caffeine-based eye cream.",
        "Use a cold compress to reduce puffiness.",
        "Get enough sleep and stay hydrated.",
      ],
      "Dry Skin": [
        "Use a hydrating cleanser.",
        "Apply a moisturizer with hyaluronic acid and ceramides.",
        "Drink plenty of water.",
      ],
      "Normal Skin": [
        "Maintain a balanced skincare routine.",
        "Use a gentle cleanser and lightweight moisturizer.",
        "Apply sunscreen daily.",
      ],
      "Oily Skin": [
        "Use an oil-free cleanser.",
        "Apply a lightweight, non-comedogenic moisturizer.",
        "Use blotting papers throughout the day.",
      ],
      "Wrinkled Skin": [
        "Use a retinol-based night cream.",
        "Apply a moisturizer with peptides and antioxidants.",
        "Wear sunscreen daily to prevent further aging.",
      ],
    };

    const recommendations = recommendationsMap[skinType] || ["No recommendations available."];
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhh",recommendations)
    res.json({ skin_type: skinType, recommendations });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Server error during analysis." });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
