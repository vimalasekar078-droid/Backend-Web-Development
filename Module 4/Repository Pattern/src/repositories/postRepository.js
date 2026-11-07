const postStore = require('../data/postStore');

/**
 * Repository Pattern: Post Repository
 *
 * Storage Swap Readiness & Prisma Transition Analysis:
 *
 * What will CHANGE when replaced by a Prisma-backed implementation:
 * 1. Asynchronous Execution:
 *    - All repository methods (findAll, findById, create, update, remove) will become `async`
 *      and return Promises, as Prisma Client performs asynchronous network I/O with the database.
 *    - Callers in `postService` (and subsequently `postController`) will need to `await` repository calls.
 * 2. Data Access Mechanism:
 *    - Direct manipulation of the in-memory `postStore` array will be replaced with Prisma Client calls:
 *      - `findAll()` -> `prisma.post.findMany()`
 *      - `findById(id)` -> `prisma.post.findUnique({ where: { id: Number(id) } })`
 *      - `create(fields)` -> `prisma.post.create({ data: { title: fields.title, body: fields.body || '', authorId: fields.authorId } })`
 *      - `update(id, patch)` -> `prisma.post.update({ where: { id: Number(id) }, data: patch })`
 *      - `remove(id)` -> `prisma.post.delete({ where: { id: Number(id) } })`
 * 3. Identity and State Management:
 *    - Manual ID generation (`postStore.nextId()`) will be replaced by database autoincrement / UUID sequences managed by PostgreSQL/Prisma.
 *    - Data persistence will survive application restarts rather than living only in process memory.
 * 4. Error and Constraint Handling:
 *    - Database-level constraints (e.g., foreign keys, unique constraints, connection failures) will originate
 *      from Prisma and require repository/service-level handling (e.g., catching PrismaClientKnownRequestError).
 *
 * What will REMAIN UNCHANGED:
 * 1. Repository Interface & Contract:
 *    - The public repository method names (`findAll`, `findById`, `create`, `update`, `remove`) and their
 *      logical input signatures (id, fields, patch) will remain identical.
 * 2. Architectural Boundaries & Decoupling:
 *    - The service layer (`postService`) will remain decoupled from database specifics (SQL, schema internals, ORM queries).
 *      `postService` will still speak solely to `postRepository` without knowing how or where data is stored.
 * 3. Business Logic Placement:
 *    - Domain validation rules (e.g., ensuring `title` is provided and throwing a 422 error) remain in `postService`.
 *    - HTTP routing, controllers, request parsing, and response status mapping (404, 201, 204, etc.) remain in `postController`.
 * 4. Data Transfer Shapes:
 *    - The shape of post records returned to callers ({ id, title, body, authorId }) will remain consistent.
 */

function findAll() {
  return postStore.posts;
}

function findById(id) {
  return postStore.posts.find((post) => post.id === Number(id)) || null;
}

function create(fields) {
  const post = {
    id: postStore.nextId(),
    title: fields.title,
    body: fields.body || '',
    authorId: fields.authorId,
  };
  postStore.posts.push(post);
  return post;
}

function update(id, patch) {
  const post = findById(id);
  if (!post) return null;
  if (patch.title !== undefined) post.title = patch.title;
  if (patch.body !== undefined) post.body = patch.body;
  return post;
}

function remove(id) {
  const index = postStore.posts.findIndex((post) => post.id === Number(id));
  if (index === -1) return false;
  postStore.posts.splice(index, 1);
  return true;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
