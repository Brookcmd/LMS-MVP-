import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface CreateMaterialInput {
  title: string;
  description?: string;
  category?: string;
  classId: number;
  subjectId: number;
  teacherId: number;
  schoolId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  isAdmin?: boolean;
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

  if (!input.isAdmin) {
    await validateTeacherForClass(input.teacherId, input.classId, input.schoolId);
  }

  // Validate subject exists
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, schoolId: input.schoolId },
  });

  if (!subject) {
    throw appErrors.notFound("Subject not found in this institution", "SUBJECT_NOT_FOUND");
  }

  // If category is provided, prefix or append it gracefully to description if not in dedicated schema field
  let formattedDescription = input.description?.trim() || "";
  if (input.category) {
    formattedDescription = `[category:${input.category.toLowerCase().trim()}] ${formattedDescription}`.trim();
  }

  const material = await prisma.material.create({
    data: {
      title: input.title.trim(),
      description: formattedDescription.length > 0 ? formattedDescription : null,
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
 * List all materials for admin with pagination, filters, and search
 */
export async function listAdminMaterials(
  schoolId: number,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: number;
    subjectId?: number;
    gradeBand?: string;
  } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {
    class: { schoolId },
  };

  if (options.classId) {
    where.classId = options.classId;
  }

  if (options.subjectId) {
    where.subjectId = options.subjectId;
  }

  if (options.search && options.search.trim()) {
    const term = options.search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { fileName: { contains: term, mode: "insensitive" } },
      { subject: { name: { contains: term, mode: "insensitive" } } },
      { class: { name: { contains: term, mode: "insensitive" } } },
      { teacher: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  // Filter by grade band if specified
  if (options.gradeBand && options.gradeBand !== "all") {
    const gb = options.gradeBand.toLowerCase();
    if (gb === "kg") {
      where.class = { ...where.class, name: { startsWith: "KG", mode: "insensitive" } };
    } else if (gb === "primary") {
      where.class = {
        ...where.class,
        OR: [
          { name: { startsWith: "Grade 1", mode: "insensitive" } },
          { name: { startsWith: "Grade 2", mode: "insensitive" } },
          { name: { startsWith: "Grade 3", mode: "insensitive" } },
          { name: { startsWith: "Grade 4", mode: "insensitive" } },
          { name: { startsWith: "Grade 5", mode: "insensitive" } },
          { name: { startsWith: "Grade 6", mode: "insensitive" } },
          { name: { startsWith: "Grade 7", mode: "insensitive" } },
          { name: { startsWith: "Grade 8", mode: "insensitive" } },
        ],
      };
    } else if (gb === "high") {
      where.class = {
        ...where.class,
        OR: [
          { name: { startsWith: "Grade 9", mode: "insensitive" } },
          { name: { startsWith: "Grade 10", mode: "insensitive" } },
        ],
      };
    } else if (gb === "prep") {
      where.class = {
        ...where.class,
        OR: [
          { name: { startsWith: "Grade 11", mode: "insensitive" } },
          { name: { startsWith: "Grade 12", mode: "insensitive" } },
          { name: { contains: "Natural", mode: "insensitive" } },
          { name: { contains: "Social", mode: "insensitive" } },
        ],
      };
    }
  }

  const [items, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.material.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
