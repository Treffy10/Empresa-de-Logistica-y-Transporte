# 🛠️ PLAN DE REFACTORIZACIÓN - Paso a Paso

## 📋 Resumen Ejecutivo

**Objetivo:** Migrar de una arquitectura monolítica con límites difusos a una arquitectura en capas con interfaces claras.

**Duración estimada:** 3-4 sprints (3 semanas cada uno)
**Complejidad:** Media-Alta
**Riesgo de breaking changes:** Bajo (si se mantiene API compatible)

---

## 🎯 FASE 0: Preparación (Sprint 0 - 1 semana)

### ✅ 0.1 - Preparar estructura de carpetas

```
backend/
├── src/
│   ├── domain/                 # Lógica de negocio pura (sin dependencias)
│   │   ├── entities/           # Cliente, Paquete, Usuario
│   │   ├── interfaces/         # Contratos (IRepository, IValidator)
│   │   ├── exceptions/         # Excepciones de dominio
│   │   └── services/           # Servicios de negocio
│   ├── application/            # Orquestación de casos de uso
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── mappers/            # Mapeo domain ↔ DTO
│   │   └── services/           # Application Services
│   ├── infrastructure/         # Detalles técnicos
│   │   ├── repositories/       # MemoryRepository, PostgresRepository
│   │   ├── validators/         # Validadores específicos
│   │   ├── mappers/            # Mapeo domain ↔ DB
│   │   ├── database/           # Conexiones DB
│   │   └── auth/               # Autenticación
│   ├── presentation/           # HTTP layer
│   │   ├── controllers/        # Controladores
│   │   ├── routes/             # Rutas API
│   │   ├── middleware/         # Middleware Express
│   │   └── server.js           # Configuración Express
│   ├── config/                 # Configuración
│   │   ├── DIContainer.js      # Inyección de dependencias
│   │   ├── bootstrap.js        # Inicialización
│   │   └── env.js              # Variables de entorno
│   └── shared/                 # Código compartido
│       ├── utils/
│       ├── constants/
│       └── errors/
├── package.json
└── .env
```

**Tareas:**
- [ ] Crear nueva estructura de carpetas
- [ ] Mover archivos existentes (sin cambios de código aún)
- [ ] Actualizar imports
- [ ] Verificar que tests sigan pasando

---

## 🎯 FASE 1: Interfaces Base (Sprint 1 - 1 semana)

### ✅ 1.1 - Crear interfaz IRepository

**Archivo:** `src/domain/interfaces/IRepository.js`

```javascript
export class IRepository {
  // CLIENTS
  async listClients() { this._notImplemented() }
  async createClient(data) { this._notImplemented() }
  async getClientById(id) { this._notImplemented() }
  async updateClient(id, data) { this._notImplemented() }
  async deleteClient(id) { this._notImplemented() }

  // DISTRIBUTORS
  async listDistributors() { this._notImplemented() }
  async createDistributor(data) { this._notImplemented() }
  async getDistributorById(id) { this._notImplemented() }
  async updateDistributor(id, data) { this._notImplemented() }
  async deleteDistributor(id) { this._notImplemented() }

  // BRANCHES
  async listBranches() { this._notImplemented() }
  async createBranch(data) { this._notImplemented() }
  async getBranchById(id) { this._notImplemented() }
  async updateBranch(id, data) { this._notImplemented() }
  async deleteBranch(id) { this._notImplemented() }

  // PACKAGES
  async listPackages(status) { this._notImplemented() }
  async createPackage(data) { this._notImplemented() }
  async getPackageById(id) { this._notImplemented() }
  async getPackageDetailsById(id) { this._notImplemented() }
  async updatePackageStatus(id, status) { this._notImplemented() }
  async listPackagesDetailed(status) { this._notImplemented() }
  async listPackagesByCourier(courierId) { this._notImplemented() }

  // USERS
  async listUsers() { this._notImplemented() }
  async createUser(data) { this._notImplemented() }
  async getUserById(id) { this._notImplemented() }
  async getUserByEmail(email) { this._notImplemented() }
  async updateUser(id, data) { this._notImplemented() }
  async deleteUser(id) { this._notImplemented() }

  // ROLES
  async listRoles() { this._notImplemented() }
  async getRoleById(id) { this._notImplemented() }
  async createRole(name) { this._notImplemented() }

  // GENERAL
  async getHealth() { this._notImplemented() }
  async close() { this._notImplemented() }

  _notImplemented() {
    throw new Error(`${this.constructor.name} must implement this method`)
  }
}
```

