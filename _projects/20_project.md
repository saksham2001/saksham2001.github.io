---
layout: page
title: "PulseLoop"
description: "Subscription free, privacy first, AI native health companion. Powered by a cheap Temu ring (2026)"
img: assets/img/projects/pulseloop/thumbnail.png
importance: 1
category: fun, llm, health, embedded
year: 2026
---

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/thumbnail.png" title="PulseLoop" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

I recently got a Google Fitbit Air and I genuinely loved the idea behind it. The app wraps every measurement from the band in an LLM. It sends you two daily briefs, it analyzes your sleep and activity, and you can talk to a coach, set goals, and ask about a specific workout. That last part is the real unlock. Sparse temporal health data is not intuitive from graphs and gauges. A line going up and to the right does not tell you much. A coach that can say "your resting heart rate crept up the three nights you slept under six hours" tells you something.

But there were a few things I could not get past. The band is $100, and there is a $10 per month subscription on top of it, so you are looking at roughly $220 in the first year and $120 every year after. The app itself is buggy, the interface is rough, and there is honestly too much LLM stuff shoved into every corner. And it is Google, a company whose entire business depends on collecting as much data about you as it possibly can. Handing them a continuous stream of my heart rate, sleep, and movement felt like the wrong trade.

So I wanted to build the opposite. An app where you own your sensitive health data and it never leaves your device except when you choose to ask a question, where the LLM runs through APIs that do not store your prompts or train on your data, and where you pay only for what you actually use. No $360 a year, and no $100 device when a $7 ring gets you most of the way there. I bought a very cheap $7 ring from AliExpress and reverse engineered the BLE protocol. It came with a very basic app with terible UI, and you never know where the data is being sent.

This is PulseLoop. It is free, open source, privacy first, and you bring your own keys. The pieces that have to be smart are smart, and nothing about you sits on someone else's server by default.

## How the system fits together

PulseLoop is a native SwiftUI app for iPhone. There is no backend, no account, and no vendor cloud. The whole thing breaks down into four layers that stack cleanly on top of each other.

At the bottom is the ring layer, which speaks Bluetooth LE directly to the ring, decodes its proprietary 20 byte packets, and turns them into typed events. Above that is the persistence layer, which writes everything into a local SwiftData store on the device. Above that is the UI layer, the Today, Vitals, Sleep, and Activity dashboards you actually look at. And running alongside all of it is the coach layer, an agentic LLM loop that can read the same local data, run its own analysis, draw charts, remember things about you, and take actions on your behalf.

The important design choice is that data flows up from the ring into local storage, and the coach reads sideways out of that same local storage through a fixed set of tools. The model never gets a raw dump of your life. It asks for exactly the slices it needs, when it needs them.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/system-architecture.png" title="PulseLoop system architecture" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The four layers, all inside the device boundary. Raw data flows up from the ring into local storage; the coach reads sideways through tools. The only thing that ever leaves the phone is a coach question you choose to ask, sent under your own API key.
</div>

## Talking to the ring

I covered the protocol itself in the [previous write up](/hacking/2_hacking/), so I will keep this short. The ring exposes a single custom GATT service (`0x56ff`), with one characteristic to write commands to and one to receive notifications from. Every frame is exactly 20 bytes, byte zero is the command ID, and there is no encryption or signing anywhere, which is what made this tractable in the first place.

In the app this lives in a `RingBLEClient` built on CoreBluetooth. It scans for a peripheral advertising as `SMART_RING`, connects, subscribes to notifications, and serializes its writes so the ring's framed responses come back in order. Every frame, incoming and outgoing, gets published on an internal event bus, so a debug feed can show you the raw traffic while decoded events fan out to the rest of the app. It reconnects on its own if the link drops, which matters a lot during a workout.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/ble-interaction.png" title="Talking to the ring over Bluetooth LE" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The ring link: commands go out on one characteristic, notifications stream back on another, every packet is a fixed 20 bytes in cleartext. Battery is the one thing that does not use this protocol, since the ring exposes the standard BLE Battery Service.
</div>

