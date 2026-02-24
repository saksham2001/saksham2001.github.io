---
layout: page
title: "AutoGrader"
description: "AI-Powered Evidence-Anchored Grading Platform (2025)"
img: assets/img/projects/autograder/hil_grading.png
importance: 1
category: work, ml, llm
year: 2025
---

## The Problem with Grading at Scale

Last semester I was the Head TA for **18-844: Embedded Machine Learning** at Carnegie Mellon. The course had 50+ students submitting open-ended coding assignments — Jupyter notebooks, Python scripts, PDF reports — every week. Grading was the bottleneck. Each submission required carefully reading through student code, cross-referencing against a rubric, and writing justifiable feedback. With a small TA team, we were spending more time grading than teaching.

The issue wasn't just speed. It was **consistency** and **transparency**. Different TAs interpreted rubrics differently. Students would ask "why did I lose points here?" and sometimes the answer wasn't clear, even to us. I wanted a system that could help grade faster while making every scoring decision *fully traceable* back to the student's own work.

So I built AutoGrader.

## The Core Idea: AI Grading That Cites Its Work

Most AI grading tools treat the model as a black box: feed in a submission, get back a score. The problem is trust. If a student disputes a grade, you need to point to *exactly* what they wrote and explain why it earned or lost points.

AutoGrader enforces a simple rule: **every score must be grounded in the student's submission**. The AI cannot award or deduct points without citing its evidence. This makes the entire grading process auditable — every decision has a paper trail.

## How It Works

Under the hood, AutoGrader runs a three-stage pipeline:

### Stage 1: Extract

Student submissions come in all shapes — PDFs, Jupyter notebooks, Python files, Canvas exports, Markdown. The extraction stage uses a dual OCR approach: **Mistral AI** produces rich markdown representations of the content, while **PyMuPDF** generates deterministic source maps with block-level bounding boxes. Together, they turn any submission into structured, navigable content with precise source references down to the page and line level.

### Stage 2: Judge

An LLM scores the extracted content against the instructor's rubric, category by category. The key constraint: for every score assigned, the model must provide exact quotations (capped at 250 characters each) from the submission as evidence, along with explicit reasoning and a calibrated confidence level. If the model can't find sufficient evidence to justify a score, it flags the category as low-confidence rather than guessing.

### Stage 3: Calibrate

Before finalizing scores, the system applies any learned **grading policies** — rules extracted from past TA corrections. These are IF/THEN policies (e.g., "IF the student uses hardcoded values instead of deriving from data shape, THEN deduct 2 points from Style & Clarity"). Only rules meeting a minimum confidence threshold are applied, keeping calibration targeted and defensible.

## The Human-in-the-Loop Workstation

AutoGrader is designed to augment TAs, not replace them. The grading interface is a three-panel workstation: the reference solution on the left, the student's submission rendered in its native format in the center, and the grading console on the right — with editable per-category scores, expandable evidence trails, structured feedback, and plagiarism analysis.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/autograder/hil_grading.png" title="AutoGrader Human-in-the-Loop Grading Interface" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The human-in-the-loop grading workstation: reference solution (left), student submission (center), and grading console with evidence-backed scores (right).
</div>

TAs can choose between **Human-in-the-Loop mode** (review each submission interactively) and **Auto Bulk Grading** (grade an entire section automatically, then review flagged or low-confidence submissions).

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/autograder/grading_modes.png" title="AutoGrader Grading Mode Selection" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Grading mode selection: Human-in-the-Loop for interactive review, or Auto Bulk Grading for processing entire sections at once.
</div>

## Policy Learning: The System Gets Smarter Over Time

This is probably the most interesting part. When a TA overrides an AI-assigned score and provides a reason, the system doesn't just accept the correction — it *learns* from it. A background process extracts generalizable IF/THEN rules from the override and stores them as grading policies with severity, confidence, and instance count metadata.

These policies are automatically enforced in subsequent grading runs. Over time, the system converges toward the instructor's grading style. In practice, we observed a **68% decline in override rates** after just a few grading cycles — the system was picking up on patterns like notation conventions, common partial-credit scenarios, and edge cases that the original rubric didn't explicitly address.

Rules are capped at 50 per assignment and 200 per course to prevent proliferation, and each rule accumulates confidence through repeated application.

## AI Rubric Builder

Setting up an assignment is guided by a step-by-step wizard. Instructors specify the assignment type, upload reference solutions, and answer a few clarifying questions generated by the AI. The system then produces a full rubric draft with per-category scoring criteria at the FULL, PARTIAL, and NONE levels — ready to use or refine.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/autograder/assignment_setup.png" title="AutoGrader AI Rubric Builder" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The AI Rubric Builder: upload a reference solution, answer clarifying questions, and get a complete rubric draft with per-category scoring criteria.
</div>

## Chat with the Grader

Sometimes you want to ask a follow-up question about a specific submission without re-running the entire analysis. AutoGrader includes a conversational AI console where TAs can ask natural-language questions about any submission — "did the student hardcode the values anywhere?", "is the loss function implemented correctly?" — and get responses grounded in the actual submission content.

<div class="row">
  <div class="col-md-8 mx-auto mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/autograder/hil_llm_chat.png" title="AutoGrader Chat with Grader" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The conversational AI console: ask follow-up questions about any submission and get evidence-grounded responses.
</div>

## Results and Impact

AutoGrader was deployed for active use in courses at Carnegie Mellon University across the ECE and CS departments.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/autograder/grading_statistics.png" title="AutoGrader Grading Statistics Dashboard" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Grading statistics dashboard showing progress, score distributions, per-rubric-item averages, and override rates across a class section.
</div>

Key metrics from deployment:

- **87% reduction** in time spent grading per assignment
- **94% agreement rate** with expert human graders
- **100%** of scores backed by cited evidence from student submissions
- **6+ submission formats** supported (PDF, Jupyter, Python, Canvas, HTML, Markdown)

## Tech Stack

Python/Flask backend with real-time WebSocket connections for live pipeline progress. OpenAI GPT models for grading and Mistral AI for OCR. PostgreSQL (Neon.tech) for the database, Firebase for cloud file storage, and Bcrypt + Fernet encryption for security. Deployed on Fly.io via Docker.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/autograder/view_assignments.png" title="AutoGrader Assignment Management" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    The assignment management dashboard — a multi-tenant platform supporting multiple courses and instructors.
</div>
