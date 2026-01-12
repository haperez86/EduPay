#!/bin/bash

# Script de actualización automática para EduPay
# Uso: sudo ./update-app.sh

set -e

echo "🔄 Iniciando actualización de EduPay..."

# Variables
APP_DIR="/opt/control-pagos"
SERVICE_NAME="control-pagos"
BACKUP_DIR="/opt/backups"

# Crear backup del JAR actual
echo "📦 Creando backup..."
mkdir -p $BACKUP_DIR
cp /opt/control-pagos-app/app.jar $BACKUP_DIR/app-$(date +%Y%m%d-%H%M%S).jar

# Actualizar código
echo "⬇️ Actualizando código desde GitHub..."
cd $APP_DIR
git pull origin main

# Construir aplicación
echo "🔨 Construyendo aplicación..."
cd control-pagos
./mvnw clean package -DskipTests

# Reemplazar JAR
echo "📤 Instalando nueva versión..."
sudo cp target/control-pagos-*.jar /opt/control-pagos-app/app.jar
sudo chown ubuntu:ubuntu /opt/control-pagos-app/app.jar

# Reiniciar servicio
echo "🔄 Reiniciando servicio..."
sudo systemctl restart $SERVICE_NAME

# Verificar estado
echo "✅ Verificando estado..."
sleep 5
sudo systemctl status $SERVICE_NAME --no-pager

# Verificar que la aplicación responde
echo "🌐 Verificando aplicación..."
if curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Aplicación actualizada exitosamente"
else
    echo "❌ Error: La aplicación no responde"
    echo "🔄 Restaurando backup..."
    sudo cp $BACKUP_DIR/app-$(date +%Y%m%d-%H%M%S).jar /opt/control-pagos-app/app.jar
    sudo systemctl restart $SERVICE_NAME
    exit 1
fi

echo "🎉 ¡Actualización completada!"
echo "📊 Logs: sudo journalctl -u $SERVICE_NAME -f"
