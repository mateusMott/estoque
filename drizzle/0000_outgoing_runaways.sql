CREATE TABLE `balances` (
	`product_id` text NOT NULL,
	`location` text NOT NULL,
	`quantity` integer NOT NULL,
	PRIMARY KEY(`product_id`, `location`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "nonnegative_quantity" CHECK("balances"."quantity" >= 0 AND "balances"."quantity" <= 1000000000)
);
--> statement-breakpoint
CREATE TABLE `codes` (
	`code` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`kind` text NOT NULL,
	`quantity` integer NOT NULL,
	`source` text,
	`destination` text,
	`reason` text,
	`payload` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_quantity" CHECK("operations"."quantity" > 0 AND "operations"."quantity" <= 1000000),
	CONSTRAINT "operation_kind" CHECK("operations"."kind" IN ('entry', 'add', 'move', 'remove'))
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`barcode` text NOT NULL,
	`gemco` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_unique` ON `products` (`barcode`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_gemco_unique` ON `products` (`gemco`);--> statement-breakpoint
CREATE TRIGGER validate_operation BEFORE INSERT ON operations BEGIN
  SELECT CASE WHEN NEW.kind IN ('move','remove') AND COALESCE((SELECT quantity FROM balances WHERE product_id = NEW.product_id AND location = NEW.source),0) < NEW.quantity THEN RAISE(ABORT,'INSUFFICIENT_STOCK') END;
  SELECT CASE WHEN NEW.kind = 'add' AND COALESCE((SELECT SUM(quantity) FROM balances WHERE product_id = NEW.product_id),0) = 0 THEN RAISE(ABORT,'ZERO_STOCK') END;
  SELECT CASE WHEN NEW.kind = 'move' AND NEW.source = NEW.destination THEN RAISE(ABORT,'SAME_LOCATION') END;
  SELECT CASE WHEN NEW.kind IN ('move','remove') AND NEW.source IS NULL THEN RAISE(ABORT,'SOURCE_REQUIRED') END;
  SELECT CASE WHEN NEW.kind IN ('entry','add','move') AND NEW.destination IS NULL THEN RAISE(ABORT,'DESTINATION_REQUIRED') END;
  SELECT CASE WHEN NEW.kind = 'remove' AND length(trim(COALESCE(NEW.reason,''))) < 3 THEN RAISE(ABORT,'REASON_REQUIRED') END;
END;
--> statement-breakpoint
CREATE TRIGGER apply_incoming AFTER INSERT ON operations WHEN NEW.kind IN ('entry','add','move') BEGIN
  INSERT INTO balances (product_id,location,quantity) VALUES (NEW.product_id,NEW.destination,NEW.quantity)
  ON CONFLICT (product_id,location) DO UPDATE SET quantity = quantity + NEW.quantity;
END;
--> statement-breakpoint
CREATE TRIGGER apply_outgoing AFTER INSERT ON operations WHEN NEW.kind IN ('move','remove') BEGIN
  UPDATE balances SET quantity = quantity - NEW.quantity WHERE product_id = NEW.product_id AND location = NEW.source;
END;
