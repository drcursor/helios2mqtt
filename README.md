# Helios KWL to MQTT for Home Assistant

This project is a fork and enhancement of the original [sanchosk/helios2mqtt](https://github.com/sanchosk/helios2mqtt) repository.

It is a Node.js bridge that runs periodically to monitor and control Helios ventilation units (EasyControls 3.0 / Vallox) over WebSocket and integrate with Home Assistant via MQTT Discovery.

## Features
- **Auto-discovery in Home Assistant:** Automatically creates sensors and controls linked to the device by its serial number.
- **Sensors:** Fan speed, temperatures (outdoor, supply, extract/indoor, exhaust), humidity, filter dates, and operational state.
- **Bi-directional Control:**
  - **Mode Selector (`select`):** Switch between `At home`, `Away`, `Boost`, and `Fireplace`.
  - **Boost Button (`button`):** Trigger Boost/Party mode for 30 minutes.
  - **Fireplace Button (`button`):** Trigger Fireplace mode for 15 minutes.
  - **Fan Speed Control (`number`):** Set fan speed percentage (0–100%).

## Configuration

Configuration variables can be passed as environment/session variables or defined in a local `.env` file (see `.env.example`):

| Variable | Description | Default |
| :--- | :--- | :--- |
| `HELIOS_HOST` (or `HELIOS_URL`) | IP/Host of the Helios unit | `YOUR_HELIOS_IP` |
| `HELIOS_PORT` | WebSocket port | `80` |
| `MQTT_HOST` (or `MQTT_URL`) | MQTT Broker host | `YOUR_MQTT_BROKER_IP` |
| `MQTT_PORT` | MQTT Broker port | `1883` |
| `MQTT_USER` (or `MQTT_USERNAME`)| MQTT username | `YOUR_MQTT_USERNAME` |
| `MQTT_PASS` (or `MQTT_PASSWORD`)| MQTT password | `YOUR_MQTT_PASSWORD` |
| `REPEAT_INTERVAL` (or `POLL_INTERVAL`)| Polling interval in seconds | `60` |

## Quick Start (Recommended: Docker Compose)

The preferred and easiest way to run `helios2mqtt` is via **Docker Compose**:

1. **Set up configuration:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Helios IP, MQTT broker details, and credentials.

2. **Start the service:**
   ```bash
   docker compose up -d
   ```

3. **View logs:**
   ```bash
   docker compose logs -f
   ```

4. **Stop the service:**
   ```bash
   docker compose down
   ```

---

### Alternative: Running with Node.js directly

If you prefer to run bare-metal without Docker:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run with `.env`:**
   ```bash
   cp .env.example .env
   npm start
   ```

   *Or pass session environment variables directly:*
   ```bash
   HELIOS_HOST=YOUR_HELIOS_IP MQTT_HOST=YOUR_MQTT_BROKER_IP MQTT_USER=YOUR_MQTT_USER MQTT_PASS=YOUR_MQTT_PASS npm start
   ```

## MQTT Topics

### State Topics (Reported by bridge)
- `helios/<SERIAL>/devState` — Current state (`At home`, `Away`, `Boost`, `Fireplace`)
- `helios/<SERIAL>/fan` — Fan speed (%)
- `helios/<SERIAL>/outTemp` — Outside temperature (°C)
- `helios/<SERIAL>/supTemp` — Supply temperature (°C)
- `helios/<SERIAL>/indTemp` — Indoor temperature (°C)
- `helios/<SERIAL>/exhTemp` — Exhaust temperature (°C)
- `helios/<SERIAL>/airRH` — Relative humidity (%)
- `helios/<SERIAL>/filterChanged` — Filter last changed date
- `helios/<SERIAL>/filterDue` — Next filter change due date

### Command Topics (Received by bridge)
- `helios/<SERIAL>/setDevState` — Set mode (`At home`, `Away`, `Boost`, `Fireplace`)
- `helios/<SERIAL>/setBoost` — Trigger boost mode (payload: duration in minutes, e.g. `30`)
- `helios/<SERIAL>/setFireplace` — Trigger fireplace mode (payload: duration in minutes, e.g. `15`)
- `helios/<SERIAL>/setFanSpeed` — Set fan speed (payload: `0`–`100`)

## Tested Hardware
Tested and verified with a **Helios KWL 300 W ET L** unit (easyControls 3.0).

## Acknowledgements & Credits
Based on the original work by [sanchosk/helios2mqtt](https://github.com/sanchosk/helios2mqtt).

## Disclaimer
This project was developed with the assistance of **Google Gemini**. It is an independent open-source tool and is provided as-is without any warranties.
