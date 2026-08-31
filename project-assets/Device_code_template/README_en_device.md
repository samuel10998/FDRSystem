FDRSystem – Device Code Template Setup
======================================

This package contains:
1) Device_code_template.ino
2) README_SETUP.txt (this file)

Purpose
-------
The `Device_code_template.ino` template is used for quick setup of the device (ESP32),
which will record flight data and send it to the FDRSystem cloud workflow.

Important
---------
The device you receive is hardware-ready (the wiring is already done).
You just need to update the configuration values in the code and upload the firmware.

Before you start
-----------------
- You need Arduino IDE (or PlatformIO) and the libraries used in the code installed.
- You need a working Wi-Fi / hotspot connection.
- You need the following details from the admin:
  - DEVICE_ID
  - DEVICE_KEY

WARNING:
DEVICE_KEY is sensitive data.
Do not share it publicly, do not send it via screenshots, and do not store it in public repositories.

Step 1 – Open the file
-----------------------
Open `Device_code_template.ino` in Arduino IDE.

Step 2 – Fill in the placeholders
----------------------------------
At the top of the file, fill in these values:

- WIFI_SSID
  [WRITE HERE YOUR MOBILE HOTSPOT SSID OR WIFI SSID]
- WIFI_PASS
  [WRITE HERE YOUR MOBILE HOTSPOT PASSWORD OR WIFI PASSWORD]
- DEVICE_ID
  [PASTE HERE DEV_ID ADMIN GAVE YOU]
- DEVICE_KEY
  [PASTE HERE DEV_KEY YOU RECEIVED FROM ADMIN]

Do not use square brackets in the actual value — replace the entire text with your own value.

Step 3 – Upload the firmware
-----------------------------
- Select the correct board (ESP32) and COM port.
- Click Upload.
- After uploading, open the Serial Monitor (115200 baud).

Step 4 – Verify the device is running
---------------------------------------
In the Serial Monitor, watch for:
- Wi-Fi connection
- GPS fix/stabilization
- logging
- cloud upload of chunks (OK/FAIL messages)

If you see upload OK, the device is communicating correctly.

Most common issues
-------------------
1) Wi-Fi won't connect
   - check the SSID/password
   - check the range of the hotspot/Wi-Fi
2) Cloud upload FAIL (401/403)
   - wrong DEVICE_ID or DEVICE_KEY
   - re-enter the details exactly as given by the admin
3) GPS takes a long time without a fix
   - place the device in an open area
   - wait for the first fix + stabilization time
4) SD errors
   - restart the device
   - if the problem persists, contact the admin

Security recommendations
-------------------------
- Store DEVICE_KEY only locally and securely.
- Do not share the entire `.ino` file publicly if it contains real credentials.
- Always restore the placeholders before sharing.

Note
----
This template is intended for a quick start.
After testing, you can adjust the code to match your device/hardware.
