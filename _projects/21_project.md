---
layout: page
title: "Remy"
description: "Your kitchen assistant that helps you cook. (2026)"
img: assets/img/projects/remy/thumbnail.png
importance: 1
category: fun, llm, embedded, computer vision
year: 2026
---

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/thumbnail.png" title="Remy camera" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

A friend and I built Remy over a weekend at the SF Hackathon, an invite-only event that flys out students from CMU, Stanford, Berkeley, Waterloo and a few other schools and puts them in a room for a couple of days. It is run by Sebastian Thrun, who founded Udacity, Google X and Waymo. We won the grand prize in the hackathon with this project!

Remy is inspired by the rat in Ratatouille, and the idea is roughly the same: something that knows what is in your kitchen and cooks with you.

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 1.5rem;"><iframe src="https://www.youtube.com/embed/z9MbaN44JXI" title="Remy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

## The cameras

Little battery powered ESP32 cameras. You drop one on each fridge shelf, or stick one in a cabinet, and that is the whole install. Smart fridges are at least few orders of magnitude more expensive than these cheap camera.

<div class="row">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/prototype-hand.jpg" title="Remy camera in hand" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/prototype-counter.jpg" title="Remy camera prototype" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The prototype. Small enough to sit on a shelf without getting in the way.
</div>

## Figuring out what it is looking at

VLMs have come a long way in breaking down scenes, and understanding what all products you have in an image is not hard. But, it is hard not having to run inference every few seconds and understanding more than just what is in the fridge. We need a complex memory of items in the fridge, need to update them whenver something is added, permanently removed, temporarily removed, or slighly changed.

In Remy we tried to use many tricks and came up with a complex vision pipeline to only run inference when there is significant change in the frame. Then YOLO finds the objects, CLIP embeddings decide whether each crop is something Remy has seen before or genuinely new, and only the new ones get sent to a vision model to extract name, quantity and other information. Nothing is added or removed from your inventory until it has shown up the same way a few frames in a row. The system keeps all the objects in a complex memory system with informaiton like quantity and shelf life. It also takes care of edge cases like items moved around betweeen shelves, items temporarily removed to be used, and deduplication, etc.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/vision-pipeline.png" title="Remy vision pipeline" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

Here is that running on a real shelf:

<div class="row">
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/vision-detect.png" title="Detections on a fridge shelf" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/vision-add.png" title="Items committed to inventory" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/remy/vision-match.png" title="Items matched on a later frame" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Left: boxes and crops from one frame. Middle: three items hit 3/3 sightings and get added. Right: a later frame recognises the same three by embedding and reuses them instead of asking the model again.
</div>

## What it does with that

The interface runs on an iPad you leave somewhere in the kitchen. Remy has some other really cool features:

- **Knows what you have.** A live inventory that updates itself as you put things away and take things out.
- **Restocks.** Running low on something you always keep around, and it can reorder from Walmart.
- **Suggests recipes.** Based on what is actually in the fridge right now, not a generic list. It has user profiles and remembers who it is cooking for, so vegan stays vegan, and you can switch users.
- **Saves food.** Nudges you toward dishes that use up whatever is about to go bad.
- **Cooks with you.** My personal favourite feature: Live mode, where you just talk to Remy hands free while you are cooking and it walks you through the recipe. This is the part that feels like the movie.

Code is on [GitHub](https://github.com/saksham2001/Remy).
