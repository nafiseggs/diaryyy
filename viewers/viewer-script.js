// ================= TELEGRAM CONFIG =================
const BOT_TOKEN = "7180890909:AAEmpWcoeg7_oVV5s4C5bxzbY72YNr7vwwE";
const CHANNEL_ID = "-1001580632618";
// ==================================================


// Elements
const formCard = document.getElementById("formCard");
const diaryDisplay = document.getElementById("diaryDisplay");
const loader = document.getElementById("loader");
const viewBtn = document.getElementById("viewBtn");
const backBtn = document.getElementById("backBtn");
const downloadDiaryBtn = document.getElementById("downloadDiaryBtn");
const diaryImageView = document.getElementById("diaryImageView");
const noDiary = document.getElementById("noDiary");
const diaryTitle = document.getElementById("diaryTitle");
const viewDate = document.getElementById("viewDate");

// Set today's date
viewDate.value = new Date().toISOString().split("T")[0];


// View button
viewBtn.addEventListener("click", async () => {
  const classValue = document.getElementById("viewClass").value;
  const subjectValue = document.getElementById("viewSubject").value;
  const dateValue = viewDate.value;

  if (!classValue || !subjectValue || !dateValue) {
    alert("⚠️ Please select class, subject, and date");
    return;
  }

  loader.classList.remove("hidden");
  await fetchDiary(classValue, subjectValue, dateValue);
});


// Back button
backBtn.addEventListener("click", () => {
  diaryDisplay.classList.add("hidden");
  formCard.classList.remove("hidden");
});


// Download
downloadDiaryBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = diaryImageView.src;
  a.download = "school_diary.png";
  a.click();
});


// ================= FETCH DIARY =================
async function fetchDiary(classValue, subjectValue, dateValue) {
  try {
    const d = new Date(dateValue + "T00:00:00");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");

    // Partial date match (VERY IMPORTANT)
    const dateKey = `${day}.${month}`;

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100`
    );
    const json = await res.json();

    if (!json.ok) throw new Error("Telegram API error");

    let foundPhoto = null;

    // Search newest → oldest
    for (let i = json.result.length - 1; i >= 0; i--) {
      const upd = json.result[i];
      if (!upd.channel_post) continue;

      const post = upd.channel_post;

      if (
        post.photo &&
        post.caption &&
        post.caption.includes(classValue) &&
        post.caption.includes(subjectValue) &&
        post.caption.includes(dateKey)
      ) {
        foundPhoto = post.photo;
        break;
      }
    }

    loader.classList.add("hidden");

    if (!foundPhoto) {
      showNoDiary();
      return;
    }

    // Get best quality photo
    const photoId = foundPhoto[foundPhoto.length - 1].file_id;
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photoId}`
    );
    const fileJson = await fileRes.json();

    if (!fileJson.ok) {
      showNoDiary();
      return;
    }

    const imgUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileJson.result.file_path}`;

    diaryImageView.src = imgUrl;
    diaryImageView.classList.remove("hidden");
    noDiary.classList.add("hidden");
    diaryTitle.textContent = `${classValue} - ${subjectValue}`;

    formCard.classList.add("hidden");
    diaryDisplay.classList.remove("hidden");

  } catch (err) {
    console.error("Fetch error:", err);
    loader.classList.add("hidden");
    alert("❌ Failed to load diary");
  }
}


// No diary UI
function showNoDiary() {
  diaryImageView.classList.add("hidden");
  noDiary.classList.remove("hidden");
  diaryTitle.textContent = "No Diary Found";
  formCard.classList.add("hidden");
  diaryDisplay.classList.remove("hidden");
}
