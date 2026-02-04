// -------- CONFIG --------
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Groq model[web:90]
const GROQ_MAX_TOKENS = 512;
const GROQ_DAILY_LIMIT = 10;

// When using PythonAnywhere backend, we don't put the key here.
const BACKEND_URL = "https://superdev2775.pythonanywhere.com/api/groq/chat";

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
  if (el) {
    el.textContent = `Groq uses today: ${u.count}/${GROQ_DAILY_LIMIT}`;
  }
}

// -------- BACKEND CALL (GROQ VIA FLASK) --------
async function callGroqChat(prompt) {
  const usage = getUsage();
  if (usage.count >= GROQ_DAILY_LIMIT) {
    throw new Error("Daily Groq limit reached.");
  }

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Backend error: ${res.status} ${errText}`);
  }

  incrementUsage();
  updateUsageUI();

  const json = await res.json();
  return json.answer;
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

async function getDogUrl() {
  const res = await fetch("https://dog.ceo/api/breeds/image/random");
  const data = await res.json();
  return data.message; // image URL
}

async function getFoxUrl() {
  const res = await fetch("https://randomfox.ca/floof/");
  const data = await res.json();
  return data.image; // image URL
}

async function getDuckUrl() {
  const res = await fetch("https://random-d.uk/api/v2/random");
  const data = await res.json();
  return data.url; // image URL
}

// -------- HOOK UP UI --------
document.addEventListener("DOMContentLoaded", () => {
  updateUsageUI();

  // Groq
  const groqBtn = document.getElementById("groq-btn");
  const groqInput = document.getElementById("groq-input");
  const groqOutput = document.getElementById("groq-output");

  if (groqBtn && groqInput && groqOutput) {
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
  }

  // Joke
  const jokeBtn = document.getElementById("joke-btn");
  const jokeOutput = document.getElementById("joke-output");

  if (jokeBtn && jokeOutput) {
    jokeBtn.addEventListener("click", async () => {
      jokeOutput.textContent = "Loading joke...";
      try {
        const joke = await getJoke();
        jokeOutput.textContent = joke;
      } catch (err) {
        jokeOutput.textContent = err.message;
      }
    });
  }

  // Cat
  const catBtn = document.getElementById("cat-btn");
  const catOutput = document.getElementById("cat-output");

  if (catBtn && catOutput) {
    catBtn.addEventListener("click", async () => {
      catOutput.innerHTML = "Loading cat...";
      try {
        const url = await getCatUrl();
        catOutput.innerHTML = `<img src="${url}" alt="Cat" style="max-width: 100%; border-radius: 8px;" />`;
      } catch (err) {
        catOutput.textContent = err.message;
      }
    });
  }

  // Dog
  const dogBtn = document.getElementById("dog-btn");
  const dogOutput = document.getElementById("dog-output");

  if (dogBtn && dogOutput) {
    dogBtn.addEventListener("click", async () => {
      dogOutput.innerHTML = "Loading dog...";
      try {
        const url = await getDogUrl();
        dogOutput.innerHTML = `<img src="${url}" alt="Dog" style="max-width: 100%; border-radius: 8px;" />`;
      } catch (err) {
        dogOutput.textContent = err.message;
      }
    });
  }

  // Fox
  const foxBtn = document.getElementById("fox-btn");
  const foxOutput = document.getElementById("fox-output");

  if (foxBtn && foxOutput) {
    foxBtn.addEventListener("click", async () => {
      foxOutput.innerHTML = "Loading fox...";
      try {
        const url = await getFoxUrl();
        foxOutput.innerHTML = `<img src="${url}" alt="Fox" style="max-width: 100%; border-radius: 8px;" />`;
      } catch (err) {
        foxOutput.textContent = err.message;
      }
    });
  }

  // Duck
  const duckBtn = document.getElementById("duck-btn");
  const duckOutput = document.getElementById("duck-output");

  if (duckBtn && duckOutput) {
    duckBtn.addEventListener("click", async () => {
      duckOutput.innerHTML = "Loading duck...";
      try {
        const url = await getDuckUrl();
        duckOutput.innerHTML = `<img src="${url}" alt="Duck" style="max-width: 100%; border-radius: 8px;" />`;
      } catch (err) {
        duckOutput.textContent = err.message;
      }
    });
  }
});
