---
layout: page
title: "Covid'19 Screening Kiosk"
description: "Covid'19 Screening Kiosk (2022)"
img: assets/img/projects/covid19_screening_kiosk/covid19_screening_kiosk_thumbnail.png
importance: 8
category: ml, health
year: 2022
---

## Introduction

### Why an Automated Screening Kiosk?
The COVID-19 pandemic exposed a critical weakness in how public spaces handle health screening. Airports, university campuses, hospitals, malls, and workplaces suddenly became high-risk environments for viral transmission, yet the primary line of defense remained manual screening: temperature checks with handheld devices, visual inspection for mask compliance, and ad-hoc sanitization.

These manual processes were slow, labor-intensive, and error-prone. They created long queues, increased close-contact exposure, and depended heavily on human consistency. Ironically, the very act of screening people for infection risk often increased the risk of transmission itself.

At the same time, large-scale diagnostic testing was expensive and impractical for continuous use. During the peak of the pandemic, a single COVID-19 test could be expensive and time-consuming, making frequent testing economically infeasible for organizations operating at scale. What was needed was not a diagnostic replacement, but a fast, reliable *first-line screening system* that could flag potential risk while maintaining social distancing.

This project was motivated by that gap.

The goal was to design and build an **automated, self-service screening kiosk** capable of rapidly assessing key COVID-19 indicators—mask usage, body temperature, blood oxygen saturation (SpO₂), and pulse rate—while minimizing physical contact and human intervention. The system needed to be accurate enough to be meaningful, fast enough to avoid bottlenecks, accessible to a wide range of users, and inexpensive enough to justify real-world deployment.

Rather than treating this as a purely machine learning or sensing problem, I approached it as a **full systems challenge**: integrating sensing theory, signal processing, computer vision, embedded hardware, user interface design, accessibility standards, and cost analysis into a single deployable platform.

This kiosk was developed as part of my bachelor’s thesis and internship at **ETH Zurich**, with the broader vision that such systems could extend beyond COVID-19 and serve as scalable screening tools for future infectious diseases and public health emergencies.

### Video Demo
<div style="width: 100%; height: 80vh; display: flex; justify-content: center; align-items: center;">
  <iframe 
    src="https://drive.google.com/file/d/1Ve6UlBkOd8RfED5HR9ZI_wPf1xQCCAOW/preview"
    width="100%" 
    height="100%" 
    allow="autoplay"
    style="border: none; border-radius: 12px; min-height: 300px; max-width: 900px;"
  ></iframe>
</div>

## High Level Overview

## Design constraints that drove everything

## Hardware Design: CAD to Physical Kiosk

## Sensing Stack & Algorithms

## Software Architecture and Parallelization

## User Experience & Accessibility

## Evaluation & Results

## Cost and Deployment
