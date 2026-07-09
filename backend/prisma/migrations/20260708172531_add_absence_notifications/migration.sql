-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('absence');

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "parent_user_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "attendance_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'absence',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_parent_user_id_read_at_created_at_idx" ON "notifications"("parent_user_id", "read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_parent_user_id_attendance_id_key" ON "notifications"("parent_user_id", "attendance_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
