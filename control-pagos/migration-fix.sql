-- Script para corregir migración de datos existentes
-- Ejecutar después de que Hibernate haya creado las nuevas columnas

-- 1. Actualizar timestamps nulos con valores por defecto
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;

UPDATE students SET created_at = NOW() WHERE created_at IS NULL;
UPDATE students SET updated_at = NOW() WHERE updated_at IS NULL;

UPDATE courses SET created_at = NOW() WHERE created_at IS NULL;
UPDATE courses SET updated_at = NOW() WHERE updated_at IS NULL;

UPDATE enrollments SET created_at = NOW() WHERE created_at IS NULL;
UPDATE enrollments SET updated_at = NOW() WHERE updated_at IS NULL;

UPDATE payments SET created_at = NOW() WHERE created_at IS NULL;
UPDATE payments SET updated_at = NOW() WHERE updated_at IS NULL;

UPDATE payment_methods SET created_at = NOW() WHERE created_at IS NULL;
UPDATE payment_methods SET updated_at = NOW() WHERE updated_at IS NULL;

-- 2. Actualizar columnas de enum nulas con valores por defecto
UPDATE enrollments SET status = 'ACTIVE' WHERE status IS NULL;
UPDATE payments SET type = 'ABONO' WHERE type IS NULL;
UPDATE payments SET status = 'CONFIRMADO' WHERE status IS NULL;
UPDATE payment_methods SET type = 'CASH' WHERE type IS NULL;

-- 3. Asegurar que todos los registros activos tengan valores válidos
UPDATE users SET active = true WHERE active IS NULL;
UPDATE students SET active = true WHERE active IS NULL;
UPDATE courses SET active = true WHERE active IS NULL;
UPDATE enrollments SET active = true WHERE active IS NULL;
UPDATE payment_methods SET active = true WHERE active IS NULL;

-- 4. Si hay usuarios existentes, asignarlos a la sede principal (se creará después)
-- Esto se ejecutará después de crear las sedes

-- 5. Actualizar roles de usuarios existentes a ADMIN si no tienen rol específico
UPDATE users SET role = 'ADMIN' WHERE role IS NULL OR role NOT IN ('SUPER_ADMIN', 'ADMIN', 'STUDENT');

-- 6. Agregar fecha de registro a estudiantes si no tienen
UPDATE students SET fecha_registro = created_at WHERE fecha_registro IS NULL;

COMMIT;
