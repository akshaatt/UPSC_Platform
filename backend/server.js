require("dotenv").config();
const pool = require("./db");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch"); // make sure you installed node-fetch@2

console.log(
  "Loaded API Key:",
  process.env.OPENAI_API_KEY ? "✅ Exists" : "❌ Missing"
);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ✅ Test DB connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection error:", err);
  } else {
    console.log("DB connected:", res.rows[0]);
  }
});

// ✅ Test API route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ AI Q&A API route
app.post("/api/ask", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ answer: "No question provided." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI tutor specialized in UPSC preparation. Answer clearly and concisely.",
          },
          { role: "user", content: query },
        ],
        max_tokens: 500, // limit response length
      }),
    });

    const data = await response.json();
    console.log("🔍 OpenAI raw response:", data); // 👈 log response

    if (data.error) {
      return res
        .status(500)
        .json({ answer: `API Error: ${data.error.message}` });
    }

    const answer = data.choices?.[0]?.message?.content?.trim();
    res.json({ answer: answer || "⚠️ AI returned an empty response." });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ answer: "Error contacting AI service." });
  }
});

// ✅ Socket.io chat
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg); // broadcast to all
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
