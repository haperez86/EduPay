#!/bin/bash

# Script de despliegue ULTRA RÁPIDO para AWS EC2
# Escuela de Conducción - Sistema de Pagos
# Optimizado para despliegues frecuentes

set -e

echo "⚡ Despliegue ULTRA RÁPIDO - EduPay Producción"
echo "🔄 Iniciando: $(date)"

# Variables
APP_NAME="control-pagos"
APP_DIR="/opt/$APP_NAME"
SERVICE_NAME="$APP_NAME"
BACKUP_DIR="/opt/backups"

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

# Verificar root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Ejecutar como root: sudo ./deploy-quick.sh"
    exit 1
fi

# Verificar que la aplicación existe
if [ ! -d "$APP_DIR" ]; then
    log_error "La aplicación no existe. Ejecuta primero: sudo ./deploy-aws-ec2.sh"
    exit 1
fi

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# 1. Backup automático con timestamp
log_step "1/7 - Creando backup automático..."
BACKUP_FILE="$BACKUP_DIR/app-$(date +%Y%m%d_%H%M%S).jar"
if [ -f "$APP_DIR/app.jar" ]; then
    cp "$APP_DIR/app.jar" "$BACKUP_FILE"
    log_info "✅ Backup creado: $(basename $BACKUP_FILE)"
else
    log_warn "⚠️  No hay archivo app.jar para backup"
fi

# 2. Actualizar código (usando fetch + reset para mayor velocidad)
log_step "2/7 - Actualizando código desde rama main..."
cd $APP_DIR
git fetch origin main --quiet
git reset --hard origin/main --quiet
log_info "✅ Código actualizado a: $(git rev-parse --short HEAD)"

# 3. Construir backend (con flags de velocidad)
log_step "3/7 - Construyendo backend Spring Boot..."
cd $APP_DIR/control-pagos
if [ ! -f "mvnw" ]; then
    chmod +x mvnw
fi
./mvnw clean package -DskipTests -Dspring.profiles.active=prod -q -T 1C
log_info "✅ Backend construido"

# 4. Construir frontend (con flags de velocidad)
log_step "4/7 - Construyendo frontend React..."
cd $APP_DIR/payment-portal-pro
# Usar npm ci en lugar de npm install para mayor velocidad
if [ -d "node_modules" ]; then
    npm ci --silent --prefer-offline --no-audit
else
    npm ci --silent --no-audit
fi
npm run build
log_info "✅ Frontend construido"

# 5. Instalar nueva versión
log_step "5/7 - Instalando nueva versión..."
cp $APP_DIR/control-pagos/target/control-pagos-*.jar $APP_DIR/app.jar
chown $APP_NAME:$APP_NAME $APP_DIR/app.jar
chmod 500 $APP_DIR/app.jar
log_info "✅ Nueva versión instalada"

# 6. Reiniciar servicios con verificación
log_step "6/7 - Reiniciando servicios..."
systemctl restart $SERVICE_NAME
systemctl reload nginx

# 7. Verificación post-despliegue con rollback automático
log_step "7/7 - Verificando despliegue..."
sleep 8  # Dar tiempo para que la aplicación inicie

if systemctl is-active --quiet $SERVICE_NAME; then
    # Verificación adicional: hacer una petición HTTP
    if curl -s http://localhost:8080/actuator/health >/dev/null 2>&1; then
        log_info "✅ Backend funcionando correctamente"
        DEPLOY_SUCCESS=true
    else
        log_warn "⚠️  Backend iniciado pero health check falló"
        DEPLOY_SUCCESS=false
    fi
else
    log_error "❌ Backend no inició correctamente"
    DEPLOY_SUCCESS=false
fi

# Rollback automático si falló
if [ "$DEPLOY_SUCCESS" = false ]; then
    log_warn "🔄 Iniciando rollback automático..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$APP_DIR/app.jar"
        chown $APP_NAME:$APP_NAME $APP_DIR/app.jar
        systemctl restart $SERVICE_NAME
        sleep 8
        
        if systemctl is-active --quiet $SERVICE_NAME; then
            log_warn "✅ Rollback completado exitosamente"
        else
            log_error "❌ Rollback falló! Revisa los logs manualmente"
            exit 1
        fi
    else
        log_error "❌ No hay backup disponible para rollback"
        exit 1
    fi
fi

# 8. Verificación NGINX
if nginx -t >/dev/null 2>&1; then
    log_info "✅ NGINX configuración correcta"
else
    log_warn "⚠️  NGINX tiene problemas de configuración"
fi

# 9. Mostrar resumen
echo ""
echo "🚀 ¡Despliegue ULTRA RÁPIDO completado!"
echo "⏱️  Tiempo total: $(date +%H:%M:%S)"
echo ""
echo "📊 Resumen:"
if [ "$DEPLOY_SUCCESS" = true ]; then
    echo "  ✅ Estado: EXITOSO"
else
    echo "  ⚠️  Estado: ROLLBACK EJECUTADO"
fi
echo "  🌐 Aplicación: http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost')"
echo "  📋 Logs: journalctl -u $SERVICE_NAME -f --lines=50"
echo "  🔄 Versión: $(git rev-parse --short HEAD)"
echo ""
echo "⚡ Optimizaciones aplicadas:"
echo "  - ✅ Git fetch + reset (más rápido que pull)"
echo "  - ✅ Maven en paralelo (-T 1C)"
echo "  - ✅ npm ci con cache local"
echo "  - ✅ Backup automático con rollback"
echo "  - ✅ Verificación post-despliegue"
echo "  - ✅ Sin reinstalación de dependencias"
echo ""

log_info "¡Despliegue ultra rápido finalizado!"
