---
layout: page
title: "LoRa based CubeSat Prototype"
description: "LoRa based CubeSat Prototype (2025)"
img: assets/img/cubesat_lora_thumbnail.png
importance: 6
category: embedded, comms
year: 2025
---

# CubeSat Prototype

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/cubesat_lora_thumbnail.png" title="AI-generated Mission Patch" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    AI-generated mission patch for the CubeSat prototype project.
</div>

## Introduction

CubeSats are a class of miniature satellites built using standardized modular units that offer a low-cost and accessible platform for performing scientific experiments in space. Their small size and inexpensive construction have made them an important tool for performing science in space. Despite their simplicity, CubeSats must handle many of the same challenges as larger satellites, including power management during orbital shadow periods, executing a primary scientific experiment using onboard sensors, and reliably downlinking collected data to ground stations.

Modern CubeSats often rely on low-power long-range communication systems to meet their strict energy budgets. LoRa, in particular, has become increasingly popular because of its long-distance capability, robustness to noise, and high link redundancy. Community networks such as TinyGS have further accelerated adoption by enabling inexpensive, crowdsourced reception of CubeSat telemetry worldwide. In addition to communication, CubeSats must also deal with environmental challenges such as radiation-induced bit flips, motivating the use of watchdog timers, and other redundancy mechanisms.

In this project, we built a simplified CubeSat prototype that captures the core elements of an actual satellite system: power-aware mode switching, periodic scientific data collection, persistent logging, long-range communication via LoRa, and robust scheduling of multiple interacting threads. This was built upon our custom embedded RTOS that I built for a course at CMU. Our goal was to demonstrate how these subsystems integrate into a coherent embedded platform that mirrors the constraints and design principles of real CubeSat missions.

## System Architecture

### State Machine

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/cubesat_lora_state_machine.png" title="State Machine" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    State machine diagram showing the three-state power-aware architecture.
</div>

The CubeSat prototype operates using a three-state power-aware architecture that mirrors real spacecraft behavior. The system transitions between Sleep, Experiment, and Communication modes based on available energy and the presence of data waiting to be transmitted. A simplified hardware switch is used in place of a real battery to simulate power availability. We modified our RMS scheduler from our custom embedded RTOS to support the state transitions based on the battery level and data availability.

#### Sleep Mode
- Lowest-power state; entered on reset.
- Intended to simulate battery charging periods.
- Only minimal housekeeping threads run (e.g., heartbeat).
- The Power Manager monitors the simulated battery level.
- Transition out of Sleep occurs when sufficient energy is available.

#### Experiment Mode
- Primary science/data-collection state.
- Microphone + ADC threads periodically sample data.
- Data is stored to QSPI flash via the logging filesystem.
- Processing tasks (FFT or similar lightweight compute) may run.
- Transition to Communication happens when logged data is available for downlink.
- Transition to Sleep happens if power drops below threshold.

#### Communication Mode
- Dedicated LoRa downlink state.
Packetizer thread loads data segments from flash, formats LoRa packets, and queues them.
- LoRa TX thread handles FIFO writes, opcode sequencing, and triggers transmission.
- Heartbeat packets may be sent periodically.
- Transition back to Experiment if transmission is complete and energy is sufficient.
- Transition to Sleep if energy becomes insufficient.

### State Transition Logic
| Current State | Condition                 | Next State                                   |
| ------------- | ------------------------- | -------------------------------------------- |
| Sleep         | Power ≥ threshold         | Experiment / Communication depending on data |
| Experiment    | Data ready for TX         | Communication                                |
| Experiment    | Power < threshold         | Sleep                                        |
| Communication | TX finished & power is OK | Experiment                                   |
| Communication | Power < threshold         | Sleep                                        |


### Thread Model

The system is composed of five periodic threads that operate across different system states. Each state uses a different subset of threads, enabling modularity and power-aware scheduling. Threads are organized into common (always running) and mode-specific categories.

#### A. Common Threads (always running)
1. **Watchdog Thread**
- Ti: 100ms, Ci: 2ms
- Continuously calls `uwatchdog_bop()` to kick the watchdog timer.
- Ensures the system does not stall by triggering automatic resets.
- Simulates radiation-induced fault tolerance and recovery behavior seen in real CubeSats.

2. **Battery Thread**
- Ti: 100ms, Ci: 2ms
- Monitors simulated battery level
- Updates the global status structure with current energy status and system time.

3. **Heartbeat Thread**
- Ti: 100ms, Ci: 10ms
- Periodically emits a telemetry packet containing system status information.
- Formats a status line with time, battery level, downlink status, and sample status.
- Sends the status packet via LoRa and prints it to serial output.
- Provides liveness visibility to the ground station and serial logs.

#### B. Experiment-Mode Threads
1. **Sample Thread**
- Ti: 100ms, Ci: 10ms
- Samples microphone/ADC data by calling `get_sample()`.
- Waits for interrupt if sample data is not immediately ready.
- Updates the global status structure with sample status (128 bytes on successful acquisition).
- Handles data acquisition and pushes data into the flash logging layer.

#### C. Communication-Mode Threads
1. **Downlink Thread**
- Ti: 100ms, Ci: 10ms
- Reads 128-byte data blocks from flash using `uflash_read()`.
- Formats and sends payloads via LoRa using `lora_send()`.
- Updates the global status structure with downlink status (0=success, 2=empty flash, 1=transmitted).
- Handles the complete downlink process: reading from flash and transmitting via LoRa.

