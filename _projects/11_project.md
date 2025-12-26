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
  `gpio_read(pin) to 0/1`

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
  `adc_quick_sample() to value`  
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
  `check_lux() to value`

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

- **Peripheral:** PWM0 + GPIO (P0.16 connected to the onboard NeoPixel LED)

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

## User vs Kernel: Privilege Separation

This RTOS enforces a clear separation between kernel and user execution using a combination of Cortex-M privilege levels, dual stack pointers, and the Memory Protection Unit (MPU). The goal is to ensure that application code can execute safely without direct access to kernel state or hardware, while still allowing controlled interaction through well-defined system calls.

Kernel code always runs in privileged mode and uses the Main Stack Pointer (MSP). This includes all exception handlers, scheduler logic, device drivers, and MPU configuration. In contrast, user applications run in unprivileged Thread mode and use the Process Stack Pointer (PSP). Once the MPU is enabled, user code is restricted to explicitly defined regions of flash and RAM and is prevented from accessing kernel memory or MMIO registers directly.

This separation is reinforced at the linker level. The linker script places kernel and user sections into distinct regions—kernel text and data are isolated from user text, rodata, data, and stacks. During initialization, `mpu_enable()` programs MPU regions with appropriate permissions: kernel regions are accessible only in privileged mode, while user regions are readable and writable (or executable where appropriate) only when running unprivileged. As a result, any illegal access from user code reliably triggers a memory management fault rather than silently corrupting kernel state.

Transitioning from kernel execution into unprivileged user code is a deliberate, explicit handoff. While still in privileged mode, the kernel initializes the user process stack and switches the active stack pointer to the PSP. Control is then transferred to a small user-mode entry stub, which updates the processor control state so that Thread mode becomes unprivileged and continues execution using the PSP. Only after this transition does user C code begin executing. From that point onward, user code cannot regain privilege on its own.

Interaction between user and kernel code is implemented through system calls using the ARM Supervisor Call (SVC) mechanism. User-space functions invoke SVC instructions with a small immediate value identifying the requested service, passing arguments in registers according to the standard calling convention. Executing an SVC causes the processor to synchronously enter Handler mode, which is always privileged. The hardware automatically saves the user execution context, and control is transferred to the kernel’s SVC handler.

The SVC handler extracts the system call identifier, validates arguments, and dispatches to the corresponding kernel service. Any return value is written back into the saved user context so that, when the exception completes, execution resumes seamlessly in user space as if the call had returned from a normal function. Crucially, the processor automatically restores unprivileged Thread mode and the PSP on exception return, ensuring that privilege is never accidentally retained by user code.

Together, privilege levels, stack separation, MPU enforcement, and SVC-based system calls form the security and isolation boundary of the RTOS. This design allows user applications to run with strong safety guarantees while keeping the kernel small, auditable, and fully in control of hardware and system state.

## Context Switching & Multithreading

The multitasking subsystem extends the kernel from a single-threaded execution model into a true multi-threaded runtime that supports both non-preemptive and preemptive scheduling of multiple user-level threads. This design deliberately mirrors how real RTOS kernels structure their threading APIs, while keeping the mechanics explicit and inspectable.

User code interacts with the multitasking system exclusively through a small, well-defined set of system calls. Before any scheduling begins, the user program declares its intent by calling `multitask_request(n, stack_bytes)`, which informs the kernel how many threads will exist and how much stack space each thread requires. The kernel validates these parameters, partitions the user stack region accordingly, and initializes a global process control block (PCB) that will hold all thread metadata. At this stage, no threads are runnable yet; the kernel is only reserving resources and establishing bookkeeping structures.

Threads are then defined individually using `thread_define(thread_id, fn, arg)`. For each thread, the kernel constructs an initial user-mode stack frame that makes the thread appear as though it had been interrupted just before executing `fn(arg)`. This includes preloading the argument register, setting the program counter to the thread entry function, installing a special `thread_end` trampoline as the return address, and initializing the processor state so execution begins in Thumb mode. In parallel, the kernel allocates a corresponding kernel stack frame and records both user and kernel context in a Thread Control Block (TCB). Each TCB therefore captures everything required to suspend and later resume that thread.

Once all threads are defined, `multitask_start(freq)` transfers control to the scheduler. At this point, all user-defined threads are marked `READY`, and the original `main` execution context is converted into a special main thread TCB. This main thread is treated like any other schedulable entity, allowing the system to cleanly return to `main` once all worker threads have completed. If `freq` is zero, the system runs in non-preemptive mode, and context switches occur only when threads explicitly yield or terminate. If `freq` is non-zero, the kernel configures the SysTick timer to generate periodic interrupts, enabling preemptive scheduling.

All transitions between threads are mediated by the PendSV exception, which is reserved exclusively for context switching. When a switch is required—either because a thread voluntarily yields, terminates, or is preempted by SysTick—the kernel sets the PendSV pending bit. When PendSV is taken, execution enters privileged handler mode, and the low-level assembly stub preserves the minimal architectural state before transferring control to a C-level handler.

