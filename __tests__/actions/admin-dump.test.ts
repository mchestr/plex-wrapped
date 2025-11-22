import { exportDatabaseDump, importDatabaseDump } from "@/actions/admin"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    setup: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    plexServer: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    tautulli: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    overseerr: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    lLMProvider: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    plexWrapped: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    wrappedShareVisit: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    lLMUsage: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    config: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    promptTemplate: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}))

jest.mock("@/lib/admin", () => ({
  requireAdmin: jest.fn(),
}))

describe("Database Dump Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("exportDatabaseDump", () => {
    it("should export all data successfully", async () => {
      // Mock data
      const mockUsers = [{ id: "user1", name: "Test User" }]
      const mockConfigs = [{ id: "config", llmDisabled: false }]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
      ;(prisma.config.findMany as jest.Mock).mockResolvedValue(mockConfigs)
      // Mock other findMany calls to return empty arrays
      ;(prisma.setup.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.plexServer.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.tautulli.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.overseerr.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.lLMProvider.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.plexWrapped.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.wrappedShareVisit.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.lLMUsage.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.promptTemplate.findMany as jest.Mock).mockResolvedValue([])

      const result = await exportDatabaseDump()

      expect(requireAdmin).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.version).toBe(1)
      expect(result.data.data.users).toEqual(mockUsers)
      expect(result.data.data.configs).toEqual(mockConfigs)
    })

    it("should handle errors during export", async () => {
      ;(prisma.user.findMany as jest.Mock).mockRejectedValue(new Error("Database error"))

      const result = await exportDatabaseDump()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to export database dump")
    })
  })

  describe("importDatabaseDump", () => {
    const validDump = {
      version: 1,
      timestamp: "2023-01-01T00:00:00.000Z",
      data: {
        users: [{ id: "user1", name: "Test User" }],
        configs: [{ id: "config", llmDisabled: false }],
      },
    }

    it("should import data successfully", async () => {
      const result = await importDatabaseDump(validDump)

      expect(requireAdmin).toHaveBeenCalled()
      expect(prisma.$transaction).toHaveBeenCalled()

      // Verify delete order (reverse dependency)
      expect(prisma.wrappedShareVisit.deleteMany).toHaveBeenCalled()
      expect(prisma.lLMUsage.deleteMany).toHaveBeenCalled()
      expect(prisma.plexWrapped.deleteMany).toHaveBeenCalled()
      expect(prisma.promptTemplate.deleteMany).toHaveBeenCalled()
      expect(prisma.config.deleteMany).toHaveBeenCalled()
      expect(prisma.lLMProvider.deleteMany).toHaveBeenCalled()
      expect(prisma.overseerr.deleteMany).toHaveBeenCalled()
      expect(prisma.tautulli.deleteMany).toHaveBeenCalled()
      expect(prisma.plexServer.deleteMany).toHaveBeenCalled()
      expect(prisma.setup.deleteMany).toHaveBeenCalled()
      expect(prisma.user.deleteMany).toHaveBeenCalled()

      // Verify create order (dependency)
      expect(prisma.user.createMany).toHaveBeenCalledWith({ data: validDump.data.users })
      expect(prisma.config.createMany).toHaveBeenCalledWith({ data: validDump.data.configs })

      expect(result.success).toBe(true)
    })

    it("should reject invalid dump format", async () => {
      const invalidDump = { version: 2, data: {} }
      const result = await importDatabaseDump(invalidDump)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Invalid dump format")
    })

    it("should handle errors during import", async () => {
      ;(prisma.$transaction as jest.Mock).mockRejectedValue(new Error("Transaction failed"))

      const result = await importDatabaseDump(validDump)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Transaction failed")
    })
  })
})
