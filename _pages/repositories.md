---
layout: page
permalink: /repositories/
title: repositories
description:
nav: true
nav_order: 5
---

{% if site.data.repositories.github_repos %}

<div class="repositories">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.liquid repository=repo %}
  {% endfor %}
</div>
{% endif %}

<!-- prettier-ignore-start -->
<script defer src="{{ '/assets/js/github-repos.js' | relative_url | bust_file_cache }}"></script>
<!-- prettier-ignore-end -->
