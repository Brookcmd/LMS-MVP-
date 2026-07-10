School         (id, name, created_at)

User           (id, school_id, role, name, email, phone, password_hash, created_at)
               role: 'admin' | 'teacher' | 'parent' | 'student'


Student        (id, school_id, class_id, name, dob, created_at)
               No login credentials in Phase 1. If a later phase adds student
               logins, this table gets a nullable, unique user_id — that's a
               future migration, not something to build now.
               
ParentStudent  (parent_user_id, student_id)
               Many-to-many. Handles siblings and shared custody cases.

Class          (id, school_id, name, teacher_id)

Attendance     (id, student_id, class_id, date, status, marked_by, created_at)
               status: 'present' | 'absent' | 'late'
               Unique constraint on (student_id, date) — a student can't be
               marked twice for the same day.
               marked_by references the teacher User.id who took attendance.