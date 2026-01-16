# 🚀 Guía de Despliegue en AWS EC2
# Escuela de Conducción - Sistema de Pagos

## 📋 Resumen

Esta guía te ayudará a desplegar tu aplicación Spring Boot + React en AWS EC2 con NGINX como reverse proxy.

## 🏗️ Arquitectura

```
EC2 (Ubuntu 22.04)
├── Spring Boot (API) - Puerto 8080
├── React (estático) - Servido por NGINX
├── PostgreSQL - Puerto 5432
└── NGINX (reverse proxy) - Puerto 80/443
```

## 💰 Costos Estimados

- **Free Tier (12 meses)**: $0 USD/mes
- **Después**: ~$6-10 USD/mes (EC2 t3.micro + datos)

## 🔧 Prerrequisitos

1. **Cuenta AWS** con acceso a EC2
2. **Git** instalado localmente
3. **Puerto SSH** (22) abierto en tu firewall local

## 📂 Archivos de Configuración Creados

- `deploy-aws-ec2.sh` - Script de despliegue automatizado completo
- `deploy-quick.sh` - Script de actualización rápida para producción
- `nginx-config.conf` - Configuración NGINX
- `control-pagos.service` - Servicio systemd
- `Dockerfile.production` - Docker optimizado para producción
- `application-prod.properties` - Configuración Spring Boot producción

## 🚀 Pasos de Despliegue

### 1. Crear Instancia EC2

```bash
# 1.1 Iniciar sesión en AWS Console
# 1.2 Ir a EC2 → Launch Instances
# 1.3 Configurar:
#   - Name: control-pagos-server
#   - AMI: Ubuntu Server 22.04 LTS
#   - Instance Type: t3.micro (Free Tier)
#   - Key Pair: Crear y descargar .pem
#   - Security Group: Permitir SSH (22), HTTP (80), HTTPS (443)
#   - Storage: 20GB GP3
# 1.4 Launch y esperar que esté running
```

### 2. Conectar al Servidor

```bash
# Dar permisos al key pair
chmod 400 your-key-pair.pem

# Conectar SSH
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
```

### 3. Ejecutar Script de Despliegue

```bash
# 3.1 Descargar script directamente desde GitHub
wget https://raw.githubusercontent.com/haperez86/EduPay/main/deploy-aws-ec2.sh
chmod +x deploy-aws-ec2.sh

# 3.2 Ejecutar despliegue (como root)
sudo ./deploy-aws-ec2.sh
```

### 3.1 Opción: Despliegue Rápido (si ya existe el servidor)

```bash
# Descargar script rápido
wget https://raw.githubusercontent.com/haperez86/EduPay/main/deploy-quick.sh
chmod +x deploy-quick.sh

# Ejecutar actualización rápida
sudo ./deploy-quick.sh
```

### 4. Configuración Manual (si el script falla)

```bash
# 4.1 Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 4.2 Instalar dependencias
sudo apt install -y openjdk-17-jdk nginx postgresql git

# 4.3 Configurar PostgreSQL
sudo -u postgres createdb control-pagos
sudo -u postgres createuser control-pagos
sudo -u postgres psql -c "ALTER USER control-pagos PASSWORD 'tu_password_seguro';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE control-pagos TO control-pagos;"

# 4.4 Construir aplicación
cd /opt/control-pagos/control-pagos
./mvnw clean package -DskipTests

# 4.5 Configurar NGINX
sudo cp ../nginx-config.conf /etc/nginx/sites-available/control-pagos
sudo ln -s /etc/nginx/sites-available/control-pagos /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 4.6 Configurar servicio systemd
sudo cp ../control-pagos.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable control-pagos
sudo systemctl start control-pagos
```

## 🔍 Verificación

