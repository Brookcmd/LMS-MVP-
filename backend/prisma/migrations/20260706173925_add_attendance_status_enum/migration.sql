/*
  Warnings:

  - You are about to drop the column `teacher_id` on the `classes` table. All the data in the column will be lost.
  - Changed the type of `status` on the `attendances` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late');

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_teacher_id_fkey";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "teacher_id";

-- AlterTable
ALTER TABLE "parent_students" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "relationship" TEXT;

-- CreateTable
CREATE TABLE "class_teachers" (
    "class_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,

    CONSTRAINT "class_teachers_pkey" PRIMARY KEY ("class_id","teacher_id")
);

-- AddForeignKey
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
