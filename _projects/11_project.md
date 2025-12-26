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

## Kernel MMIO & Device Drivers

All peripherals in this RTOS are driven directly via **memory-mapped I/O (MMIO)**, following the nRF52840 task/event programming model and ARM Cortex-M architectural constraints. Each driver exposes a minimal, synchronous interface intended to be predictable, debuggable, and suitable for use both in early boot code and later multitasking contexts.

---

#### GPIO

- **Peripheral:** nRF52840 GPIO blocks `P0` / `P1`  
  Base address `0x50000000`, with separate register banks for configuration, input, and atomic output control.

- **Interface:**  
  `gpio_init(pin, dir, pull, drive)`  
  `gpio_set(pin)` / `gpio_clr(pin)`  
  `gpio_read(pin) → 0/1`

- **Implementation:**  
  GPIO configuration is performed by writing to `PIN_CNF[n]`, explicitly setting direction, pull-up/down resistors, and drive strength. Output transitions use the `OUTSET` and `OUTCLR` registers to guarantee **atomic pin updates** without read-modify-write hazards. Inputs are read from the `IN` register via volatile pointers, ensuring the compiler does not cache pin state.

- **Design notes:**  
  This driver intentionally avoids abstractions such as “pin objects” or callbacks. Each operation maps directly to a single MMIO access, making GPIO behavior fully transparent during debugging and safe to use inside ISRs.

---

#### ADC / SAADC

- **Peripheral:** Successive Approximation ADC (SAADC)  
  Base address `0x40007000`, supporting EasyDMA and task/event operation.

- **Interface:**  
  `adc_setup(channel, pin, gain, ref)`  
  `adc_init(buffer, count)`  
  `adc_sample()`  
  `adc_quick_sample() → value`  
  `SAADC_Handler()`

- **Implementation:**  
  The driver configures SAADC channels in single-ended mode using the internal 0.6 V reference, programmable gain, and acquisition time. DMA buffers are set via `RESULT_PTR` and `MAX_CNT`. Conversions are driven explicitly using the task/event pipeline (`TASKS_START`, `TASKS_SAMPLE`, `EVENTS_STARTED`, `EVENTS_END`). Optional interrupt handling clears events and supports chained reactions to new samples.

- **Design notes:**  
  This implementation highlights the nRF task/event model as a hardware-level state machine. Both blocking (polling) and interrupt-driven usage are supported, making the driver usable in early boot and later multitasking contexts.

---

#### Bit-Banging / Software Timing

- **Peripheral:** TIMER0 (16 MHz high-resolution timer)

- **Interface:**  
  `bb_timer_init(freq)`  
  `bb_encode(bitstream, len)`  
  `bb_pwm(duty_sequence, cycles)`

- **Implementation:**  
  TIMER0 is configured with a programmable prescaler and compare value. The driver busy-waits on compare events to generate precise timing intervals. Each “tick” toggles GPIO pins using `OUTSET`/`OUTCLR`, allowing software-defined waveforms and PWM without using the hardware PWM block.

- **Design notes:**  
  This driver demonstrates how predictable timing can be achieved even without dedicated peripherals, at the cost of CPU occupancy. It was particularly useful for understanding the limits of polling-based designs.

---

#### I²C

- **Peripheral:** TWIM0 (I²C master with EasyDMA)  
  Base address `0x40003000`

- **Interface:**  
  `i2c_leader_init(scl, sda, freq)`  
  `i2c_leader_write(addr, buf, len)`  
  `i2c_leader_read(addr, buf, len)`  
  `i2c_leader_stop()`  
  `check_lux() → value`

- **Implementation:**  
  SDA/SCL pins are configured for open-drain operation and 100 kHz signaling. Transfers use EasyDMA (`TXD_PTR`, `RXD_PTR`) and are orchestrated via `TASKS_STARTTX/STARTRX`. Completion and error states are detected through `EVENTS_LASTTX`, `EVENTS_LASTRX`, and `EVENTS_ERROR`, with error decoding via `ERRORSRC`.

- **Design notes:**  
  The driver exposes the exact sequencing of I²C transactions and makes DMA behavior explicit, which simplifies reasoning about latency and failure cases when interfacing with sensors.

---

#### PWM

- **Peripheral:** PWM0  
  Base address `0x4001C000`

- **Interface:**  
  `pwm_init(freq)`  
  `pwm_set(duty, port, pin)`

- **Implementation:**  
  The driver configures PWM mode, prescaler, and `COUNTERTOP` to set a fixed waveform period. Output pins are selected via `PSEL_OUT`, and duty cycles are generated using sequence buffers repeatedly replayed by the PWM engine.

