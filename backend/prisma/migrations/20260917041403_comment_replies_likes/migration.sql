-- AlterTable
ALTER TABLE `comments` ADD COLUMN `parentId` INTEGER NULL;

-- CreateTable
CREATE TABLE `comment_likes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_comment_likes_commentId`(`commentId`),
    INDEX `userId`(`userId`),
    UNIQUE INDEX `uk_comment_like`(`commentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_comments_parentId` ON `comments`(`parentId`);

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parentId`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment_likes` ADD CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment_likes` ADD CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
