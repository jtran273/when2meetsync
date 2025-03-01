document.addEventListener('DOMContentLoaded', function () {
  // Auto-redirect if already logged in and calendars are selected.
  chrome.storage.local.get(['googleToken', 'calendars'], function(result) {
    if (result.googleToken && result.calendars && result.calendars.length > 0) {
      window.location.href = 'dashboard.html';
      return;
    }
  });

  const googleLoginButton = document.getElementById('googleLogin');
  const continueButton = document.getElementById('continueButton');
  const errorMessage = document.getElementById('errorMessage');
  const calendarSelectionDiv = document.getElementById('calendarSelection');
  const calendarListDiv = document.getElementById('calendarList');

  googleLoginButton.addEventListener('click', function () {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        errorMessage.textContent = 'Failed to authenticate: ' + chrome.runtime.lastError.message;
        return;
      }
      console.log("Using Client ID:", chrome.runtime.getManifest().oauth2.client_id);
      chrome.storage.local.set({ googleToken: token }, function() {
        console.log('Token saved.');
        // Load calendar list now.
        loadCalendarList(token);
      });
    });
  });

  function loadCalendarList(token) {
    fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Calendar list:', data);
      calendarListDiv.innerHTML = '';
      data.items.forEach(calendar => {
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = calendar.id;
        checkbox.id = calendar.id;
        // Pre-check the primary calendar.
        if (calendar.primary) {
          checkbox.checked = true;
        }
        let label = document.createElement('label');
        label.htmlFor = calendar.id;
        label.textContent = calendar.summary;
        let br = document.createElement('br');
        calendarListDiv.appendChild(checkbox);
        calendarListDiv.appendChild(label);
        calendarListDiv.appendChild(br);
      });
      calendarSelectionDiv.style.display = 'block';
      continueButton.style.display = 'block';
    })
    .catch(err => {
      console.error('Error loading calendar list:', err);
      errorMessage.textContent = 'Error loading calendars. Please try again.';
    });
  }

  continueButton.addEventListener('click', function () {
    const checkboxes = calendarListDiv.querySelectorAll('input[type="checkbox"]:checked');
    const selectedCalendars = Array.from(checkboxes).map(cb => cb.value);
    if (selectedCalendars.length === 0) {
      errorMessage.textContent = 'Please select at least one calendar to sync.';
      return;
    }
    chrome.storage.local.set({ calendars: selectedCalendars }, function() {
      console.log('Selected calendars saved:', selectedCalendars);
      window.location.href = 'dashboard.html';
    });
  });
});
