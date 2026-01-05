import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 1. Create a variable to store conversation history for each user
const chatHistory = {};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text) return;

  // 2. Initialize history for this user if it doesn't exist
  if (!chatHistory[chatId]) {
    chatHistory[chatId] = [
      { role: "system", content: "You are a helpful assistant." }
    ];
  }

  // 3. Add the user's new message to the history
  chatHistory[chatId].push({ role: "user", content: text });

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // Make sure this model ID is correct for your account
        // 4. Send the ENTIRE history, not just the current text
        messages: chatHistory[chatId]
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "…";

    // 5. Add the bot's reply to the history so it remembers it next time
    chatHistory[chatId].push({ role: "assistant", content: reply });

    // Optional: Keep history short (e.g., last 20 messages) to save tokens/memory
    if (chatHistory[chatId].length > 20) {
      chatHistory[chatId] = chatHistory[chatId].slice(-20);
    }

    bot.sendMessage(chatId, reply);
  } catch (e) {
    console.error(e); // Log error to console for debugging
    bot.sendMessage(chatId, "uh— error aa gaya 😔");
  }
});
