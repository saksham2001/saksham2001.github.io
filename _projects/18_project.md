---
layout: page
title: "Knight Rider"
description: "Smart Helmet for Motorcycle Safety (2026)"
img: assets/img/projects/knightrider/thumbnail.JPG
importance: 2
category: embedded, fun
year: 2026
---

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/knightrider/thumbnail.JPG" title="Knight Rider Smart Helmet" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

## The Problem

Motorcyclists are 22x more likely to die in a crash than passenger vehicle occupants. In 2023 alone, 6,335 riders were killed in the US — 15.5% of all traffic fatalities, despite motorcycles being a fraction of vehicles on the road. A major contributing factor: blind spots. Riders have limited peripheral vision inside a helmet, and checking over your shoulder at highway speeds is both dangerous and insufficient.

We built Knight Rider for **Build18** at CMU — the annual spring build week where teams go from idea to working prototype in under a week.

## The Solution

Knight Rider is a helmet-based sensing and feedback platform that brings blind-spot detection, a heads-up display, and brake/turn signal indicators directly into the helmet.

The key insight: the helmet is the right platform, not the bike. Every rider already wears one. It's universal (not bike-model dependent), moves with the rider, and is already trusted safety gear. This means zero friction to adopt — it fits into an existing purchase decision rather than requiring aftermarket bike modifications.

### What It Does

- **Rear-facing LiDAR sensors** mounted on the back of the helmet detect vehicles in the rider's blind spots
- An **integrated HUD (Heads-Up Display)** projected onto the visor shows speed, an artificial horizon, and blind-spot warning indicators on both sides
- **Brake and turn signal LEDs** embedded in the rear housing make the rider more visible to traffic behind them

## The Build

### Internal Electronics

The rear housing contains the core electronics: LiDAR sensor modules on each side for blind-spot coverage, an IMU for orientation and artificial horizon computation, LED arrays for brake/turn signals, and the microcontroller driving everything.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/knightrider/internal_electronics.jpeg" title="Knight Rider Internal Electronics" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Internal electronics of the rear module: LiDAR sensors, IMU, LED arrays for brake/turn signals, and microcontroller.
</div>

### Assembled Helmet

The rear module attaches to the back of a standard full-face helmet. The 3D-printed housing is designed to be aerodynamic and unobtrusive, with the LiDAR sensors and brake/turn signal LEDs integrated into the form factor.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/knightrider/assembled_back.jpeg" title="Knight Rider Assembled Back View" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Assembled helmet from the back showing the rear module with integrated LiDAR and brake/turn signal LEDs glowing red.
</div>

### The HUD

The heads-up display projects directly onto the visor, visible in the rider's natural line of sight. The display shows current speed (67 mph shown here), an artificial horizon for lean-angle awareness, and blind-spot warning symbols on both sides of the display that light up when the LiDAR detects a vehicle.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/knightrider/view_form_inside.jpeg" title="Knight Rider View From Inside" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    View from inside the helmet showing the HUD projected onto the visor.
</div>

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/knightrider/hud.jpeg" title="Knight Rider HUD Close-up" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Close-up of the HUD: speed readout (67 mph), artificial horizon, and blind-spot warning indicators on both sides.
</div>

## Market Context

There are 9.5 million motorcycles in the US and over 1.2 billion globally. The global motorcycle helmet market sits at $3.3–4.0B (2024–2025) and is growing at 6.6–6.8% CAGR. Existing smart helmet players like Intelligent Cranium Helmets and Cross Helmets have explored cameras and time-of-flight sensors, but Knight Rider differentiates with a helmet-centric LiDAR sensing approach and an integrated HUD that keeps the rider's eyes on the road.

## Future Plans

- Fully integrated industrial design for a production-ready form factor
- Heart-rate sensing for fatigue monitoring
- Crash detection with automatic emergency services contact
