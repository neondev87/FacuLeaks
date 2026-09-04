-- AlterTable
ALTER TABLE `post_likes` ADD COLUMN `tipo` ENUM('LIKE', 'DISLIKE') NOT NULL DEFAULT 'LIKE';

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `totalDislikes` INTEGER NOT NULL DEFAULT 0;
