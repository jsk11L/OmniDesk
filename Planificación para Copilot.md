# **Contexto de Proyecto para GitHub Copilot: Organizador Personal (OmniDesk)**

**Instrucciones para la IA (Copilot):**

Actúa como un Arquitecto de Software y Full-Stack Developer Senior. Utiliza este documento como contexto principal para generar código. El objetivo es construir una aplicación web (SPA) que sirva como organizador personal (Calendario, To-Do, Notas estilo Obsidian y Bibliotecas personalizadas). El backend debe ser una API REST estricta y segura, ya que en el futuro servirá datos a una aplicación móvil independiente.

## **1\. Stack Tecnológico Estricto**

* **Backend:** Node.js, NestJS, TypeScript.  
* **ORM y Base de Datos:** Prisma ORM, PostgreSQL.  
* **Autenticación y Seguridad:** Passport (JWT), bcrypt. Verificación de correo mediante Nodemailer o API de Resend.  
* **Frontend:** Angular 18+, TypeScript, RxJS.  
* **Estilos y UI (Frontend):** Tailwind CSS, Angular Material (para modales, inputs y tablas).  
* **Librerías Específicas Frontend:** \* FullCalendar (para la vista de calendario).  
  * TipTap o ngx-markdown (para el editor de notas estilo Obsidian).  
  * DragDrop de Angular CDK (para el Kanban/To-Do).

## **2\. Estructura de Directorios (Monorepo)**

nexushub/  
├── backend/                  \# Aplicación NestJS  
│   ├── prisma/  
│   │   ├── schema.prisma     \# Modelos de Base de Datos  
│   ├── src/  
│   │   ├── auth/             \# Módulo de Autenticación y JWT  
│   │   ├── users/            \# Módulo de Usuarios  
│   │   ├── notes/            \# Módulo de Notas  
│   │   ├── todos/            \# Módulo de Tareas  
│   │   ├── libraries/        \# Módulo de Bibliotecas (Juegos, etc.)  
│   │   ├── mail/             \# Módulo de envío de correos  
│   │   ├── app.module.ts  
│   │   └── main.ts  
│   ├── package.json  
│   ├── .env  
├── frontend/                 \# Aplicación Angular 18  
│   ├── src/  
│   │   ├── app/  
│   │   │   ├── core/         \# Interceptors (JWT), Guards, Services  
│   │   │   ├── shared/       \# Componentes reutilizables (Botones, UI)  
│   │   │   ├── features/     \# Módulos Lazy Loaded  
│   │   │   │   ├── auth/     \# Login, Registro, Verificación  
│   │   │   │   ├── dashboard/\# Vista general  
│   │   │   │   ├── calendar/ \# Calendario  
│   │   │   │   ├── notes/    \# Editor y lista de notas  
│   │   │   │   ├── libraries/\# Bibliotecas compartibles  
│   ├── package.json  
├── README.md

## **3\. Base de Datos (Esquema Prisma Objetivo)**

Generar los siguientes modelos en schema.prisma:

* **User:** id (UUID), email (Unique), passwordHash, isEmailVerified (Boolean, default false), verificationToken, createdAt.  
* **Note:** id, title, content (Markdown/Rich Text), userId (Relación User), tags (Array de strings), updatedAt.  
* **Todo:** id, title, description, status (Enum: PENDING, IN\_PROGRESS, COMPLETED), dueDate (DateTime opcional), userId.  
* **Library:** id, name (ej. "Juegos Pasados"), description, isPublic (Boolean, para compartir), userId.  
* **LibraryItem:** id, libraryId (Relación), title, status, rating (Int), customFields (JSONB para CSS/datos extra).

## **4\. Endpoints Principales de la API REST (NestJS)**

El backend debe seguir una estructura de controladores RESTful. Todos los endpoints (excepto auth y bibliotecas públicas) deben estar protegidos por JwtAuthGuard.

| Módulo | Endpoint | Método | Descripción |
| :---- | :---- | :---- | :---- |
| **Auth** | /auth/register | POST | Crea usuario y envía correo con token. |
| **Auth** | /auth/verify | POST | Recibe token del correo y activa cuenta. |
| **Auth** | /auth/login | POST | Devuelve JWT de acceso. |
| **Notes** | /notes | GET/POST | CRUD de notas del usuario logueado. |
| **Todos** | /todos | GET/POST | CRUD de tareas. |
| **Libs** | /libraries | GET/POST | CRUD de bibliotecas. |
| **Libs** | /libraries/public/:id | GET | Endpoint público para compartir bibliotecas (solo lectura). |

## **5\. Hoja de Ruta de Prompts para Copilot**

*(Guía para la generación iterativa de código)*

1. **"Fase 1 (Prisma & DB):** Inicializa el archivo backend/prisma/schema.prisma con los modelos de User, Note, Todo, Library y LibraryItem descritos en la sección 3."  
2. **"Fase 2 (NestJS Auth):** Genera el módulo de autenticación en NestJS (src/auth). Implementa el registro con encriptación bcrypt, la lógica para generar un token de verificación de email y el login devolviendo un JWT."  
3. **"Fase 3 (NestJS CRUD):** Crea el recurso NestJS para notes (Module, Controller, Service) asegurando que todas las rutas usen el JWT Guard y que las notas se filtren por el userId del usuario autenticado."  
4. **"Fase 4 (Angular Setup):** Configura la arquitectura del frontend en Angular. Crea el AuthInterceptor en core/interceptors para adjuntar el JWT a todas las peticiones HTTP salientes."  
5. **"Fase 5 (Angular Auth UI):** Genera los componentes de Login y Registro en features/auth, utilizando Reactive Forms de Angular y validaciones de email/password."  
6. **"Fase 6 (Módulo Notas):** Genera el componente de la vista de Notas en Angular. Integra una librería de Markdown o TipTap básica para el campo de contenido."