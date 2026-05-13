---
layout: page
title: "Emile"
description: "Agentic AI for GPU Kernels (2026)"
img: assets/img/projects/emile/emile_logo.png
importance: 1
category: fun, llm, ml
year: 2026
---

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 1.5rem;"><iframe src="https://www.youtube.com/embed/yAIB-kk-ypU" title="Emile Demo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

## The Problem

GPU kernels are the bottleneck of modern LLM inference: a faster matmul or attention kernel directly translates to lower TTFT and higher tok/s. But writing them is hard. Triton, CUDA, and the underlying hardware require expert-level knowledge of memory hierarchies, occupancy, register pressure, and warp scheduling. The barrier to entry is high, and the iteration loop (design, profile, integrate) is slow.

General-purpose coding agents/harnesses like Claude Code and Codex can edit kernel source, but they hit two limits: they can't profile on the *specific* GPU you're optimizing for, and most harnesses won't actually execute the code they write. Without measurement in the loop, kernel optimization is guesswork.

## Emile

Emile is an autonomous kernel-writing agent with a harness purpose-built for GPU performance work. The agent iteratively writes Triton kernels, profiles them on real hardware, and validates them end-to-end by hot-swapping the optimized kernel into a live LLM and measuring throughput against a PyTorch baseline.

*Anyone can cook. Anyone can write expert kernels.*

## How It Works

The user provides a PyTorch reference implementation (the correctness oracle and performance floor), service parameters (sequence length, head dim, query heads, batch size), an efficiency target, and a max iteration count. Emile takes it from there.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/emile/ui_kitchen.png" title="Emile Kitchen — Reference Recipe and Service Parameters" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The Kitchen: paste a PyTorch reference kernel, configure attention dimensions, set an efficiency target, and start cooking.
</div>

Each iteration runs a tight loop inside the harness:

1. **Generate**: the agent writes a Triton kernel, informed by prior iterations' profiler output and diagnoses.
2. **Compile & validate**: the kernel is compiled and checked for numerical correctness against the PyTorch reference.
3. **Profile**: the harness exposes a `profile_kernel` tool that runs the kernel on the target GPU and returns TFLOPS, bandwidth, occupancy, register usage, shared-memory footprint, and whether the kernel is compute- or memory-bound.
4. **Diagnose & iterate**: the agent reads the profiler output, identifies the bottleneck (register pressure, low occupancy, spills, memory stalls), and proposes the next change (block sizes, `num_warps`, `num_stages`, tiling strategy).

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/emile/agent_dashboard.png" title="Emile Agent Dashboard — Iterations, TFLOPS Progression, and Roofline" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The agent loop in flight: baseline at 10.34 TFLOPS, five iterations of profile-and-refine, ending at 22.8 TFLOPS — a 6.28× speedup over the PyTorch reference. The roofline plot anchors every iteration to the A100's compute and bandwidth ceilings.
</div>

## End-to-End Verification

A kernel that wins on a microbenchmark isn't automatically a win in production — fusion patterns, dtype handling, and launch overhead all matter once the kernel sits inside a real model. Emile closes this gap by hot-swapping the best kernel into Qwen3-4B's attention path and running side-by-side inference against the PyTorch baseline with identical prompts and weights.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/emile/side_by_side.png" title="Emile Tasting Room — Side-by-Side LLM Inference" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The Tasting Room: Qwen3-4B running the same prompt on the PyTorch reference (left) and Emile's fused Triton prefill kernel (right). 1.98× faster TTFT, 1.02× higher tok/s, end-to-end.
</div>

## Sandboxing

Generated kernels run on **Modal** in an isolated sandbox with a dedicated A100. The agent never touches host hardware. The harness also enforces a performance threshold — once the kernel hits the target percentage of peak TFLOPS, the agent stops, avoiding runaway iteration on diminishing returns.

## Tech Stack

- **Triton** — kernel language and profiler
- **Modal** — isolated A100 compute
- **Claude** — agent LLM driving the optimization loop
- **Qwen3-4B** — verifier inference model for end-to-end measurement
- **Streamlit** — UI (Kitchen + Tasting Room)

Code: [github.com/giterator/Emile](https://github.com/giterator/Emile/tree/new-ui)
