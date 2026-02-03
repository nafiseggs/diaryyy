// Telegram Configuration
const BOT_TOKEN = "7180890909:AAEmpWcoeg7_oVV5s4C5bxzbY72YNr7vwwE";
const CHANNEL_ID = "-1001580632618";

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
const today = new Date().toISOString().split('T')[0];
viewDate.value = today;

// View Button Click
viewBtn.addEventListener("click", async function() {
  const classValue = document.getElementById("viewClass").value;
  const subjectValue = document.getElementById("viewSubject").value;
  const dateValue = viewDate.value;

  if (!classValue || !subjectValue || !dateValue) {
    alert("⚠️ Please select class, subject, and date");
    return;
  }

  // Show loader
  loader.classList.remove("hidden");

  // Fetch diary from Telegram
  await fetchDiary(classValue, subjectValue, dateValue);
});

// Back Button
backBtn.addEventListener("click", function() {
  diaryDisplay.classList.add("hidden");
  formCard.classList.remove("hidden");
});

// Download Button
downloadDiaryBtn.addEventListener("click", function() {
  const link = document.createElement("a");
  link.href = diaryImageView.src;
  link.download = "school_diary.png";
  link.click();
});

// Fetch Diary from Telegram Channel
async function fetchDiary(classValue, subjectValue, dateValue) {
  try {
    // Format date for search
    const dateObj = new Date(dateValue + 'T00:00:00');
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const searchDate = `${day}.${month}.${year}`;

    // Get recent updates (last 100 messages)
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&offset=-100`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error("Failed to fetch messages");
    }

    // Search for matching diary in channel_post messages
    let foundPhoto = null;
    
    // Look through all updates in reverse (newest first)
    for (let i = data.result.length - 1; i >= 0; i--) {
      const update = data.result[i];
      
      if (update.channel_post) {
        const post = update.channel_post;
        
        // Check if it's a text message with diary info
        if (post.text && post.text.includes(classValue) && 
            post.text.includes(subjectValue) && 
            post.text.includes(searchDate)) {
          
          // Found matching text, now look for the next photo message
          for (let j = i + 1; j < data.result.length; j++) {
            if (data.result[j].channel_post && data.result[j].channel_post.photo) {
              foundPhoto = data.result[j].channel_post.photo;
              break;
            }
          }
          
          if (foundPhoto) break;
        }
        
        // Also check if photo has caption with diary info
        if (post.photo && post.caption && 
            post.caption.includes(classValue) && 
            post.caption.includes(subjectValue) && 
            post.caption.includes(searchDate)) {
          foundPhoto = post.photo;
          break;
        }
      }
    }

    loader.classList.add("hidden");

    if (foundPhoto) {
      // Get the highest quality photo
      const photoId = foundPhoto[foundPhoto.length - 1].file_id;
      
      // Get file path
      const fileResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photoId}`);
      const fileData = await fileResponse.json();
      
      if (fileData.ok) {
        const filePath = fileData.result.file_path;
        const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        
        // Display the diary
        diaryImageView.src = imageUrl;
        diaryImageView.classList.remove("hidden");
        noDiary.classList.add("hidden");
        diaryTitle.textContent = `${classValue} - ${subjectValue}`;
      } else {
        showNoDiary();
      }
    } else {
      showNoDiary();
    }

    // Show diary display
    formCard.classList.add("hidden");
    diaryDisplay.classList.remove("hidden");

  } catch (error) {
    console.error("Error fetching diary:", error);
    loader.classList.add("hidden");
    alert("❌ Failed to load diary. Please try again.");
  }
}

function showNoDiary() {
  diaryImageView.classList.add("hidden");
  noDiary.classList.remove("hidden");
  diaryTitle.textContent = "No Diary Found";
}
