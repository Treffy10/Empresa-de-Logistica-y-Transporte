# 💻 EJEMPLOS DE IMPLEMENTACIÓN - Interfaces y Patrones

## 1. EJEMPLO: Interface IRepository

### Paso 1: Definir la Interfaz

```javascript
// src/domain/interfaces/IRepository.js

export class IRepository {
  // CLIENTS
  async listClients() { throw new Error('Not implemented') }
  async createClient(data) { throw new Error('Not implemented') }
  async getClientById(id) { throw new Error('Not implemented') }
  async updateClient(id, data) { throw new Error('Not implemented') }
  async deleteClient(id) { throw new Error('Not implemented') }

  // DISTRIBUTORS
  async listDistributors() { throw new Error('Not implemented') }
  async createDistributor(data) { throw new Error('Not implemented') }
  async getDistributorById(id) { throw new Error('Not implemented') }
  async updateDistributor(id, data) { throw new Error('Not implemented') }
  async deleteDistributor(id) { throw new Error('Not implemented') }

  // BRANCHES
  async listBranches() { throw new Error('Not implemented') }
  async createBranch(data) { throw new Error('Not implemented') }
  async getBranchById(id) { throw new Error('Not implemented') }
  async updateBranch(id, data) { throw new Error('Not implemented') }
  async deleteBranch(id) { throw new Error('Not implemented') }

  // PACKAGES
  async listPackages(status) { throw new Error('Not implemented') }
  async createPackage(data) { throw new Error('Not implemented') }
  async getPackageById(id) { throw new Error('Not implemented') }
  async getPackageDetailsById(id) { throw new Error('Not implemented') }
  async updatePackageStatus(id, status) { throw new Error('Not implemented') }
  async listPackagesDetailed(status) { throw new Error('Not implemented') }
  async listPackagesByCourier(courierId) { throw new Error('Not implemented') }

  // USERS
  async listUsers() { throw new Error('Not implemented') }
  async createUser(data) { throw new Error('Not implemented') }
  async getUserById(id) { throw new Error('Not implemented') }
  async getUserByEmail(email) { throw new Error('Not implemented') }
  async updateUser(id, data) { throw new Error('Not implemented') }
  async deleteUser(id) { throw new Error('Not implemented') }

  // ROLES
  async listRoles() { throw new Error('Not implemented') }
  async getRoleById(id) { throw new Error('Not implemented') }
  async createRole(name) { throw new Error('Not implemented') }

  // GENERAL
  async getHealth() { throw new Error('Not implemented') }
  async close() { throw new Error('Not implemented') }
}
```

### Paso 2: Implementar con Memory

```javascript
// src/infrastructure/repositories/MemoryRepository.js
import { IRepository } from '../../domain/interfaces/IRepository.js'
import { v4 as uuid } from 'uuid'

export class MemoryRepository extends IRepository {
  constructor() {
    super()
    this.clients = []
    this.distributors = []
    this.branches = []
    this.packages = []
    this.users = []
    this.roles = []
    this.initializeData()
  }

  initializeData() {
    // Copiar datos iniciales de storage.js aquí
    this.clients = [
      {
        id: 'c1',
        tipo: 'persona',
        nombre: 'Carlos Rojas',
        documento: 'DNI 12345678',
        telefono: '987654321',
        email: 'carlos@correo.com',
        direccion: 'Jr. Perú 123'
      }
      // ... más clientes
    ]
  }

  async listClients() {
    return this.clients
  }

  async createClient(data) {
    const client = { id: uuid(), ...data }
    this.clients.push(client)
    return client
  }

  async getClientById(id) {
    return this.clients.find(c => c.id === id) || null
  }

  async updateClient(id, data) {
    const index = this.clients.findIndex(c => c.id === id)
    if (index === -1) return null
    this.clients[index] = { ...this.clients[index], ...data }
    return this.clients[index]
  }

  async deleteClient(id) {
    const index = this.clients.findIndex(c => c.id === id)
    if (index === -1) return false
    this.clients.splice(index, 1)
    return true
  }

  // ... implementar resto de métodos
}
```

### Paso 3: Implementar con PostgreSQL