On top of the raw client sits a `RingSyncCoordinator` that knows the higher level flows. When the ring connects, it runs a canonical startup sequence: status, then time sync, then locale, then an activity query, then history, which is what yields the sleep timeline. It also handles live measurements. To take a heart rate reading it starts the stream, waits out the roughly twelve second warm up window, stops the stream, and hands back the latest value. SpO2 is the same idea with a longer window. This is the layer the rest of the app and the coach both call into, so there is exactly one place that understands how to coax a number out of the hardware.

## Where your data lives

Everything the ring produces gets written into a local SwiftData store. Vitals, sleep sessions, activity rollups, workout samples, GPS points, goals, and the coach's own memory all live in models on the device. There is no sync server. If you delete the app, the data is gone, because it was never anywhere else.

This is the quiet foundation of the whole privacy story. It is not a setting you toggle or a promise in a privacy policy. It is just where the bytes physically are. The coach, the charts, and the daily check-ins all read out of this same local store, which means the intelligence is layered on top of your data rather than your data being shipped off to power the intelligence.

## The app

The app has four main tabs, all built natively in SwiftUI with a dark, high contrast look. Today is the landing screen, with a coach generated summary card and a grid of metric tiles. Vitals is for live measurements, where you can trigger an HR or SpO2 reading on demand. Sleep breaks down last night into duration, a score, and a stage architecture chart. Activity records workouts and tracks daily movement against a weekly goal ring.

<div class="row">
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/today.png" title="Today" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/vitals.png" title="Vitals" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/sleep.png" title="Sleep" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/activity.png" title="Activity" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Today, Vitals, Sleep, and Activity. I am honest in the app that the sleep decoder is experimental and does not yet recover REM, because I would rather show a humble number than a confidently wrong one.
</div>

## Recording a workout

Workout recording pulls in a bunch of iOS pieces at once. When you start a session, the coordinator opens a continuous live heart rate stream from the ring at the tightest cadence it supports, samples persist as they arrive and attach to the active session, and an optional GPS recorder traces your route. While the workout is running, there is a Live Activity on the lock screen and a Dynamic Island widget so your heart rate is glanceable without unlocking. When you finish, you get a summary card with duration, distance, average and max heart rate, active minutes, SpO2, a map of the route, and an honest recording quality panel so you know how much to trust the numbers. It feels like the kind of thing you would expect from a much more expensive watch, running off a $7 ring.

<div class="row">
  <div class="col-6 col-md-4 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/workout-live.png" title="Live workout on the lock screen" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-4 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/workout-summary.png" title="Workout summary" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-4 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/dynamic-island.png" title="Dynamic Island" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    A live workout on the lock screen and in the Dynamic Island, and the post workout summary with the GPS route and a recording quality breakdown.
</div>

## The AI coach

This is the centerpiece, and it is the part that makes the ring data actually understandable.

The coach is an agentic loop built on the OpenAI Responses API. The model is never handed your whole dataset and asked to guess. Instead it is given a small context packet (your profile, timezone, goals, device status) plus a set of tools, and it has to go fetch what it needs. The orchestrator runs the loop: it sends your question, the model calls tools, the tools run against your local SwiftData store, the results go back to the model, and this repeats for a bounded number of rounds until the model produces a final answer in a strict JSON schema. There are caps on tool calls and rounds, a retry guard for bad arguments, and JSON repair, so a turn always lands somewhere sensible instead of hanging.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/AI-coach-design.png" title="How the PulseLoop coach answers a question" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    What the user sees, and what happens behind the scenes: a context packet feeds the model, the model calls tools that read from the on-device store, results loop back, and a structured answer (with a real chart) is rendered into the conversation. Risky actions require an explicit confirm.
</div>

The tools fall into a few groups. Retrieval tools are read only and compact: daily and range summaries, a metric time series, activity sessions, sleep trends, goal progress, and a data availability check so the model does not confidently summarize a week that has two days of readings. Analysis tools run deterministic Swift over those numbers instead of asking the model to do mental math: trend detection via linear regression, period comparison, Pearson correlation, z-score outliers, and distribution stats. Chart tools let the model prepare a chart object that gets copied verbatim into the final response and rendered natively, never invented. Memory tools give the coach a durable, local memory for goals, injuries, routines, and preferences, with importance scores and optional expiry. Action tools let it set goals, log notes, create a past workout, or trigger a live reading, and the risky ones (delete, or editing an older session) return a needs confirmation result and show a Confirm or Cancel card rather than happening silently. Web search is available for general knowledge only, with a hard line kept between "your ring data says" and "general guidance says."

