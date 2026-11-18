/**
 * Repository Pattern: Post Repository
 *
 * STORAGE-SWAP PROOF:
 * This repository is implemented using a Map-backed store (`new Map()`) instead of a raw array.
 * Because `postService` depends purely on the repository interface (findAll, findById, create, update, remove)
 * rather than any underlying data structure, the service functions without any modification.
 *
 * PRISMA TRANSITION ANALYSIS:
 *
 * What will CHANGE when replaced by a Prisma-backed implementation:
 * 1. Asynchronous Execution:
 *    - All repository operations will become `async` and return Promises, since Prisma Client
 *      performs asynchronous network I/O with the database engine.
 *    - Callers in `postService` (and controllers) will `await` repository calls.
 * 2. Storage & Query Mechanism:
 *    - The internal `Map` operations will be replaced with Prisma Client model queries:
 *      - `findAll()` -> `prisma.post.findMany()`
 *      - `findById(id)` -> `prisma.post.findUnique({ where: { id: Number(id) } })`
 *      - `create(fields)` -> `prisma.post.create({ data: { title: fields.title, body: fields.body || '', authorId: fields.authorId } })`
 *      - `update(id, patch)` -> `prisma.post.update({ where: { id: Number(id) }, data: patch })`
 *      - `remove(id)` -> `prisma.post.delete({ where: { id: Number(id) } })`
 * 3. Identity & ID Generation:
 *    - Manual in-memory ID generation (`let currentId = 3`) will be replaced by database-managed
 *      autoincrement sequences or UUIDs managed by PostgreSQL/database schema.
 * 4. Persistence & Concurrency:
 *    - Data will persist across application restarts in an external database rather than living
 *      in Node.js process memory.
 *    - Concurrency, transactions, and foreign key constraints will be enforced at the database level.
 *
 * What will REMAIN UNCHANGED:
 * 1. Repository Interface Contract:
 *    - The repository will continue to expose the exact standard methods:
 *      `findAll`, `findById`, `create`, `update`, and `remove`.
 * 2. Architectural Boundaries:
 *    - `postService` will remain completely decoupled from storage specifics, SQL queries, or ORM details.
 *      The service layer only communicates through the repository interface.
 * 3. Business Logic & Validation Placement:
 *    - Domain validation rules (e.g. verifying `title` is provided and throwing a 422 error)
 *      remain strictly within `postService`, not pushed down into the repository.
 * 4. Response Shapes & Controller Handling:
 *    - The record shapes ({ id, title, body, authorId }) and HTTP layer status codes (200, 201, 204, 404, 422)
 *      remain identical.
 */

// Initial seed posts loaded into the Map-backed store
const posts = new Map([
  [1, { id: 1, title: 'First post', body: 'Repository boundaries protect change.', authorId: 7 }],
  [2, { id: 2, title: 'Second post', body: 'Services should speak in domain language.', authorId: 8 }],
]);

let currentId = 3;

function findAll() {
  // Returns a new array, not the internal collection
  return Array.from(posts.values()).map((post) => ({ ...post }));
}

function findById(id) {
  const post = posts.get(Number(id));
  if (!post) return null;
  return { ...post };
}

function create(fields) {
  const id = currentId++;
  const post = {
    id,
    title: fields.title,
    body: fields.body || '',
    authorId: fields.authorId,
  };
  posts.set(id, post);
  return { ...post };
}

function update(id, patch) {
  const numericId = Number(id);
  const post = posts.get(numericId);
  if (!post) return null;

  if (patch.title !== undefined) post.title = patch.title;
  if (patch.body !== undefined) post.body = patch.body;

  posts.set(numericId, post);
  return { ...post };
}

function remove(id) {
  const numericId = Number(id);
  if (!posts.has(numericId)) return false;
  return posts.delete(numericId);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
