---
layout: page
title: "Hacking a Cheap AliExpress Smart Ring"
description: "Reverse-engineering the BLE protocol of a no-name smart ring with an nRF sniffer, Wireshark, and a Python CLI."
img: assets/img/hacking/ble-smart-ring/jring-home-sleep-summary.png
importance: 2
---

I bought a cheap smart ring from AliExpress because I was curious how much of the app protocol I could figure out. The listing said it used a Coolchip AB2026 main chip, Bluetooth 5.4, 8Mbit flash, and a 304 stainless steel shell, but these listings change all the time, so I treated that as a clue rather than a fact. My ring does not appear to have a display. Over BLE it advertised itself as `SMART_RING`, and the app showed SpO2, heart rate, steps, calories, sleep, and a funny selfie mode where clenching the ring triggers the phone camera.

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

## First attempts: lots of advertising, no actual data

This was my first real attempt at BLE packet sniffing, so the beginning was mostly failure. I used an nRF52840 dongle with Wireshark and the nRF Sniffer plugin, but my first captures only had advertising packets. I could see the ring, but I was not catching the actual connection. The useful breakthrough was learning to capture the `CONNECT_IND`, follow the connection, and filter down to ATT/GATT traffic.

## The custom service

Once I had a good capture, the protocol started to show itself. The ring exposes a custom service:

```text
service: 0x56ff
write:   0x33f3
notify:  0x33f4
```

The phone app writes 20-byte commands to `0x33f3`, and the ring replies or streams data back on `0x33f4`.

## Building a Python CLI to talk to the ring

From there I used Codex as a coding agent to help go through the captures, compare packets, and build a Python CLI with Bleak. That CLI became the fastest way to test guesses. Instead of opening the app every time, I could connect to the ring and send commands directly:

```text
2301...  start SpO2
14b4...  start heart rate
040a...  find ring
0701...  selfie mode on
```

Then I would look at the notifications and compare them with what the official app showed. That let us confirm the important fields:

```text
heart rate: 0x14 packet, byte 5 = BPM
SpO2:       0x24 final packet, byte 4 = percentage
```

## Decoding the daily activity packet

Later I did a longer sync capture. I walked around, reopened the official app, and it showed:

```text
steps:    120 / 10000
calories: 6 / 395
mileage:  0.10 km / 7.5 km
```

The ring sent this packet:

```text
037901156a780000006900000006000000000000
```

Decoded little-endian:

```text
timestamp: bytes 1-4
steps:     bytes 5-8   = 120
distance:  bytes 9-12  = 105, roughly 0.10 km
calories:  bytes 13-16 = 6
```

We also found the time sync command:

```text
01 [unix timestamp] [timezone offset]
```

and the step goal:

```text
1a102700...
```

`0x2710` is 10000, matching the app's daily step goal.

## Sleep timeline

The morning sync also gave up the sleep format. The app showed 5 hours of sleep, with 30 minutes deep and 4 hours 30 minutes light. The ring returned `0x11` timeline packets: each one has a timestamp and fifteen one-minute samples.

```text
0x28 = light sleep
0x63 = deep sleep
```

Twenty packets covered the whole five-hour window, which matched the app exactly.

## What's published

The current repo has the CLI, protocol notes, and lab notes. I am not publishing the raw captures by default because BLE captures can contain identifiers from nearby devices. The ring address is left in the notes because it is useful for the analysis, but unrelated device identifiers are redacted.

## BOM

- Cheap AliExpress smart ring, non-display style, currently listed as Coolchip AB2026 / Bluetooth 5.4
- nRF52840 BLE dongle
- Wireshark with nRF Sniffer
- MacBook with Python and Bleak
- Original JRING phone app for ground truth

The fun part was not one magic packet. It was building up confidence one small test at a time: sniff, guess, write a CLI command, compare with the app, repeat.
