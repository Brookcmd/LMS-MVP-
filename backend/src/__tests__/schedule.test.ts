import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing schedule-service
vi.mock("../lib/prisma", () => ({
  prisma: {
    scheduleSlot: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    parentStudent: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma";
import * as scheduleService from "../services/schedule-service";

describe("schedule-service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createSlot (Admin only)", () => {
    it("throws badRequest if startTime >= endTime", async () => {
      await expect(
        scheduleService.createSlot(1, 10, {
          classId: 2,
          subjectId: 3,
          teacherId: 4,
          dayOfWeek: "monday",
          startTime: "10:00",
          endTime: "09:00",
        })
      ).rejects.toThrow("startTime must be before endTime");
    });

    it("throws notFound if class does not belong to school", async () => {
      vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

      await expect(
        scheduleService.createSlot(1, 10, {
          classId: 2,
          subjectId: 3,
          teacherId: 4,
          dayOfWeek: "monday",
          startTime: "09:00",
          endTime: "10:00",
        })
      ).rejects.toThrow("Class not found");
    });

    it("creates schedule slot successfully for valid admin call", async () => {
      vi.mocked(prisma.class.findFirst).mockResolvedValue({ id: 2, schoolId: 10 } as any);
      vi.mocked(prisma.scheduleSlot.create).mockResolvedValue({
        id: 100,
        classId: 2,
        subjectId: 3,
        teacherId: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      } as any);

      const res = await scheduleService.createSlot(1, 10, {
        classId: 2,
        subjectId: 3,
        teacherId: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      expect(res.id).toBe(100);
      expect(prisma.scheduleSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            classId: 2,
            subjectId: 3,
            teacherId: 4,
            dayOfWeek: "monday",
          }),
        })
      );
    });
  });

  describe("updateSlot", () => {
    it("throws notFound if slot does not exist for school", async () => {
      vi.mocked(prisma.scheduleSlot.findFirst).mockResolvedValue(null);

      await expect(
        scheduleService.updateSlot(100, 1, 10, { startTime: "08:00" })
      ).rejects.toThrow("Schedule slot not found");
    });

    it("updates slot when found", async () => {
      vi.mocked(prisma.scheduleSlot.findFirst).mockResolvedValue({
        id: 100,
        classId: 2,
        subjectId: 3,
        teacherId: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "10:00",
        room: null,
      } as any);
      vi.mocked(prisma.scheduleSlot.update).mockResolvedValue({
        id: 100,
        room: "Room 202",
      } as any);

      const res = await scheduleService.updateSlot(100, 1, 10, { room: "Room 202" });
      expect(res.id).toBe(100);
      expect(prisma.scheduleSlot.update).toHaveBeenCalled();
    });
  });

  describe("deleteSlot", () => {
    it("throws notFound if slot does not exist", async () => {
      vi.mocked(prisma.scheduleSlot.findFirst).mockResolvedValue(null);

      await expect(
        scheduleService.deleteSlot(100, 1, 10)
      ).rejects.toThrow("Schedule slot not found");
    });

    it("deletes slot successfully", async () => {
      vi.mocked(prisma.scheduleSlot.findFirst).mockResolvedValue({ id: 100 } as any);
      vi.mocked(prisma.scheduleSlot.delete).mockResolvedValue({ id: 100 } as any);

      const res = await scheduleService.deleteSlot(100, 1, 10);
      expect(res.success).toBe(true);
      expect(prisma.scheduleSlot.delete).toHaveBeenCalledWith({ where: { id: 100 } });
    });
  });

  describe("getClassSchedule", () => {
    it("throws notFound if class is not found in school", async () => {
      vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

      await expect(scheduleService.getClassSchedule(99, 10)).rejects.toThrow(
        "Class not found"
      );
    });

    it("returns sorted slots for class", async () => {
      vi.mocked(prisma.class.findFirst).mockResolvedValue({ id: 2, schoolId: 10 } as any);
      vi.mocked(prisma.scheduleSlot.findMany).mockResolvedValue([
        { id: 2, dayOfWeek: "tuesday", startTime: "08:00" },
        { id: 1, dayOfWeek: "monday", startTime: "09:00" },
      ] as any);

      const res = await scheduleService.getClassSchedule(2, 10);
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe(1); // Monday before Tuesday
    });
  });
});
