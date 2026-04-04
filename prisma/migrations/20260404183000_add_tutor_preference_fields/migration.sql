ALTER TABLE "preferences"
ADD COLUMN IF NOT EXISTS "learning_language" TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS "native_language" TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS "learning_level" TEXT DEFAULT 'beginner';
