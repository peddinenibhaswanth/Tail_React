# PowerShell script to manage authors and commit dates

$authors = @(
    "peddinenibhaswanth <bhaswanthpeddineni@gmail.com>",
    "NarasimhaReddy-Avula <lakshminarasimhareddyavula.63@gmail.com>",
    "Praveen2458 <somarouthusai2006@gmail.com>",
    "someswarkumar2025 <someswarkumarbalam2025@gmail.com>",
    "Nishanth-0110 <rayapunishanth@gmail.com>"
)

$commit_dates_stage1 = @(
    "2026-02-10T10:00:00",
    "2026-02-11T11:30:00",
    "2026-02-12T14:00:00",
    "2026-02-13T16:45:00",
    "2026-02-14T18:00:00"
)

$commit_dates_stage2 = @(
    "2026-03-20T09:00:00",
    "2026-03-21T12:15:00",
    "2026-03-22T15:30:00",
    "2026-03-23T17:00:00",
    "2026-03-24T20:00:00"
)

$commit_dates_stage3 = @(
    "2026-04-12T10:00:00",
    "2026-04-13T11:30:00",
    "2026-04-14T14:00:00",
    "2026-04-15T16:45:00"
)

# Function to get a random author
function Get-RandomAuthor {
    param($authors)
    return $authors | Get-Random
}

# Function to create a commit
function New-Commit {
    param(
        [string]$message,
        [string]$author,
        [string]$date
    )
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    git commit --author=$author --message=$message
}

# Export functions for use in other scripts
Export-ModuleMember -Function Get-RandomAuthor, New-Commit -Variable authors, commit_dates_stage1, commit_dates_stage2, commit_dates_stage3
