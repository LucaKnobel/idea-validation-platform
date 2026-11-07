#!/usr/bin/env bash
# Writes a Trivy image scan summary (severity counts + CRITICAL/HIGH findings)
# to the GitHub job summary. Informational only: never fails the job.
#
# Usage: trivy-summary.sh <report.json> <image-ref>
set -euo pipefail

REPORT="${1:?report path required}"
IMAGE_REF="${2:-}"
MAX_ROWS=25
OUT="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

if [[ ! -f "$REPORT" ]]; then
  echo "Trivy report not found at \`$REPORT\`." >> "$OUT"
  exit 0
fi

count() {
  jq --arg s "$1" '[.Results[]?.Vulnerabilities[]? | select(.Severity == $s)] | length' "$REPORT"
}

CRITICAL=$(count CRITICAL)
HIGH=$(count HIGH)
MEDIUM=$(count MEDIUM)

# One markdown row per CRITICAL/HIGH finding, CRITICAL first.
ROWS=$(jq -r '
  [.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH")]
  | sort_by(.Severity != "CRITICAL")
  | .[]
  | "| \(.Severity) | `\(.PkgName)` | \(.InstalledVersion) | \(.FixedVersion // "-") | \(if .PrimaryURL then "[\(.VulnerabilityID)](\(.PrimaryURL))" else .VulnerabilityID end) |"
' "$REPORT")
TOTAL_ROWS=$(grep -c '^|' <<< "$ROWS" || true)

{
  echo "## Container Security (Trivy)"
  echo ""
  [[ -n "$IMAGE_REF" ]] && echo "Image: \`$IMAGE_REF\`" && echo ""
  echo "| Severity | Count |"
  echo "| --- | ---: |"
  echo "| Critical | $CRITICAL |"
  echo "| High | $HIGH |"
  echo "| Medium | $MEDIUM |"

  if [[ "$TOTAL_ROWS" -gt 0 ]]; then
    echo ""
    echo "<details><summary>Critical/High findings ($TOTAL_ROWS, showing up to $MAX_ROWS)</summary>"
    echo ""
    echo "| Severity | Package | Installed | Fixed | ID |"
    echo "| --- | --- | --- | --- | --- |"
    head -n "$MAX_ROWS" <<< "$ROWS"
    echo ""
    echo "</details>"
  fi

  echo ""
  echo "_Informational only, does not block the deployment. Full report: workflow artifact._"
} >> "$OUT"