- **Design notes:**  
  PWM operation is entirely hardware-timed once configured, allowing the CPU to sleep or service other tasks without affecting waveform integrity.

---

#### RTT Debug Transport

- **Peripheral:** Debugger-assisted RAM transport (SEGGER RTT-style)

- **Interface:**  
  `rtt_init()`  
  `rtt_write(buf, len)`  
  `rtt_read(buf, len)`  
  `rtt_peek()`

- **Implementation:**  
  A control block is placed in RAM via the linker and initialized with up/down circular buffers. Reads and writes are implemented as blocking ring-buffer operations with explicit memory barriers to ensure coherence between the CPU and debugger.

- **Design notes:**  
  RTT provides early, low-intrusion logging before UART or scheduling is available, making it indispensable during bring-up.

---

#### Kernel Logging (`printk`)

- **Built on:** RTT

- **Interface:**  
  `printk(fmt, ...)`

- **Implementation:**  
  A small, custom formatter supports a limited subset of format specifiers and emits formatted strings through `rtt_write`. No dynamic memory or libc calls are used.

- **Design notes:**  
  This gives the kernel introspection and debugging capability while preserving full control over memory and execution.

---

#### SWO Output

- **Peripheral:** ARM CoreSight ITM/SWO

- **Interface:**  
  `swo_write(char)`

- **Implementation:**  
  The driver checks ITM enable and stimulus port status, then busy-waits until the FIFO is available before writing to `ITM_STIM0`.

- **Design notes:**  
  SWO provides an alternative low-latency debug path that operates independently of RAM-based transports.

---

#### RTC

- **Peripheral:** LFCLK + RTC0 (32.768 kHz domain)

- **Interface:**  
  `rtc0_init(period_ms)`  
  `RTC0_Handler()`

- **Implementation:**  
  The low-frequency clock is started explicitly, RTC prescaler and compare registers are programmed from millisecond inputs, and compare interrupts are enabled via `INTENSET` and NVIC. The ISR clears events and re-arms periodic compares.

- **Design notes:**  
  This driver demonstrates low-power, long-interval timing suitable for periodic tasks and system heartbeats.

---

#### NeoPixel (WS2812)

- **Peripheral:** PWM0 + GPIO (P0.16)

- **Interface:**  
  `pix_init()`  
  `pix_color_set(r, g, b)`

- **Implementation:**  
  RGB values are expanded into a PWM sequence encoding WS2812B pulse widths (1.25 µs bit period at 16 MHz). The sequence is sent via PWM EasyDMA, generating the exact waveform required by the LED without CPU intervention.

- **Design notes:**  
  This driver illustrates how general-purpose peripherals can be repurposed to meet strict timing protocols.

---

#### Mutex

- **Primitive:** ARMv7-M exclusive accesses and low-power wait instructions

- **Interface:**  
  `mutex_init(m)`  
  `mutex_lock(m)`  
  `mutex_try(m)`  
  `mutex_unlock(m)`

- **Implementation:**  
  The mutex is a single-word semaphore manipulated atomically using `LDREX/STREX`. Contended locks execute `WFE` to sleep until `SEV` is issued on unlock. Memory barriers enforce ordering guarantees.

- **Design notes:**  
  This implementation avoids spin-loops and integrates naturally with low-power execution.

---

#### MPU

- **Peripheral:** ARM Cortex-M MPU + MemManage fault logic

- **Interface:**  
  `mpu_enable()`  
  `mpu_thread_region_enable/disable()`  
  `mpu_kernel_region_enable/disable()`  
  `MemFault_C_Handler(psp)`

- **Implementation:**  
  Static MPU regions protect user text, rodata, and data using linker-defined boundaries. Dynamic regions enforce per-thread stack isolation. The MemFault handler inspects fault status registers and address registers to diagnose violations and terminate offending threads safely.

- **Design notes:**  
  This provides true user/kernel isolation on a microcontroller-class system.

---

#### SPI

- **Peripheral:** SPIM3 (EasyDMA SPI master)  
  Base address `0x4002F000`

- **Interface:**  
  `spi_init(freq)`  
  `spi_transfer(tx_buf, tx_len, rx_buf, rx_len)`

- **Implementation:**  
  GPIO pins are muxed to SPIM3, SPI mode and bit order are configured, and DMA pointers are programmed for full-duplex transfers. Completion is detected by polling `EVENTS_END`.

- **Design notes:**  
  The driver exposes the full SPI transaction lifecycle, making timing and blocking behavior explicit.
