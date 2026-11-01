CREATE TABLE `streets` (
	`name` text PRIMARY KEY NOT NULL,
	`floor` text
);
--> statement-breakpoint
CREATE TRIGGER require_registered_street BEFORE INSERT ON operations
WHEN NEW.kind IN ('entry','add','move') AND NEW.destination LIKE 'estoque:%'
BEGIN
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM streets WHERE name = substr(NEW.destination,9)) THEN RAISE(ABORT,'UNKNOWN_STREET') END;
END;
