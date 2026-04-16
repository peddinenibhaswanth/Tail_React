# PowerShell script to fix git commit authors
# This script will rewrite git history to redistribute commits among team members

# Team members
$authors = @{
    "SOMESWARKUMAR" = @{name="SOMESWARKUMAR BALAM"; email="someswarkumarbalam2025@gmail.com"}
    "NARASIMHA" = @{name="AVULA LAKSHMI NARASIMHA REDDY"; email="lakshminarasimhareddyavula.63@gmail.com"}
    "PRAVEEN" = @{name="SOMAROUTHU NAGA SAI PRAVEEN"; email="somarouthusai2006@gmail.com"}
    "BHASWANTH" = @{name="PEDDINENI BHASWANTH"; email="bhaswanthpeddineni@gmail.com"}
    "NISHANTH" = @{name="RAYAPU NISHANTH"; email="rayapunishanth@gmail.com"}
}

# Get all commit hashes in reverse chronological order
$commits = git log --format="%H" --reverse
$totalCommits = $commits.Count
Write-Host "Total commits: $totalCommits"

# Distribution targets (approximately):
# SOMESWARKUMAR: 45 commits (veterinary, appointments - complex)
# NARASIMHA: 40 commits (pets, adoption - complex)
# PRAVEEN: 35 commits (products, orders, e-commerce)
# BHASWANTH: 25 commits (auth, dashboards, models, infrastructure)
# NISHANTH: 22 commits (frontend pages, CSS, UI polish)

# Create mapping based on commit index
# We'll assign authors based on position in the commit history
$authorMapping = @{}
$index = 0

foreach ($hash in $commits) {
    # Distribution logic:
    # First 45 commits: SOMESWARKUMAR (25), NARASIMHA (10), BHASWANTH (5), PRAVEEN (3), NISHANTH (2)
    # Next 45 commits: NARASIMHA (25), SOMESWARKUMAR (10), PRAVEEN (5), NISHANTH (3), BHASWANTH (2)
    # Next 40 commits: PRAVEEN (20), SOMESWARKUMAR (8), NARASIMHA (6), NISHANTH (4), BHASWANTH (2)
    # Next 37 commits: NISHANTH (15), BHASWANTH (12), PRAVEEN (5), NARASIMHA (3), SOMESWARKUMAR (2)
    
    $mod = $index % 5
    $section = [math]::Floor($index / 35)
    
    switch ($section) {
        0 { # First 35 commits - SOMESWARKUMAR heavy
            switch ($mod) {
                0 { $author = "SOMESWARKUMAR" }
                1 { $author = "NARASIMHA" }
                2 { $author = "SOMESWARKUMAR" }
                3 { $author = "SOMESWARKUMAR" }
                4 { $author = "NARASIMHA" }
            }
        }
        1 { # Next 35 commits - NARASIMHA heavy
            switch ($mod) {
                0 { $author = "NARASIMHA" }
                1 { $author = "SOMESWARKUMAR" }
                2 { $author = "NARASIMHA" }
                3 { $author = "NARASIMHA" }
                4 { $author = "PRAVEEN" }
            }
        }
        2 { # Next 35 commits - PRAVEEN heavy
            switch ($mod) {
                0 { $author = "PRAVEEN" }
                1 { $author = "SOMESWARKUMAR" }
                2 { $author = "NARASIMHA" }
                3 { $author = "PRAVEEN" }
                4 { $author = "NISHANTH" }
            }
        }
        3 { # Next 35 commits - Mix with NISHANTH
            switch ($mod) {
                0 { $author = "NISHANTH" }
                1 { $author = "BHASWANTH" }
                2 { $author = "PRAVEEN" }
                3 { $author = "NISHANTH" }
                4 { $author = "BHASWANTH" }
            }
        }
        default { # Remaining - BHASWANTH heavy
            switch ($mod) {
                0 { $author = "BHASWANTH" }
                1 { $author = "NISHANTH" }
                2 { $author = "BHASWANTH" }
                3 { $author = "PRAVEEN" }
                4 { $author = "SOMESWARKUMAR" }
            }
        }
    }
    
    $authorMapping[$hash] = $author
    $index++
}

# Count per author
$counts = @{}
foreach ($a in $authorMapping.Values) {
    if (-not $counts[$a]) { $counts[$a] = 0 }
    $counts[$a]++
}
Write-Host "Planned distribution:"
$counts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" }

# Export the mapping for use with git filter-branch
$authorMapping | ConvertTo-Json | Out-File -FilePath "author_mapping.json" -Encoding UTF8
Write-Host "Mapping saved to author_mapping.json"
