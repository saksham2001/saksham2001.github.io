---
layout: page
title: projects
permalink: /projects/
description: a growing collection of my projects.
nav: true
nav_order: 3
display_categories: [avionics, embedded, iot, llm, comms, ml, robotics, health]
horizontal: false
---

<!-- pages/projects.md -->
<div class="projects">
  <!-- Sort Selector -->
  <div class="mb-4 d-flex justify-content-end">
    <div role="group" aria-label="Sort projects">
      <button type="button" class="btn btn-sm btn-outline-secondary sort-btn-year active mr-2">
        Sort by Year
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary sort-btn-category">
        Sort by Category
      </button>
    </div>
  </div>

  <!-- Year-sorted view (default) -->
  <div id="projects-year-view">
    {% assign all_projects = site.projects %}
    {% assign years = "" | split: "" %}
    {% for project in all_projects %}
      {% unless years contains project.year %}
        {% assign years = years | push: project.year %}
      {% endunless %}
    {% endfor %}
    {% assign sorted_years = years | sort | reverse %}
    
    {% for year in sorted_years %}
      <a id="year-{{ year }}" href=".#year-{{ year }}">
        <h2 class="category">{{ year }}</h2>
      </a>
      {% assign year_projects = "" | split: "" %}
      {% for project in all_projects %}
        {% if project.year == year %}
          {% assign year_projects = year_projects | push: project %}
        {% endif %}
      {% endfor %}
      {% assign sorted_year_projects = year_projects | sort: "importance" %}
      {% if page.horizontal %}
      <div class="container">
        <div class="row row-cols-1 row-cols-md-2">
        {% for project in sorted_year_projects %}
          {% include projects_horizontal.liquid %}
        {% endfor %}
        </div>
      </div>
      {% else %}
      <div class="row row-cols-1 row-cols-md-3">
        {% for project in sorted_year_projects %}
          {% include projects.liquid %}
        {% endfor %}
      </div>
      {% endif %}
    {% endfor %}
  </div>

  <!-- Category-sorted view (hidden by default) -->
  <div id="projects-category-view" style="display: none;">
    {% if site.enable_project_categories and page.display_categories %}
      <!-- Display categorized projects -->
      {% for category in page.display_categories %}
      <a id="{{ category }}" href=".#{{ category }}">
        <h2 class="category">{{ category }}</h2>
      </a>
      {% assign categorized_projects = "" | split: "" %}
      {% for project in site.projects %}
        {% assign project_categories = project.category | split: ", " %}
        {% for project_category in project_categories %}
          {% if project_category == category %}
            {% assign categorized_projects = categorized_projects | push: project %}
            {% break %}
          {% endif %}
        {% endfor %}
      {% endfor %}
      {% assign sorted_projects = categorized_projects | sort: "importance" %}
      <!-- Generate cards for each project -->
      {% if page.horizontal %}
      <div class="container">
        <div class="row row-cols-1 row-cols-md-2">
        {% for project in sorted_projects %}
          {% include projects_horizontal.liquid %}
        {% endfor %}
        </div>
      </div>
      {% else %}
      <div class="row row-cols-1 row-cols-md-3">
        {% for project in sorted_projects %}
          {% include projects.liquid %}
        {% endfor %}
      </div>
      {% endif %}
      {% endfor %}
    {% endif %}
  </div>
</div>

<!-- Include sorting script -->
<script defer src="{{ '/assets/js/projects-sort.js' | relative_url | bust_file_cache }}"></script>
