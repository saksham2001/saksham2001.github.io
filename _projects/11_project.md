---
layout: page
title: "Custom Embedded RTOS"
description: "RTOS for nRF52840 in bare metal C (2025)"
img: assets/img/projects/custom_embedded_rtos/custom_embedded_rtos_thumbnail.png
importance: 5
category: embedded
year: 2025
---

<div class="d-flex justify-content-center my-3">
    <div style="max-width: 300px; width: 100%;">
        {% include figure.liquid loading="eager" path="assets/img/projects/custom_embedded_rtos/custom_embedded_rtos_thumbnail.png" title="Custom Embedded RTOS" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

> ##### NOTE
>
> The codebase for this project is not publically available because it this was part of a course at CMU. It can be made available upon request.
{: .block-warning }

## Introduction

As part of an embedded systems course at CMU, I built a real-time operating system (RTOS) entirely from scratch on the nRF52840 microcontroller using bare-metal C, without relying on any SDKs, libraries, or existing operating systems. Starting from the reset handler and custom linker scripts, I implemented core OS functionality including device drivers, interrupt handling, privilege separation, context switching, and a preemptive, priority-based scheduler. This was one of the most fun and challenging projects I have worked on. I spent countless hours debugging and testing the OS, and I learned a lot about the intricacies of embedded systems.

## Hardware & Constraints
This project was implemented on the Nordic nRF52840 (Arm Cortex-M4) using the Adafruit Feather nRF52840 development board. All code was written in bare-metal C and built/debugged using the Arm GNU toolchain (arm-none-eabi-gcc, arm-none-eabi-gdb) with a Black Magic Probe (BMP) serving as both the flashing and hardware debugging interface. In addition to on-chip peripherals (GPIO, timers, UART, SAADC, NVIC), the system interfaced with external hardware including an I²C ambient light (lux) sensor, an analog microphone module, and the Feather’s onboard WS2812 (NeoPixel) RGB LED, all driven through custom drivers without any SDK or libraries.

## Bootloader
On reset, the nRF52840 follows the standard Cortex-M boot sequence, beginning execution from a vector table placed at address 0 in flash. I defined this vector table manually in startup.s, with the first entry providing the initial main stack pointer and the second entry pointing to Reset_Handler, followed by handlers for core exceptions (HardFault, SVC, PendSV, SysTick, MemoryFault, etc) and all nRF52840 external IRQs. The linker script explicitly places this .vector_table section at the start of flash, ensuring the CPU can locate it immediately after reset.

The Reset_Handler performs a minimal runtime bring-up before handing control to the kernel. It invokes an early setup routine (prep_for_reset) to configure system handler priorities and initialize RAM with a known pattern for debugging. It then clears the .bss section, copies initialized .data from flash into RAM using linker-defined symbols, and finally branches into kernel_main. At this point, all C runtime assumptions are satisfied, and the system transitions cleanly from bare-metal startup code into the RTOS kernel proper.