### Receive Stretch Goal

We were also able to implement the receive functionality using the SX1262 
module. Although we didn't use this in any of the threads, we were able to 
independently test it.

## Hardware Setup

The CubeSat prototype is built around the Adafruit Feather nRF52840 
microcontroller, the Seeed Studio Wio SX1262 LoRa radio module, and a 
microphone used as the scientific payload. All components interface 
through SPI, GPIO, and ADC peripherals provided by nRF.

### LoRa Radio (TX/RX) [[Datasheet](https://files.seeedstudio.com/products/SenseCAP/Wio_SX1262/Wio-SX1262_Module_Datasheet.pdf)]:

We used the Seeed Studio Wio SX1262 LoRa radio module which uses the 
Semtech SX1262 LoRa radio chip along with a 32 MHz crystal oscillator, a 
matching filter and a RF switch to select the TX or RX path. The module 
was interfaced with the nRF52840 using the SPI peripheral. We initially 
powered the module from the feather board's 3.3V rail while it was 
connected to the BMP, but we couldn't get the TX or RX to work. We then 
powered all the peripherals and feather board from an external 3.3V supply 
and it worked.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/cubesat_lora_seeed_wio.png" title="Wio SX1262 Schematic" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Wio SX1262 Schematic.
</div>

The interaction with the SX1262 is done using the SPI interface and it usually follows this structure where we send specific OPCODEs and parameters (optional) to the module and it responds with a status (for the command) or data (for some other command). See the
[SX1262 Datasheet](https://www.semtech.com/products/wireless-rf/lora-connect/sx1262) for more details.

The power to the crystal oscillator is provided by the SX1262's DIO3 pin, but these need to be confiured using SPI commands. The SX1262 controls the RF switch to select the TX or RX path from the DIO2 pin, which is also configured using SPI commands. The SX1262's BUSY pin is used to wait for the module to be ready for the next command which is configured to GPIO. The SX1262's DIO1 pin is used to detect the end of a transmission or reception which is also configured to GPIO. The output of the DIO1 is dynamically configured using SPI commands to either trigger a transmission or reception, and the thread polls this pin to check for the end of a transmission or reception. The SX1262 needs to be configured for the desired frequency, spreading factor, bandwidth, coding rate, preamble length, payload length, and other parameters using SPI commands before the TX or RX can be initiated.

### Microphone / ADC

The microphone is used as a sensor data source and is wired and set up like in our earlier labs. The driver for this device operates asynchronously and communicates with its caller by means of a callback. As we are storing the microphone data into flash, this is handled in the callback, and the caller receives the status of the flash write.

### Watchdog

The board's builtin watchdog interface has been configured with one input, and a timeout of 10 seconds. Functionality has been tested by halting the watchdog monitoring thread.

### Flash memory

The board has flash memory with an erasure unit of 4096 bytes. We are using lower pages for program code, so our storage facility has picked the top two pages for storage. It was necessary to allocate two pages so that when a write operation goes past the end of one page, it can continue writing in another page, while read operations can still proceed in the original page. Functionality was tested by doing continuous writes to flash and reading to compare.

Once flash was used, code corruption on upload became much more frequent. Erasing the flash on connection to the board has eliminated this problem during the remainder of development on this project.

### Scheduler

The scheduler from our labs has been extended to manage operating states of the system. State change logic determines the operating state based on defined parameters, such as the system energy level. Threads request in
which operating state to run in, and they will only be scheduled when the system is in the correct state. We have chosen to have a SLEEP state; threads that are allocated to that state will also be run in the other states. Those threads are generally important to the operation of the system, such as the watchdog bopper, energy monitor and status transmitter.

Threads were profiled, but utilization was not an issue for us here,  partially because longer scheduling periods made demonstrating operation easier.

### Pin Configuration:

The following table summarizes all GPIO pin assignments used in the CubeSat prototype:

| Pin | Function | Direction |
|-----|----------|-----------|
| P0.13 | SX1262's MOSI | Output |
| P0.14 | SX1262's SCK | Output |
| P0.15 | SX1262's MISO | Input |
| P0.26 | SX1262's NSS | Output |
| P0.27 | SX1262's RF_SW | Output |
| P0.07 | SX1262's NRST | Output |
| P1.08 | SX1262's BUSY | Input |
| P0.06 | SX1262's DIO1 | Input |
| P0.04 (A4/AIO0) | Microphone analog output | Input |
| P1.02 | User switch | Input |
| P0.18 | Reset button | Input |
| P1.15 | Red LED | Output |
| P1.10 | Blue LED | Output |

You can see our final setup here:
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/cubesat_lora_final.jpg" title="Final Setup" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Final CubeSat prototype hardware setup.
</div>

### Receiving Board

To test the transmission from our CubeSat, we used another board with Seeed Studio XIAO nRF52840 microcontroller along with a Seeed Studio Wio SX1262 LoRa radio module. The code to configure this was written in Arduino IDE and uses the [RadioLib Library](https://github.com/jgromes/RadioLib) to interact with the SX1262.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/cubesat_lora_receiving_board.jpeg" title="Receiving Board" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The receiving board for transmission tests, built using Seeed Studio XIAO nRF52840 and Wio SX1262 LoRa Radio module.
</div>

