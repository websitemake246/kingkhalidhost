const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // Auto-assign Render's port

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (like the front-end)
app.use(express.static("public"));

// Route to deploy bots
app.post("/deploy", (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Bot token is required!" });
    }

    // Create a directory for the user
    const userDir = path.join(__dirname, "bots", token);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    // Write a basic bot script
    const botScript = `
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf('${token}');

        bot.start((ctx) => ctx.reply('Hello! Your bot is running!'));
        bot.launch();

        console.log("Bot started with token: ${token}");
    `;

    fs.writeFileSync(path.join(userDir, "bot.js"), botScript);

    return res.json({ message: "Bot deployed successfully!" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
