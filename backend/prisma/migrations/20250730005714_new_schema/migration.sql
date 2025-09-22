-- Migration to add isGenbaVisit field to Meeting model
ALTER TABLE "meetings"
ADD COLUMN "is_genba_visit" BOOLEAN NOT NULL DEFAULT FALSE;
