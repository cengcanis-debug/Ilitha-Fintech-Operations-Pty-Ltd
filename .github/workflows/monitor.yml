name: Ilitha Sentinel Monitor

on:
  schedule:
    - cron: '*/10 * * * *'  # Runs every 10 minutes
  workflow_dispatch:

permissions:
  contents: write

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          persist-credentials: true

      - name: Sentinel Cloud Pulse
        run: |
          # 1. Run the watcher to check Sifiso and other cloud projects
          python3 scripts/cloud_watcher.py
          
          # 2. Sentinel prints the report using a protected zone
          python3 - <<'PY'
          import json
          from pathlib import Path
          
          # Sentinel reads the status file
          file = Path("status.json")
          if file.exists():
              data = json.loads(file.read_text())
              print(f"Overall status: {data.get('overall_status', 'unknown')}")
          else:
              print("Sentinel: Initializing first-time cloud scan...")
          PY

      - name: Commit and Push Status
        run: |
          git config --global user.name "Ilitha-Sentinel"
          git config --global user.email "sentinel@ilitha.com"
          git add status.json
          git commit -m "Sentinel: Updated Business Health Report" || echo "No changes"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.ADMIN_GITHUB_TOKEN }}