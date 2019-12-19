#!/bin/bash

set -e

if [ -n "$OPEN_CITY_PROFILE_API_URL" ]; then
    # TODO: this curl does not really do anything
    until curl -Is "$OPEN_CITY_PROFILE_API_URL" | head -1
    do
    echo "Waiting for open city profile GrahpQL API..."
    sleep 1
    done
    echo "Open city profile GrahpQL API is available!"
fi

if [ -n "$BERTH_RESERVATIONS_API_URL" ]; then
    # TODO: this curl does not really do anything
    until curl -Is "$BERTH_RESERVATIONS_API_URL" | head -1
    do
    echo "Waiting for berth reservations GrahpQL API..."
    sleep 1
    done
    echo "Berth reservations GrahpQL API is available!"
fi

# Start server
if [[ ! -z "$@" ]]; then
    "$@"
elif [[ "$DEV_SERVER" = "1" ]]; then
    npm start
else
    npm run serve
fi
