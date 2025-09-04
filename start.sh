#!/bin/bash

# Przygotowanie środowiska
export DISPLAY=:1

# Utworzenie katalogu dla logów
mkdir -p /var/log

# Uruchomienie supervisord
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
