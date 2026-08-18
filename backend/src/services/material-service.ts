import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface CreateMaterialInput {
  title: string;
  description?: string;
  classId: number;
  subjectId: number;
  teacherId: number;
  schoolId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
}

/**
 * Validate that a teacher is assigned to the class
 */
async function validateTeacherForClass(teacherId: number, classId: number, schoolId: number): Promise<void> {
  const cls = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });

  if (!cls) {
    throw appErrors.notFound("Class not found in this institution", "CLASS_NOT_FOUND");
  }

  // Check if teacher is assigned via ClassTeacher or Homeroom or TeachingAssignment
  const [classTeacher, teachingAssignment] = await Promise.all([
    prisma.classTeacher.findFirst({
      where: { classId, teacherId },
    }),
    prisma.teachingAssignment.findFirst({
      where: { classId, teacherId },
    }),
  ]);

  if (!classTeacher && !teachingAssignment && cls.homeroomTeacherId !== teacherId) {
    throw appErrors.forbidden("You are not assigned to teach this class", "NOT_ASSIGNED_TO_CLASS");
  }
}

/**
 * Create course material
 */
export async function createMaterial(input: CreateMaterialInput) {
  if (!input.title || input.title.trim().length === 0) {
    throw appErrors.badRequest("Title is required", "INVALID_TITLE");
  }

  await validateTeacherForClass(input.teacherId, input.classId, input.schoolId);

  // Validate subject exists
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, schoolId: input.schoolId },
  });

  if (!subject) {
    throw appErrors.notFound("Subject not found in this institution", "SUBJECT_NOT_FOUND");
  }

  const material = await prisma.material.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      classId: input.classId,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType || null,
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
  });

  return material;
}

/**
 * List materials created by a teacher
 */
export async function listTeacherMaterials(teacherId: number, schoolId: number) {
  const materials = await prisma.material.findMany({
    where: {
      teacherId,
      class: { schoolId },
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return materials;
}

/**
 * List materials for a specific class
 */
export async function listClassMaterials(classId: number, schoolId: number, subjectId?: number) {
  const where: any = {
    classId,
    class: { schoolId },
  };

  if (subjectId) {
    where.subjectId = subjectId;
  }

  const materials = await prisma.material.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return materials;
}

/**
 * List materials for a student or parent's child
 */
export async function listStudentMaterials(studentId: number, schoolId: number, subjectId?: number) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { classId: true },
  });

  if (!student) {
    throw appErrors.notFound("Student not found", "STUDENT_NOT_FOUND");
  }

  return listClassMaterials(student.classId, schoolId, subjectId);
}

/**
 * Delete a course material
 */
export async function deleteMaterial(materialId: number, userId: number, role: string, schoolId: number) {
  const material = await prisma.material.findFirst({
    where: { id: materialId, class: { schoolId } },
  });

  if (!material) {
    throw appErrors.notFound("Material not found", "MATERIAL_NOT_FOUND");
  }

  if (role !== "admin" && material.teacherId !== userId) {
    throw appErrors.forbidden("Unauthorized to delete this material", "FORBIDDEN");
  }

  // Delete DB record
  await prisma.material.delete({
    where: { id: materialId },
  });

  // Attempt to delete physical file if within local uploads
  try {
    if (material.fileUrl.startsWith("/uploads/")) {
      const relativePath = material.fileUrl.replace("/uploads/", "");
      const fullPath = path.join(process.cwd(), "uploads", relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch {
    // Non-critical file unlink error
  }

  return { success: true, message: "Material deleted successfully" };
}
