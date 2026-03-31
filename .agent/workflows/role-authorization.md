---
description: Autorización de Edición (Rol vs Dueño) para Productores
---

# Autorización de Rutas - Dueños vs Administradores

En el proyecto **Hurlingham PNO**, los administradores pueden gestionar a todos los usuarios, pero **cada productor debe poder gestionar su propio perfil** de MercadoLingham sin requerir del rango de administrador.

## El Problema Inicial

Anteriormente, rutas como `PUT /api/producers/:id` o la adición de productos estaban protegidas exclusivamente por `adminMiddleware`. Esto causaba el error `"Acceso denegado. Se requiere rol admin."` si el propio productor intentaba cambiar su descripción.

## La Solución Aplicada (Basado en el TP 1)

1. **Quitar `adminMiddleware` de la ruta:**
   En lugar de bloquear todo a nivel ruta, usamos el middleware básico `authMiddleware` que simplemente corrobora que el usuario esté logueado y populará `req.user`.

2. **Verificar a nivel de Controlador (Dueño vs Admin):**
   Dentro del método del controlador correspondiente (ej. `updateProducer` o `addProduct`), obtenemos el recurso y verificamos si el `req.user.userId` del token coincide con el `userId` en ese registro.
   Si no coinciden, además nos fijamos si `req.user.role` es `"admin"`.

   ```javascript
   const producer = await Producer.findById(req.params.id);

   if (!producer) {
     return res.status(404).json({ error: "Productor no encontrado" });
   }

   // Autorización: admin o el dueño del perfil
   if (req.user.role !== "admin" && req.user.userId !== producer.userId) {
     return res.status(403).json({ error: "No tenés permiso" });
   }
   ```

3. **Ejecutar la modificación:**
   Una vez verificada la autoridad, podemos reemplazar o pushear lo necesario.
