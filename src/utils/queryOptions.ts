import { Query } from 'mongoose';

export default class QueryOptions<T> {
  private _queryStrCopy: Record<string, unknown>;

  // Pagination section properties
  private _defaultStartPage: number = 1;
  private _defaultItemPerPage: number = 5;

  constructor(
    private _query: Query<T | T[], T>,
    private _queryString: Object & {
      sort?: string;
      filter?: string;
      page?: string;
      limit?: string;
    }
  ) {
    // Copy the query string and exclude the query mutable parameters.
    // So, it won't affect the query results.
    this._queryStrCopy = { ...this._queryString };

    const excludedParameters = ['sort', 'filter', 'page', 'limit'];
    excludedParameters.forEach((param) => delete this._queryStrCopy[param]);

    // Ensure sorting is certainly going to be performed, since it's required for pagination to work properly.
    if (!this._queryString.sort)
      this._queryString.sort = '-createdAt -updatedAt';
  }

  find(): this {
    // Convert query object to a JSON string and replace specified keywords with MongoDB operators.
    // Example: { rating: { gte: 5 } } becomes { rating: { $gte: 5 } }
    const queryStr = JSON.stringify(this._queryStrCopy);
    this._queryStrCopy = JSON.parse(
      queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (operator) => `$${operator}`)
    );

    // Apply the modified query to the 'find' method.
    this._query = this._query.find(this._queryStrCopy);
    return this;
  }

  sort(): this {
    // Split parameters by empty space for sorting.
    // Sort based on parameters or by creation date by default.
    const sortBy = this._queryString.sort
      ? this._queryString.sort.split(',').join(' ')
      : '-createdAt -updatedAt';

    // Apply sorting criteria to the query.
    this._query = this._query.sort(sortBy);

    return this;
  }

  filter(): this {
    // Split filter parameters by empty space, if any exists.
    // Select fields of documents based on filtering criteria.
    // Doesn't select __v (version indicator field), in case filter isn't provided.

    // A projection must be either inclusive or exclusive. In other words,
    // you must either list the fields to include (which excludes all others),
    // or list the fields to exclude (which implies all other fields are included).
    // https://mongoosejs.com/docs/api/query.html#Query.prototype.select()

    if (this._queryString.filter) {
      const filterBy = this._queryString.filter.split(',').join(' ');
      this._query = this._query.select(filterBy);
    } else this._query = this._query.select('-__v');
    return this;
  }

  page(): this {
    const page = Number(this._queryString.page) || this._defaultStartPage;
    const limit = Number(this._queryString.limit) || this._defaultItemPerPage;

    // Calculate the number of documents to skip based on the page number and limit.
    const skip = (page - 1) * limit;

    // Apply pagination settings to the query.
    this._query = this._query.skip(skip).limit(limit);

    return this;
  }

  // Provides access to the manipulated query.
  get query(): typeof this._query {
    return this._query;
  }
}