```javascript
// src/infrastructure/repositories/PostgresRepository.js
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

  async createClient(data) {
    const { tipo, nombre, documento, telefono, email, direccion } = data
    const result = await this.pool.query(
      `INSERT INTO clients (tipo, nombre, documento, telefono, email, direccion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tipo, nombre, documento, telefono, email, direccion]
    )
    return this.mapClientRow(result.rows[0])
  }

  async getClientById(id) {
    const result = await this.pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    )
    return result.rows[0] ? this.mapClientRow(result.rows[0]) : null
  }

  mapClientRow(row) {
    return {
      id: row.id,
      tipo: row.tipo,
      nombre: row.nombre,
      documento: row.documento,
      telefono: row.telefono,
      email: row.email,
      direccion: row.direccion
    }
  }

  // ... implementar resto de métodos
}
```

### Paso 4: Usar en server.js

```javascript
// src/presentation/server.js
import express from 'express'
import { MemoryRepository } from './infrastructure/repositories/MemoryRepository.js'
import { PostgresRepository } from './infrastructure/repositories/PostgresRepository.js'

const app = express()
const useDb = process.env.USE_DB === 'true'

// Seleccionar implementación
let repo
if (useDb) {
  repo = new PostgresRepository(process.env.DATABASE_URL)
} else {
  repo = new MemoryRepository()
}

// Ahora los endpoints usan la interfaz, no importa la implementación
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await repo.listClients()
    res.json(clients)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/clients', async (req, res) => {
  try {
    const client = await repo.createClient(req.body)
    res.status(201).json(client)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})
```

---

## 2. EJEMPLO: Interface IValidator

```javascript
// src/domain/interfaces/IValidator.js

export class IValidator {
  validatePhone(numero, pais) { throw new Error('Not implemented') }
  validateDni(dni) { throw new Error('Not implemented') }
  validateEmail(email) { throw new Error('Not implemented') }
  validateClient(payload) { throw new Error('Not implemented') }
  validatePackage(payload) { throw new Error('Not implemented') }
  validateBranch(payload) { throw new Error('Not implemented') }
}

// Retorna: { ok: boolean, error?: string, data?: any }
```

### Implementación Peruana

```javascript
// src/infrastructure/validators/PeruvianValidator.js
import { IValidator } from '../../domain/interfaces/IValidator.js'

export class PeruvianValidator extends IValidator {
  validatePhone(numero, pais) {
    if (pais !== 'PE') {
      return { ok: false, error: 'País no soportado' }
    }
    const cleaned = numero.replace(/\D/g, '')
    
    // Validar que sea 9 dígitos
    if (cleaned.length !== 9) {
      return {
        ok: false,
        error: 'Teléfono peruano debe tener 9 dígitos'
      }
    }
    
    // Validar que sea móvil o fijo
    const firstDigit = parseInt(cleaned[0])
    if (![2, 3, 4, 5, 6, 7, 8, 9].includes(firstDigit)) {
      return {
        ok: false,
        error: 'Número de teléfono inválido'
      }
    }
    
    return {
      ok: true,
      data: {
        country: 'PE',
        local: cleaned,
        e164: `+51${cleaned}`
      }
    }
  }

  validateDni(dni) {
    const cleaned = dni.replace(/\D/g, '')
    
    if (cleaned.length !== 8) {
      return { ok: false, error: 'DNI debe tener 8 dígitos' }
    }
    
    // Validar dígito verificador (opcional)
    if (!this.validateDniChecksum(cleaned)) {
      return { ok: false, error: 'DNI inválido' }
    }
    
    return { ok: true, data: { dni: cleaned } }
  }

