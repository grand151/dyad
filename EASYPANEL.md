# EasyPanel Configuration

## Deployment Instructions

### 1. Dodaj nowy projekt w EasyPanel:
- Kliknij "Add Project"
- Wybierz "Docker Compose"
- Repository URL: `https://github.com/grand151/dyad.git`
- Branch: `main`

### 2. Konfiguracja środowiska:

**Ports:**
- 6080 - noVNC Web Interface (HTTP)
- 5901 - VNC Direct Access (TCP)

**Environment Variables:**
```
DISPLAY=:1
```

**Volumes (opcjonalne):**
- `./shared:/shared` - współdzielony katalog

### 3. Domain Configuration:
- Skonfiguruj domenę dla portu 6080 (noVNC)
- Przykład: `your-domain.com -> Container Port 6080`

### 4. Security:
⚠️ **ZMIEŃ HASŁO VNC** przed wdrożeniem na produkcji!

W pliku `supervisord.conf` zmień:
```
command=/usr/bin/x11vnc -display :1 -passwd TWOJE_HASLO -listen localhost -xkb -ncache 10 -ncache_cr -forever
```

### 5. Resource Limits:
Zalecane minimum:
- CPU: 1 vCPU
- RAM: 2GB
- Storage: 5GB

### 6. Backup:
Katalog `/shared` zawiera dane użytkownika - ustaw backup dla tego volume.

## Dostęp po wdrożeniu:

1. **Web Interface:** `https://your-domain.com`
2. **VNC Client:** `your-domain.com:5901`
3. **Hasło:** `password` (domyślnie - ZMIEŃ!)

## Testowanie:

Po wdrożeniu:
1. Otwórz domenę w przeglądarce
2. Powinieneś zobaczyć interfejs noVNC
3. Kliknij "Connect" i wprowadź hasło
4. Powinieneś zobaczyć desktop XFCE4
5. Otwórz terminal i uruchom dyad: `cd /opt/dyad && npm start`
