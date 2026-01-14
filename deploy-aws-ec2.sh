#!/bin/bash

# Script de despliegue para AWS EC2
# Escuela de Conducción - Sistema de Pagos

set -e

echo "🚀 Iniciando despliegue en AWS EC2..."

# Variables
APP_NAME="control-pagos"
APP_DIR="/opt/$APP_NAME"
SERVICE_NAME="$APP_NAME"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"
BACKUP_DIR="/opt/backups"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Funciones de utilidad
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# 1. Actualizar sistema
log_info "Actualizando paquetes del sistema..."
apt update && apt upgrade -y

# 2. Instalar dependencias
log_info "Instalando dependencias..."
apt install -y \
    openjdk-17-jdk \
    nginx \
    postgresql \
    postgresql-contrib \
    git \
    curl \
    wget \
    unzip \
    ufw

# 3. Configurar firewall
log_info "Configurando firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# 4. Crear directorios
log_info "Creando directorios de aplicación..."
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR
mkdir -p /var/log/$APP_NAME

# 5. Crear usuario para la aplicación
if ! id "$APP_NAME" &>/dev/null; then
    log_info "Creando usuario $APP_NAME..."
    useradd -r -s /bin/false $APP_NAME
fi

# 6. Configurar PostgreSQL
log_info "Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE $APP_NAME;" || log_warn "La base de datos ya existe"
sudo -u postgres psql -c "CREATE USER $APP_NAME WITH PASSWORD 'change_password_123';" || log_warn "El usuario ya existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $APP_NAME TO $APP_NAME;" || log_warn "Privilegios ya concedidos"

# 7. Clonar o actualizar código
if [ -d "$APP_DIR/.git" ]; then
    log_info "Actualizando código existente..."
    cd $APP_DIR
    git pull origin main
else
    log_info "Clonando repositorio..."
    git clone <YOUR_REPO_URL> $APP_DIR
    cd $APP_DIR
fi

# 8. Construir aplicación
log_info "Construyendo aplicación..."
cd $APP_DIR/control-pagos
chmod +x mvnw
./mvnw clean package -DskipTests

# 9. Configurar application.properties para producción
log_info "Configurando application.properties..."
cat > src/main/resources/application-prod.properties << EOF
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/$APP_NAME
spring.datasource.username=$APP_NAME
spring.datasource.password=change_password_123
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
logging.level.com.escuelaconduccion=INFO
logging.file.name=/var/log/$APP_NAME/application.log
EOF

# 10. Construir JAR de producción
log_info "Construyendo JAR de producción..."
./mvnw clean package -DskipTests -Dspring.profiles.active=prod

# 11. Copiar JAR al directorio de aplicación
log_info "Instalando aplicación..."
cp target/control-pagos-*.jar $APP_DIR/app.jar
chown $APP_NAME:$APP_NAME $APP_DIR/app.jar
chmod 500 $APP_DIR/app.jar

# 12. Crear servicio systemd
log_info "Creando servicio systemd..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=$APP_NAME
After=syslog.target network.target postgresql.service

[Service]
Type=simple
User=$APP_NAME
Group=$APP_NAME
ExecStart=/usr/bin/java -jar $APP_DIR/app.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/$APP_NAME/service.log
StandardError=append:/var/log/$APP_NAME/service.log

[Install]
WantedBy=multi-user.target
EOF

# 13. Configurar NGINX
log_info "Configurando NGINX..."
cat > $NGINX_CONFIG << EOF
server {
    listen 80;
    server_name _;

    # Frontend estático (React build)
    location / {
        root $APP_DIR/payment-portal-pro/dist;
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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# 14. Activar sitio NGINX
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 15. Verificar configuración NGINX
nginx -t

# 16. Recargar servicios
log_info "Recargando servicios..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME
systemctl restart nginx

# 17. Verificar estado
log_info "Verificando estado de los servicios..."
systemctl status $SERVICE_NAME --no-pager
systemctl status nginx --no-pager

# 18. Mostrar información importante
echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📋 Información importante:"
echo "  - Aplicación: http://$(curl -s ifconfig.me)"
echo "  - Logs aplicación: journalctl -u $SERVICE_NAME -f"
echo "  - Logs NGINX: tail -f /var/log/nginx/access.log"
echo "  - Configuración NGINX: $NGINX_CONFIG"
echo ""
echo "🔧 Comandos útiles:"
echo "  - Reiniciar app: sudo systemctl restart $SERVICE_NAME"
echo "  - Ver logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  - Recargar NGINX: sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Cambiar la contraseña de PostgreSQL: 'change_password_123'"
echo "  - Configurar dominio personalizado si es necesario"
echo "  - Considerar instalar SSL certificado con Let's Encrypt"
echo ""

log_info "¡Despliegue finalizado exitosamente!"