  validateDniChecksum(dni) {
    // Algoritmo de validación DNI peruano
    const multipliers = [3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 8; i++) {
      sum += parseInt(dni[i]) * multipliers[i]
    }
    const check = 11 - (sum % 11)
    // Simplificado, ver algoritmo completo en RENIEC
    return true
  }

  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email)) {
      return { ok: false, error: 'Email inválido' }
    }
    return { ok: true, data: { email } }
  }

  validateClient(payload) {
    const errors = []
    
    // Validar campos requeridos
    if (!payload.nombre?.trim()) errors.push('Nombre requerido')
    if (!payload.documento?.trim()) errors.push('Documento requerido')
    if (!payload.email?.trim()) errors.push('Email requerido')
    if (!payload.telefono?.trim()) errors.push('Teléfono requerido')
    if (!payload.direccion?.trim()) errors.push('Dirección requerida')
    
    // Validar email
    const emailValid = this.validateEmail(payload.email)
    if (!emailValid.ok) errors.push(emailValid.error)
    
    // Validar teléfono
    const phoneValid = this.validatePhone(payload.telefono, payload.telefonoPais || 'PE')
    if (!phoneValid.ok) errors.push(phoneValid.error)
    
    // Validar DNI o RUC
    if (payload.tipo === 'persona') {
      const dniValid = this.validateDni(payload.documento)
      if (!dniValid.ok) errors.push(`DNI: ${dniValid.error}`)
    }
    
    if (errors.length > 0) {
      return { ok: false, errors }
    }
    
    return { ok: true, data: payload }
  }
}
```

### Implementación Genérica

```javascript
// src/infrastructure/validators/GenericValidator.js
export class GenericValidator extends IValidator {
  validatePhone(numero, pais) {
    if (!numero?.trim()) {
      return { ok: false, error: 'Teléfono requerido' }
    }
    return { ok: true, data: { phone: numero } }
  }

  validateDni(dni) {
    if (!dni?.trim()) {
      return { ok: false, error: 'Documento requerido' }
    }
    return { ok: true, data: { document: dni } }
  }

  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email)) {
      return { ok: false, error: 'Email inválido' }
    }
    return { ok: true, data: { email } }
  }

  validateClient(payload) {
    const requiredFields = ['nombre', 'documento', 'email', 'telefono', 'direccion']
    const errors = []
    
    for (const field of requiredFields) {
      if (!payload[field]?.toString().trim()) {
        errors.push(`${field} requerido`)
      }
    }
    
    if (errors.length > 0) {
      return { ok: false, errors }
    }
    return { ok: true, data: payload }
  }
}
```

### Uso en server.js

```javascript
// src/presentation/server.js
import { PeruvianValidator } from './infrastructure/validators/PeruvianValidator.js'
import { GenericValidator } from './infrastructure/validators/GenericValidator.js'

// Seleccionar validator según país (o detectarlo)
const validator = process.env.DEFAULT_COUNTRY === 'PE' 
  ? new PeruvianValidator() 
  : new GenericValidator()

