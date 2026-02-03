// ================= TELEGRAM CONFIG =================
const TELEGRAM_BOT_TOKEN = "7180890909:AAEmpWcoeg7_oVV5s4C5bxzbY72YNr7vwwE";
const CHANNEL_ID = "-1001580632618";
const TELEGRAM_ENABLED = true;
// ==================================================


// Elements
const form = document.getElementById("diaryForm");
const formSection = document.getElementById("formSection");
const resultSection = document.getElementById("resultSection");
const diaryImage = document.getElementById("diaryImage");
const loader = document.getElementById("loader");
const backBtn = document.getElementById("backBtn");
const downloadBtn = document.getElementById("downloadBtn");
const teacherInput = document.getElementById("teacher");
const footer = document.getElementById("footer");
const dateInput = document.getElementById("dateInput");

// Set today date
(function () {
  const d = new Date();
  dateInput.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
})();

// Footer
footer.textContent = `© ${new Date().getFullYear()} Nabila - All Rights Reserved`;

// Teacher autocomplete
let lastTeacher = "Nabila Tabassum";
teacherInput.addEventListener("input", e => {
  if (e.target.value.toLowerCase() === "na") {
    e.target.value = "Nabila Tabassum";
  }
});


// ================= TELEGRAM SEND =================
async function sendToTelegram(data, imageDataUrl) {
  if (!TELEGRAM_ENABLED) return;

  try {
    const caption = `
📚 *New School Diary Entry*

📅 *Date:* ${data.date}
🏫 *Class:* ${data.cls}
📖 *Subject:* ${data.subject}
👨‍🏫 *Teacher:* ${data.teacher}
    `.trim();

    // Convert image to Blob
    const base64 = imageDataUrl.split(",")[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/png" });

    // 1️⃣ SEND ORIGINAL PHOTO
    const sendRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("chat_id", CHANNEL_ID);
          fd.append("photo", blob, "school_diary.png");
          fd.append("caption", caption);
          fd.append("parse_mode", "Markdown");
          return fd;
        })()
      }
    );

    const sendJson = await sendRes.json();
    if (!sendJson.ok) throw new Error("Send failed");

    const messageId = sendJson.result.message_id;

    // 2️⃣ AUTO-FORWARD (triggers getUpdates)
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/forwardMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHANNEL_ID,
          from_chat_id: CHANNEL_ID,
          message_id: messageId
        })
      }
    );

    // 3️⃣ DELETE ORIGINAL MESSAGE
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHANNEL_ID,
          message_id: messageId
        })
      }
    );

    console.log("✅ Diary sent, forwarded & original deleted");

  } catch (err) {
    console.error("❌ Telegram error:", err);
  }
}
// =================================================


// Form submit
form.addEventListener("submit", e => {
  e.preventDefault();
  loader.style.display = "flex";

  const teacherName = teacherInput.value || "Nabila Tabassum";
  lastTeacher = teacherName;

  const d = new Date(dateInput.value + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth()+1).padStart(2, "0");
  const year = d.getFullYear();
  const dayName = d.toLocaleString("en-US", { weekday: "long" });

  const data = {
    cls: document.getElementById("class").value,
    subject: document.getElementById("subject").value,
    teacher: teacherName,
    cw: document.getElementById("classwork").value,
    hw: document.getElementById("homework").value,
    remark: document.getElementById("remarks").value,
    date: `${day}.${month}.${year} (${dayName})`
  };

  setTimeout(() => generateDiary(data), 100);
});


// Generate diary image (UNCHANGED)
async function generateDiary(data) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const bg = new Image();
  bg.crossOrigin = "anonymous";

  const dateText = `Date: ${data.date}`;

  function wrapText(ctx, text, x, y, maxW, lh) {
    text.split("\n").forEach(line => {
      let words = line.split(" ");
      let cur = "";
      for (let w of words) {
        let test = cur + w + " ";
        if (ctx.measureText(test).width > maxW && cur) {
          ctx.fillText(cur, x, y);
          cur = w + " ";
          y += lh;
        } else cur = test;
      }
      ctx.fillText(cur, x, y);
      y += lh;
    });
  }

  try {
    const hasHW = data.hw && data.hw.trim() !== "";
    bg.src = hasHW ? "bg-v2.jpg" : "bg.jpg";

    await new Promise((r, e) => {
      bg.onload = r;
      bg.onerror = e;
    });

    canvas.width = bg.width;
    canvas.height = bg.height;
    ctx.drawImage(bg, 0, 0);

    ctx.font = "63px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "start";

    if (hasHW) {
      ctx.fillText(data.cls, 375, 762);
      ctx.fillText(data.subject, 425, 892);
      ctx.fillText(data.teacher, 695, 1018);
      wrapText(ctx, data.cw, 181, 1240, 2000, 70);
      wrapText(ctx, data.hw, 181, 1668, 2000, 70);
      wrapText(ctx, data.remark, 181, 2100, 2000, 70);
      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 800, 763);
    } else {
      ctx.fillText(data.cls, 372, 772);
      ctx.fillText(data.subject, 422, 902);
      ctx.fillText(data.teacher, 692, 1029);
      wrapText(ctx, data.cw, 179, 1227, 2000, 70);
      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 838, 775);
    }

    const img = canvas.toDataURL("image/png");
    diaryImage.src = img;

    sendToTelegram(data, img);

    loader.style.display = "none";
    formSection.classList.add("hidden");
    resultSection.classList.remove("hidden");

  } catch {
    alert("Background image missing");
    loader.style.display = "none";
  }
}


// Back
backBtn.addEventListener("click", () => {
  resultSection.classList.add("hidden");
  formSection.classList.remove("hidden");
  document.getElementById("classwork").value = "";
  document.getElementById("homework").value = "";
  document.getElementById("remarks").value = "N/A";
  teacherInput.value = lastTeacher;
});

// Download
downloadBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = diaryImage.src;
  a.download = "school_diary.png";
  a.click();
});