**Tareas:**
- [ ] Crear IRepository.js
- [ ] Documentar cada método con JSDoc
- [ ] Crear tests básicos

### ✅ 1.2 - Crear interfaz IValidator

**Archivo:** `src/domain/interfaces/IValidator.js`

```javascript
export class IValidator {
  validatePhone(numero, pais) { this._notImplemented() }
  validateDni(dni) { this._notImplemented() }
  validateEmail(email) { this._notImplemented() }
  validateClient(payload) { this._notImplemented() }
  validatePackage(payload) { this._notImplemented() }
  validateBranch(payload) { this._notImplemented() }
  validateUser(payload) { this._notImplemented() }
  validateDistributor(payload) { this._notImplemented() }

  _notImplemented() {
    throw new Error(`${this.constructor.name} must implement this method`)
  }
}
```

**Tareas:**
- [ ] Crear IValidator.js
- [ ] Definir estructura de retorno (ValidationResult)

### ✅ 1.3 - Crear interfaz IMapper

**Archivo:** `src/domain/interfaces/IMapper.js`

```javascript
export class IMapper {
  toDomain(raw) { this._notImplemented() }
  toPersistence(domain) { this._notImplemented() }
  toDTO(domain) { this._notImplemented() }

  _notImplemented() {
    throw new Error(`${this.constructor.name} must implement this method`)
  }
}
```

### ✅ 1.4 - Crear DIContainer

**Archivo:** `src/config/DIContainer.js`

```javascript
export class DIContainer {
  constructor() {
    this.services = new Map()
    this.singletons = new Map()
  }

  register(name, factory) {
    this.services.set(name, { factory, singleton: false })
  }

  registerSingleton(name, factory) {
    this.services.set(name, { factory, singleton: true })
  }

  get(name) {
    const service = this.services.get(name)
    if (!service) throw new Error(`Service "${name}" not registered`)

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this))
      }
      return this.singletons.get(name)
    }

    return service.factory(this)
  }

  has(name) {
    return this.services.has(name)
  }
}
```

**Tareas:**
- [ ] Implementar DIContainer
- [ ] Agregar tests

---

## 🎯 FASE 2: Implementaciones de Repositorio (Sprint 2 - 1 semana)

### ✅ 2.1 - Refactorizar storage.js → MemoryRepository

**Archivo:** `src/infrastructure/repositories/MemoryRepository.js`

**Tarea:** Convertir `storage.js` a clase que extiende `IRepository`

- Cambio mínimo de lógica
- Solo estructura y naming

```javascript
import { IRepository } from '../../domain/interfaces/IRepository.js'
import { v4 as uuid } from 'uuid'

export class MemoryRepository extends IRepository {
  constructor() {
    super()
    this.clients = [/* data init */]
    this.distributors = [/* data init */]
    this.branches = [/* data init */]
    this.packages = [/* data init */]
    this.users = [/* data init */]
    this.roles = [/* data init */]
  }

  async listClients() {
    return this.clients
  }

  // ...resto de métodos
}
```

### ✅ 2.2 - Refactorizar storageDb.js → PostgresRepository

**Archivo:** `src/infrastructure/repositories/PostgresRepository.js`

**Tarea:** Convertir `storageDb.js` a clase que extiende `IRepository`

```javascript
import { IRepository } from '../../domain/interfaces/IRepository.js'
import pg from 'pg'

export class PostgresRepository extends IRepository {
  constructor(connectionString) {
    super()
    this.pool = new pg.Pool({ connectionString })
  }

  async listClients() {
    const result = await this.pool.query('SELECT * FROM clients')
    return result.rows.map(row => this.mapClientRow(row))
  }

  // ...resto de métodos
}
```

### ✅ 2.3 - Crear bootstrap.js

**Archivo:** `src/config/bootstrap.js`

```javascript
import { DIContainer } from './DIContainer.js'
import { MemoryRepository } from '../infrastructure/repositories/MemoryRepository.js'
import { PostgresRepository } from '../infrastructure/repositories/PostgresRepository.js'

export function createContainer() {
  const container = new DIContainer()

  if (process.env.USE_DB === 'true') {
    container.registerSingleton('repository', () =>
      new PostgresRepository(process.env.DATABASE_URL)
    )
  } else {
    container.registerSingleton('repository', () =>
      new MemoryRepository()
    )
  }

  return container
}
```

### ✅ 2.4 - Actualizar server.js para usar DI

