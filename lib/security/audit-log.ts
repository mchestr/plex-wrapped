/**
 * Audit logging for security-sensitive operations
 * Logs admin privilege changes and other critical security events
 */

export enum AuditEventType {
  ADMIN_PRIVILEGE_GRANTED = "ADMIN_PRIVILEGE_GRANTED",
  ADMIN_PRIVILEGE_REVOKED = "ADMIN_PRIVILEGE_REVOKED",
  ADMIN_PRIVILEGE_CHANGED = "ADMIN_PRIVILEGE_CHANGED",
  CONFIG_CHANGED = "CONFIG_CHANGED",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
}

export interface AuditLogEntry {
  type: AuditEventType
  userId: string
  targetUserId?: string
  details?: Record<string, unknown>
  timestamp: Date
}

/**
 * Log an audit event
 * In production, this should write to a secure audit log system
 */
export function logAuditEvent(
  type: AuditEventType,
  userId: string,
  details?: {
    targetUserId?: string
    [key: string]: unknown
  }
) {
  const entry: AuditLogEntry = {
    type,
    userId,
    targetUserId: details?.targetUserId,
    details: details ? { ...details, targetUserId: undefined } : undefined,
    timestamp: new Date(),
  }

  // Log to console (in production, use a proper audit log system)
  console.log("[AUDIT]", JSON.stringify(entry))

  // TODO: In production, write to:
  // - Database audit log table
  // - External audit log service (e.g., CloudWatch, Datadog)
  // - Immutable log storage
}

