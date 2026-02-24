---
layout: page
title: "Quorum"
description: "AI Agents That Negotiate Your Meeting Times (2026)"
img: assets/img/projects/quorum/quorum_thumbnail.png
importance: 2
category: fun, llm
year: 2026
---

<div style="position: relative; padding-bottom: 64.86486486486486%; height: 0;"><iframe src="https://www.loom.com/embed/7132641fe3a24e919ab031e855271375" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

## The Problem

Scheduling a meeting between two people shouldn't require five emails. But it usually does — "How's Thursday?", "Thursday doesn't work, what about Friday afternoon?", "I have a conflict at 2, could we do 3?", and on and on. It's a coordination problem that wastes time on both sides, and every scheduling tool I've tried either requires sharing your full calendar (a privacy concern) or still involves manual back-and-forth.

## The Idea

What if each party had an AI agent that could negotiate on their behalf — autonomously, privately, and transparently?

**Quorum** does exactly that. You share a scheduling link, the other person accepts, and two GPT-4o agents negotiate the optimal meeting time based on both parties' availability and preferences. Your calendar stays private — agents only see free/busy status, never event details. When they reach agreement, the meeting is created on both calendars automatically.

The name comes from the concept itself: the agents must reach **quorum** — mutual agreement — before a meeting is booked.

## How It Works

### 1. Set Your Preferences

Each user configures their scheduling constraints: working hours, preferred time of day (morning, midday, afternoon), lunch breaks, buffer time between meetings, and any special instructions. These preferences persist across all scheduling sessions.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/quorum/preferences.png" title="Quorum Preferences" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Scheduling preferences: working hours, time-of-day weights, lunch breaks, and buffer time.
</div>

### 2. Create a Scheduling Link

The host creates a link specifying the meeting title, duration, date range, and intent. This link is shared with the invitee.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/quorum/create.png" title="Quorum Create Link" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Creating a scheduling link with meeting details and date range.
</div>

### 3. Agents Negotiate

Once both parties have accepted, the system generates candidate time slots by scanning both calendars for mutual availability in 15-minute increments, scoring each slot against both users' preferences. Two GPT-4o agents — one representing the host, one the invitee — then negotiate over these candidates.

The agents communicate through structured tool calls: proposing slots, counter-proposing, ranking alternatives, and eventually declaring quorum (or no quorum if they can't agree). The negotiation is capped at 12 turns to prevent runaway conversations.

**Privacy is enforced architecturally** — agents receive free/busy data and preference scores, never actual calendar event details. This isn't a policy, it's a design constraint.

### 4. Proof of Quorum

Every negotiation produces a full transcript showing exactly how the agents reached agreement — which slots were proposed, why alternatives were suggested, and what the final consensus was. Complete transparency into the decision.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/quorum/agent_negotiation.png" title="Quorum Agent Negotiation" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Proof of Quorum: the full negotiation transcript showing how agents reached agreement, with tool calls and reasoning visible.
</div>

### 5. Meeting Confirmed

When both agents declare quorum on the same slot, the system automatically creates calendar events for both parties. No manual confirmation step — it just appears on your calendar.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/quorum/calendar.png" title="Quorum Calendar View" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
    Calendar view showing scheduled meetings alongside existing events.
</div>

## Tech Stack

Next.js 14 with the App Router for both frontend and API routes. Google OAuth and Calendar API for authentication and calendar integration. PostgreSQL (Neon) with Prisma ORM for persistence. OpenAI GPT-4o for the negotiation agents with structured tool calling. Tailwind CSS and FullCalendar.js for the UI.
