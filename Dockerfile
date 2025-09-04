FROM alpine/gcloud:310.0.0

# Instalacja podstawowych pakietów i środowiska graficznego
RUN apk update && apk add --no-cache \
    xvfb \
    x11vnc \
    xfce4 \
    xfce4-terminal \
    firefox \
    bash \
    curl \
    wget \
    git \
    nodejs \
    npm \
    python3 \
    py3-pip \
    supervisor \
    xrandr \
    procps-ng \
    build-base \
    && rm -rf /var/cache/apk/*

# Instalacja noVNC
RUN wget -qO- https://github.com/novnc/noVNC/archive/v1.4.0.tar.gz | tar xz -C /opt/ \
    && mv /opt/noVNC-1.4.0 /opt/noVNC \
    && wget -qO- https://github.com/novnc/websockify/archive/v0.10.0.tar.gz | tar xz -C /opt/ \
    && mv /opt/websockify-0.10.0 /opt/websockify

# Kopiuj custom CSS dla noVNC
COPY novnc-custom.css /opt/noVNC/app/styles/custom.css

# Dodaj custom CSS do HTML noVNC
RUN sed -i 's|</head>|<link rel="stylesheet" type="text/css" href="app/styles/custom.css">\n</head>|' /opt/noVNC/vnc.html

# Konfiguracja VNC
RUN mkdir -p /root/.vnc

# Konfiguracja Supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Skrypt startowy
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Instalacja dyad
RUN git clone https://github.com/dyad-sh/dyad.git /opt/dyad \
    && cd /opt/dyad \
    && npm install

# Skrypt dla automatycznego uruchamiania dyad
COPY start-dyad.sh /opt/start-dyad.sh
RUN chmod +x /opt/start-dyad.sh

# Konfiguracja środowiska
ENV DISPLAY=:1
ENV VNC_PORT=5901
ENV NOVNC_PORT=6080

# Porty
EXPOSE 5901 6080

# Uruchomienie
CMD ["/start.sh"]
