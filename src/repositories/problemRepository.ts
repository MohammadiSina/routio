import { FilterQuery, Types } from 'mongoose';

import IRepository from './baseRepository';
import Problem from '../models/problemModel';
import { IProblemDoc as IPD } from '../types';
import { QueryOptions } from '../utils';

class ProblemRepository implements IRepository<IPD, Types.ObjectId | string> {
  /**
   * Creates a new problem document in the database.
   * @param {IPD} entity - The problem document to create.
   * @returns {Promise<IPD>} A promise that resolves with the created problem document.
   */
  async create(entity: IPD): Promise<IPD> {
    return Problem.create(entity);
  }

  /**
   * Retrieves problem documents from the database based on the provided filter.
   * @param {FilterQuery<IPD>} filter - The filter to apply for retrieval.
   * @returns {Promise<IPD | IPD[]>} A promise that resolves with the retrieved problem document or an array of problem documents.
   */
  async readAll(filter: FilterQuery<IPD>): Promise<IPD | IPD[]> {
    return new QueryOptions(Problem.find(), filter)
      .find()
      .sort()
      .filter()
      .page().query;
  }

  /**
   * Retrieves a single problem document from the database based on its ID, optionally applying projection.
   * @param {string | Types.ObjectId} id - The ID of the problem document to retrieve.
   * @param {string | { [key in keyof IPD]?: boolean }} [projection] - Optional. The projection specifying the fields to include or exclude.
   * @returns {Promise<IPD | null>} A promise that resolves with the retrieved problem document, or null if not found.
   */
  async read(
    id: string | Types.ObjectId,
    projection?: string | { [key in keyof IPD]?: boolean | 0 | 1 }
  ): Promise<IPD | null> {
    return Problem.findById(id, projection);
  }

  /**
   * Updates a problem document in the database based on its ID.
   * @param {string | Types.ObjectId} id - The ID of the problem document to update.
   * @param {Partial<IPD>} entityUpdates - The updates to be applied to the problem document.
   * @returns {Promise<IPD | null>} A promise that resolves with the updated problem document, or null if the document with the specified ID is not found.
   */
  async update(
    id: string | Types.ObjectId,
    entityUpdates: Partial<IPD>
  ): Promise<IPD | null> {
    return Problem.findByIdAndUpdate(id, entityUpdates, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Deletes a problem document from the database based on its ID.
   * @param {string | Types.ObjectId} id - The ID of the problem document to delete.
   * @returns {Promise<IPD | null>} A promise that resolves with the deleted problem document, or null if the document with the specified ID is not found.
   */
  async delete(id: string | Types.ObjectId): Promise<IPD | null> {
    return Problem.findByIdAndDelete(id);
  }
}

export default new ProblemRepository();