**Archivo:** `src/presentation/server.js`

**Cambio:**
```javascript
// ANTES
const repo = useDb ? db : memory

// DESPUÉS
import { createContainer } from './config/bootstrap.js'
const container = createContainer()
const repo = container.get('repository')
```

**Tareas:**
- [ ] Implementar MemoryRepository
- [ ] Implementar PostgresRepository
- [ ] Crear bootstrap.js
- [ ] Actualizar server.js
- [ ] Tests deben seguir pasando sin cambios

---

## 🎯 FASE 3: Validadores (Sprint 3 - 4 días)

### ✅ 3.1 - Extraer validadores

**Archivos:**
- `src/infrastructure/validators/PeruvianValidator.js`
- `src/infrastructure/validators/GenericValidator.js`

**Tarea:** Extraer funciones `resolvePhone`, `normalizeDniData` a clases validadoras

```javascript
import { IValidator } from '../../domain/interfaces/IValidator.js'

export class PeruvianValidator extends IValidator {
  validatePhone(numero, pais) {
    if (pais !== 'PE') {
      return { ok: false, error: 'País no soportado' }
    }
    // Lógica de resolvePhone()
  }

  validateDni(dni) {
    // Lógica de validación DNI
  }

  // ... resto
}
```

### ✅ 3.2 - Registrar validadores en DI

**Actualizar:** `src/config/bootstrap.js`

```javascript
container.registerSingleton('validator', () =>
  new PeruvianValidator()  // o elegir según config
)
```

### ✅ 3.3 - Usar validadores en server.js

**Cambio:** Reemplazar funciones sueltas con validador inyectado

```javascript
// ANTES
const phone = resolvePhone(req.body)
if (!phone.ok) return res.status(400).json({ error: phone.error })

// DESPUÉS
const validator = container.get('validator')
const phone = validator.validatePhone(
  req.body.telefonoNumero,
  req.body.telefonoPais
)
if (!phone.ok) return res.status(400).json({ error: phone.error })
```

**Tareas:**
- [ ] Crear PeruvianValidator
- [ ] Crear GenericValidator
- [ ] Registrar en DIContainer
- [ ] Actualizar todos los endpoints
- [ ] Tests

---

## 🎯 FASE 4: Application Services (Sprint 4 - 1 semana)

### ✅ 4.1 - Crear ClientService

**Archivo:** `src/application/services/ClientService.js`

```javascript
export class ClientService {
  constructor(repository, validator, mapper) {
    this.repository = repository
    this.validator = validator
    this.mapper = mapper
  }

  async createClient(payload) {
    const validation = this.validator.validateClient(payload)
    if (!validation.ok) {
      throw new ValidationError(validation.errors)
    }

    const client = await this.repository.createClient(validation.data)
    return this.mapper.toDTO(client)
  }

  async getClientById(id) {
    const client = await this.repository.getClientById(id)
    if (!client) throw new NotFoundError()
    return this.mapper.toDTO(client)
  }

  async listClients() {
    const clients = await this.repository.listClients()
    return clients.map(c => this.mapper.toDTO(c))
  }

  async updateClient(id, payload) {
    const validation = this.validator.validateClient(payload)
    if (!validation.ok) {
      throw new ValidationError(validation.errors)
    }

    const client = await this.repository.updateClient(id, validation.data)
    if (!client) throw new NotFoundError()
    return this.mapper.toDTO(client)
  }

  async deleteClient(id) {
    const success = await this.repository.deleteClient(id)
    if (!success) throw new NotFoundError()
    return { success: true }
  }
}
```

### ✅ 4.2 - Crear ClientController

**Archivo:** `src/presentation/controllers/ClientController.js`

```javascript
export class ClientController {
  constructor(clientService) {
    this.clientService = clientService
  }

  async create(req, res) {
    try {
      const client = await this.clientService.createClient(req.body)
      res.status(201).json(client)
    } catch (err) {
      this.handleError(err, res)
    }
  }

  async getById(req, res) {
    try {
      const client = await this.clientService.getClientById(req.params.id)
      res.json(client)
    } catch (err) {
      this.handleError(err, res)
    }
  }

  async list(req, res) {
    try {
      const clients = await this.clientService.listClients()
      res.json(clients)
    } catch (err) {
      this.handleError(err, res)
    }
  }

  async update(req, res) {
    try {
      const client = await this.clientService.updateClient(req.params.id, req.body)
      res.json(client)
    } catch (err) {
      this.handleError(err, res)
    }
  }

  async delete(req, res) {
    try {
      await this.clientService.deleteClient(req.params.id)
      res.status(204).send()
    } catch (err) {
      this.handleError(err, res)
    }
  }

  handleError(err, res) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ errors: err.errors })
    }
    if (err.name === 'NotFoundError') {
      return res.status(404).json({ error: 'Not found' })
    }
    res.status(500).json({ error: err.message })
  }
}
```