The core of the context switch occurs in the PendSV handler in `multitask.c`. If a thread was previously running, its callee-saved registers, stack pointers, and exception return state are saved into its TCB, and its state is updated from `RUNNING` to `READY` as appropriate. The scheduler is then invoked to select the next runnable thread using a simple round-robin policy that skips threads marked `DONE`. If no runnable user threads remain, the scheduler selects the main thread TCB, allowing execution to unwind naturally back to the original user program.

Once a next thread is selected, its saved context is restored, the kernel stack is reloaded, and PendSV returns using a carefully chosen exception return value that resumes execution in Thread mode using the PSP. From the perspective of user code, this entire process is invisible: each thread simply appears to pause and resume execution at arbitrary points, depending on scheduling decisions.

Preemptive scheduling is layered cleanly on top of this mechanism. When enabled, the SysTick handler runs at a fixed frequency and decides whether a scheduling event should occur. Instead of performing a context switch directly, SysTick merely requests one by setting PendSV, ensuring that all switching logic remains centralized and consistent. This separation keeps interrupt handlers short and deterministic while allowing the kernel to control when and how context switches occur.

Thread termination is handled explicitly through `thread_end()`. When a thread exits, the kernel marks its TCB as `DONE`, compacts the active TCB list, and requests a context switch. Eventually, when all user threads have terminated, the scheduler naturally falls back to the main thread, and `multitask_start()` returns. In this way, the multitasking system integrates seamlessly with normal program control flow, treating the main thread as just another schedulable context rather than a special case.

Overall, this design demonstrates how thread abstraction, scheduling policy, and low-level context switching fit together in a real RTOS. By separating user intent (via syscalls) from kernel mechanics (via PendSV and SysTick), the system remains modular, debuggable, and faithful to how production kernels implement multitasking on Cortex-M platforms.

## Scheduling & Concurrency: From Round-Robin to Real-Time Guarantees

After establishing basic multitasking, the kernel was extended to support real-time scheduling and safe concurrency control, moving progressively from best-effort scheduling to analytically grounded guarantees.

#### Rate Monotonic Scheduling (RMS)

The round-robin scheduler was replaced with a Rate Monotonic Scheduler (RMS), where thread priority is derived from timing requirements rather than fairness. Each thread now declares a worst-case execution time (`Ci`) and a period (`Ti`), and the kernel performs admission control before accepting the thread. A utilization-bound test ensures that the total CPU demand remains schedulable before the thread is admitted.

Once multitasking starts, each thread tracks remaining execution budget (`Ci_remaining`), remaining period (`Ti_remaining`), and cumulative runtime. Static priorities are assigned based on period length (shorter period ⇒ higher priority), and scheduling decisions always select the READY thread with the highest priority. SysTick enforces timing constraints by decrementing execution budgets and releasing threads when their periods expire. Whenever a higher-priority thread becomes READY, the kernel immediately preempts the running thread via PendSV, preserving strict RMS semantics.

This design cleanly separates timing enforcement (SysTick) from context switching (PendSV), ensuring deterministic behavior even under preemption.

---

#### Memory Protection for Multitasking

Building on RMS, the kernel integrates the ARM Memory Protection Unit (MPU) to enforce isolation. Kernel memory is always protected from user threads, and an optional per-thread protection mode further isolates user stacks from one another. Static MPU regions protect user text, data, and heap, while two dynamic regions are reprogrammed on every context switch to grant access only to the currently running thread’s user and kernel stacks.

Any illegal access—such as stack overflow or cross-thread memory access—triggers a memory fault. The fault handler diagnoses the violation and terminates the offending thread, preventing silent corruption and allowing the system to fail safely.

---

#### Priority Ceiling Protocol (PCP)

To handle shared resources safely under RMS, the kernel implements the Priority Ceiling Protocol (PCP). Each lock is assigned a priority ceiling, and a thread may acquire a lock only if its priority exceeds the current system ceiling. When contention occurs, priority inheritance is applied: a thread holding a lock temporarily inherits the highest priority of any thread it blocks, ensuring bounded blocking time and preventing priority inversion.

Dynamic priority management is fully integrated into scheduling and preemption logic. All scheduling decisions operate on dynamic priority, while static priorities remain the baseline. When locks are released, priorities are restored consistently, and any remaining dependencies are re-evaluated.

## Final Thoughts
This project progressed from bare-metal bring-up to a fully functional real-time operating system, implementing core OS concepts such as privilege separation, multitasking, real-time scheduling, memory protection, and safe concurrency entirely from scratch. By building each layer explicitly from linker scripts and exception handlers to RMS scheduling and priority ceiling locking, the kernel exposes how real RTOSes achieve determinism, safety, and control on resource-constrained hardware.
