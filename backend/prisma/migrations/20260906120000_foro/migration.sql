-- CreateTable
CREATE TABLE `forum_temas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `canal` ENUM('general', 'aesthetics', 'code', 'dark_music', 'void') NOT NULL DEFAULT 'general',
    `titulo` VARCHAR(200) NOT NULL,
    `autorId` INTEGER NOT NULL,
    `totalComentarios` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_forum_temas_autor`(`autorId`),
    INDEX `idx_forum_temas_canal`(`canal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_comentarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `temaId` INTEGER NOT NULL,
    `autorId` INTEGER NOT NULL,
    `contenido` TEXT NOT NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_forum_com_autor`(`autorId`),
    INDEX `idx_forum_com_tema`(`temaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `forum_temas` ADD CONSTRAINT `forum_temas_ibfk_1` FOREIGN KEY (`autorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_comentarios` ADD CONSTRAINT `forum_comentarios_ibfk_1` FOREIGN KEY (`temaId`) REFERENCES `forum_temas`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_comentarios` ADD CONSTRAINT `forum_comentarios_ibfk_2` FOREIGN KEY (`autorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
