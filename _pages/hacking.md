---
layout: page
title: hacking
permalink: /hacking/
description: Reverse-engineering, BLE sniffing, and other hardware tinkering.
nav: true
nav_order: 4
horizontal: false
---

<!-- pages/hacking.md -->
<div class="projects">
<!-- Display hacking articles without categories -->

{% assign sorted_hacking = site.hacking | sort: "importance" %}

  <!-- Generate cards for each hacking article -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for hacking in sorted_hacking %}
      {% include projects_horizontal.liquid project=hacking %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for hacking in sorted_hacking %}
      {% include projects.liquid project=hacking %}
    {% endfor %}
  </div>
  {% endif %}
</div>

