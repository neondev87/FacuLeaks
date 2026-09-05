-- AlterTable
ALTER TABLE `posts` ADD COLUMN `totalCompartidos` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `post_shares` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_post_shares_postId`(`postId`),
    INDEX `userId`(`userId`),
    UNIQUE INDEX `uk_share`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `post_shares` ADD CONSTRAINT `post_shares_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `post_shares` ADD CONSTRAINT `post_shares_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
