// Atelier NEAM : attente pendant la génération, et « Tout générer » livrable par livrable
(function () {
  // Un bouton de génération se désactive pendant l'appel (30 à 90 secondes)
  document.querySelectorAll('[data-attente]').forEach(function (btn) {
    btn.form.addEventListener('submit', function (e) {
      if (btn.dataset.confirm && !confirm(btn.dataset.confirm)) { e.preventDefault(); return; }
      btn.disabled = true;
      btn.textContent = 'Génération en cours… (jusqu’à 1 min)';
    });
  });

  // Tout générer : un appel par livrable, pour rester sous la limite de temps de l'hébergement
  var tout = document.querySelector('[data-tout]');
  if (tout) {
    tout.addEventListener('click', async function () {
      var types = tout.dataset.tout.split(','), info = tout.nextElementSibling, erreurs = [];
      var noms = { diagnostic: 'Diagnostic', feuille_de_route: 'Feuille de route', charte: 'Identité éditoriale', fiche_google: 'Fiche Google', page: 'Page de présentation', site: 'Site vitrine', boutique: 'Boutique en ligne', whatsapp: 'WhatsApp Business', sequences: 'Relances automatiques', workflows: 'Automatisations', assistant_ia: 'Assistant IA', cahier_des_charges: 'Cahier des charges', formation: 'Formation' };
      tout.disabled = true;
      info.hidden = false;
      for (var i = 0; i < types.length; i++) {
        info.textContent = 'Génération ' + (i + 1) + ' / ' + types.length + ' : ' + (noms[types[i]] || types[i]) + '…';
        var fd = new FormData();
        fd.append('a', 'generer'); fd.append('type', types[i]); fd.append('id', tout.dataset.id);
        fd.append('csrf', tout.dataset.csrf); fd.append('ajax', '1');
        try {
          var r = await fetch('./', { method: 'POST', body: fd, credentials: 'same-origin' });
          var j = await r.json();
          if (!j.ok) erreurs.push((noms[types[i]] || types[i]) + ' : ' + j.msg);
        } catch (e) {
          erreurs.push((noms[types[i]] || types[i]) + ' : erreur réseau');
        }
      }
      info.textContent = erreurs.length ? 'Terminé avec des erreurs. ' + erreurs.join(' · ') : 'Terminé. Relisez et validez chaque livrable.';
      setTimeout(function () { location.reload(); }, erreurs.length ? 6000 : 1200);
    });
  }

  // Sélection du lien du brief au clic
  document.querySelectorAll('.copie-lien').forEach(function (i) {
    i.addEventListener('focus', function () { i.select(); });
  });
})();
