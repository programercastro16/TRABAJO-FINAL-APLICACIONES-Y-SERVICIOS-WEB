# Conobras Quote Pro 🏛️ (Laravel Edition)
*Software para Gestión de Costos, Presupuestos y Cotizaciones Arquitectónicas desarrollado con Laravel 11/12, Eloquent ORM, SQLite y React 19 + Tailwind CSS*

Desarrollada para el uso de **Conobras Construcción + Arquitectura** (Arquitecto - Constructor John Fabio Giraldo).

---

## 🚀 Cómo Iniciar la Aplicación

Tienes varias formas inmediatas de ejecutar la aplicación:

### Opción 1: Acceso Directo Windows (Recomendado)
Haz doble clic sobre el archivo por lotes:
```text
ConobrasQuote.bat
```
Esto iniciará automáticamente el servidor local de Laravel en el puerto `8000` y abrirá tu navegador predeterminado en `http://localhost:8000`.

### Opción 2: Modo Desarrollo con Hot-Reload (Vite + Laravel)
Haz doble clic en:
```text
dev.bat
```
O desde la consola:
```powershell
php artisan serve
# En otra terminal:
npm run dev
```

### Opción 3: Comandos Artisan
```powershell
# Levantar el servidor web
php artisan serve

# Re-ejecutar migraciones y datos de prueba
php artisan migrate:fresh --seed
```

---

## 📂 Arquitectura Laravel del Proyecto

1. **Backend Laravel**:
   - **Modelos Eloquent**: `Cotizacion`, `Insumo`, `Configuracion` (ubicados en `app/Models/`).
   - **Controladores API**:
     - `CotizacionController`: Gestión integral de cotizaciones (CRUD, cálculo, duplicación).
     - `InsumoController`: Catálogo de insumos, cuadrillas, maquinaria y materiales.
     - `ConfiguracionController`: Parámetros de estudio, arquitecto titular y márgenes predeterminados.
   - **Rutas API**: Definidas en `routes/api.php` bajo `/api/quotes`, `/api/materials` y `/api/config`.
   - **Rutas Web**: Definidas en `routes/web.php` sirviendo la vista Blade principal `resources/views/app.blade.php`.

2. **Base de Datos MySQL**:
   - Almacenamiento local ultrarrápido y sin necesidad de servicios externos en `database/database.mysql`.
   - Migraciones estructuradas en `database/migrations/`.
   - Sembrado de catálogo e insumos iniciales en `database/seeders/`.

3. **Frontend React + Vite**:
   - Integrado directamente con Laravel Vite Plugin (`resources/js/` y `resources/css/`).
   - Todos los cálculos técnicos en tiempo real (AIU desglosado o simplificado, IVA, honorarios del arquitecto).
   - Generador de PDF institucional membretado de Conobras (`jsPDF` / `html2canvas`).
   - Exportación, impresión y envío directo por WhatsApp.

---

## 💾 Dónde se Guardan tus Datos (MySQL)
Toda la información se gestiona a través de Laravel Eloquent en el archivo local:
```text
database/database.mysql
```
Tus cotizaciones, catálogo de precios y configuración permanecen 100% privados y locales.
