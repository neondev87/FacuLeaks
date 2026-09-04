-- Integridad referencial de las respuestas de chat (messages.replyToId).
-- Antes: replyToId era un INT suelto sin FK -> al borrar un mensaje citado
-- quedaban punteros colgantes. Ahora: FK self-referencial con ON DELETE SET NULL.

-- 1) Limpiar punteros de respuesta colgantes que existan hoy (si no, el ADD CONSTRAINT falla)
UPDATE `messages` m
LEFT JOIN `messages` parent ON parent.`id` = m.`replyToId`
SET m.`replyToId` = NULL
WHERE m.`replyToId` IS NOT NULL AND parent.`id` IS NULL;

-- 2) Índice para la FK
CREATE INDEX `idx_messages_replyTo` ON `messages`(`replyToId`);

-- 3) FK self-referencial
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_replyToId_fkey`
  FOREIGN KEY (`replyToId`) REFERENCES `messages`(`id`)
  ON DELETE SET NULL ON UPDATE NO ACTION;
