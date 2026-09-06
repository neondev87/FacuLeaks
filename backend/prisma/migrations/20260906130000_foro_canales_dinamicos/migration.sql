-- Foro: los canales pasan de ser un ENUM fijo (general/aesthetics/code/
-- dark_music/void) a una tabla `forum_canales` que el admin puede ampliar y
-- borrar. `forum_temas.canal` (enum) -> `forum_temas.canalId` (FK).

-- CreateTable
CREATE TABLE `forum_canales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `nombre` VARCHAR(60) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_forum_canales_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sembrar los 5 canales que ya existían (así ningún tema previo queda huérfano;
-- el admin puede borrar los que no use desde la UI).
INSERT INTO `forum_canales` (`slug`, `nombre`, `orden`) VALUES
    ('general', 'general', 0),
    ('aesthetics', 'aesthetics', 1),
    ('code', 'code', 2),
    ('dark_music', 'dark-music', 3),
    ('void', 'void', 4);

-- Nueva columna FK, backfill desde el enum viejo, y a NOT NULL.
ALTER TABLE `forum_temas` ADD COLUMN `canalId` INTEGER NULL AFTER `id`;

UPDATE `forum_temas` `t`
    JOIN `forum_canales` `c` ON `c`.`slug` = `t`.`canal`
    SET `t`.`canalId` = `c`.`id`;

UPDATE `forum_temas`
    SET `canalId` = (SELECT `id` FROM `forum_canales` WHERE `slug` = 'general')
    WHERE `canalId` IS NULL;

ALTER TABLE `forum_temas` MODIFY COLUMN `canalId` INTEGER NOT NULL;

-- Fuera el enum viejo y su índice; índice + FK nuevos sobre canalId.
ALTER TABLE `forum_temas` DROP INDEX `idx_forum_temas_canal`;
ALTER TABLE `forum_temas` DROP COLUMN `canal`;
ALTER TABLE `forum_temas` ADD INDEX `idx_forum_temas_canal`(`canalId`);
ALTER TABLE `forum_temas` ADD CONSTRAINT `forum_temas_ibfk_2` FOREIGN KEY (`canalId`) REFERENCES `forum_canales`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
