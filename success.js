chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateAvailability') {
    updateWhen2MeetAvailability(message.availability);
    sendResponse({ status: 'updated' });
  }
});

function updateWhen2MeetAvailability(availability) {
  console.log('Received availability:', availability);
  // Example: suppose the When2Meet page uses elements with class "availSlot" and a data attribute "data-time"
  let slots = document.querySelectorAll('.availSlot[data-time]');
  if (!slots.length) {
    console.warn("No available time slots found on When2Meet page.");
    alert("No available time slots found on When2Meet page. Please check the page structure.");
    return;
  }
  slots.forEach(slot => {
    let slotTime = slot.getAttribute('data-time'); // expected format "HH:MM"
    let slotAvailable = availability.some(range => {
      return (formatTime(new Date(range.start)) <= slotTime &&
              slotTime < formatTime(new Date(range.end)));
    });
    if (slotAvailable) {
      slot.style.backgroundColor = '#a8d08d'; // mark available in light green
      // If it is a checkbox, you might set slot.checked = true;
    }
  });
  alert("Availability updated on When2Meet page.");
}

function formatTime(date) {
  let hours = date.getHours().toString().padStart(2, '0');
  let minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
