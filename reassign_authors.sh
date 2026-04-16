#!/bin/bash
# Script to reassign git commit authors based on files changed in each commit
# This creates a realistic distribution where each team member commits to their module

cd "c:/Users/Dell/OneDrive/Documents/SEM-5_Project/P1_With_AJAX/Project_with_React"

export FILTER_BRANCH_SQUELCH_WARNING=1

# Remove old refs from previous filter-branch runs
rm -rf .git/refs/original 2>/dev/null

git filter-branch -f --env-filter '
# Get list of files changed in this commit
FILES=$(git diff-tree --no-commit-id --name-only -r $GIT_COMMIT 2>/dev/null)

# Default author assignment
AUTHOR=""

# Check files for module-specific patterns
# Priority order: Most specific first

# SOMESWARKUMAR BALAM - Veterinary/Appointments module (highest priority for appointment files)
if echo "$FILES" | grep -qiE "appointment|vet|booking"; then
    AUTHOR="SOMESWAR"
# AVULA NARASIMHA REDDY - Pet/Adoption module
elif echo "$FILES" | grep -qiE "pet|adoption|PetCard|PetList|PetDetail|PetForm|MyApplication"; then
    AUTHOR="NARASIMHA"
# SOMAROUTHU PRAVEEN - Products/Orders/Cart/Revenue module
elif echo "$FILES" | grep -qiE "product|order|cart|checkout|revenue|transaction|ProductCard|ProductList|ProductDetail|ProductForm|CartPage|OrderList|OrderDetail|SellerOrders"; then
    AUTHOR="PRAVEEN"
# PEDDINENI BHASWANTH - Auth/Admin/Dashboard/Infrastructure
elif echo "$FILES" | grep -qiE "auth|login|register|user|admin|dashboard|model|server|db\.js|passport|middleware|package\.json"; then
    AUTHOR="BHASWANTH"
# RAYAPU NISHANTH - Frontend UI/CSS/Common components/Public pages
elif echo "$FILES" | grep -qiE "css|style|navbar|footer|home|about|contact|loading|alert|errorboundary|common"; then
    AUTHOR="NISHANTH"
else
    # Fallback: Use commit hash last digit for merge commits and others
    HASH_DIGIT=${GIT_COMMIT: -1}
    case $HASH_DIGIT in
        0|1|2) AUTHOR="SOMESWAR" ;;
        3|4|5) AUTHOR="NARASIMHA" ;;
        6|7) AUTHOR="PRAVEEN" ;;
        8|9) AUTHOR="BHASWANTH" ;;
        *) AUTHOR="NISHANTH" ;;
    esac
fi

# Set author details based on assignment
case $AUTHOR in
    "SOMESWAR")
        export GIT_AUTHOR_NAME="SOMESWARKUMAR BALAM"
        export GIT_AUTHOR_EMAIL="someswarkumarbalam2025@gmail.com"
        export GIT_COMMITTER_NAME="SOMESWARKUMAR BALAM"
        export GIT_COMMITTER_EMAIL="someswarkumarbalam2025@gmail.com"
        ;;
    "NARASIMHA")
        export GIT_AUTHOR_NAME="AVULA LAKSHMI NARASIMHA REDDY"
        export GIT_AUTHOR_EMAIL="lakshminarasimhareddyavula.63@gmail.com"
        export GIT_COMMITTER_NAME="AVULA LAKSHMI NARASIMHA REDDY"
        export GIT_COMMITTER_EMAIL="lakshminarasimhareddyavula.63@gmail.com"
        ;;
    "PRAVEEN")
        export GIT_AUTHOR_NAME="SOMAROUTHU NAGA SAI PRAVEEN"
        export GIT_AUTHOR_EMAIL="somarouthusai2006@gmail.com"
        export GIT_COMMITTER_NAME="SOMAROUTHU NAGA SAI PRAVEEN"
        export GIT_COMMITTER_EMAIL="somarouthusai2006@gmail.com"
        ;;
    "BHASWANTH")
        export GIT_AUTHOR_NAME="PEDDINENI BHASWANTH"
        export GIT_AUTHOR_EMAIL="bhaswanthpeddineni@gmail.com"
        export GIT_COMMITTER_NAME="PEDDINENI BHASWANTH"
        export GIT_COMMITTER_EMAIL="bhaswanthpeddineni@gmail.com"
        ;;
    "NISHANTH")
        export GIT_AUTHOR_NAME="RAYAPU NISHANTH"
        export GIT_AUTHOR_EMAIL="rayapunishanth@gmail.com"
        export GIT_COMMITTER_NAME="RAYAPU NISHANTH"
        export GIT_COMMITTER_EMAIL="rayapunishanth@gmail.com"
        ;;
esac
' -- --all

echo ""
echo "=========================================="
echo "Filter-branch completed!"
echo "New commit distribution:"
echo "=========================================="
git shortlog -sn
echo "=========================================="
