-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('assignment', 'exam', 'quiz', 'project');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'message';

-- DropIndex
DROP INDEX "notifications_parent_user_id_attendance_id_key";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "message_id" INTEGER,
ADD COLUMN     "recipient_user_id" INTEGER,
ALTER COLUMN "parent_user_id" DROP NOT NULL,
ALTER COLUMN "attendance_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "user_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT;

-- CreateTable
CREATE TABLE "assessments" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL DEFAULT 'assignment',
    "due_date" TIMESTAMP(3) NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_slots" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "content" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "grade_score" INTEGER,
    "feedback" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'submitted',

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessments_class_id_due_date_idx" ON "assessments"("class_id", "due_date");

-- CreateIndex
CREATE INDEX "assessments_teacher_id_idx" ON "assessments"("teacher_id");

-- CreateIndex
CREATE INDEX "schedule_slots_class_id_day_of_week_idx" ON "schedule_slots"("class_id", "day_of_week");

-- CreateIndex
CREATE INDEX "schedule_slots_teacher_id_idx" ON "schedule_slots"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_slots_class_id_day_of_week_start_time_key" ON "schedule_slots"("class_id", "day_of_week", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_student_id_teacher_id_parent_id_key" ON "conversations"("student_id", "teacher_id", "parent_id");

-- CreateIndex
CREATE INDEX "materials_class_id_subject_id_idx" ON "materials"("class_id", "subject_id");

-- CreateIndex
CREATE INDEX "materials_teacher_id_idx" ON "materials"("teacher_id");

-- CreateIndex
CREATE INDEX "submissions_assessment_id_idx" ON "submissions"("assessment_id");

-- CreateIndex
CREATE INDEX "submissions_student_id_idx" ON "submissions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assessment_id_student_id_key" ON "submissions"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_read_at_created_at_idx" ON "notifications"("recipient_user_id", "read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "grades_student_id_teaching_assignment_id_academic_year_quarter_" RENAME TO "grades_student_id_teaching_assignment_id_academic_year_quar_key";
