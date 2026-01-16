#!/bin/bash

# Script rápido de despliegue para producción
# Escuela de Conducción - Sistema de Pagos

set -e

echo "🚀 Despliegue Rápido - EduPay Producción"

# Variables
APP_NAME="control-pagos"
APP_DIR="/opt/$APP_NAME"
SERVICE_NAME="$APP_NAME"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Verificar root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Ejecutar como root: sudo ./deploy-quick.sh"
    exit 1
fi

# 1. Actualizar código
log_info "Actualizando código desde rama main..."
cd $APP_DIR
git pull origin main

# 2. Construir backend
log_info "Construyendo backend Spring Boot..."
cd control-pagos
./mvnw clean package -DskipTests -Dspring.profiles.active=prod

# 3. Construir frontend
log_info "Construyendo frontend React..."
cd ../payment-portal-pro
npm ci
npm run build

# 4. Instalar nueva versión
log_info "Instalando nueva versión..."
cp control-pagos/target/control-pagos-*.jar $APP_DIR/app.jar
chown $APP_NAME:$APP_NAME $APP_DIR/app.jar

# 5. Reiniciar servicios
log_info "Reiniciando servicios..."
systemctl restart $SERVICE_NAME
systemctl reload nginx

# 6. Verificar estado
log_info "Verificando estado..."
sleep 5
systemctl status $SERVICE_NAME --no-pager -l
systemctl status nginx --no-pager -l

# 7. Mostrar información
echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📋 Información:"
echo "  - Aplicación: http://$(curl -s ifconfig.me)"
echo "  - Logs: journalctl -u $SERVICE_NAME -f"
echo "  - Versión: $(git rev-parse --short HEAD)"
echo ""

log_info "¡Despliegue finalizado exitosamente!"
