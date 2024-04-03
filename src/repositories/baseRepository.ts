import { FilterQuery } from 'mongoose';

/**
 * Interface representing a repository for CRUD operations on entities.
 * @template T - The type of entity stored in the repository.
 * @template K - The type of the unique identifier of the entity.
 */
export default interface IRepository<T, K> {
  /**
   * Creates a new entity in the repository.
   * @param {T} entity - The entity to be created.
   * @returns {Promise<T>} A promise that resolves with the created entity.
   */
  create(entity: T): Promise<T>;

  /**
   * Retrieves entities from the repository based on a filter.
   * @param {FilterQuery<T>} filter - The filter (received query in requests, e.g. req.query in Express) to apply for retrieval.
   * @returns {Promise<T | T[]>} A promise that resolves with the retrieved entity or an array of entities.
   */
  readAll(filter: FilterQuery<T>): Promise<T | T[]>;

  /**
   * Retrieves a single entity from the repository based on its unique identifier,
   * optionally specifying a projection for selecting specific fields.
   * @param {K} id - The unique identifier of the entity to retrieve.
   * @param {string | { [key in keyof T]?: boolean }} [projection] - Optional. The projection specifying the fields to include or exclude.
   * If a string, it represents the fields to include, separated by spaces. If an object, it specifies the fields to include/exclude.
   * @returns {Promise<T | null>} A promise that resolves with the retrieved entity, or null if not found.
   */
  read(
    id: K,
    projection?: string | { [key in keyof T]?: boolean | 0 | 1 }
  ): Promise<T | null>;

  /**
   * Updates an entity in the repository based on its unique identifier.
   * @param {K} id - The unique identifier of the entity to update.
   * @param {Partial<T>} entityUpdates - The updates to be applied to the entity.
   * @returns {Promise<T | null>} A promise that resolves with the updated entity, or null if the entity with the specified ID is not found.
   */
  update(id: K, entityUpdates: Partial<T>): Promise<T | null>;

  /**
   * Deletes an entity from the repository based on its unique identifier.
   * @param {K} id - The unique identifier of the entity to delete.
   * @returns {Promise<T | null>} A promise that resolves with the deleted entity, or null if the entity with the specified ID is not found.
   */
  delete(id: K): Promise<T | null>;
}