app.post('/api/clients', async (req, res) => {
  const validation = validator.validateClient(req.body)
  
  if (!validation.ok) {
    return res.status(400).json({ errors: validation.errors })
  }
  
  try {
    const client = await repo.createClient(validation.data)
    res.status(201).json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

---

## 3. EJEMPLO: Interface IMapper

```javascript
// src/domain/interfaces/IMapper.js

export class IMapper {
  // Convertir desde BD/DTO a Entity (dominio)
  toDomain(raw) { throw new Error('Not implemented') }
  
  // Convertir desde Entity (dominio) a BD/DTO
  toPersistence(domain) { throw new Error('Not implemented') }
  
  // Convertir desde Entity a DTO para respuesta HTTP
  toDTO(domain) { throw new Error('Not implemented') }
}
```

### Implementación para Client

```javascript
// src/infrastructure/mappers/ClientMapper.js
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
      creadoEn: raw.creado_en,
      updatedAt: raw.updated_at
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
      creado_en: domain.creadoEn,
      updated_at: domain.updatedAt
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

### Implementación para Package

```javascript
// src/infrastructure/mappers/PackageMapper.js
export class PackageMapper extends IMapper {
  toDomain(raw) {
    return {
      id: raw.id,
      codigoSeguimiento: raw.codigo_seguimiento,
      tipoEnvio: raw.tipo_envio || 'distribuidora_cliente',
      remitenteId: raw.remitente_id,
      remitenteClienteId: raw.remitente_cliente_id,
      destinatarioId: raw.destinatario_id,
      operadorId: raw.operador_id,
      repartidorId: raw.repartidor_id,
      sucursalOrigenId: raw.sucursal_origen_id,
      sucursalDestinoId: raw.sucursal_destino_id,
      destinoTexto: raw.destino_texto || '',
      descripcion: raw.descripcion,
      estadoActual: raw.estado_actual,
      reprogramacionFecha: raw.reprogramacion_fecha,
      creadoEn: raw.creado_en,
      historial: raw.historial || []
    }
  }

  toPersistence(domain) {
    return {
      id: domain.id,
      codigo_seguimiento: domain.codigoSeguimiento,
      tipo_envio: domain.tipoEnvio,
      remitente_id: domain.remitenteId,
      remitente_cliente_id: domain.remitenteClienteId,
      destinatario_id: domain.destinatarioId,
      operador_id: domain.operadorId,
      repartidor_id: domain.repartidorId,
      sucursal_origen_id: domain.sucursalOrigenId,
      sucursal_destino_id: domain.sucursalDestinoId,
      destino_texto: domain.destinoTexto,
      descripcion: domain.descripcion,
      estado_actual: domain.estadoActual,
      reprogramacion_fecha: domain.reprogramacionFecha,
      creado_en: domain.creadoEn,
      historial: domain.historial
    }
  }

  toDTO(domain) {
    return {
      id: domain.id,
      codigoSeguimiento: domain.codigoSeguimiento,
      estadoActual: domain.estadoActual,
      destinoTexto: domain.destinoTexto,
      descripcion: domain.descripcion,
      creadoEn: domain.creadoEn
    }
  }
}
```

---

## 4. EJEMPLO: Dependency Injection Container

```javascript
// src/config/DIContainer.js

export class DIContainer {
  constructor() {
    this.services = new Map()
    this.singletons = new Map()
  }

  // Registrar un servicio (se crea nueva instancia cada vez)
  register(name, factory) {
    this.services.set(name, { factory, singleton: false })
  }

  // Registrar un singleton (misma instancia siempre)
  registerSingleton(name, factory) {
    this.services.set(name, { factory, singleton: true })
  }

  // Obtener instancia de un servicio
  get(name) {
    const service = this.services.get(name)
    
    if (!service) {
      throw new Error(`Service "${name}" not found in container`)
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this))
      }
      return this.singletons.get(name)
    }

    return service.factory(this)
  }

  // Verificar si existe un servicio
  has(name) {
    return this.services.has(name)
  }
}
```

### Uso del Container

```javascript
// src/config/bootstrap.js
import { DIContainer } from './DIContainer.js'
import { MemoryRepository } from '../infrastructure/repositories/MemoryRepository.js'
import { PostgresRepository } from '../infrastructure/repositories/PostgresRepository.js'
import { PeruvianValidator } from '../infrastructure/validators/PeruvianValidator.js'
import { ClientMapper } from '../infrastructure/mappers/ClientMapper.js'
import { PackageMapper } from '../infrastructure/mappers/PackageMapper.js'

export function createContainer() {
  const container = new DIContainer()

  // Registrar Repository
  if (process.env.USE_DB === 'true') {
    container.registerSingleton('repository', (c) => 
      new PostgresRepository(process.env.DATABASE_URL)
    )
  } else {
    container.registerSingleton('repository', (c) => 
      new MemoryRepository()
    )
  }

  // Registrar Validators
  container.registerSingleton('validator', (c) =>
    new PeruvianValidator()  // o elegir según config
  )

  // Registrar Mappers
  container.register('clientMapper', (c) => new ClientMapper())
  container.register('packageMapper', (c) => new PackageMapper())

  // Registrar Servicios de Aplicación
  container.registerSingleton('clientService', (c) => 
    new ClientService(
      c.get('repository'),
      c.get('validator'),
      c.get('clientMapper')
    )
  )

  container.registerSingleton('packageService', (c) =>
    new PackageService(
      c.get('repository'),
      c.get('validator'),
      c.get('packageMapper')
    )
  )

  return container
}

// En server.js
import { createContainer } from './config/bootstrap.js'

const container = createContainer()
const repo = container.get('repository')
const validator = container.get('validator')
const clientService = container.get('clientService')
```

---

## 5. EJEMPLO: Servicio de Aplicación (Application Service)

```javascript
// src/application/services/ClientService.js

export class ClientService {
  constructor(repository, validator, mapper) {
    this.repository = repository
    this.validator = validator
    this.mapper = mapper
  }

  async createClient(payload) {
    // 1. Validar
    const validation = this.validator.validateClient(payload)
    if (!validation.ok) {
      throw new ValidationError(validation.errors)
    }

    // 2. Mapear a dominio
    const clientData = validation.data

    // 3. Persistir
    const created = await this.repository.createClient(clientData)

    // 4. Retornar como DTO
    return this.mapper.toDTO(created)
  }

