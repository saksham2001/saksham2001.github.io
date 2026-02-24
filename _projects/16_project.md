---
layout: page
title: "AgenticNetController"
description: "AI-Powered Amateur Radio Net Control Operator (2026)"
img: assets/img/projects/agentic_net_controller/agenticNet.png
importance: 2
category: fun, llm, comms
year: 2026
---

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/agentic_net_controller/agenticNet.png" title="AgenticNetController" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

## What's a Radio Net?

In amateur radio, a net is a scheduled on-air meeting where stations check in, share updates, and pass traffic — all coordinated by a single net control operator. The net control calls for check-ins, manages the roster, enforces turn-taking discipline, and keeps things moving. It's structured, orderly, and very human.

At Carnegie Mellon, the Carnegie Tech Radio Club (W3VC) runs the **ScottyNet** — a weekly Wednesday night directed net on the club's VHF repeater. I'm a member of the club, and after running a few nets myself, I thought: what if the net control operator was an AI?

## The Idea

AgenticNetController is an AI-powered net control operator that manages amateur radio nets using OpenAI's Realtime API for live, low-latency voice interaction. It listens to incoming radio traffic through the microphone, processes speech in real-time, and transmits AI-generated voice responses back over the air.

It's not a chatbot — it follows directed net discipline. It controls the flow of conversation, calls stations by callsign, logs check-ins, handles emergency traffic, and wraps up the net professionally. It understands ham radio conventions: phonetic alphabets, "copy", "over", "say again", and the structure of a directed net.

We ran this as the net control operator for ScottyNet on the W3VC repeater.

## How It Works

The system is a real-time audio pipeline built in Python:

### Audio Pipeline
The microphone captures RX audio from the ICOM IC-7000 radio (what stations are transmitting). Audio is sampled at 24kHz in 20ms frames and streamed to OpenAI's Realtime API over a WebSocket connection. The AI's voice response is played back through the speaker, which feeds TX audio into the radio for transmission.

A key design constraint: the system operates in half-duplex mode — the microphone is muted while the AI is speaking to prevent feedback loops. This mirrors how radio works naturally (you can't transmit and receive simultaneously on the same frequency).

### Voice Activity Detection
The system supports two modes:
- **Semantic VAD** — OpenAI's model intelligently detects when a station has finished speaking, even through noise and partial copy
- **Manual PTT (Push-To-Talk)** — the operator buffers audio and commits it manually, for stricter radio discipline

### Net Modes
The AI operates in distinct modes, each with specific behavior:

- **CHECKIN** — Calls for check-ins, logs each station's callsign, name, and location to a structured roster. Asks for phonetic repeats when unclear.
- **RAGCHEW** — Calls each checked-in station in order for updates and discussion. Logs traffic and announcements.
- **RECHECKIN** — Re-identifies all stations per FCC requirements. Notes unresponsive stations.
- **EMERGENCY** — Immediately prioritizes emergency traffic, gathers critical details, and logs with priority level.
- **WRAPUP** — Thanks all stations, announces the check-in count, and returns the frequency to normal use.

A human operator controls mode transitions through a CLI, keeping a human in the loop for the overall flow while the AI handles the voice interaction.

### Structured Logging
Every check-in, update, and emergency declaration is logged as structured JSONL with UTC timestamps. The AI uses function calling (tool use) to write structured records — it never just "remembers" information, it explicitly logs it. This produces a clean, machine-readable record of every net session.

## The Opening Script

When the operator types `:start`, the AI reads the standard ScottyNet opening:

> *"Good Evening, this is W3VC Acting Net Control for the Carnegie Mellon University Campus Wednesday night Scotty Net..."*

Then it transitions into check-in mode and starts accepting stations.

## Design Decisions

**Why half-duplex?** Radio is inherently half-duplex on a single frequency. If the AI's TX audio leaked back into the microphone, it would create a feedback loop. Muting the mic during transmission is the simplest and most reliable solution.

**Why tool-based logging?** Rather than trying to parse the AI's free-form speech for callsigns and details, the AI explicitly calls `log_checkin()`, `log_update()`, and `declare_emergency()` with structured parameters. This keeps the roster clean and the logs reliable.

**Why a human operator in the loop?** The AI handles voice interaction, but a human operator controls mode transitions, can force responses, cancel mid-speech, or send arbitrary instructions. This mirrors how real net control works — there's always judgment involved in when to move from check-ins to ragchew, or when to wrap up.

## FCC Compliance

All operation of AgenticNetController was conducted in full accordance with FCC rules. A licensed amateur radio operator was present and supervising at all times during net operation. The control operator identified the station with its callsign (W3VC) at least every 10 minutes. The AI system served as an auxiliary tool under the direct supervision of the control operator, who retained full authority to override, interrupt, or shut down transmissions at any time.
