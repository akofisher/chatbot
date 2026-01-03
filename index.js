import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;


app.get("/", (_, res) => {
  res.send("Chatbot API is running");
});

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",


        "HTTP-Referer": "https://chatbot-ypfo.onrender.com/chat", 
        "X-Title": "Ako Portfolio Chatbot",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages,
        temperature: 0.6,
        max_tokens: 120,
      }),
    });

    clearTimeout(timeout);

    // 🚨 Handle rate limits clearly
    if (response.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment.",
      });
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", text);
      return res.status(500).json({ error: "AI provider error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request timeout" });
    }

    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