  async getClientById(id) {
    const client = await this.repository.getClientById(id)
    if (!client) {
      throw new NotFoundError(`Client ${id} not found`)
    }
    return this.mapper.toDTO(client)
  }

  async listClients(filters = {}) {
    const clients = await this.repository.listClients()
    
    // Filtrar según necesidad
    let filtered = clients
    if (filters.tipo) {
      filtered = filtered.filter(c => c.tipo === filters.tipo)
    }

    return filtered.map(c => this.mapper.toDTO(c))
  }

  async updateClient(id, payload) {
    const validation = this.validator.validateClient(payload)
    if (!validation.ok) {
      throw new ValidationError(validation.errors)
    }

    const updated = await this.repository.updateClient(id, validation.data)
    if (!updated) {
      throw new NotFoundError(`Client ${id} not found`)
    }

    return this.mapper.toDTO(updated)
  }

  async deleteClient(id) {
    const success = await this.repository.deleteClient(id)
    if (!success) {
      throw new NotFoundError(`Client ${id} not found`)
    }
    return { success: true }
  }
}

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed')
    this.errors = errors
    this.name = 'ValidationError'
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
  }
}
```

### Usar en controllers

```javascript
// src/presentation/controllers/ClientController.js

export class ClientController {
  constructor(clientService) {
    this.clientService = clientService
  }

  async create(req, res) {
    try {
      const client = await this.clientService.createClient(req.body)
      res.status(201).json(client)
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ errors: err.errors })
      }
      res.status(500).json({ error: err.message })
    }
  }

  async getById(req, res) {
    try {
      const client = await this.clientService.getClientById(req.params.id)
      res.json(client)
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return res.status(404).json({ error: err.message })
      }
      res.status(500).json({ error: err.message })
    }
  }

  async list(req, res) {
    try {
      const clients = await this.clientService.listClients(req.query)
      res.json(clients)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  async update(req, res) {
    try {
      const client = await this.clientService.updateClient(req.params.id, req.body)
      res.json(client)
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ errors: err.errors })
      }
      if (err.name === 'NotFoundError') {
        return res.status(404).json({ error: err.message })
      }
      res.status(500).json({ error: err.message })
    }
  }

  async delete(req, res) {
    try {
      await this.clientService.deleteClient(req.params.id)
      res.status(204).send()
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return res.status(404).json({ error: err.message })
      }
      res.status(500).json({ error: err.message })
    }
  }
}
```

### Rutas simplificadas

```javascript
// src/presentation/routes/clientRoutes.js
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

---

## 📊 Comparación: Antes vs Después

### ANTES (Estado Actual)
```javascript
// server.js - 872 líneas
app.post('/api/clients', async (req, res) => {
  const { tipo, nombre, documento, email, direccion } = req.body
  
  if (!tipo || !nombre || !documento || !email || !direccion) {
    return res.status(400).json({ error: '...' })
  }
  
  const phone = resolvePhone(req.body)
  if (!phone.ok) return res.status(400).json({ error: phone.error })
  
  const client = await call(repo.createClient, {
    tipo, nombre, documento, 
    telefono: phone.e164, 
    email, direccion
  })
  
  res.status(201).json(client)
})

// Problemas:
// ❌ Lógica de validación mezclada con rutas
// ❌ Acoplado a formato de respuesta específico
// ❌ Difícil de testear
// ❌ Código duplicado en múltiples endpoints
```

### DESPUÉS (Con Interfaces)
```javascript
// Rutas limpias
router.post('/', (req, res) => controller.create(req, res))

// Controlador restringido a HTTP
async create(req, res) {
  try {
    const client = await this.service.createClient(req.body)
    res.status(201).json(client)
  } catch (err) {
    res.status(400).json({ errors: err.errors })
  }
}

// Servicio con lógica pura
async createClient(payload) {
  const validation = this.validator.validateClient(payload)
  if (!validation.ok) throw new ValidationError(validation.errors)
  
  return await this.repository.createClient(validation.data)
}

// Beneficios:
// ✅ Separación de responsabilidades
// ✅ Código testeable
// ✅ Reutilizable desde GraphQL, gRPC, etc.
// ✅ Fácil mantener
// ✅ Inyección de dependencias
```
