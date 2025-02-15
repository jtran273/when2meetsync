console.log('when2meet.js content script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateAvailability') {
    updateWhen2MeetAvailability(message.availability);
    sendResponse({ status: 'updated' });
  }
});

function updateWhen2MeetAvailability(availability) {
  console.log('Updating When2Meet with availability:', availability);
  
  // Convert the ISO date strings back into Date objects.
  availability = availability.map(range => ({
    day: new Date(range.day),
    start: new Date(range.start),
    end: new Date(range.end)
  }));
  
  console.log('Converted availability:', availability);

  // Use the selector based on your provided HTML.
  let slots = document.querySelectorAll('#YouGridSlots div[data-time]');
  console.log('Using selector "#YouGridSlots div[data-time]" - Found:', slots.length, 'slot elements.');
  
  if (slots.length === 0) {
    console.warn('No slot elements found using the selector "#YouGridSlots div[data-time]".');
    alert("No slot elements found on the page. Please verify the When2Meet page structure.");
    return;
  }
  
  // Process each slot.
  slots.forEach(slot => {
    // Retrieve the slot's time from the data-time attribute.
    let slotTimeStr = slot.getAttribute('data-time');
    let slotTime = parseInt(slotTimeStr, 10); // Unix timestamp in seconds
    console.log('Processing slot:', slot.outerHTML, 'with data-time:', slotTime);
    
    if (!isNaN(slotTime) && isSlotWithinAvailability(slotTime, availability)) {
      try {
        // For a <div>, change its background color to mark it as available.
        console.log('Marking slot with time:', slotTime);
        slot.style.backgroundColor = '#a8d08d'; // Light green
      } catch (e) {
        console.error('Error processing slot:', e, slot);
      }
    }
  });
}

function isSlotWithinAvailability(slotTime, availability) {
  // For each availability range, convert the start and end Date to Unix timestamps (seconds)
  for (let range of availability) {
    const startUnix = Math.floor(range.start.getTime() / 1000);
    const endUnix = Math.floor(range.end.getTime() / 1000);
    console.log(`Comparing slotTime ${slotTime} with range ${startUnix} - ${endUnix}`);
    if (slotTime >= startUnix && slotTime < endUnix) {
      return true;
    }
  }
  return false;
}
