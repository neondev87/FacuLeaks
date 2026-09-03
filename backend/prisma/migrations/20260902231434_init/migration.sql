-- CreateTable
CREATE TABLE `amistades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitanteId` INTEGER NOT NULL,
    `receptorId` INTEGER NOT NULL,
    `estado` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'BLOQUEADO') NOT NULL DEFAULT 'PENDIENTE',
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_amistades_estado`(`estado`),
    INDEX `idx_amistades_receptor`(`receptorId`),
    UNIQUE INDEX `uk_amistad`(`solicitanteId`, `receptorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backgrounds` (
    `id` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `previewUrl` VARCHAR(300) NOT NULL,
    `tipo` ENUM('STATIC', 'ANIMATED', 'ASCII') NOT NULL DEFAULT 'STATIC',
    `tags` VARCHAR(200) NOT NULL DEFAULT '',
    `disponible` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `autorId` INTEGER NOT NULL,
    `contenido` VARCHAR(500) NOT NULL,
    `editado` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `autorId`(`autorId`),
    INDEX `idx_comments_postId`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emisorId` INTEGER NOT NULL,
    `receptorId` INTEGER NOT NULL,
    `contenido` TEXT NOT NULL,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `leidoEn` DATETIME(0) NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tipo` VARCHAR(20) NOT NULL DEFAULT 'texto',
    `audioUrl` VARCHAR(300) NULL,
    `replyToId` INTEGER NULL,

    INDEX `idx_messages_chat`(`emisorId`, `receptorId`),
    INDEX `idx_messages_no_leidos`(`receptorId`, `leido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `generadorId` INTEGER NULL,
    `tipo` ENUM('SOLICITUD_AMISTAD', 'AMISTAD_ACEPTADA', 'LIKE_POST', 'COMENTARIO_POST', 'MENSAJE_NUEVO', 'VISITA_PERFIL', 'MENCION') NOT NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `leidaEn` DATETIME(0) NULL,
    `entidadId` INTEGER NULL,
    `entidadTipo` VARCHAR(30) NULL,
    `mensaje` VARCHAR(200) NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `generadorId`(`generadorId`),
    INDEX `idx_notif_creadoEn`(`creadoEn`),
    INDEX `idx_notif_usuario_leida`(`usuarioId`, `leida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `ruta` VARCHAR(300) NOT NULL,
    `orden` TINYINT NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_post_images_postId`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_likes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_post_likes_postId`(`postId`),
    INDEX `userId`(`userId`),
    UNIQUE INDEX `uk_like`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `autorId` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NULL,
    `contenido` TEXT NOT NULL,
    `privacidad` ENUM('PUBLICA', 'AMIGOS', 'SOLO_YO') NOT NULL DEFAULT 'AMIGOS',
    `totalLikes` INTEGER NOT NULL DEFAULT 0,
    `totalComentarios` INTEGER NOT NULL DEFAULT 0,
    `totalVistas` INTEGER NOT NULL DEFAULT 0,
    `editado` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `imagen` VARCHAR(300) NULL,

    INDEX `idx_posts_autorId`(`autorId`),
    INDEX `idx_posts_creadoEn`(`creadoEn`),
    INDEX `idx_posts_privacidad`(`privacidad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `perfilId` INTEGER NOT NULL,
    `visitanteId` INTEGER NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_visits_creadoEn`(`creadoEn`),
    INDEX `idx_visits_perfil`(`perfilId`),
    INDEX `visitanteId`(`visitanteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spotify_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bgId` VARCHAR(50) NOT NULL DEFAULT 'bg_default',
    `accentColor` VARCHAR(7) NOT NULL DEFAULT '#ffffff',
    `statusText` VARCHAR(80) NULL,
    `bio` VARCHAR(300) NULL,
    `linkPersonal` VARCHAR(200) NULL,
    `perfilPublico` BOOLEAN NOT NULL DEFAULT true,
    `mostrarSpotify` BOOLEAN NOT NULL DEFAULT true,
    `mostrarUltimaConexion` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `intereses` JSON NULL,
    `links` JSON NULL,

    UNIQUE INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `totalPosts` INTEGER NOT NULL DEFAULT 0,
    `totalAmigos` INTEGER NOT NULL DEFAULT 0,
    `totalVisitas` INTEGER NOT NULL DEFAULT 0,
    `totalLikesRecibidos` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `googleId` VARCHAR(100) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `username` VARCHAR(30) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `rol` ENUM('ADMIN', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `ultimoAcceso` DATETIME(0) NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `imagen` VARCHAR(300) NULL,

    UNIQUE INDEX `googleId`(`googleId`),
    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `username`(`username`),
    INDEX `idx_users_email`(`email`),
    INDEX `idx_users_username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seguidorId` INTEGER NOT NULL,
    `seguidoId` INTEGER NOT NULL,
    `creadoEn` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_seguido`(`seguidoId`),
    INDEX `idx_seguidor`(`seguidorId`),
    UNIQUE INDEX `uk_follow`(`seguidorId`, `seguidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `photoUrl` VARCHAR(300) NOT NULL,
    `uploadedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `amistades` ADD CONSTRAINT `amistades_ibfk_1` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `amistades` ADD CONSTRAINT `amistades_ibfk_2` FOREIGN KEY (`receptorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`autorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`emisorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receptorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`generadorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`autorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `profile_visits` ADD CONSTRAINT `profile_visits_ibfk_1` FOREIGN KEY (`perfilId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `profile_visits` ADD CONSTRAINT `profile_visits_ibfk_2` FOREIGN KEY (`visitanteId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spotify_tokens` ADD CONSTRAINT `spotify_tokens_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_stats` ADD CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `follows` ADD CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`seguidorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `follows` ADD CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`seguidoId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_photos` ADD CONSTRAINT `user_photos_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
