#!/bin/bash

# Czekaj na X server
while ! xdpyinfo -display :1 >/dev/null 2>&1; do
    echo "Czekam na X server..."
    sleep 2
done

echo "X server gotowy, uruchamiam dyad..."

# Przejdź do katalogu dyad
cd /opt/dyad

# Sprawdź dostępne skrypty
echo "Dostępne skrypty npm:"
npm run

# Uruchom dyad w trybie dev
export DISPLAY=:1
npm start &

# Czekaj chwilę na uruchomienie dyad
sleep 10

# Uruchom Firefox z dyad
firefox http://localhost:8000 &

# Trzymaj skrypt żywy
wait
