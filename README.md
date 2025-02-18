# Scheduling Extension

## Installation Guide

Follow these steps to install the extension:

1. **Clone the Repository**
   - Click **"Code"** next to the About section at the top of the GitHub repository.
   - Copy the provided repository link.
   - Open **Finder** (or File Explorer) and create a new folder (e.g., `SchedulingExtension`).
   - Open **VS Code** and select **"Clone Git Repository"**.
   - Paste the copied repository link into the search bar and press **Enter**.
   - Save the repository in the newly created folder.
   - You should now be able to view the code in VS Code.

2. **Load the Extension in Chrome**
   - Open **Google Chrome** and navigate to `chrome://extensions/`.
   - Enable **Developer Mode** (toggle switch in the top-right corner).
   - Click **"Load unpacked"** in the top-left corner.
   - Select the folder where you saved the cloned repository.
   - The extension should now appear in your Chrome **Extensions** list.

---

## Usage Guide

### **1. Log in with Google API**
   - This extension is in **development mode**, so authentication needs to be set up **individually** with James.

### **2. Select Calendars**
   - Choose the calendars that should be considered when determining your availability.
   - Click **"Save"** to store your selections.

### **3. Sync Availability**
   - Click **"Sync Availability"** to update and review your availability.
   - Verify that the displayed availability is accurate.

### **4. Sync with When2Meet**
   - Open **When2Meet** in your browser.
   - Enter your name and ensure your availability is **editable**.
   - Click **"Sync to When2Meet"**.

### **5. Manually Adjust Availability**
   - Fill in the **green blocks** that represent your availability.
   - You can modify your calendar preferences and scheduling settings at any time.

---

## Troubleshooting

- If the extension does not appear in Chrome:
  - Ensure **Developer Mode** is enabled in `chrome://extensions/`.
  - Try **removing and reloading** the extension.
  - Confirm that the repository was cloned correctly.
  - Restart Chrome and try again.

- If syncing availability fails:
  - Check that you are **logged into Google** with the correct permissions.
  - Ensure that the selected calendars have events that affect availability.
  - Verify that the When2Meet sync is functioning properly.

---

