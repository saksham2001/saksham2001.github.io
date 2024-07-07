---
layout: page
title: "Black Bird: High Powered Model Rocket (2019)"
description: High Powered Model Rocket"
img: assets/img/STAR_BB-2.jpeg'
importance: 3
category: fun
---
<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/STAR_BB-1.jpeg" title="image" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

This project was undertaken during Winter Internship 2019 at Avionics Lab, Space Technology and Rocketry (STAR), Surat, India

## Project Mission:
To design and develop a High Powered Model Rocket. This Rocket shall reach a minimum height of 120 meters Propulsively and shall have a Recovery System to land on the ground safely.

A Team comprising 9 interns worked on different aspects of the Rocket, namely 2 interns worked on the Design, 2 interns worked on Avionics, 2 interns worked on Recovery System and 3 interns worked on Propulsion.

## My Role:
* Member of Avionics Team, I was responsible for the developing Avionics system onboard the rocket to trigger recovery system and collect data.
* Designed General Circuit Board (GCB) based on the dimensions of the rocket, the board had a microcontroller, sensors and data storage devices. The build process included the following steps:
    * Roughly Planning the Positioning of various components on paper based on their proximity to the Microcontroller.
    * Designing the Circuit by Computer-Aid using Eagle software.
    * Realising the actual design on General Circuit Board by Soldering various components on the board and making required connections between the components.
    * Various tests were conducted on the GCB before the actual flight.
    
<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/STAR_gcb.jpeg" title="General Circuit Board (GCB)" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

* Developed the software for the GCB.
    * The software was capable of Triggering the Recovery Mechanism based on pre-determined conditions using data from the Inertial Measurement Unit and Altitude Sensor.
    * The software also recorded data from various sensors and in-flight events.
* Developed Rocket Launch Igniter including the hardware and software.
    * The Igniter provided the ability to remotely trigger the launch sequence to light the Rocket Motor.
    * The Igniter could be used with Bluetooth or Internet to trigger launch countdown and emergency abort of countdown in case of an anomaly.
    
<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/STAR_igniter-gcb.jpeg" title="General Circuit Board (GCB)" class="img-fluid rounded z-depth-1" %}
  </div>
</div>

* Developed Android Application to communicate with the Rocket Launch Igniter.
    * The application provided the ability to initiate the launch countdown and emergency abort the countdown in case of anomaly.
  

Start Screen | Launch Pad Igniter
:-------------------------:|:-------------------------:
{% include figure.liquid path="assets/img/STAR_igniter-gcb.jpeg" title="Screenshot" class="img-fluid rounded z-depth-1" %} | {% include figure.liquid path="assets/img/STAR_igniter-gcb.jpeg" title="Screenshot" class="img-fluid rounded z-depth-1" %}

Bluetooth Selection Menu | Launch Sequence Starter
:-------------------------:|:-------------------------:
{% include figure.liquid path="assets/img/STAR_igniter-gcb.jpeg" title="Screenshot" class="img-fluid rounded z-depth-1" %} | {% include figure.liquid path="assets/img/STAR_igniter-gcb.jpeg" title="Screenshot" class="img-fluid rounded z-depth-1" %}

During Launch Sequence |
:-------------------------:|
{% include figure.liquid path="assets/img/STAR_igniter-gcb.jpeg" title="Screenshot" class="img-fluid rounded z-depth-1" %} |

* Developed Static Launch Test Pad to help Propulsion Team test different motors.
  * Static Launch Pad used a load cell to measure the thrust and burn-time of the motor.
  * The data recorded was used by Propulsion Team to analyse different fuel compositions for the rocket motor.

{% include figure.liquid path="assets/img/STAR_launch-pad.gif" title="General Circuit Board (GCB)" class="img-fluid rounded z-depth-1" %}

## Project Accomplishments:
* 2 High Powered Model Rockets were successfully developed.
* A Remote Launch Igniter and a Static Test Pad was also developed.
* Many integrated tests were conducted of all the Systems:
  * Numerous ground tests were conducted for the main Rocket Avionics Board and Wireless Igniter.
  * 10+ Drop Tests were conducted for the main rocket avionics GCB.
  * 9 Static Tests were conducted and data collected was analysed to determine the composition of fuel for the motor.
  * 2 Rocket launches were conducted with all systems together.

{% include figure.liquid path="assets/img/STAR_launch-2.gif" title="General Circuit Board (GCB)" class="img-fluid rounded z-depth-1" %}