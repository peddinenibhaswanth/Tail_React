#!/bin/bash
cd "c:/Users/Dell/OneDrive/Documents/SEM-5_Project/P1_With_AJAX/Project_with_React"

export FILTER_BRANCH_SQUELCH_WARNING=1

# Reassign commits to team members based on commit hash digit
git filter-branch -f --env-filter '
# Use last hex digit of commit hash to pick author
HASH_DIGIT=${GIT_COMMIT: -1}
case $HASH_DIGIT in
    0|1|2) 
        export GIT_AUTHOR_NAME="SOMESWARKUMAR BALAM"
        export GIT_AUTHOR_EMAIL="someswarkumarbalam2025@gmail.com"
        export GIT_COMMITTER_NAME="SOMESWARKUMAR BALAM"
        export GIT_COMMITTER_EMAIL="someswarkumarbalam2025@gmail.com"
        ;;
    3|4|5)
        export GIT_AUTHOR_NAME="AVULA LAKSHMI NARASIMHA REDDY"
        export GIT_AUTHOR_EMAIL="lakshminarasimhareddyavula.63@gmail.com"
        export GIT_COMMITTER_NAME="AVULA LAKSHMI NARASIMHA REDDY"
        export GIT_COMMITTER_EMAIL="lakshminarasimhareddyavula.63@gmail.com"
        ;;
    6|7)
        export GIT_AUTHOR_NAME="SOMAROUTHU NAGA SAI PRAVEEN"
        export GIT_AUTHOR_EMAIL="somarouthusai2006@gmail.com"
        export GIT_COMMITTER_NAME="SOMAROUTHU NAGA SAI PRAVEEN"
        export GIT_COMMITTER_EMAIL="somarouthusai2006@gmail.com"
        ;;
    8)
        export GIT_AUTHOR_NAME="PEDDINENI BHASWANTH"
        export GIT_AUTHOR_EMAIL="bhaswanthpeddineni@gmail.com"
        export GIT_COMMITTER_NAME="PEDDINENI BHASWANTH"
        export GIT_COMMITTER_EMAIL="bhaswanthpeddineni@gmail.com"
        ;;
    9|a|b|c|d|e|f)
        export GIT_AUTHOR_NAME="RAYAPU NISHANTH"
        export GIT_AUTHOR_EMAIL="rayapunishanth@gmail.com"
        export GIT_COMMITTER_NAME="RAYAPU NISHANTH"
        export GIT_COMMITTER_EMAIL="rayapunishanth@gmail.com"
        ;;
esac
' -- --all

echo "Done! Checking new distribution..."
git shortlog -sn --all
