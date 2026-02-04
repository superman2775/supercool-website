// -------- CONFIG --------
const GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE"; // for local dev only
const GROQ_MODEL = "llama-3.3-70b-versatile";  // pick from Groq docs[web:90]
const GROQ_MAX_TOKENS = 512;
const GROQ_DAILY_LIMIT = 20;

// -------- DAILY LIMIT LOGIC --------
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getUsage() {
  const today = getTodayKey();
  const raw = localStorage.getItem("groq_usage");
  if (!raw) {
    return { date: today, count: 0 };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }
    return parsed;
  } catch {
    return { date: today, count: 0 };
  }
}

function setUsage(count) {
  const today = getTodayKey();
  localStorage.setItem("groq_usage", JSON.stringify({ date: today, count }));
}

function incrementUsage() {
  const u = getUsage();
  const newCount = u.count + 1;
  setUsage(newCount);
  return newCount;
}

function updateUsageUI() {
  const u = getUsage();
  const el = document.getElementById("groq-usage");
  el.textContent = `Groq uses today: ${u.count}/${GROQ_DAILY_LIMIT}`;
}

// -------- GROQ CALL --------
async function callGroqChat(prompt) {
  const usage = getUsage();
  if (usage.count >= GROQ_DAILY_LIMIT) {
    throw new Error("Daily Groq limit reached.");
  }

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: GROQ_MAX_TOKENS,
    stream: false
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error: ${res.status} ${errText}`);
  }

  incrementUsage();
  updateUsageUI();

  const json = await res.json();
  return json.choices[0].message.content;
}

// -------- OTHER APIS (examples) --------
async function getJoke() {
  const res = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode");
  const data = await res.json();
  if (data.type === "single") return data.joke;
  return `${data.setup}\n${data.delivery}`;
}

async function getCatUrl() {
  const res = await fetch("https://api.thecatapi.com/v1/images/search");
  const data = await res.json();
  return data[0].url;
}

// -------- HOOK UP UI --------
document.addEventListener("DOMContentLoaded", () => {
  updateUsageUI();

  const groqBtn = document.getElementById("groq-btn");
  const groqInput = document.getElementById("groq-input");
  const groqOutput = document.getElementById("groq-output");

  groqBtn.addEventListener("click", async () => {
    const prompt = groqInput.value.trim();
    if (!prompt) return;
    groqOutput.textContent = "Thinking...";
    try {
      const answer = await callGroqChat(prompt);
      groqOutput.textContent = answer;
    } catch (err) {
      groqOutput.textContent = err.message;
    }
  });

  const jokeBtn = document.getElementById("joke-btn");
  const jokeOutput = document.getElementById("joke-output");

  jokeBtn.addEventListener("click", async () => {
    jokeOutput.textContent = "Loading joke...";
    try {
      const joke = await getJoke();
      jokeOutput.textContent = joke;
    } catch (err) {
      jokeOutput.textContent = err.message;
    }
  });

  const catBtn = document.getElementById("cat-btn");
  const catOutput = document.getElementById("cat-output");

  catBtn.addEventListener("click", async () => {
    catOutput.innerHTML = "Loading cat...";
    try {
      const url = await getCatUrl();
      catOutput.innerHTML = `<img src="${url}" alt="Cat" style="max-width: 300px;" />`;
    } catch (err) {
      catOutput.textContent = err.message;
    }
  });
});