```bash
# Verificar servicios
sudo systemctl status control-pagos
sudo systemctl status nginx
sudo systemctl status postgresql

# Ver logs
sudo journalctl -u control-pagos -f
sudo tail -f /var/log/nginx/access.log

# Probar API
curl http://localhost:8080/api/health

# Probar frontend
curl http://localhost/

# Obtener IP pública
curl ifconfig.me
```

## 🌐 Acceso a la Aplicación

- **URL Pública**: `http://your-ec2-public-ip`
- **API Endpoints**: `http://your-ec2-public-ip/api/*`
- **Login inicial**: 
  - Usuario: `admin`
  - Contraseña: `admin123` (cambiar después)

## 📱 Verificación Post-Despliegue

1. **Acceder al frontend**: `http://your-ec2-public-ip`
2. **Probar login**: Con credenciales por defecto
3. **Verificar funcionalidades**:
   - Dashboard con estadísticas
   - Gestión de estudiantes
   - Sistema de pagos
   - Multisede (si SUPER_ADMIN)
4. **Verificar responsive**: Probar en móvil y desktop

## 🔐 Seguridad Adicional

### 1. Cambiar Contraseñas

```bash
# PostgreSQL
sudo -u postgres psql -c "ALTER USER control-pagos PASSWORD 'nuevo_password_seguro';"

# Editar application-prod.properties con nueva contraseña
sudo nano /opt/control-pagos/control-pagos/src/main/resources/application-prod.properties
```

### 2. Configurar SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d your-domain.com

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Firewall Adicional

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📊 Monitoreo

### Logs Importantes

```bash
# Aplicación
sudo journalctl -u control-pagos -f

# NGINX
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Comandos de Mantenimiento

```bash
# Reiniciar aplicación
sudo systemctl restart control-pagos

# Recargar NGINX
sudo nginx -t && sudo systemctl reload nginx

# Actualizar código
cd /opt/control-pagos && git pull
cd control-pagos && ./mvnw clean package -DskipTests
sudo systemctl restart control-pagos
```

## 🐛 Problemas Comunes

### 1. Error de conexión a base de datos

```bash
# Verificar estado PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
sudo -u postgres psql -c "\l"

# Revisar configuración
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

### 2. NGINX no sirve frontend

```bash
# Verificar configuración
sudo nginx -t

# Verificar permisos
sudo ls -la /opt/control-pagos/payment-portal-pro/dist/

# Revisar logs NGINX
sudo tail -f /var/log/nginx/error.log
```

### 3. Aplicación no inicia

```bash
# Verificar logs
sudo journalctl -u control-pagos -n 50

# Verificar Java
java -version

# Verificar JAR
ls -la /opt/control-pagos/app.jar
```

## 🔄 Actualizaciones

Para actualizar la aplicación:

```bash
# 1. Hacer backup
sudo cp /opt/control-pagos/app.jar /opt/backups/app-$(date +%Y%m%d).jar

# 2. Actualizar código
cd /opt/control-pagos && git pull

# 3. Reconstruir
cd control-pagos && ./mvnw clean package -DskipTests

# 4. Reemplazar JAR
sudo cp target/control-pagos-*.jar /opt/control-pagos/app.jar

# 5. Reiniciar
sudo systemctl restart control-pagos
```

## 📞 Soporte

- **AWS Documentation**: https://docs.aws.amazon.com/ec2/
- **NGINX Docs**: https://nginx.org/en/docs/
- **Spring Boot Docs**: https://docs.spring.io/spring-boot/docs/

---

## ✅ Checklist Final

- [ ] Instancia EC2 creada y accesible
- [ ] Script de despliegue ejecutado
- [ ] Servicios corriendo (Spring Boot, NGINX, PostgreSQL)
- [ ] Aplicación accesible vía HTTP
- [ ] Contraseñas seguras configuradas
- [ ] Firewall configurado
- [ ] SSL configurado (opcional pero recomendado)
- [ ] Sistema de backups implementado
- [ ] Monitoreo configurado

¡Felicidades! Tu aplicación está desplegada en AWS EC2. 🎉