<div class="row">
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/coach-chart.png" title="Conversation with a real-data chart" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/coach-grounded.png" title="Grounded answer from your own data" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/coach-actions.png" title="Taking an action with a confirm card" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-6 col-md-3 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/pulseloop/coach-summary.png" title="Coach summary card" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Four ways the coach shows up: answering with a chart built from real retrieved data, grounding a reply in your own readings, taking an action behind a confirm card, and generating a summary card. The whole agent is wrapped in transparency: every tool call is traced with a human readable label, and the prompt leans hard on honesty, grounding, and cautious health language.
</div>

## The privacy model, concretely

The phrase "privacy first" gets thrown around a lot, so here is exactly what it means in PulseLoop. Your ring data lives in a local SwiftData store on your phone and nowhere else. There is no PulseLoop server, no account, and no telemetry. The only time anything leaves the device is when you ask the coach a question, and at that point only the specific slices the model retrieves are sent to the LLM provider you chose, under your own API key. That key is stored in the iOS Keychain and never leaves the device except to authenticate the call. You pick the model, you pay the provider directly for the tokens you use, and you can point it at a provider with a no training, no retention policy. If you never enable the coach, the app is a completely offline tracker.

Compare that to the subscription wearables. With Whoop, Oura, or Fitbit, your most intimate data, your heart, your sleep, your movement, is the product. With PulseLoop it is a file on your phone.

## What's next

This is very much the beginning. The roadmap I am most excited about: running small on-device LLMs (Qwen, a small Llama, or Apple's Foundation Models) so the coach works with no API key and no network at all; generalizing the BLE layer to support other cheap rings beyond the `0x56ff` family; writing custom open firmware to unlock automatic workout detection and higher sampling rates; a multimodal coach with voice and image input; calorie and nutrition tracking; and surfacing exactly which tools the coach called for any given answer, so every response is fully auditable.

## Use it

Get your own ring from here: https://www.aliexpress.us/item/3256810466598469.html

Building it is straightforward. You need Xcode and an iPhone (Bluetooth and Live Activities do not work in the simulator). Open the project in Xcode, set your own Team and a unique bundle identifier under Signing, then build and run to your phone. On first launch, finish onboarding and keep the ring nearby; the app auto-scans and connects when Bluetooth comes on. To turn on the coach, paste your own OpenAI key under Settings, it is stored in the iOS Keychain and only ever leaves the device to call the model. No ring yet? There is a demo data mode so you can explore the whole UI with sample data.

## Open source, and a call for contributions

PulseLoop is open source. If you have a cheap `0x56ff` ring lying around, you can clone the repo, open it in Xcode, drop in your own OpenAI key, and run it on your phone for free. There is also a demo data mode so you can poke around the UI without any hardware at all.

I built this because I think people should own their own health data and not pay a subscription to understand their own bodies, and a project like that is much better as a community than as one person's side project. There is a lot to do and a lot of it is fun. Some good places to start:

- **You have a different cheap ring.** Sniff its protocol, send me captures, and let us widen hardware support. My [protocol notes and CLI](https://github.com/saksham2001/Smart-Ring-Protocol/) are a decent starting point for the reverse engineering side.
- **You know on-device ML.** Help wire up a local model so the coach can run with no API key at all.
- **You write Swift.** Pick up a roadmap item, improve the UI, or harden the BLE layer.
- **You like firmware.** The custom firmware track is wide open.
- **You just want to use it.** File issues, report bad sleep decodes, and tell me where the coach gets things wrong. That feedback is worth a lot.

If any of this resonates, the code is on GitHub, and issues and pull requests are open. Star it, fork it, break it, and send me what you find.

Sources:
- Code: [github.com/saksham2001/PulseLoopIOS](https://github.com/saksham2001/PulseLoopIOS)
- Ring protocol notes and CLI: [github.com/saksham2001/Smart-Ring-Protocol](https://github.com/saksham2001/Smart-Ring-Protocol/)
- How I reverse engineered the ring: [the write up](/hacking/2_hacking/)
