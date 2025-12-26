---
layout: page
title: "Covid'19 Screening Kiosk"
description: "Covid'19 Screening Kiosk (2022)"
img: assets/img/projects/covid19_screening_kiosk/kiosk_final.png
importance: 8
category: ml, health
year: 2022
---

## Why an Automated Screening Kiosk?
The COVID-19 pandemic exposed a critical weakness in how public spaces handle health screening. Airports, university campuses, hospitals, malls, and workplaces suddenly became high-risk environments for viral transmission, yet the primary line of defense remained manual screening: temperature checks with handheld devices, visual inspection for mask compliance, and ad-hoc sanitization.

These manual processes were slow, labor-intensive, and error-prone. They created long queues, increased close-contact exposure, and depended heavily on human consistency. Ironically, the very act of screening people for infection risk often increased the risk of transmission itself.

At the same time, large-scale diagnostic testing was expensive and impractical for continuous use. During the peak of the pandemic, a single COVID-19 test could be expensive and time-consuming, making frequent testing economically infeasible for organizations operating at scale. What was needed was not a diagnostic replacement, but a fast, reliable *first-line screening system* that could flag potential risk while maintaining social distancing.

This project was motivated by that gap.

The goal was to design and build an **automated, self-service screening kiosk** capable of rapidly assessing key COVID-19 indicators—mask usage, body temperature, blood oxygen saturation (SpO₂), and pulse rate—while minimizing physical contact and human intervention. The system needed to be accurate enough to be meaningful, fast enough to avoid bottlenecks, accessible to a wide range of users, and inexpensive enough to justify real-world deployment.

Rather than treating this as a purely machine learning or sensing problem, I approached it as a **full systems challenge**: integrating sensing theory, signal processing, computer vision, embedded hardware, user interface design, accessibility standards, and cost analysis into a single deployable platform.

This kiosk was developed as part of my bachelor’s thesis and internship at **ETH Zurich**, with the broader vision that such systems could extend beyond COVID-19 and serve as scalable screening tools for future infectious diseases and public health emergencies.

