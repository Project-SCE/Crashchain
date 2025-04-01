const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

// Endpoint to handle OBD data
app.post("/obd", (req, res) => {
  console.log("OBD Data Received:", req.body);
  res.send("OBD data received successfully!");
});

// Endpoint to handle image upload
app.post("/image", (req, res) => {
  if (!req.body || req.body.length === 0) {
    res.status(400).send("No image uploaded.");
    return;
  }

  const filePath = `uploads/image_${Date.now()}.jpg`;
  fs.writeFile(filePath, req.body, (err) => {
    if (err) {
      console.error("Failed to save image:", err);
      res.status(500).send("Failed to save image.");
    } else {
      console.log("Image saved:", filePath);
      res.send("Image uploaded successfully!");
    }
  });
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
