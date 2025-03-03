console.log('when2meet.js content script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateAvailability') {
    autoSelectWhen2MeetAvailability(message.availability);
    sendResponse({ status: 'updated' });
  }
});

function autoSelectWhen2MeetAvailability(availability) {
  console.log('Auto-selecting availability:', availability);
  
  availability = availability.map(range => ({
    day: new Date(range.day),
    start: new Date(range.start),
    end: new Date(range.end)
  }));
  
  console.log('Converted availability:', availability);

  let slots = document.querySelectorAll('#YouGridSlots div[data-time]');
  console.log('Using selector "#YouGridSlots div[data-time]" - Found:', slots.length, 'slot elements.');
  
  if (slots.length === 0) {
    console.warn('No slot elements found using the selector "#YouGridSlots div[data-time]".');
    alert("No slot elements found on the page. Please verify the When2Meet page structure.");
    return;
  }
  
  slots.forEach(slot => {
    let slotTimeStr = slot.getAttribute('data-time');
    let slotTime = parseInt(slotTimeStr, 10);
    
    if (!isNaN(slotTime) && isSlotWithinAvailability(slotTime, availability)) {
      try {
        // Simulate a mouse click event to select the slot
        slot.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        slot.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      } catch (e) {
        console.error('Error selecting slot:', e, slot);
      }
    }
  });
}

function isSlotWithinAvailability(slotTime, availability) {
  for (let range of availability) {
    const startUnix = Math.floor(range.start.getTime() / 1000);
    const endUnix = Math.floor(range.end.getTime() / 1000);
    if (slotTime >= startUnix && slotTime < endUnix) {
      return true;
    }
  }
  return false;
}
