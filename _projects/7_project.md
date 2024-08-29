---
layout: page
title: AgriHero
description: A comprehensive hub for agricultural activities (2021)
img: assets/img/agrihero_logo.png
importance: 7
category: fun
---

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_logo.png" title="AgriHero Logo" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

## Overview

AgriHero is an application that serves as a central hub for all agricultural activities in a region. It aims to address the challenges faced by the agriculture sector due to recent regulatory changes and poor infrastructure for crop management.

## Features

- Detailed view of important happenings in the agriculture sector
- Platform for fair agricultural commerce
- Sensor-based crop monitoring system
- Direct selling platform for farmers
- Data-driven decision-making for crop pricing
- One-stop resource for agriculture sector stakeholders

## Tech Stack

### Web Platform
- Flask (Python)
- MySQL database
- HTML5 & CSS3
- Bootstrap and JavaScript

### Farm Monitoring System
- Raspberry Pi
- ESP32 CAM
- Various sensors (Rain, Soil Moisture, LDR, Gas, Temperature, Humidity)

## How to Use

1. Visit the live website: [AgriHero](https://agrihero-webapp.herokuapp.com/)
2. For local setup:
   - Clone the repository
   - Install dependencies: `pip3 install -r requirements.txt`
   - Uncomment lines 215 and 216 in `applet.py`
   - Run the application: `python applet.py`

## Key Pages

- Home (with real-time alerts)
- Buy & Sell marketplace
- News feed
- User authentication (Login/Register)

## Team

Created by Saksham Bhutani, Anirudh Karnik, Anshuman Phadke, Ishan and Arvind N

[View on GitHub](https://github.com/saksham2001/AgriHero)

## Screenshots

### About Page
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_about1.png" title="About Page 1" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_about2.png" title="About Page 2" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Home Page
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_home1.png" title="Home Page 1" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_home2.png" title="Home Page 2" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Home Page with Alerts
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_home_with_alert.png" title="Home Page with Alerts" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Buy & Sell Page
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_buy&sell.png" title="Buy & Sell Page" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Buy Page with all Listings
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_buy.png" title="Buy Page with all Listings" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Buy Page for Individual Listing
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_buy_individual.png" title="Buy Page for Individual Listing" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Sell Page
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_sell.png" title="Sell Page" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### News Page
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_news.png" title="News Page" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Login and Register Pages
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_login.png" title="Login Page" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/agrihero_register.png" title="Register Page" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
