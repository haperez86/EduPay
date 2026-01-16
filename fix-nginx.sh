#!/bin/bash

# Script de configuración automática de NGINX para EduPay
# Soluciona problemas de 404 y configura el servidor correctamente

set -e

echo "🔧 Configuración automática de NGINX - EduPay"
echo "🔄 Iniciando: $(date)"

# Variables
APP_NAME="control-pagos"
FRONTEND_DIR="/opt/control-pagos/payment-portal-pro/dist"
NGINX_ROOT="/var/www/html"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# 1. Verificar que el frontend existe
log_step "1/6 - Verificando frontend..."
if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "El directorio del frontend no existe: $FRONTEND_DIR"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/index.html" ]; then
    log_error "No se encuentra index.html en: $FRONTEND_DIR"
    log_warn "Construyendo el frontend..."
    cd /opt/control-pagos/payment-portal-pro
    sudo -u ubuntu npm ci
    sudo -u ubuntu npm run build
fi

log_info "✅ Frontend verificado"

# 2. Limpiar y copiar archivos del frontend
log_step "2/6 - Copiando archivos del frontend..."
sudo rm -rf $NGINX_ROOT/*
sudo cp -r $FRONTEND_DIR/* $NGINX_ROOT/
sudo chown -R www-data:www-data $NGINX_ROOT/
sudo chmod -R 755 $NGINX_ROOT/

# Verificar que index.html existe
if [ ! -f "$NGINX_ROOT/index.html" ]; then
    log_error "Error: index.html no se copió correctamente"
    exit 1
fi

log_info "✅ Frontend copiado a $NGINX_ROOT"

# 3. Crear configuración de NGINX
log_step "3/6 - Creando configuración de NGINX..."
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # Frontend estático (React)
    location / {
        root $NGINX_ROOT;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API backend (Spring Boot)
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

log_info "✅ Configuración de NGINX creada"

# 4. Activar sitio y desactivar default
log_step "4/6 - Activando sitio..."
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

log_info "✅ Sitio activado"

# 5. Verificar y recargar NGINX
log_step "5/6 - Verificando configuración de NGINX..."
if sudo nginx -t; then
    log_info "✅ Configuración de NGINX válida"
    sudo systemctl reload nginx
    log_info "✅ NGINX recargado"
else
    log_error "❌ Configuración de NGINX inválida"
    exit 1
fi

# 6. Verificar estado final
log_step "6/6 - Verificando estado final..."
echo ""
echo "📊 Estado de los servicios:"
echo "----------------------------------------"
sudo systemctl status nginx --no-pager -l | head -10
echo ""
sudo systemctl status $APP_NAME --no-pager -l | head -10
echo ""

# 7. Tests de conexión
echo "🔍 Tests de conexión:"
echo "----------------------------------------"
echo "Frontend (index.html):"
if curl -s http://localhost/ | grep -q "html"; then
    echo "✅ Frontend responde correctamente"
else
    echo "❌ Frontend no responde"
fi

echo ""
echo "Backend (API):"
if curl -s http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "✅ Backend responde correctamente"
else
    echo "❌ Backend no responde"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "🌐 Tu aplicación está disponible en:"
echo "  - http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost')"
echo "  - http://localhost"
echo ""
echo "📋 Comandos útiles:"
echo "  - Ver logs NGINX: sudo tail -f /var/log/nginx/access.log"
echo "  - Ver logs app: sudo journalctl -u $APP_NAME -f"
echo "  - Recargar NGINX: sudo nginx -t && sudo systemctl reload nginx"
echo ""

log_info "¡Configuración automática finalizada exitosamente!"
