# 🖥️ root@vps — Manual de Autogestión de un VPS

> Página estática HTML autocontenida con +290 comandos de Linux para administrar tu propio servidor. Sin dependencias externas, sin build tools, sin frameworks.

## ¿Qué es esto?

Una **cheat-sheet interactiva** con todos los comandos de Linux que necesitás para administrar un VPS: sistema, archivos, red, firewall, servicios, Docker, Nginx y más. Diseñada para ser una referencia rápida — abrís el HTML en el browser y listo.

## 🚀 Cómo usarlo

1. Descargá o cloná el repositorio
2. Serví la carpeta con un servidor local:
   python -m http.server 8000
3. Abrí http://localhost:8000 en el navegador

```
git clone <tu-repo>
cd linux-commands
python -m http.server 8000
start http://localhost:8000  # Windows
open http://localhost:8000   # macOS
```

> ⚠ Ya no funciona abrir con doble-clic (file://): el navegador bloquea fetch de js/data.json por CORS. Necesitás HTTP (local o GitHub Pages).

## ✨ Características

- **Búsqueda en tiempo real** — filtrá comandos escribiendo en la barra superior (o presioná `/`)
- **Copia con un clic** — cada comando tiene un botón "copiar" para pegarlo directo en la terminal
- **23 categorías** organizadas por tema (el contador del footer se calcula solo)
- **5 playbooks** — recetas paso a paso (hardening de VPS, deploy Node + PM2 + Nginx + SSL, diagnóstico de servidor lento, swap, backup de MySQL) con variables editables (`usuario`, `dominio`...) que se aplican a todos los comandos, progreso por paso y botón *copiar como script* (los pasos peligrosos salen comentados)
- **Enlaces directos** — `#pb-<id>` para un playbook, `#c-<categoria>-<n>` para un comando (botón *enlace* en cada tarjeta)
- **HTML saneado** — solo se permiten `<b>`, `<i>`, `<code>` y `<br>` en los textos del JSON
- **Sin dependencias** — HTML, CSS y JS planos, sin build ni paquetes
- **Tema terminal** — modo oscuro y claro con persistencia y preferencia del sistema
- **Navegación lateral** — TOC sticky con highlight por scroll
- **Warnings visuales** — comandos destructivos marcados en rojo con advertencias
- **Responsive** — funciona en desktop y mobile

## 📂 Estructura del proyecto

```
linux-commands/
├── index.html      ← Página principal (estructura HTML)
├── css/styles.css  ← Estilos (tema terminal)
├── js/app.js          ← Carga de datos, render del catálogo, búsqueda y enlaces directos
├── js/core.js         ← Lógica pura (saneado, variables, validación, script); testeable en Node
├── js/playbooks-ui.js ← Render e interacción de los playbooks
├── js/data.json       ← Catálogo de comandos
├── js/playbooks.json  ← Playbooks paso a paso
├── tests/             ← Tests con `node --test`
├── README.md
├── AGENTS.md
└── CLAUDE.md
```

**Sin build tools ni dependencias**: HTML + CSS + JS planos — abrís `index.html` y funciona.

## 📋 Categorías

| # | Categoría | Descripción |
|---|-----------|-------------|
| 01 | Sistema e información | Kernel, distro, uptime, hardware |
| 02 | Archivos, directorios y permisos | Navegación del filesystem y control de acceso |
| 03 | Procesamiento de texto (grep, sed, awk) | Buscar, reemplazar y extraer información de archivos |
| 04 | Procesos y rendimiento | CPU, RAM, matar procesos colgados |
| 05 | Swap (memoria virtual) | Respaldo de RAM para VPS con poca memoria |
| 06 | Red y conectividad | Diagnóstico, puertos, DNS |
| 07 | Firewall (UFW) | Primera línea de defensa del VPS |
| 08 | iptables (firewall del kernel) | Reglas directas, política por defecto, persistencia |
| 09 | SSH y acceso remoto | Endurecimiento y autenticación por llaves |
| 10 | Nginx | Servidor web / proxy reverso, SSL |
| 11 | Docker | Contenedores, volúmenes, redes, compose |
| 12 | Bases de datos (MySQL/MariaDB) | Conectar, crear usuarios, permisos |
| 13 | Systemd (servicios) | Control de servicios, autoarranque |
| 14 | Logs y journalctl | Diagnóstico de fallas |
| 15 | Cron y tareas programadas | Automatización de backups y limpiezas |
| 16 | Gestión de paquetes | apt, dpkg, actualizaciones |
| 17 | Seguridad | fail2ban, hardening, auditorías |
| 18 | Backups y transferencia | rsync, dumps de BD, programación |
| 19 | Monitoreo y disco | Uso de disco, RAM, herramientas visuales |
| 20 | Bash y configuración de shell | Alias, variables, prompt, historial |
| 21 | PM2 (gestor de procesos Node.js) | Reinicios, cluster, logs de Node |
| 22 | Git y despliegue | Clonar, deploy keys, actualizar producción |
| 23 | Gestión de usuarios | Crear usuarios, grupos, sudoers, bloqueos y auditoría |

## 🛠️ Cómo editar / contribuir

Todo el contenido vive en `js/data.json` (un array JSON de categorías con el mismo esquema de siempre). `js/app.js` solo carga y renderiza.

Cada categoría tiene esta estructura:

```javascript
{
  id: "slug-unico",
  title: "Nombre de la categoría",
  desc: "Descripción breve de la categoría",
  items: [
    {
      cmd: "comando_ejemplo",
      desc: "Descripción del comando",
      flags: "<b>-f</b> fuerza la operación",  // opcional
      warn: "Cuidado con esto",                  // opcional
      danger: true                               // opcional - marca en rojo
    }
  ]
}
```

### Playbooks (`js/playbooks.json`)

```javascript
{
  id: "slug-unico",            // no puede coincidir con el id de una categoría
  title: "Nombre del playbook",
  desc: "Qué logra y qué requiere",
  time: "15 min",              // opcional
  vars: [{ name: "usuario", label: "Usuario sudo", default: "deploy" }],
  steps: [
    {
      title: "Crear usuario",
      cmd: "adduser {{usuario}}",   // {{var}} debe estar declarada en vars
      desc: "Qué hace el paso",
      warn: "Texto del riesgo",     // obligatorio si danger es true
      danger: true                  // opcional
    }
  ]
}
```

Nunca pongas contraseñas ni claves como valor por defecto: los valores se guardan en el `localStorage` del navegador.

### Reglas al editar

- El contenido está en **español** — mantener consistencia
- **No escapar** `cmd` — el JS lo hace con `escapeHtml`/`escapeAttr`. `desc`, `flags` y `warn` aceptan solo `<b>`, `<i>`, `<code>` y `<br>` (sin atributos); cualquier otra etiqueta se muestra como texto
- El contador de categorías del footer es automático: no hace falta tocarlo
- Para que un comando sea buscable, incluí palabras clave en `desc` o `flags` — el filtro busca en `cmd + desc + flags` (sin etiquetas)
- Al editar `js/data.json` respetá JSON válido: comillas dobles en claves y strings, sin comas finales, sin comentarios.

## 🧪 Verificación

```
node --test
```

Valida la lógica de `js/core.js`, el catálogo y los playbooks. Para lo visual, serví la carpeta (`python3 -m http.server 8000`) y revisá en el navegador. No hay build ni dependencias: `package.json` solo declara `type: module` y el script `test`.

## Stack

- HTML5
- CSS custom (variables, grid, flexbox, backdrop-filter)
- Vanilla JavaScript (sin frameworks)
- Fuente: JetBrains Mono + IBM Plex Sans

## 📄 Licencia

Uso local. Generado como referencia personal.

Licencia MTI

---

*Hecho con ❤️ para la comunidad de auto-gestión de servidores.*
