# Contribuer à mairie-ouverte.fr

## Architecture

```
index.html          → Structure HTML (ne contient plus ni CSS ni JS)
css/style.css       → Styles
js/app.js           → Logique applicative
data/site-data.json → Toutes les données du site (délibérations, budgets, etc.)
_headers            → Headers de sécurité Cloudflare Pages
```

## Ajouter une délibération

### Avec le script (recommandé)

```bash
./tools/add-delib.sh \
  --date 2026-04-15 \
  --numero "2026/21" \
  --objet "Titre de la délibération" \
  --theme "Budget" \
  --mandat "2026-2032" \
  --pdf "https://www.mairie-laclayette.fr/wp-content/uploads/2026/04/D2026-21-EXEMPLE.pdf"
```

Options supplémentaires : `--pv "url"` et `--note "commentaire"`.

Le script met automatiquement à jour le compteur KPI et la date de dernière mise à jour.

### Manuellement

1. Ouvrir `data/site-data.json`
2. Ajouter un objet au **début** du tableau `deliberations` :
   ```json
   {
     "id": "D2026-21",
     "date": "2026-04-15",
     "numero": "2026/21",
     "objet": "Titre",
     "theme": "Budget",
     "mandat": "2026-2032",
     "pdf": "https://...",
     "pv": null,
     "note": ""
   }
   ```
3. Mettre à jour `kpi.deliberations_total`
4. Mettre à jour `lastUpdate`

## Ajouter une publication

Dans `data/site-data.json`, ajouter au **début** du tableau `publications` :

```json
{
  "id": "PUB04",
  "date": "2026-04-01",
  "type": "editorial",
  "titre": "Titre de la publication",
  "extrait": "Court résumé",
  "lien": null
}
```

`type` : `"official"` (donnée officielle) ou `"editorial"` (analyse citoyenne).

## Mettre à jour les données budgétaires

Dans `data/site-data.json`, section `budget` :
- Ajouter l'année au tableau `annees`
- Ajouter les valeurs correspondantes dans chaque tableau

## Déployer

Le site est déployé automatiquement par Cloudflare Pages sur chaque push :

```bash
git add -A
git commit -m "Description des modifications"
git push
```

## Thèmes de délibérations existants

Budget, Urbanisme, Associations, Voirie, Sports, Culture, Santé, Assainissement, ZAC / SEMA

Réutiliser un thème existant quand c'est possible pour maintenir la cohérence des filtres.
