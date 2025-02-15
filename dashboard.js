try {
  document.addEventListener('DOMContentLoaded', function () {
    const syncButton = document.getElementById('syncAvailability');
    const syncToWhen2MeetButton = document.getElementById('syncToWhen2Meet');
    const settingsButton = document.getElementById('settingsButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsSection = document.getElementById('resultsSection');
    const freeSlotsContainer = document.getElementById('freeSlotsContainer');
    const prevWeekButton = document.getElementById('prevWeek');
    const nextWeekButton = document.getElementById('nextWeek');
    const weekRangeSpan = document.getElementById('weekRange');
    const logoutButton = document.getElementById('logoutButton');

    // Initialize week offset (0 = current week)
    let currentWeekOffset = 0;
    chrome.storage.local.get(['currentWeekOffset'], function(result) {
      if (result.currentWeekOffset !== undefined) {
        currentWeekOffset = result.currentWeekOffset;
      }
      updateWeekRangeDisplay();
    });

    function updateWeekRangeDisplay() {
      const { weekStart, weekEnd } = getWeekStartAndEnd(currentWeekOffset);
      weekRangeSpan.textContent = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    }

    prevWeekButton.addEventListener('click', function () {
      currentWeekOffset--;
      chrome.storage.local.set({ currentWeekOffset });
      updateWeekRangeDisplay();
      syncAvailabilityForWeek();
    });
    nextWeekButton.addEventListener('click', function () {
      currentWeekOffset++;
      chrome.storage.local.set({ currentWeekOffset });
      updateWeekRangeDisplay();
      syncAvailabilityForWeek();
    });

    logoutButton.addEventListener('click', function () {
      // Clear all stored data and return to the login screen.
      chrome.storage.local.clear(function() {
        window.location.href = 'popup.html';
      });
    });

    settingsButton.addEventListener('click', function() {
      window.location.href = 'preferences.html';
    });

    syncButton.addEventListener('click', syncAvailabilityForWeek);

    function syncAvailabilityForWeek() {
      loadingIndicator.style.display = 'inline';
      resultsSection.style.display = 'none';

      chrome.storage.local.get(['googleToken', 'calendars'], function(result) {
        const token = result.googleToken;
        const selectedCalendars = result.calendars;
        if (!token) {
          alert("No Google token found. Please login again.");
          loadingIndicator.style.display = 'none';
          return;
        }
        if (!selectedCalendars || selectedCalendars.length === 0) {
          alert("No calendars selected. Please select at least one calendar.");
          loadingIndicator.style.display = 'none';
          return;
        }

        // Compute the week’s start (Monday) and end (Sunday)
        const { weekStart, weekEnd } = getWeekStartAndEnd(currentWeekOffset);
        const timeMin = weekStart.toISOString();
        const timeMax = weekEnd.toISOString();

        // Fetch events from each selected calendar for this week.
        const fetchPromises = selectedCalendars.map(calendarId => {
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
          return fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
          }).then(response => response.json());
        });

        Promise.all(fetchPromises)
          .then(resultsArray => {
            let allEvents = [];
            resultsArray.forEach(result => {
              if (result.items) {
                allEvents = allEvents.concat(result.items);
              }
            });
            console.log("Combined events:", allEvents);
            // Compute free time slots for each day (using full-day boundaries).
            const freeSlots = computeFreeTimeSlots(allEvents, weekStart, weekEnd);
            displayTimeSuggestions(freeSlots);
            // Convert Date objects to ISO strings before storing.
            const availabilityToStore = freeSlots.map(slot => ({
              day: slot.day.toISOString(),
              start: slot.start.toISOString(),
              end: slot.end.toISOString()
            }));
            chrome.storage.local.set({ computedAvailability: availabilityToStore });
          })
          .catch(err => {
            console.error("Error fetching events:", err);
            alert("Error fetching events. Please try again.");
          })
          .finally(() => {
            loadingIndicator.style.display = 'none';
          });
      });
    }

    syncToWhen2MeetButton.addEventListener('click', function() {
      chrome.storage.local.get(['computedAvailability'], function(result) {
        const computedAvailability = result.computedAvailability;
        if (!computedAvailability) {
          alert("Please sync your availability first.");
          return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          const activeTab = tabs[0];
          chrome.tabs.sendMessage(activeTab.id, { action: 'updateAvailability', availability: computedAvailability }, function(response) {
            console.log('When2Meet availability updated:', response);
          });
        });
      });
    });

    // Utility: getWeekStartAndEnd returns weekStart (Monday 00:00) and weekEnd (Sunday 23:59:59)
    function getWeekStartAndEnd(offset) {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      let monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday + offset * 7);
      monday.setHours(0, 0, 0, 0);
      let sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { weekStart: monday, weekEnd: sunday };
    }

    // Compute free slots by merging overlapping events for each day (full day: 00:00–23:59)
    function computeFreeTimeSlots(events, startDate, endDate) {
      const freeSlots = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        let dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        let dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        let dayEvents = events.filter(event => {
          let eventStart = new Date(event.start.dateTime || event.start.date);
          let eventEnd = new Date(event.end.dateTime || event.end.date);
          return eventEnd > dayStart && eventStart < dayEnd;
        });

        dayEvents.sort((a, b) => {
          let aStart = new Date(a.start.dateTime || a.start.date);
          let bStart = new Date(b.start.dateTime || b.start.date);
          return aStart - bStart;
        });

        const mergedEvents = [];
        dayEvents.forEach(event => {
          let eventStart = new Date(event.start.dateTime || event.start.date);
          let eventEnd = new Date(event.end.dateTime || event.end.date);
          if (eventStart < dayStart) eventStart = new Date(dayStart);
          if (eventEnd > dayEnd) eventEnd = new Date(dayEnd);

          if (mergedEvents.length === 0) {
            mergedEvents.push({ start: eventStart, end: eventEnd });
          } else {
            let last = mergedEvents[mergedEvents.length - 1];
            if (eventStart <= last.end) {
              if (eventEnd > last.end) last.end = eventEnd;
            } else {
              mergedEvents.push({ start: eventStart, end: eventEnd });
            }
          }
        });

        let currentSlotStart = dayStart;
        if (mergedEvents.length === 0) {
          freeSlots.push({ day: new Date(currentDate), start: new Date(dayStart), end: new Date(dayEnd) });
        } else {
          mergedEvents.forEach(event => {
            if (event.start > currentSlotStart) {
              freeSlots.push({ day: new Date(currentDate), start: new Date(currentSlotStart), end: new Date(event.start) });
            }
            currentSlotStart = event.end;
          });
          if (currentSlotStart < dayEnd) {
            freeSlots.push({ day: new Date(currentDate), start: new Date(currentSlotStart), end: new Date(dayEnd) });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return freeSlots;
    }

    // Display free slots grouped by day.
    function displayTimeSuggestions(slots) {
      freeSlotsContainer.innerHTML = '';
      const grouped = {};
      slots.forEach(slot => {
        const dayStr = slot.day.toDateString();
        if (!grouped[dayStr]) {
          grouped[dayStr] = [];
        }
        grouped[dayStr].push(slot);
      });
      for (const day in grouped) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-group');

        const header = document.createElement('h3');
        header.textContent = day;
        dayDiv.appendChild(header);

        const ul = document.createElement('ul');
        grouped[day].forEach(slot => {
          const li = document.createElement('li');
          li.textContent = `${slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          ul.appendChild(li);
        });
        dayDiv.appendChild(ul);
        freeSlotsContainer.appendChild(dayDiv);
      }
      resultsSection.style.display = 'block';
    }
  });
} catch (e) {
  console.error("Error in dashboard.js:", e);
}
