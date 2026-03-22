/* ═══════════════════════════════════════════════════
   La Clayette en clair — mairie-ouverte.fr
   Application principale
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── LOAD DATA ──────────────────────────────────────
  fetch('./data/site-data.json')
    .then(function (r) { return r.json(); })
    .then(function (DATA) { init(DATA); })
    .catch(function (err) { console.error('Erreur chargement données:', err); });

  function init(DATA) {

    // ─── UPDATE BANNER ────────────────────────────────
    var bannerEl = document.getElementById('update-banner');
    if (bannerEl && DATA.lastUpdate) {
      bannerEl.innerHTML = '&#x1F550; Dernière mise à jour : <strong>' + fmtDate(DATA.lastUpdate) + '</strong> — ' + DATA.kpi.deliberations_total + ' délibérations indexées, données financières 2020–2024';
    }

    // ─── TAB NAVIGATION ─────────────────────────────────
    var chartsBuilt = false;
    var tabButtons = document.querySelectorAll('.nav-tab');
    var subTabButtons = document.querySelectorAll('.sub-tab');

    function showTab(name) {
      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
      tabButtons.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
      var p = document.getElementById('page-' + name);
      if (p) p.classList.add('active');
      var t = document.querySelector('[data-tab="' + name + '"]');
      if (t) t.setAttribute('aria-selected', 'true');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (name === 'donnees' && !chartsBuilt) { buildCharts(); chartsBuilt = true; }
    }

    function showSubTab(parent, name) {
      var tabs = document.querySelectorAll('#page-' + parent + ' .sub-tab');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
      var active = document.querySelector('#page-' + parent + ' [data-subtab="' + name + '"]');
      if (active) active.setAttribute('aria-selected', 'true');
      var pages = document.querySelectorAll('#page-' + parent + ' .sub-page');
      pages.forEach(function (p) { p.classList.remove('active'); });
      var sp = document.getElementById('sub-' + parent + '-' + name);
      if (sp) sp.classList.add('active');
      if (parent === 'donnees' && name === 'budgets' && !chartsBuilt) { buildCharts(); chartsBuilt = true; }
    }

    // Expose for inline onclick during transition
    window.showTab = showTab;
    window.showSubTab = showSubTab;

    // Attach click handlers on tabs
    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTab(this.getAttribute('data-tab'));
      });
    });

    subTabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parent = this.closest('.page') || this.closest('[id^="page-"]');
        var parentId = parent ? parent.id.replace('page-', '') : '';
        showSubTab(parentId, this.getAttribute('data-subtab'));
      });
    });

    // Keyboard navigation for tabs (arrow keys)
    var navInner = document.querySelector('.nav-inner');
    if (navInner) {
      navInner.addEventListener('keydown', function (e) {
        var tabs = Array.from(navInner.querySelectorAll('.nav-tab'));
        var idx = tabs.indexOf(document.activeElement);
        if (idx === -1) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
          tabs[next].focus();
          tabs[next].click();
        }
      });
    }

    // ─── HELPERS ────────────────────────────────────────
    function fmt(n) {
      return new Intl.NumberFormat('fr-FR').format(n);
    }

    // ─── KPI CARDS ──────────────────────────────────────
    var kpiDefs = [
      { label: 'Éléments indexés', value: fmt(DATA.kpi.deliberations_total), sub: 'Délibérations 2020–2026' },
      { label: 'Fonctionnement ' + DATA.kpi.annee_reference, value: fmt(DATA.kpi.budget_fonctionnement_2024) + '\u00a0€', sub: 'Dépenses réelles' },
      { label: 'Investissement ' + DATA.kpi.annee_reference, value: fmt(DATA.kpi.budget_investissement_2024) + '\u00a0€', sub: 'Dépenses réelles' },
      { label: 'Dette / habitant', value: fmt(DATA.kpi.dette_par_habitant) + '\u00a0€', sub: 'Estim. ' + DATA.kpi.annee_reference }
    ];
    var kpiGrid = document.getElementById('kpi-grid');
    if (kpiGrid) {
      kpiDefs.forEach(function (k) {
        var d = document.createElement('div');
        d.className = 'kpi-card';
        d.innerHTML = '<div class="kpi-label">' + k.label + '</div>'
          + '<div class="kpi-value">' + k.value + '</div>'
          + '<div class="kpi-sub">' + k.sub + '</div>';
        kpiGrid.appendChild(d);
      });
    }

    // ─── LAST DELIBS ────────────────────────────────────
    var lastDelibs = document.getElementById('last-delibs');
    if (lastDelibs) {
      DATA.deliberations.slice(0, 5).forEach(function (d) {
        var div = document.createElement('div');
        div.className = 'delib-list-item';
        div.innerHTML = '<div class="delib-list-date">'
          + fmtDate(d.date) + ' · <span class="badge-mandat">' + d.mandat + '</span></div>'
          + '<div class="delib-list-title">' + d.objet + '</div>';
        lastDelibs.appendChild(div);
      });
    }

    // ─── LAST PUBS ───────────────────────────────────────
    var lastPubs = document.getElementById('last-pubs');
    if (lastPubs) {
      DATA.publications.slice(0, 3).forEach(function (p) {
        var div = document.createElement('div');
        div.className = 'pub-list-item';
        var icon = p.type === 'editorial' ? '✍️' : '📊';
        var badgeClass = p.type === 'editorial' ? 'badge-editorial' : 'badge-official';
        var badgeTxt = p.type === 'editorial' ? '✍️ Analyse' : '📊 Données';
        div.innerHTML = '<div class="pub-list-icon">' + icon + '</div>'
          + '<div><div style="margin-bottom:.2rem;"><span class="' + badgeClass + '">' + badgeTxt + '</span>'
          + ' <span class="text-xs text-secondary">' + fmtDate(p.date) + '</span></div>'
          + '<div class="pub-list-title">' + p.titre + '</div></div>';
        lastPubs.appendChild(div);
      });
    }

    // ─── DELIBERATIONS TABLE ────────────────────────────
    var allDelibs = DATA.deliberations.slice();
    var themes = {};
    allDelibs.forEach(function (d) { themes[d.theme] = true; });
    var themeSelect = document.getElementById('filter-theme');
    if (themeSelect) {
      Object.keys(themes).sort().forEach(function (t) {
        var o = document.createElement('option');
        o.value = t; o.textContent = t;
        themeSelect.appendChild(o);
      });
    }

    function filterDelibs() {
      var search = (document.getElementById('search-delib').value || '').toLowerCase();
      var theme = (document.getElementById('filter-theme') || {}).value || '';
      var mandat = (document.getElementById('filter-mandat') || {}).value || '';
      var filtered = allDelibs.filter(function (d) {
        var matchSearch = !search || d.objet.toLowerCase().indexOf(search) !== -1 || d.numero.toLowerCase().indexOf(search) !== -1;
        var matchTheme = !theme || d.theme === theme;
        var matchMandat = !mandat || d.mandat === mandat;
        return matchSearch && matchTheme && matchMandat;
      });
      renderDelibs(filtered);
    }
    window.filterDelibs = filterDelibs;

    function renderDelibs(list) {
      var tbody = document.getElementById('delib-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      list.forEach(function (d) {
        var tr = document.createElement('tr');
        var noteHtml = d.note ? '<div style="font-size:.7rem;color:var(--text-secondary);margin-top:.2rem;font-style:italic;">' + d.note + '</div>' : '';
        var pdfBtn = d.pdf
          ? '<a href="' + d.pdf + '" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm mb-0">📄 Délib.</a>'
          : '<span class="btn btn-ghost btn-sm opacity-dim mb-0">Délib. —</span>';
        var pvBtn = d.pv
          ? '<a href="' + d.pv + '" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">📝 PV</a>'
          : '';
        tr.innerHTML = '<td class="nowrap">' + fmtDate(d.date) + '</td>'
          + '<td class="nowrap mono">' + d.numero + '</td>'
          + '<td><div class="delib-objet">' + d.objet + '</div>' + noteHtml + '</td>'
          + '<td><span style="background:var(--bg-subtle);padding:.1rem .4rem;border-radius:3px;font-size:.72rem;">' + d.theme + '</span></td>'
          + '<td><span class="badge-mandat">' + d.mandat + '</span></td>'
          + '<td class="nowrap">' + pdfBtn + ' ' + pvBtn + '</td>';
        tbody.appendChild(tr);
      });
      var countEl = document.getElementById('delib-count');
      if (countEl) countEl.textContent = list.length + ' résultat' + (list.length > 1 ? 's' : '');
    }
    renderDelibs(allDelibs);

    // ─── CSV EXPORT ──────────────────────────────────────
    window.exportCSV = function () {
      var search = (document.getElementById('search-delib').value || '').toLowerCase();
      var theme = (document.getElementById('filter-theme') || {}).value || '';
      var mandat = (document.getElementById('filter-mandat') || {}).value || '';
      var filtered = allDelibs.filter(function (d) {
        return (!search || d.objet.toLowerCase().indexOf(search) !== -1) &&
          (!theme || d.theme === theme) &&
          (!mandat || d.mandat === mandat);
      });
      var header = ['Date', 'Numero', 'Objet', 'Theme', 'Mandat', 'PDF'];
      var rows = filtered.map(function (d) {
        return [d.date, d.numero, '"' + d.objet.replace(/"/g, '""') + '"', d.theme, d.mandat, d.pdf].join(',');
      });
      var csv = [header.join(',')].concat(rows).join('\n');
      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'deliberations-laclayette.csv';
      a.click();
    };

    // ─── CHARTS ──────────────────────────────────────────
    function buildCharts() {
      var B = DATA.budget;
      var commonOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11, family: "'Source Sans 3', sans-serif" }, boxWidth: 10, padding: 12 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 10 }, callback: function (v) { return (v / 1000000).toFixed(1) + 'M'; } } }
        }
      };

      new Chart(document.getElementById('chart-fonctionnement'), {
        type: 'bar',
        data: {
          labels: B.annees,
          datasets: [
            { label: 'Dépenses', data: B.fonctionnement_depenses, backgroundColor: '#BFDBFE', borderColor: '#3B82F6', borderWidth: 1.5, borderRadius: 3 },
            { label: 'Recettes', data: B.fonctionnement_recettes, backgroundColor: '#A7F3D0', borderColor: '#059669', borderWidth: 1.5, borderRadius: 3 }
          ]
        },
        options: commonOpts
      });

      new Chart(document.getElementById('chart-investissement'), {
        type: 'bar',
        data: {
          labels: B.annees,
          datasets: [
            { label: 'Dépenses investissement', data: B.investissement_depenses, backgroundColor: '#FDE68A', borderColor: '#D97706', borderWidth: 1.5, borderRadius: 3 }
          ]
        },
        options: commonOpts
      });

      new Chart(document.getElementById('chart-dette'), {
        type: 'line',
        data: {
          labels: B.annees,
          datasets: [
            { label: 'Encours de dette', data: B.dette_capital, borderColor: '#DC2626', backgroundColor: 'rgba(220,38,38,.08)', fill: true, tension: 0.3, pointBackgroundColor: '#DC2626', pointRadius: 4 }
          ]
        },
        options: Object.assign({}, commonOpts, {
          scales: Object.assign({}, commonOpts.scales, {
            y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 10 }, callback: function (v) { return (v / 1000000).toFixed(1) + 'M'; } } }
          })
        })
      });
    }

    // ─── ENGAGEMENTS ─────────────────────────────────────
    var icons = { ok: '✅', partial: '⚠️', pending: '⏳', none: '❌', herite: '📥' };
    var engGrid = document.getElementById('eng-grid');
    if (engGrid) {
      DATA.engagements.forEach(function (e) {
        var div = document.createElement('div');
        div.className = 'eng-item';
        div.innerHTML = '<div class="eng-status ' + e.statut + '">' + icons[e.statut] + '</div>'
          + '<div class="eng-content">'
          + '<div class="eng-title">' + e.titre + '</div>'
          + '<div class="eng-detail">' + e.detail + '</div>'
          + '<span class="eng-tag ' + e.statut + '">' + e.label + '</span>'
          + '</div>';
        engGrid.appendChild(div);
      });
    }

    // ─── SEMA TIMELINE ───────────────────────────────────
    var tl = document.getElementById('sema-timeline');
    if (tl) {
      DATA.sema_timeline.forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'tl-item';
        var srcHtml = '';
        if (item.source) {
          srcHtml = '<div class="tl-badges"><span class="badge-official">📊 ' + item.source + '</span>';
          if (item.pdf) srcHtml += ' <a href="' + item.pdf + '" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">📄 PDF</a>';
          srcHtml += '</div>';
        }
        div.innerHTML = '<div class="tl-dot ' + item.type + '"></div>'
          + '<div class="tl-date">' + item.date + '</div>'
          + '<div class="tl-title">' + item.titre + '</div>'
          + '<div class="tl-body">' + item.corps + '</div>'
          + srcHtml;
        tl.appendChild(div);
      });
    }

    // ─── FAQ ─────────────────────────────────────────────
    var faqList = document.getElementById('faq-list');
    if (faqList) {
      DATA.faq.forEach(function (item, i) {
        var div = document.createElement('div');
        div.className = 'faq-item';
        var answerId = 'faq-answer-' + i;
        div.innerHTML = '<button class="faq-q" aria-expanded="false" aria-controls="' + answerId + '">'
          + item.q
          + '<svg class="faq-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          + '</button>'
          + '<div class="faq-a" id="' + answerId + '" role="region">' + item.r + '</div>';
        faqList.appendChild(div);
      });

      faqList.addEventListener('click', function (e) {
        var btn = e.target.closest('.faq-q');
        if (!btn) return;
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // ─── PUBLICATIONS ─────────────────────────────────────
    var pubGrid = document.getElementById('pub-grid');
    if (pubGrid) {
      DATA.publications.forEach(function (p) {
        var isEdit = p.type === 'editorial';
        var div = document.createElement('div');
        div.className = 'pub-card';
        div.innerHTML = '<div class="pub-icon ' + p.type + '">' + (isEdit ? '✍️' : '📊') + '</div>'
          + '<div class="pub-content">'
          + '<div class="pub-meta">'
          + (isEdit ? '<span class="badge-editorial">✍️ Analyse citoyenne</span>' : '<span class="badge-official">📊 Donnée officielle</span>')
          + '<span class="pub-date">' + fmtDate(p.date) + '</span>'
          + '</div>'
          + '<div class="pub-title">' + p.titre + '</div>'
          + '<div class="pub-excerpt">' + p.extrait + '</div>'
          + '<div class="pub-actions">'
          + (p.lien
            ? '<a href="' + p.lien + '" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Lire la publication</a>'
            : '<span class="btn btn-ghost btn-sm opacity-muted">Publication à venir</span>')
          + '</div>'
          + '</div>';
        pubGrid.appendChild(div);
      });
    }

  } // end init()

  // ─── GLOBAL HELPERS ────────────────────────────────
  function fmtDate(s) {
    var d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

})();
