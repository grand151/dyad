#!/bin/bash

# Czekaj na dostępność X serwera
while ! xdpyinfo -display :1 >/dev/null 2>&1; do
    echo "Czekam na X server..."
    sleep 2
done

echo "X server dostępny, uruchamiam dyad..."

# Uruchom dyad w tle
cd /opt/dyad
export DISPLAY=:1
npm start &

# Uruchom Firefox i otwórz dyad (po 10 sekundach czekania na start)
sleep 10
firefox http://localhost:8000 &

# Utrzymuj skrypt aktywny
wait