### ✅ 4.3 - Crear ClientMapper

**Archivo:** `src/infrastructure/mappers/ClientMapper.js`

```javascript
import { IMapper } from '../../domain/interfaces/IMapper.js'

export class ClientMapper extends IMapper {
  toDomain(raw) {
    return {
      id: raw.id,
      tipo: raw.tipo,
      nombre: raw.nombre,
      documento: raw.documento,
      telefono: raw.telefono,
      email: raw.email,
      direccion: raw.direccion,
      creadoEn: raw.creado_en || raw.creadoEn
    }
  }

  toPersistence(domain) {
    return {
      id: domain.id,
      tipo: domain.tipo,
      nombre: domain.nombre,
      documento: domain.documento,
      telefono: domain.telefono,
      email: domain.email,
      direccion: domain.direccion,
      creado_en: domain.creadoEn
    }
  }

  toDTO(domain) {
    return {
      id: domain.id,
      tipo: domain.tipo,
      nombre: domain.nombre,
      documento: domain.documento,
      telefono: domain.telefono,
      email: domain.email,
      direccion: domain.direccion
    }
  }
}
```

### ✅ 4.4 - Crear rutas limpias

**Archivo:** `src/presentation/routes/clientRoutes.js`

```javascript
import { Router } from 'express'

export function createClientRoutes(container) {
  const router = Router()
  const controller = new ClientController(
    container.get('clientService')
  )

  router.get('/', (req, res) => controller.list(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.get('/:id', (req, res) => controller.getById(req, res))
  router.patch('/:id', (req, res) => controller.update(req, res))
  router.delete('/:id', (req, res) => controller.delete(req, res))

  return router
}
```

### ✅ 4.5 - Actualizar server.js para usar rutas

```javascript
import { createClientRoutes } from './routes/clientRoutes.js'

app.use('/api/clients', createClientRoutes(container))
```

### ✅ 4.6 - Repetir para otras entidades

Crear ClientService → PackageService, UserService, etc.

**Tareas:**
- [ ] ClientService + Controller + Mapper + Routes
- [ ] PackageService + Controller + Mapper + Routes
- [ ] UserService + Controller + Mapper + Routes
- [ ] BranchService + Controller + Mapper + Routes
- [ ] DistributorService + Controller + Mapper + Routes
- [ ] Actualizar server.js para usar todas las rutas
- [ ] Tests E2E sin cambios esperados

---

## 🎯 FASE 5: Tests & Optimización (Sprint 5 - 3 días)

### ✅ 5.1 - Crear tests unitarios

**Archivo:** `tests/unit/repositories.test.js`

```javascript
import { describe, it, expect } from 'vitest'
import { MemoryRepository } from '../../src/infrastructure/repositories/MemoryRepository.js'
import { PostgresRepository } from '../../src/infrastructure/repositories/PostgresRepository.js'

describe('Repository Pattern', () => {
  describe('MemoryRepository', () => {
    it('should create and retrieve a client', async () => {
      const repo = new MemoryRepository()
      const client = await repo.createClient({
        tipo: 'persona',
        nombre: 'Test',
        documento: '12345678',
        telefono: '987654321',
        email: 'test@test.com',
        direccion: 'Jr. Test'
      })
      
      expect(client.id).toBeDefined()
      
      const retrieved = await repo.getClientById(client.id)
      expect(retrieved.nombre).toBe('Test')
    })
  })

  describe('PostgresRepository', () => {
    // Los mismos tests - compatible interface!
  })
})
```

### ✅ 5.2 - Crear tests de servicios

**Archivo:** `tests/unit/services.test.js`

