document.addEventListener('DOMContentLoaded', function () {
  const saveButton = document.getElementById('savePreferences');

  saveButton.addEventListener('click', function () {
    const preferences = {
      doNotScheduleAfter9: document.getElementById('doNotScheduleAfter9').checked,
      syncOnlyWeekdays: document.getElementById('syncOnlyWeekdays').checked,
      includeWeekends: document.getElementById('includeWeekends').checked,
      timeZone: document.getElementById('timeZoneSelect').value
    };

    chrome.storage.local.set({ userPreferences: preferences }, function() {
      alert('Preferences saved.');
      // Return to the dashboard.
      window.location.href = 'dashboard.html';
    });
  });
});