### Video Demo
<div class="row my-4">
  <div class="col-md-7 mb-3 mb-md-0 d-flex align-items-center justify-content-center" style="min-height: 320px;">
    <iframe 
      src="https://drive.google.com/file/d/1Ve6UlBkOd8RfED5HR9ZI_wPf1xQCCAOW/preview"
      width="100%" 
      height="350" 
      allow="autoplay"
      style="border: none; border-radius: 12px; min-height: 300px; max-width: 100%;"
    ></iframe>
  </div>
  <div class="col-md-5 d-flex align-items-center justify-content-center">
    {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/kiosk_final.png" title="Covid'19 Screening Kiosk - Final Build" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

## High Level Overview

At a high level, the kiosk is designed to perform end-to-end health screening for a single user in a guided, self-service workflow. From the moment a user approaches the kiosk to the final screening decision, all sensing, inference, and feedback are handled automatically without requiring trained personnel.

The system integrates multiple sensing modalities (vision, thermal imaging, and photoplethysmography) each targeting a specific screening signal. These subsystems operate in parallel and are orchestrated through a centralized decision-making pipeline to minimize total screening time.

### Screening Signals Captured

The kiosk screens for the following indicators:

- **Mask compliance** using an RGB camera and a real-time computer vision model  
- **Body temperature** by combining thermal imaging and RGB camera 
- **Blood oxygen saturation (SpO₂)** using a fingertip photoplethysmography (PPG) sensor  
- **Pulse rate**, estimated from both contact-based PPG and camera-based remote PPG (rPPG)  
- **Hand sanitization**, enforced as part of the workflow to reduce cross-user contamination  

Each signal is chosen deliberately. While no single measurement is sufficient to identify infection.

### User-Centered Workflow

The kiosk guides the user through the screening process step by step using a touch-based graphical interface, visual indicators, and audio cues. The workflow is designed to be:

- **Fast**: All measurements are completed within a single interaction  
- **Low-contact**: Sensors are either contactless or require minimal touch  
- **Accessible**: Physical dimensions and interface design follow established accessibility standards  
- **Error-tolerant**: The system detects improper positioning or incomplete steps and prompts corrective action  

Importantly, the user is never required to interpret raw data. The kiosk abstracts sensor complexity behind simple instructions and produces a clear screening outcome at the end of the interaction.

### System Architecture Philosophy

Rather than building a monolithic pipeline, the kiosk is structured as a set of loosely coupled subsystems:

- Independent sensing modules acquire raw data  
- Signal processing and inference run concurrently  
- A central controller synchronizes results and enforces decision logic  

This modular design improves robustness, allows individual components to be upgraded independently, and makes the system adaptable to different deployment scenarios or future screening requirements.

In the following sections, I break down how each of these subsystems—hardware, sensing algorithms, software architecture, and user interface—was designed, implemented, and evaluated as part of this project.

<div class="d-flex justify-content-center my-4">
  {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/kiosk_flow.png" title="Covid'19 Kiosk System Flowchart" class="img-fluid rounded z-depth-1" %}
</div>

## Design constraints that drove everything
Before choosing sensors, models, or materials, the most important step in this project was defining the constraints. Unlike a lab-only prototype, this kiosk was designed with real-world deployment in mind. Every technical decision, from hardware layout to algorithm selection, was shaped by a small set of non-negotiable constraints.

### 1. Minimizing Human Contact

The primary objective of the kiosk was to reduce close human interaction during health screening. Manual temperature checks and supervised screening introduce repeated contact between staff and users, increasing exposure risk.

This constraint directly influenced several design choices:
- Preference for contactless or low-contact sensing wherever possible  
- Automated guidance to eliminate the need for trained operators  
- Enforced sanitization as part of the screening workflow  

While fully contactless sensing is attractive, it is not always reliable in practice. For this reason, the kiosk adopts a mixed sensing strategy, combining contactless measurements (vision and thermal imaging) with brief, controlled contact (fingertip PPG) when accuracy demands it.

### 2. Throughput and Time per User

Screening systems deployed in public spaces must process users quickly. Long interactions lead to queues, frustration, and ultimately abandonment of the system.

This constraint ruled out:
- Long signal acquisition windows  
- Computationally heavy models that cannot run in real time  
- Sequential processing of independent measurements  

Instead, the system was designed to:
- Run multiple sensing pipelines in parallel
- Provide real-time feedback to keep the user engaged  
- Complete all screening steps within a single, continuous interaction  

The focus was not just on accuracy, but on accuracy per second of user time.

### 3. Accuracy vs. Deployability

Clinical gold-standard measurements often require trained personnel, invasive sensors, or long acquisition times. While highly accurate, these approaches are fundamentally incompatible with self-service kiosks.

This project explicitly prioritizes deployable accuracy over theoretical optimality:
- Infrared and thermal sensors instead of rectal or oral thermometry  
- Photoplethysmography instead of ECG for pulse rate estimation  
- Machine learning models optimized for robustness rather than peak benchmark scores  

Wherever possible, measurements were evaluated against established gold standards, but the final system favors methods that can operate reliably in uncontrolled public environments.

### 4. Accessibility and Usability

A screening kiosk is only effective if it can be used by *everyone*. Many healthcare kiosks in existing literature overlook accessibility, despite well-established standards.

From the outset, the kiosk was designed to:
- Comply with ADA guidelines for physical reach and height  
- Follow WCAG principles for visual contrast, feedback, and interaction flow  
- Provide clear visual and audio cues to guide users  

These requirements influenced physical dimensions, sensor placement, screen size, interface layout, and even color choices. Accessibility was treated as a core design constraint, not a post-hoc addition.

### 5. Cost and Economic Viability

Finally, the kiosk needed to make economic sense. A system that is accurate but prohibitively expensive will never see real deployment.

This constraint affected:
- Sensor selection and redundancy  
- Material choices for the enclosure  
- Preference for commodity hardware over specialized medical equipment  

Together, these constraints shaped the kiosk.

## Hardware Design: CAD to Physical Kiosk

The kiosk was designed as a self-contained, freestanding system that balances accessibility, manufacturability, and rapid iteration. Rather than treating the enclosure as a passive shell, the physical design was tightly coupled with sensing, user interaction, and accessibility requirements.

### CAD Design

The full kiosk was modeled in CAD to determine:
- Screen height and reach in accordance with accessibility guidelines  
- Sensor placement for consistent line-of-sight and thermal measurements  
- Internal volume for electronics, wiring, and airflow  

This upfront CAD work allowed component placement, user posture, and interaction flow to be evaluated before fabrication.

### Fabrication and Assembly

To keep the system inexpensive and easy to modify, the enclosure was built using:
- Laser-cut plywood panels for the main structure  

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/sheets.png" title="Laser-cut plywood panels" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

- 3D-printed parts for sensor housings, hand trays, and internal mounts  

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/3d_parts.png" title="3D-printed parts" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

This hybrid approach enabled fast iteration: structural changes could be made by updating CAD files and re-cutting or re-printing individual components rather than rebuilding the entire kiosk. Each sensing module (RGB camera, thermal camera, PPG sensor, and motion sensor) was housed in a dedicated enclosure.

## Sensing Stack & Algorithms

The kiosk integrates multiple sensing modalities, each targeting a specific physiological or behavioral signal. Each subsystem was designed to operate independently, with minimal assumptions about user behavior or environmental conditions, and to produce outputs that could be synchronized at the decision layer.

### Mask Detection (RGB Vision)

Mask compliance is detected using an RGB camera mounted above the display, aligned to capture a frontal facial view during user interaction.

The pipeline consists of:
1. Face detection and region extraction  
2. Binary mask classification using a lightweight convolutional neural network  
3. Temporal smoothing across consecutive frames to reduce flicker and false positives  

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/mask_pipeline.png" title="Mask Detection Pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

The model was trained on a curated dataset containing masked and unmasked faces under varying lighting conditions, camera angles, and occlusions. Model optimization focused on inference speed and robustness rather than maximizing benchmark accuracy, enabling real-time execution on consumer-grade hardware.

Output from this subsystem is a confidence score indicating mask compliance, which gates progression to subsequent screening steps.

### Body Temperature Measurement (Thermal + Infrared)

Body temperature is estimated using a combination of:
- A thermal camera for spatial temperature distribution  
- An infrared temperature sensor for localized point measurements  

Facial temperature is estimated by identifying the forehead region in the thermal frame, while hand temperature is captured when the user places their hand inside the designated tray. These measurements are corrected for environmental variation and sensor noise through calibration offsets determined during testing.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/temp_pipeline.png" title="Temperature Measurement Pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

The dual-sensor approach reduces sensitivity to improper positioning and ambient temperature fluctuations, which are common failure modes in single-sensor systems.

### Pulse Rate and SpO₂ (PPG and rPPG)

Physiological monitoring is performed using two complementary approaches.

**Contact-based PPG:**  
A fingertip pulse oximeter provides direct photoplethysmographic measurements used to estimate pulse rate and blood oxygen saturation. The raw PPG signal is filtered to remove motion artifacts and baseline drift before peak detection and BPM estimation.

**Camera-based rPPG:**  
In parallel, pulse rate is estimated remotely using an RGB camera via remote photoplethysmography. The rPPG pipeline consists of:
- Face detection and ROI selection  
- Extraction of mean RGB intensity signals over time  
- Temporal filtering and windowing  
- Blood Volume Pulse (BVP) estimation using signal processing methods  
- Frequency-domain analysis for BPM estimation  

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/covid19_screening_kiosk/rppg_pipeline.png" title="rPPG Pipeline" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

Multiple rPPG algorithms were evaluated, including chrominance-based and plane-orthogonal-to-skin methods, with selection driven by robustness to motion and illumination changes rather than raw accuracy.

The contact-based PPG serves as a reliability anchor, while rPPG provides a contactless estimate and redundancy under partial sensor failure.

### Synchronization and Data Flow

Each sensing module produces time-stamped outputs that are buffered and synchronized by the central controller. This design allows:
- Parallel execution of independent sensing pipelines  
- Graceful degradation if one modality fails  
- Consistent decision-making despite variable acquisition times  

No single sensing modality is treated as authoritative; instead, each contributes a bounded-confidence signal to the overall screening process.


## Software Architecture and Parallelization

## User Experience & Accessibility

## Evaluation & Results

## Cost and Deployment
