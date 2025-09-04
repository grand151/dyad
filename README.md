# Alpine Linux Desktop z noVNC i dyad

Ten projekt tworzy kontener Docker z Alpine Linux, środowiskiem graficznym XFCE4, noVNC i zainstalowanym dyad.

## Co zawiera:

- Alpine Linux (najnowsza wersja)
- Środowisko graficzne XFCE4
- noVNC dla dostępu przez przeglądarkę
- Firefox
- dyad (https://github.com/dyad-sh/dyad)
- Podstawowe narzędzia deweloperskie

## Deployment na EasyPanel:

### 1. Dodaj projekt w EasyPanel:
- Wybierz "Docker Compose"
- Wskaż na to repo: `https://github.com/grand151/dyad.git`
- EasyPanel automatycznie wykryje `docker-compose.yml`

### 2. Konfiguracja portów:
- Port 6080 - noVNC (dostęp przez przeglądarkę)
- Port 5900 - VNC bezpośredni dostęp

### 3. Zmienne środowiskowe (opcjonalne):
```
DISPLAY=:1
```

## Uruchomienie lokalne:

### Docker Compose
```bash
docker compose up -d
```

### Docker bezpośrednio
```bash
# Zbudowanie obrazu
docker build -t alpine-desktop .

# Uruchomienie kontenera
docker run -d \
  --name alpine-desktop-vnc \
  -p 6080:6080 \
  -p 5900:5900 \
  -v $(pwd)/shared:/shared \
  alpine-desktop
```

## Dostęp:

### Przez przeglądarkę (noVNC):
- Lokalnie: http://localhost:6080
- Na VPS: http://twoja-domena:6080
- Hasło VNC: `password`

### Przez klienta VNC:
- Adres: localhost:5900 (lub IP VPS:5900)
- Hasło: `password`

## dyad:

dyad jest zainstalowany w `/opt/dyad`. Możesz go uruchomić z terminala w środowisku graficznym:

```bash
cd /opt/dyad
npm start
```

## Zarządzanie kontenerem:

```bash
# Sprawdzenie statusu
docker compose ps

# Zatrzymanie
docker compose down

# Restart
docker compose restart

# Logi
docker compose logs -f

# Dostęp do terminala wewnątrz kontenera
docker exec -it alpine-desktop-vnc bash
```

## Katalog shared:

Katalog `shared/` jest zamontowany w kontenerze pod `/shared` - możesz tam umieszczać pliki do wymiany między hostem a kontenerem.

## Rozwiązywanie problemów:

1. Jeśli noVNC nie działa, sprawdź logi:
   ```bash
   docker compose logs alpine-desktop
   ```

2. Jeśli ekran jest czarny, spróbuj zrestartować kontener:
   ```bash
   docker compose restart
   ```

3. Aby zmienić rozdzielczość, zmodyfikuj parametr `-screen 0 1024x768x24` w `supervisord.conf`

## Bezpieczeństwo:

⚠️ **WAŻNE**: Domyślne hasło VNC to `password`. Na produkcji zmień je w pliku `supervisord.conf`
