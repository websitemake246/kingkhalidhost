const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

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

    // Write a basic bot script with the /developer command
    const botScript = `
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf('${token}');

        bot.start((ctx) => ctx.reply('Hello! Your bot is running!'));

        // /developer command
        bot.command('developer', (ctx) => {
            ctx.reply('I am King Khalid, I am the developer.');
        });

        bot.launch();
        console.log("Bot started successfully!");
    `;

    fs.writeFileSync(path.join(userDir, "bot.js"), botScript);

    // Install dependencies and start the bot
    fs.writeFileSync(path.join(userDir, "package.json"), JSON.stringify({
        name: "telegram-bot",
        version: "1.0.0",
        main: "bot.js",
        dependencies: { "telegraf": "^4.12.2" }
    }, null, 2));

    exec(`cd ${userDir} && npm install && node bot.js`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error starting bot:", error);
            return res.status(500).json({ message: "Bot deployment failed." });
        }
        console.log("Bot started:", stdout);
        res.json({ message: "Bot deployed and running!" });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
