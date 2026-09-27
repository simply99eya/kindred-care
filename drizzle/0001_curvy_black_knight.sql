CREATE TABLE `care_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(140) NOT NULL,
	`notes` text,
	`category` enum('routine','appointment','visit','reminder','rest','other') NOT NULL DEFAULT 'routine',
	`date_key` varchar(10) NOT NULL,
	`start_time` varchar(5) NOT NULL,
	`reminder_time` varchar(5),
	`status` enum('planned','completed') NOT NULL DEFAULT 'planned',
	`is_demo` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `care_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `care_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('caregiver','supported') NOT NULL DEFAULT 'caregiver',
	`display_name` varchar(120) NOT NULL,
	`supported_name` varchar(120) NOT NULL DEFAULT '',
	`timezone` varchar(80) NOT NULL DEFAULT 'UTC',
	`language` varchar(12) NOT NULL DEFAULT 'en',
	`onboarding_step` int NOT NULL DEFAULT 0,
	`onboarding_complete` boolean NOT NULL DEFAULT false,
	`speech_rate` int NOT NULL DEFAULT 90,
	`notifications_enabled` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `care_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `care_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `familiar_people` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`relationship` varchar(80) NOT NULL,
	`description` text,
	`photo_key` varchar(500),
	`photo_url` text,
	`is_demo` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familiar_people_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `care_activities` ADD CONSTRAINT `care_activities_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `care_profiles` ADD CONSTRAINT `care_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `familiar_people` ADD CONSTRAINT `familiar_people_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `care_activities_user_date_idx` ON `care_activities` (`user_id`,`date_key`);--> statement-breakpoint
CREATE INDEX `familiar_people_user_idx` ON `familiar_people` (`user_id`);