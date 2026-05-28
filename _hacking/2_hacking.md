---
layout: page
title: "Hacking a $7 AliExpress Smart Ring"
description: "Reverse-engineering the BLE protocol of a chinese smart ring"
img: assets/img/hacking/ble-smart-ring/logo.png
importance: 2
---

I bought a smart ring for $7 from AliExpress. You can easily find similar rings for under $20 on AliExpress or Temu. I found it really cool that they were able to compress sensors, battery, microcontroller, and other electronics into a ring for this price. I mostly wanted to see how the quality compared to other health wearables I use. I did not expect much from the ring, mostly PPG heart rate measurements and a bad app with poor English translations. But to my surprise the ring packed a decent amount of features and the app was actually usable. The ring can estimate heart rate, SpO2, count steps, calories, distance, and sleep. The app is not great but it is usable. I still haven't gotten around to comparing the actual numbers, but the ring seems to be close in heart rate and SpO2, but off in steps, calories, and distance. For sleep I see a variance of around 15 minutes. The battery life is not great and lasts about 5 days on a single charge.

Seller-provided specs:

```text
Material: 304 stainless steel, glue pouring process
Main chip: Coolchip AB2026
Memory: 64KB + 8K cache + 8Mbit flash
Bluetooth: 5.4
Charging time: 2 hours
Runtime: 3-5 days normal use
Charging: magnetic charging
Compatibility: Android 9.0+, iOS 10.0+
Sizes: 7-13
Thickness: 2.5 mm
```

Next I wanted to see if I could reverse engineer the BLE data from this ring and use this data to build my own apps around it. The AliExpress listing [1] I bought the ring from is very generic and does not provide any useful information like manufacturer, model, chipset, etc. It mentions some generic information like the chip being a Coolchip AB2026, which I am pretty sure is not a thing. I found some other listings for slightly more expensive rings mentioning the manufacturer as Colmi and the chip as Realtek RTL8762. There are some other open-source projects that have successfully reverse engineered the Colmi ring [2, 3]. I started out by trying these but I was not able to get them to work with my ring. The rings do look very similar; my guess would be that they are using the same hardware, just different firmware that implements the protocol in different ways.

The ring is pretty neat: it has anodized metal outside with electronics neatly packed inside. It appears to have a PPG sensor, IMU, BLE-enabled microcontroller, battery, and a magnetic charging contact. My ring does not appear to have a display, but there are some other Chinese rings that do have a display to show time [4]. Over BLE it advertised itself as `SMART_RING`, and the app showed SpO2, heart rate, steps, calories, sleep, and a funny selfie mode where clenching the ring triggers the phone camera. It works with an app called JRing on iOS and Android (see screenshot below).

<div class="row">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/hacking/ble-smart-ring/jring-home-sleep-summary.png" title="JRing app home screen" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/hacking/ble-smart-ring/jring-sleep-detail.png" title="JRing app sleep detail view" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The official JRing app — home screen with steps, sleep, and heart rate (left), and a detailed sleep breakdown (right). This is the ground truth I kept comparing my sniffed packets against.
</div>

I was curious how much of the app protocol I could figure out. So I started out by using an nRF52840 BLE dongle with Wireshark and the nRF Sniffer plugin to capture the interaction between the ring and the app. I tried to perform different actions in the app like syncing the ring, triggering instantaneous measurements for heart rate and SpO2, changing settings for the ring, etc., and then manually analyzed the packets to see if I could figure out the protocol. This was my first real attempt at BLE packet sniffing, so the beginning was mostly failure. My first captures only had advertising packets. I could see the ring, but I was not catching the actual connection. The useful breakthrough was learning to capture the `CONNECT_IND`, follow the connection, and filter down to ATT/GATT traffic. Once I had a good capture, the protocol started to show itself. To my surprise there was no signing or encryption whatsoever. The packets were all cleartext and I was able to see the raw data from the ring. I did this over 10 times trying to capture all variations of the different commands and data packets (see my detailed notes that I built while trying to break down the protocol [5]).

Next, I used Codex to help go through the captures, compare packets, and build a Python CLI with Bleak. That CLI became the fastest way to test guesses. Instead of opening the app every time, I could connect to the ring and send commands directly and see if I was getting the correct responses. Then, I would look at the notifications and compare them with what the official app showed.


## The protocol

Here is a high-level view of what I pieced together. The full implementer reference, with confidence markers and open questions, lives in my protocol notes [6].

### Transport

The whole app protocol runs over a single custom GATT service, `0x56ff`. There is no encryption or signing anywhere — every command and response is cleartext, which is what made this tractable in the first place.

```text
Advertised name:  SMART_RING
Service:          0x56ff
Write char:       0x33f3   (central -> ring)
Notify char:      0x33f4   (ring -> central)
```

The ring advertises as `SMART_RING`, and the first six bytes of its manufacturer data are its own BLE address. To talk to it you connect, enable notifications on `0x33f4`, write 20-byte commands to `0x33f3`, and read 20-byte notifications back. That is the entire transport.

### Packet format

Every packet is a fixed 20 bytes. There is no length field or framing header — byte 0 is the command/response ID, and the rest is payload zero-padded out to 20 bytes. Multi-byte integers (timestamps, steps, distance, calories) are little-endian.

```text
byte 0       command / response id
bytes 1-19   payload fields and zero padding
```

### Annotated example

The current-activity response (`0x03`) is a good example of how the fields pack in. The app showed `328` steps, `0.28 km`, and `18` calories, and the matching packet decodes cleanly:

```text
03 fd7c156a 48010000 1f010000 12000000 504600
│  │        │        │        │        └ unknown / padding
│  │        │        │        └ calories = 18
│  │        │        └ distance units = 287  (~0.28 km)
│  │        └ steps = 328
└ command 0x03 = current activity
```

