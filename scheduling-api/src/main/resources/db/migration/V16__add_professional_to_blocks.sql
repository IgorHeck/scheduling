ALTER TABLE schedule_blocks ADD COLUMN professional_id BIGINT REFERENCES users(id);
