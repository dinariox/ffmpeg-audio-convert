const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

// Erstelle die Verzeichnisse "uploads" und "converted", falls sie nicht vorhanden sind
const createDirectories = () => {
  const directories = ["uploads", "converted"];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
};

app.get("/", (req, res) => {
  return res.status(200).json({ hello: "world" });
});

app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const inputFilePath = req.file.path;
  const outputFilePath = `converted/${req.file.filename}.mp3`;

  ffmpeg(inputFilePath)
    .output(outputFilePath)
    .on("end", () => {
      res.download(outputFilePath, (err) => {
        if (err) {
          console.error("Error during file download:", err);
          res.status(500).json({ error: "Error during file download" });
        }
        fs.unlink(inputFilePath, (err) => {
          if (err) console.error("Error deleting input file:", err);
        });
        fs.unlink(outputFilePath, (err) => {
          if (err) console.error("Error deleting output file:", err);
        });
      });
    })
    .on("error", (err) => {
      console.error("Error during conversion:", err);
      res.status(500).json({ error: "Error during conversion" });
      fs.unlink(inputFilePath, (err) => {
        if (err) console.error("Error deleting input file:", err);
      });
    })
    .run();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  createDirectories();
  console.log(`Server is running on port ${port}`);
});
