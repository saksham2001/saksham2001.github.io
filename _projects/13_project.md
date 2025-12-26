---
layout: page
title: "VisionTracker"
description: "Autonomous Object-Following Mobile Robot for Autonomous Robotics I (2025)"
img: assets/img/projects/visiontracker/visiontracker_thumbnail.png
importance: 7
category: ml, robotics
year: 2025
---

<div class="d-flex justify-content-center my-3">
    <div style="max-width: 300px; width: 100%;">
        {% include figure.liquid loading="eager" path="assets/img/projects/visiontracker/visiontracker_thumbnail.png" title="VisionTracker" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

## Video Demo

<div class="row justify-content-center">
  <div class="col-lg-10">
    <figure class="text-center">
      <video width="100%" controls>
        <source src="{{ '/assets/video/projects/visiontracker_demo.mp4' | relative_url }}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <figcaption class="mt-2">
        The bot is instructed to look for a "potted plant". It starts the object-finding maneuver, locates the target, and then uses PID control to gradually approach the object until it is 1 meter away.
      </figcaption>
    </figure>
  </div>
</div>

As the final project for *Autonomous Robotics I* at CMU, we designed and built a fully autonomous 4-wheel drive mobile robot capable of detecting, localizing, and tracking everyday objects in real time using onboard perception and control.

### System Overview

We assembled a 4-wheel drive robot platform equipped with motor controllers and an **NVIDIA Jetson Nano** as the onboard computer along with an **Intel RealSense depth camera**. The Jetson Nano interfaces directly with the motor drivers via GPIO pins, issuing individual velocity commands for each wheel. The entire system runs **ROS 2**, for modular perception, planning, and control.

### Motion Control & ROS 2 Architecture

The robot follows a velocity-based control pipeline:

* A ROS 2 node converts commanded linear and angular velocity (`/cmd_vel`) into individual wheel velocities, which are published to the motor control interface.
* An action server exposes high-level motion commands, allowing the robot to be commanded asynchronously for behaviors such as object search and tracking.
* Low-level wheel velocity commands are continuously updated to ensure smooth motion and stable tracking.

### Perception & Object Selection

For perception, we run a YOLOv8 object detection model onboard the Jetson Nano, pretrained on the COCO dataset (80 object classes). A dedicated ROS 2 node allows the user to select any COCO object class at runtime.

Once an object is selected, the robot enters object-finding mode:

1. The robot performs a full 360° rotational scan to locate the target object in its camera view.
2. Upon detection, the system switches to tracking mode.

### Visual Servoing & Depth-Aware Control

The robot uses the depth camera to estimate the distance to the detected object. A PID control loop keeps the object centered in the camera frame while simultaneously driving the robot forward. Depth feedback is used to regulate forward velocity, and the robot autonomously approaches the object until it reaches a target distance of 1 meter, at which point it stops.


