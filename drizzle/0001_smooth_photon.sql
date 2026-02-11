CREATE TABLE `bots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`brandLogoUrl` text,
	`flowiseApiUrl` text NOT NULL,
	`flowiseApiKey` text,
	`firstMessage` text,
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientTesterId` int NOT NULL,
	`content` text NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_testers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`botId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_testers_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_testers_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `message_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`sessionId` int NOT NULL,
	`feedbackType` enum('like','dislike') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','bot') NOT NULL,
	`content` text NOT NULL,
	`editedContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`memberName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`botId` int NOT NULL,
	`clientTesterId` int NOT NULL,
	`status` enum('live','completed','reviewed') NOT NULL DEFAULT 'live',
	`adminNotes` text,
	`reviewSubmitted` boolean NOT NULL DEFAULT false,
	`reviewRating` int,
	`reviewComment` text,
	`assignedTeamMemberId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `test_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