I repeated this loop several times: trigger an action, read what the app displayed, then go find the packet whose bytes matched.

### Commands

These are the commands I confirmed, either by sending them from the CLI or by matching responses against app-visible data. Multi-packet flows (activity, sleep, HR, SpO2) send a small acknowledgement first and then stream data packets back.

| Command | Byte 0 | Direction | What it does |
|---|---|---|---|
| Time sync | `0x01` | write | Set clock (unix time) + timezone offset |
| Current activity query | `0x02` | write | Request current activity; triggers `0x03`/`0x13` |
| Current activity | `0x03` | notify | Steps, distance, calories, timestamp |
| Find ring | `0x04` | write | Buzz the ring to locate it (byte 1 = parameter) |
| Selfie shutter event | `0x06` | notify | Fired when you clench the ring |
| Selfie mode | `0x07` | write | Enable/disable clench-to-trigger camera |
| Status | `0x0c` | write | Device status; response embeds ring MAC |
| Factory reset | `0x0e` | write | Reset device; magic payload `fedcba9876543210` |
| Sleep / history query | `0x10` | write | Request sleep + history; triggers `0x11` |
| Sleep timeline | `0x11` | notify | 15 one-minute sleep-stage samples per packet |
| Activity summary | `0x13` | notify | Companion summary to `0x03` (partly decoded) |
| Live heart rate | `0x14` | write/notify | Start HR; BPM streams back at byte 5 |
| HR stop | `0x15` | write | Stop/cleanup HR measurement |
| Stored measurement query | `0x16` | write | Pull stored HR/measurement history |
| Automatic HR schedule | `0x19` | write | Configure auto-HR window, cadence, on/off |
| Step goal | `0x1a` | write | Set daily step goal (e.g. 10000) |
| Locale | `0x21` | write | Set locale string, e.g. `en-US` |
| SpO2 | `0x23` | write/notify | Start/stop SpO2; progress packets `0x24` |
| SpO2 result | `0x24` | notify | SpO2 percentage at byte 4 |
| HR complete | `0x27` | notify | Heart-rate measurement finished |
| Air control / HID mode | `0x52` | write | Likely toggles BLE HID air-control (unconfirmed) |

Battery is the one thing that does *not* go through this protocol — the ring exposes the standard BLE Battery Service (`0x180f` / `0x2a19`), so you just read the percentage directly.

This is still work in progress and a few commands are still murky. The `0x52` air-control writes were accepted but never visibly did anything from my CLI, because the air-control feature rides on a BLE HID service that macOS/CoreBluetooth hides from Bleak entirely. And several notification IDs (`0x0b`, `0x20`, `0x44`, `0x48`, `0xf6`) show up during sync but I never fully decoded them.

## How to use the CLI

The CLI [x] is a Python script that uses the Bleak library to connect to the ring and send commands. 

The CLI provides the following commands:
```bash
Commands:
  help                         Show this help.
  scan [seconds]               Scan for BLE devices and auto-select SMART_RING.
  connect [address]            Connect to selected ring, or specific address/UUID.
  disconnect                   Disconnect.
  services                     Print discovered services/chars.
  notify on                    Enable notifications on 0x33f4.
  notify off                   Disable notifications.
  hid scan                     Print HID service/report characteristics.
  hid on                       Enable HID report notifications.
  hid off                      Disable HID report notifications.
  hid map                      Read raw HID report map.

  battery                      Read standard BLE battery percentage.
  status                       Send device/status query.
  time sync                    Send app-style current time/timezone command.
  locale                       Send en-US locale command.
  activity                     Request current steps/activity packet.
  sync baseline                Send status, time sync, locale, activity query.
  history                      Request history summary and measurement stream.
  sleep                        Request sleep/history timeline packets.
  spo2 start                   Start SpO2 measurement.
  spo2 stop                    Stop SpO2 measurement.
  spo2 run [seconds]           Start SpO2, wait, stop. Default 25s.
  hr start                     Start HR measurement.
  hr stop                      Stop/cleanup HR measurement.
  hr run [seconds]             Start HR, wait, stop. Default 30s.

  selfie on                    Enable selfie/clench mode.
  selfie off                   Disable selfie/clench mode.
  find                         Send possible find-ring 04 0a command.
  mode 1                       Send 52...01 candidate.
  mode 2                       Send 52...02 candidate.
  mode reset                   Send 52...ffffffff reset candidate.
  phase2                       Run known-variant test sequence automatically.

  raw <hex>                    Send any hex payload to write char.
  sleep <seconds>              Wait while notifications keep logging.
  quit                         Disconnect and exit.
```

One macOS quirk worth noting: CoreBluetooth hides the real BLE MAC and hands you a per-machine CoreBluetooth UUID instead, so you cannot hard-code the address across machines. So you need to forget the ring everytime you rerun the CLI.

## References

- [1] AliExpress listing for the ring: https://www.aliexpress.us/item/3256810466598469.html
- [2] Colmi R02 ring reverse engineering by tahnok: https://tahnok.github.io/colmi_r02_client/colmi_r02_client.html
- [3] Hackaday post about revererse engineering a smart ring: https://hackaday.com/2024/06/16/new-part-day-a-hackable-smart-ring/
- [4] Reverse engineering the SR08 smart ring with display: https://github.com/atc1441/ATC_SR08_Ring
- [5] My detailed notes that I made while reverse engineering the protocol: https://github.com/saksham2001/Smart-Ring-Protocol/blob/main/lab-notes.md
- [6] The full protocol reference: https://github.com/saksham2001/Smart-Ring-Protocol/blob/main/Protocol.md
- [x] The CLI code: https://github.com/saksham2001/Smart-Ring-Protocol/blob/main/smart_ring_cli.py