```javascript
import { ClientService } from '../../src/application/services/ClientService.js'
import { MemoryRepository } from '../../src/infrastructure/repositories/MemoryRepository.js'
import { PeruvianValidator } from '../../src/infrastructure/validators/PeruvianValidator.js'
import { ClientMapper } from '../../src/infrastructure/mappers/ClientMapper.js'

describe('ClientService', () => {
  it('should create client with valid data', async () => {
    const repo = new MemoryRepository()
    const validator = new PeruvianValidator()
    const mapper = new ClientMapper()
    const service = new ClientService(repo, validator, mapper)

    const client = await service.createClient({
      tipo: 'persona',
      nombre: 'Test',
      documento: '12345678',
      telefono: '987654321',
      email: 'test@test.com',
      direccion: 'Jr. Test',
      telefonoPais: 'PE'
    })

    expect(client.nombre).toBe('Test')
  })

  it('should throw error with invalid email', async () => {
    const service = new ClientService(
      new MemoryRepository(),
      new PeruvianValidator(),
      new ClientMapper()
    )

    await expect(
      service.createClient({
        tipo: 'persona',
        nombre: 'Test',
        documento: '12345678',
        telefono: '987654321',
        email: 'invalid-email',  // Error aquí
        direccion: 'Jr. Test',
        telefonoPais: 'PE'
      })
    ).rejects.toThrow('ValidationError')
  })
})
```

### ✅ 5.3 - Limpiar server.js

Deben quedar solo:
- Middleware de CORS
- Middleware de JSON
- Middleware de autenticación
- Middleware de errores globales
- Registro de rutas
- Inicialización del servidor

**Tareas:**
- [ ] Escribir tests unitarios
- [ ] Escribir tests de servicios
- [ ] Escribir tests E2E
- [ ] Verificar cobertura

---

## 📊 Checklist de Implementación

### Fase 0 (Preparación)
- [ ] Estructura de carpetas creada
- [ ] Archivos movidos sin cambios
- [ ] Imports actualizados
- [ ] Tests pasando

### Fase 1 (Interfaces Base)
- [ ] IRepository creada
- [ ] IValidator creada
- [ ] IMapper creada
- [ ] DIContainer implementado
- [ ] Tests básicos para DIContainer

### Fase 2 (Repositorios)
- [ ] MemoryRepository implementado
- [ ] PostgresRepository implementado
- [ ] bootstrap.js creado y funcionando
- [ ] server.js usa DI Container
- [ ] Tests de API sin cambios

### Fase 3 (Validadores)
- [ ] PeruvianValidator implementado
- [ ] GenericValidator implementado
- [ ] Validadores registrados en DI
- [ ] Endpoints usan validadores
- [ ] Tests de API sin cambios

### Fase 4 (Services)
- [ ] ClientService implementado
- [ ] ClientController implementado
- [ ] ClientMapper implementado
- [ ] Rutas de clientes funcionando
- [ ] Repetir para Packages, Users, Branches, Distributors

### Fase 5 (Tests)
- [ ] Tests unitarios de repos
- [ ] Tests de servicios
- [ ] Tests E2E
- [ ] Cobertura de 80%+

---

## ⚠️ Cosas a Considerar

### Compatibilidad hacia Atrás
- Mantener API HTTP idéntica durante refactorización
- Los tests E2E existentes deben pasar sin modificación
- Usar feature flags si es necesario

### Migrando a la Nueva Arquitectura
- No intentar hacer todo a la vez
- Completar una entidad (Clients) antes de seguir con la siguiente
- Realizar merges pequeños y frecuentes

### Manejo de Errores
- Centralizar excepciones de dominio
- Mapear excepciones a códigos HTTP en controller
- Loguear errores internos

### Testing
- Tests unitarios para cada capa
- Tests de integración para servicios
- Tests E2E para API HTTP

---

## 📈 Beneficios Obtenidos

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Líneas server.js** | 872 | ~200 (+ controllers en otros archivos) |
| **Testabilidad** | Difícil | Fácil (mocks via interfaces) |
| **Reusabilidad** | Acoplada a HTTP | Independiente |
| **Nuevas entidades** | Repetir todo | Solo crear Service + Controller |
| **Cambiar DB** | Modificar server.js | Solo cambiar bootstrap.js |
| **Documentación** | Implícita | Explícita (interfaces) |

---

## 🚀 Próximos Pasos Después

1. **Event-Driven Architecture** (v2.1)
   - EventBus para cambios de paquetes
   - Listeners para notificaciones

2. **Query Objects** (v2.2)
   - Búsquedas complejas sin parámetros
   - Paginación y sorting

3. **Specification Pattern** (v2.3)
   - Reglas de negocio reutilizables

4. **Caching** (v2.3)
   - Redis para datos frecuentes

5. **Audit Trail** (v2.4)
   - Historial de cambios
   - Quién cambió qué y cuándo
