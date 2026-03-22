#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# add-delib.sh — Ajouter une délibération au site
# Usage:
#   ./tools/add-delib.sh \
#     --date 2026-04-15 \
#     --numero "2026/21" \
#     --objet "Titre de la délibération" \
#     --theme "Budget" \
#     --mandat "2026-2032" \
#     --pdf "https://www.mairie-laclayette.fr/wp-content/uploads/..." \
#     [--pv "https://..."] \
#     [--note "Commentaire optionnel"]
# ─────────────────────────────────────────────────────
set -euo pipefail

DATA_FILE="data/site-data.json"

# Parse args
DATE="" NUMERO="" OBJET="" THEME="" MANDAT="" PDF="" PV="null" NOTE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --date)    DATE="$2";    shift 2 ;;
    --numero)  NUMERO="$2";  shift 2 ;;
    --objet)   OBJET="$2";   shift 2 ;;
    --theme)   THEME="$2";   shift 2 ;;
    --mandat)  MANDAT="$2";  shift 2 ;;
    --pdf)     PDF="$2";     shift 2 ;;
    --pv)      PV="$2";      shift 2 ;;
    --note)    NOTE="$2";    shift 2 ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

# Validate required
for var in DATE NUMERO OBJET THEME MANDAT; do
  if [[ -z "${!var}" ]]; then
    echo "Erreur: --$(echo $var | tr '[:upper:]' '[:lower:]') est requis"
    exit 1
  fi
done

# Generate ID from numero
ID="D$(echo "$NUMERO" | tr '/' '-')"

# Build JSON for the new deliberation
if [[ "$PDF" == "" ]]; then PDF_JSON="null"; else PDF_JSON="\"$PDF\""; fi
if [[ "$PV" == "null" || "$PV" == "" ]]; then PV_JSON="null"; else PV_JSON="\"$PV\""; fi

# Check jq is available
if ! command -v jq &> /dev/null; then
  echo "Erreur: jq est requis. Installer avec: sudo apt install jq / brew install jq"
  exit 1
fi

# Insert at the beginning of deliberations array
TEMP=$(mktemp)
jq --arg id "$ID" \
   --arg date "$DATE" \
   --arg numero "$NUMERO" \
   --arg objet "$OBJET" \
   --arg theme "$THEME" \
   --arg mandat "$MANDAT" \
   --argjson pdf "$PDF_JSON" \
   --argjson pv "$PV_JSON" \
   --arg note "$NOTE" \
   '.deliberations = [{
      id: $id,
      date: $date,
      numero: $numero,
      objet: $objet,
      theme: $theme,
      mandat: $mandat,
      pdf: $pdf,
      pv: $pv,
      note: $note
    }] + .deliberations
    | .kpi.deliberations_total = (.deliberations | length)
    | .lastUpdate = (now | strftime("%Y-%m-%d"))' \
   "$DATA_FILE" > "$TEMP"

mv "$TEMP" "$DATA_FILE"

echo "Délibération ajoutée : $ID — $OBJET"
echo "Total délibérations : $(jq '.kpi.deliberations_total' "$DATA_FILE")"
echo ""
echo "Pour publier :"
echo "  git add data/site-data.json"
echo "  git commit -m \"Ajout délibération $NUMERO\""
echo "  git push"
