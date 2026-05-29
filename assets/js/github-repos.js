// Populate repository cards with live data from the GitHub REST API.
// Replaces the discontinued github-readme-stats pin images with native cards.
(function () {
  "use strict";

  var CACHE_PREFIX = "gh-repo:";
  var CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  // Colors for the most common languages; falls back to a neutral dot otherwise.
  var LANG_COLORS = {
    Python: "#3572A5",
    "Jupyter Notebook": "#DA5B0B",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Shell: "#89e051",
    Dockerfile: "#384d54",
    MATLAB: "#e16737",
    Cuda: "#3A4E3A",
    Makefile: "#427819",
  };

  function readCache(repo) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + repo);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.t > CACHE_TTL) return null;
      return entry.d;
    } catch (e) {
      return null;
    }
  }

  function writeCache(repo, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + repo, JSON.stringify({ t: Date.now(), d: data }));
    } catch (e) {
      /* storage full or unavailable — ignore */
    }
  }

  function compact(n) {
    if (typeof n !== "number") return "";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function fill(card, data) {
    var descEl = card.querySelector('[data-field="description"]');
    if (descEl) descEl.textContent = data.description || "No description provided.";

    var langWrap = card.querySelector('[data-field="language"]');
    if (langWrap && data.language) {
      langWrap.hidden = false;
      langWrap.querySelector('[data-field="language-name"]').textContent = data.language;
      var dot = langWrap.querySelector(".repo-card-lang-dot");
      if (dot && LANG_COLORS[data.language]) dot.style.backgroundColor = LANG_COLORS[data.language];
    }

    var starWrap = card.querySelector('[data-field="stars"]');
    if (starWrap && typeof data.stargazers_count === "number") {
      starWrap.hidden = false;
      starWrap.querySelector('[data-field="star-count"]').textContent = compact(data.stargazers_count);
    }

    var forkWrap = card.querySelector('[data-field="forks"]');
    if (forkWrap && typeof data.forks_count === "number") {
      forkWrap.hidden = false;
      forkWrap.querySelector('[data-field="fork-count"]').textContent = compact(data.forks_count);
    }
  }

  function load(card) {
    var repo = card.getAttribute("data-github-repo");
    if (!repo) return;

    var cached = readCache(repo);
    if (cached) {
      fill(card, cached);
      return;
    }

    fetch("https://api.github.com/repos/" + repo, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API responded " + res.status);
        return res.json();
      })
      .then(function (data) {
        var slim = {
          description: data.description,
          language: data.language,
          stargazers_count: data.stargazers_count,
          forks_count: data.forks_count,
        };
        writeCache(repo, slim);
        fill(card, slim);
      })
      .catch(function () {
        // Rate limited or offline: leave the card as a plain link to the repo.
        var descEl = card.querySelector('[data-field="description"]');
        if (descEl && !descEl.textContent) descEl.textContent = "";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cards = document.querySelectorAll("[data-github-repo]");
    Array.prototype.forEach.call(cards, load);
  });
})();
