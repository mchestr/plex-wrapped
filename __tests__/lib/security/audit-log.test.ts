import { logAuditEvent, AuditEventType, type AuditLogEntry } from '@/lib/security/audit-log'

describe('AuditEventType', () => {
  it('should have all expected event types', () => {
    expect(AuditEventType.ADMIN_PRIVILEGE_GRANTED).toBe('ADMIN_PRIVILEGE_GRANTED')
    expect(AuditEventType.ADMIN_PRIVILEGE_REVOKED).toBe('ADMIN_PRIVILEGE_REVOKED')
    expect(AuditEventType.ADMIN_PRIVILEGE_CHANGED).toBe('ADMIN_PRIVILEGE_CHANGED')
    expect(AuditEventType.CONFIG_CHANGED).toBe('CONFIG_CHANGED')
    expect(AuditEventType.USER_CREATED).toBe('USER_CREATED')
    expect(AuditEventType.USER_UPDATED).toBe('USER_UPDATED')
  })
})

describe('logAuditEvent', () => {
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('should log audit event with minimal data', () => {
    logAuditEvent(AuditEventType.USER_CREATED, 'user-1')

    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    const callArg = consoleLogSpy.mock.calls[0][1]
    const entry: AuditLogEntry = JSON.parse(callArg)

    expect(entry.type).toBe(AuditEventType.USER_CREATED)
    expect(entry.userId).toBe('user-1')
    expect(entry.targetUserId).toBeUndefined()
    expect(entry.details).toBeUndefined()
    expect(entry.timestamp).toBeDefined()
    // JSON.parse converts Date to string, so check it's a valid ISO date string
    expect(typeof entry.timestamp).toBe('string')
    expect(() => new Date(entry.timestamp)).not.toThrow()
  })

  it('should log audit event with details', () => {
    const details = {
      plexUserId: 'plex-123',
      isAdmin: true,
    }

    logAuditEvent(AuditEventType.USER_CREATED, 'user-1', details)

    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    const callArg = consoleLogSpy.mock.calls[0][1]
    const entry: AuditLogEntry = JSON.parse(callArg)

    expect(entry.type).toBe(AuditEventType.USER_CREATED)
    expect(entry.userId).toBe('user-1')
    expect(entry.details).toEqual(details)
    expect(entry.timestamp).toBeDefined()
    // JSON.parse converts Date to string
    expect(typeof entry.timestamp).toBe('string')
  })

  it('should extract targetUserId from details', () => {
    const details = {
      targetUserId: 'user-2',
      someOtherField: 'value',
    }

    logAuditEvent(AuditEventType.ADMIN_PRIVILEGE_GRANTED, 'user-1', details)

    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    const callArg = consoleLogSpy.mock.calls[0][1]
    const entry: AuditLogEntry = JSON.parse(callArg)

    expect(entry.targetUserId).toBe('user-2')
    expect(entry.details).toEqual({ someOtherField: 'value' })
    expect(entry.details?.targetUserId).toBeUndefined()
  })

  it('should handle all audit event types', () => {
    const eventTypes = Object.values(AuditEventType)

    eventTypes.forEach((eventType) => {
      logAuditEvent(eventType, 'user-1')
    })

    expect(consoleLogSpy).toHaveBeenCalledTimes(eventTypes.length)
  })

  it('should include timestamp in log entry', () => {
    const beforeTime = new Date()
    logAuditEvent(AuditEventType.USER_CREATED, 'user-1')
    const afterTime = new Date()

    const callArg = consoleLogSpy.mock.calls[0][1]
    const entry: AuditLogEntry = JSON.parse(callArg)
    // JSON.parse converts Date to string, so parse it back to Date
    const timestamp = new Date(entry.timestamp as unknown as string)

    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime())
  })

  it('should format log with [AUDIT] prefix', () => {
    logAuditEvent(AuditEventType.USER_CREATED, 'user-1')

    expect(consoleLogSpy).toHaveBeenCalledWith('[AUDIT]', expect.any(String))
  })
})

