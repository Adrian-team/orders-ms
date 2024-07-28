<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

# Orders Microservice

## Dev

1. Clonar el repositorio
2. Instalar dependencias
3. Crear un archivo `.env` basado en el `env.template`
4. Ejecutar migración de prisma `npx prisma migrate dev`
5. Ejecutar `npm run start:dev`

#### Temario curso seccion 06 (02-products-app/orders-ms)

1. PostgreSQL
2. Prisma + PostgreSQL
3. Nest resource para microservicios
4. Paginaciones y extensiones de DTOs
5. Creación y cambio de estado de la orden.
No haremos un CRUD completo porque las órdenes no se actualizarán más que para cambiar su estado de CANCELADA, ENTREGADA y PENDIENTE.

#### Temario curso seccion 07 (02-products-app/orders-ms)
1- Gateway - Validación de orden con su detalle de orden
2- OrdersMicroservice - Creación de la orden y su detalle
3- ProductsMicroservice - Verificación de que cada producto existe en la base de datos.
Haremos validación de DTOs compuestos, comunicación entre microservicios y validación y retorno de la data esperada.