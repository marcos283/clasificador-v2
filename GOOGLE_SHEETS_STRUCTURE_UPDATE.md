# Actualización de Estructura Google Sheets - LeadsVoice

## Resumen de Cambios

**Fecha**: Septiembre 2024
**Branch**: `leads`
**Versión**: v2.1.0

### Cambios Principales

Se actualizó completamente la estructura de la hoja "Leads" en Google Sheets para incluir campos adicionales y reordenar las columnas según los nuevos requerimientos del negocio.

## Estructura Anterior vs Nueva

### ❌ Estructura Anterior (10 columnas A-J)
```
A: Fecha
B: Nombre
C: Apellidos
D: Teléfono
E: Email
F: DNI
G: Fecha Nacimiento
H: Edad
I: Estado
J: Notas
```

### ✅ Nueva Estructura (15 columnas A-O)
```
A: Nombre
B: Apellidos
C: DNI
D: Fecha nacimiento
E: Teléfono
F: Email
G: ID de Contacto          ← NUEVO CAMPO
H: Situación laboral       ← NUEVO CAMPO
I: Curso Terminado         ← NUEVO CAMPO
J: Interés                 ← NUEVO CAMPO
K: Disponibilidad          ← NUEVO CAMPO
L: Notas
M: Whatsapp               ← NUEVO CAMPO
N: Registro ED            ← NUEVO CAMPO
O: Fecha                  ← MOVIDO AL FINAL
```

## Archivos Modificados

### 1. `src/services/googleSheets.ts`

**Cambios realizados:**
- Actualizado array de headers para hoja "Leads" con 15 columnas
- Cambiado rango de `A1:J1` a `A1:O1` para headers
- Modificado rango de datos de `A:J` a `A:O` para la hoja Leads
- Actualizado comentario explicativo del rango

**Líneas modificadas:**
- **Líneas 237-253**: Nuevo array de headers
- **Línea 254**: Nuevo rango A1:O1
- **Línea 423**: Nuevo rango A:O para datos

### 2. `src/App.tsx`

**Cambios realizados:**
- Reordenado mapeo de datos para múltiples leads (`allLeadsData`)
- Actualizado mapeo de fallback (`leadSheetData`) para casos sin leads detectados
- Añadido manejo de nuevos campos con valores por defecto
- Movido timestamp de primera a última posición

**Líneas modificadas:**
- **Líneas 237-253**: Estructura fallback actualizada
- **Líneas 262-278**: Mapeo de múltiples leads actualizado

## Nuevos Campos Añadidos

| Campo | Posición | Tipo | Descripción | Valor por Defecto |
|-------|----------|------|-------------|-------------------|
| ID de Contacto | G | String | Identificador único del contacto | `''` (vacío) |
| Situación laboral | H | String | Estado laboral actual del lead | `''` (vacío) |
| Curso Terminado | I | String | Cursos completados previamente | `''` (vacío) |
| Interés | J | String | Nivel/tipo de interés mostrado | `''` (vacío) |
| Disponibilidad | K | String | Horarios/días disponibles | `''` (vacío) |
| Whatsapp | M | String | Número de WhatsApp del lead | `''` (vacío) |
| Registro ED | N | String | Estado del registro en sistema ED | `''` (vacío) |

## Impacto en la Aplicación

### ✅ Compatibilidad Mantenida
- La detección automática de tipo de hoja sigue funcionando
- Headers se crean automáticamente al crear nuevas hojas "Leads"
- Fallback para casos sin leads detectados actualizado

### ⚠️ Consideraciones Importantes
- **Hojas existentes**: Deben actualizarse manualmente o recrearse
- **Rangos**: El sistema ahora usa 15 columnas (A-O) para hojas Leads
- **Datos antiguos**: Pueden quedar desalineados si no se migran

## Migración de Datos Existentes

### Opción 1: Recrear Hoja
1. Eliminar hoja "Leads" existente
2. Crear nueva hoja "Leads" desde la aplicación
3. Headers se añadirán automáticamente con nueva estructura

### Opción 2: Migración Manual
1. Insertar 5 columnas nuevas en posiciones correctas
2. Actualizar headers manualmente
3. Verificar alineación de datos

## Testing

### ✅ Casos Probados
- [x] Creación de nueva hoja Leads
- [x] Headers automáticos con 15 columnas
- [x] Mapeo de datos con leads detectados
- [x] Fallback sin leads detectados
- [x] Rango A:O funcional

### 🔄 Casos por Probar
- [ ] Migración de datos existentes
- [ ] Compatibilidad con hojas mixtas (antigua/nueva estructura)
- [ ] Performance con 15 columnas vs 10 columnas

## Configuración Requerida

### Variables de Entorno (sin cambios)
```env
VITE_GOOGLE_SHEET_ID=your_google_sheet_id_here
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
VITE_GOOGLE_PRIVATE_KEY=your_private_key_here
```

### Permisos Google Sheets (sin cambios)
- Service Account debe tener permisos de **Editor**
- Hoja debe estar compartida con el email de Service Account

## Próximos Pasos

1. **Actualizar AI Prompts**: Modificar prompts de clasificación para extraer los nuevos campos
2. **Testing Extensivo**: Probar con datos reales de producción
3. **Documentar API**: Actualizar documentación de campos esperados
4. **Migración Producción**: Planificar migración de hojas existentes

## Versionado

| Versión | Columnas | Rango | Estado |
|---------|----------|-------|--------|
| v1.0 | 10 (A-J) | A:J | Deprecado |
| **v2.1** | **15 (A-O)** | **A:O** | **Actual** |

---

**Autor**: Claude Code Assistant
**Fecha**: 2024-09-14
**Commit**: Pending
**Reviewer**: @marcos283