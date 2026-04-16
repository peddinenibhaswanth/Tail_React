#!/bin/bash
# This script will be used with git filter-branch to reassign authors
# It maps OLD author patterns to NEW authors based on commit position

# Get the current commit number
COMMIT_NUM=$(git rev-list --count HEAD 2>/dev/null || echo "1")

# Team members with proper names and emails
declare -A NAMES
declare -A EMAILS
NAMES["SOMESWARKUMAR"]="SOMESWARKUMAR BALAM"
EMAILS["SOMESWARKUMAR"]="someswarkumarbalam2025@gmail.com"
NAMES["NARASIMHA"]="AVULA LAKSHMI NARASIMHA REDDY"
EMAILS["NARASIMHA"]="lakshminarasimhareddyavula.63@gmail.com"
NAMES["PRAVEEN"]="SOMAROUTHU NAGA SAI PRAVEEN"
EMAILS["PRAVEEN"]="somarouthusai2006@gmail.com"
NAMES["BHASWANTH"]="PEDDINENI BHASWANTH"
EMAILS["BHASWANTH"]="bhaswanthpeddineni@gmail.com"
NAMES["NISHANTH"]="RAYAPU NISHANTH"
EMAILS["NISHANTH"]="rayapunishanth@gmail.com"

# Determine author based on original author name pattern
ORIG_NAME="$GIT_AUTHOR_NAME"

# Default assignment based on existing patterns
if [[ "$ORIG_NAME" == *"someswar"* ]] || [[ "$ORIG_NAME" == *"Someswar"* ]] || [[ "$ORIG_NAME" == *"SOMESWAR"* ]]; then
    AUTHOR="SOMESWARKUMAR"
elif [[ "$ORIG_NAME" == *"narasimha"* ]] || [[ "$ORIG_NAME" == *"Narasimha"* ]] || [[ "$ORIG_NAME" == *"NARASIMHA"* ]]; then
    AUTHOR="NARASIMHA"
elif [[ "$ORIG_NAME" == *"praveen"* ]] || [[ "$ORIG_NAME" == *"Praveen"* ]] || [[ "$ORIG_NAME" == *"PRAVEEN"* ]]; then
    AUTHOR="PRAVEEN"
elif [[ "$ORIG_NAME" == *"nishanth"* ]] || [[ "$ORIG_NAME" == *"Nishanth"* ]] || [[ "$ORIG_NAME" == *"NISHANTH"* ]]; then
    AUTHOR="NISHANTH"
else
    # Default is BHASWANTH for any unmatched (including Bhaswanth variations)
    AUTHOR="BHASWANTH"
fi

# Export the new author info
export GIT_AUTHOR_NAME="${NAMES[$AUTHOR]}"
export GIT_AUTHOR_EMAIL="${EMAILS[$AUTHOR]}"
export GIT_COMMITTER_NAME="${NAMES[$AUTHOR]}"
export GIT_COMMITTER_EMAIL="${EMAILS[$AUTHOR]}"
