CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teaching_assignments" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "teaching_assignment_id" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "grades_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grades_quarter_check" CHECK ("quarter" BETWEEN 1 AND 4),
    CONSTRAINT "grades_score_check" CHECK ("score" BETWEEN 0 AND 100)
);

ALTER TABLE "classes" ADD COLUMN "homeroom_teacher_id" INTEGER;

CREATE UNIQUE INDEX "subjects_school_id_name_key" ON "subjects"("school_id", "name");
CREATE UNIQUE INDEX "teaching_assignments_class_id_teacher_id_subject_id_key" ON "teaching_assignments"("class_id", "teacher_id", "subject_id");
CREATE INDEX "teaching_assignments_teacher_id_class_id_idx" ON "teaching_assignments"("teacher_id", "class_id");
CREATE UNIQUE INDEX "grades_student_id_teaching_assignment_id_academic_year_quarter_key" ON "grades"("student_id", "teaching_assignment_id", "academic_year", "quarter");
CREATE INDEX "grades_teaching_assignment_id_academic_year_quarter_idx" ON "grades"("teaching_assignment_id", "academic_year", "quarter");

ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_fkey" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grades" ADD CONSTRAINT "grades_teaching_assignment_id_fkey" FOREIGN KEY ("teaching_assignment_id") REFERENCES "teaching_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
