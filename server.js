require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const jwt = require("jsonwebtoken");

const app = express();

const port = process.env.PORT;


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


const systemPrompt = fs.readFileSync(path.join(__dirname, "prompts", "system_prompt.txt"), "utf-8");


// app.post("/simulate", async (req, res) => {
//   try {
//     const patient = req.body;

//     const prompt = `
// ${systemPrompt}

// Patient:
// ${JSON.stringify(patient)}
// `;

//     const response = await fetch("http://localhost:11434/api/generate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         model: "phi3",
//         prompt: prompt,
//         stream: false
//       })
//     });

//     const data = await response.json();

//     let text = data.response;

//     // 🔧 Extract JSON safely
//     const match = text.match(/\{[\s\S]*\}/);

//     if (!match) {
//       return res.json({
//         error: "Invalid AI response",
//         raw: text
//       });
//     }

//     const result = JSON.parse(match[0]);

//     res.json(result);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Ollama error" });
//   }
// });


app.post("/simulate", async (req, res) => {
  try {
    const patient = req.body;

    const prompt = `
${systemPrompt}

Patient:
${JSON.stringify(patient)}

IMPORTANT:
Return ONLY valid JSON.
`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "phi3",
        prompt,
        stream: false
      })
    });

    // ✅ Check HTTP error
    if (!response.ok) {
      const errText = await response.text();
      console.error("Ollama HTTP error:", errText);
      return res.status(500).json({ error: "Ollama HTTP error" });
    }

    const data = await response.json();

    console.log("RAW OLLAMA RESPONSE:", data); // 🔥 IMPORTANT DEBUG

    // ✅ Validate response field
    if (!data || !data.response) {
      return res.status(500).json({
        error: "Invalid Ollama response",
        raw: data
      });
    }

    const text = data.response;

    // ✅ Safe JSON extraction
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({
        error: "No JSON found in response",
        raw: text
      });
    }

    let result;
    try {
      result = JSON.parse(match[0]);
    } catch (err) {
      return res.status(500).json({
        error: "JSON parse failed",
        raw: match[0]
      });
    }

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crash" });
  }
});

app.get("/patient-data", (req,res) => {
 res.render("patientForm.ejs")
})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})