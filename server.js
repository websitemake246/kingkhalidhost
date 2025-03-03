const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
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

    // Write bot script with real song download
    const botScript = `
        const { Telegraf } = require('telegraf');
        const { exec } = require('child_process');
        const path = require('path');
        const fs = require('fs');

        const bot = new Telegraf('${token}');

        bot.start((ctx) => ctx.reply('Hello! Your bot is running!'));

        // Developer command
        bot.command('developer', (ctx) => {
            ctx.reply('I am King Khalid, I am the developer.');
        });

        // Song download command
        bot.command('song', async (ctx) => {
            const query = ctx.message.text.split(" ").slice(1).join(" ");
            if (!query) return ctx.reply("Please provide a song name. Example: /song Shape of You");

            ctx.reply(\`Downloading song: \${query}, please wait...\`);

            const outputDir = path.join(__dirname, "downloads");
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const outputFile = path.join(outputDir, \`\${query.replace(/ /g, "_")}.mp3\`);

            exec(\`yt-dlp -x --audio-format mp3 --output "\${outputFile}" ytsearch1:"\${query}"\`, (error, stdout, stderr) => {
                if (error) {
                    console.error("Error downloading song:", error);
                    return ctx.reply("Failed to download the song. Try another one.");
                }

                ctx.replyWithAudio({ source: outputFile }).then(() => {
                    fs.unlinkSync(outputFile); // Delete file after sending
                });
            });
        });

        bot.launch();
        console.log("Bot started successfully!");
    `;

    fs.writeFileSync(path.join(userDir, "bot.js"), botScript);

    // Create package.json
    fs.writeFileSync(path.join(userDir, "package.json"), JSON.stringify({
        name: "telegram-bot",
        version: "1.0.0",
        main: "bot.js",
        dependencies: { 
            "telegraf": "^4.12.2", 
            "child_process": "^1.0.2" 
        }
    }, null, 2));

    // Install dependencies and run bot with PM2
    exec(`cd ${userDir} && npm install && npx pm2 start bot.js --name bot-${token}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error starting bot:", error);
            return res.status(500).json({ message: "Bot deployment failed." });
        }
        console.log("Bot started:", stdout);
        res.json({ message: "Bot deployed and running!" });
    });
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
