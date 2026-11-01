class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
        this.filters = {};
        this.page = 1;
        this.resPerPage = 10;
    }

    search() {
        if (this.queryStr.keyword) {
            const escapedKeyword = this.queryStr.keyword.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            this.filters.album_title = {
                $regex: escapedKeyword,
                $options: 'i'
            };
        }

        this.query = this.query.find(this.filters);
        return this;
    }

    filter() {
        const priceFilter = {};

        if (this.queryStr['price[gte]'] !== undefined) {
            priceFilter.$gte = Number(this.queryStr['price[gte]']);
        }

        if (this.queryStr['price[lte]'] !== undefined) {
            priceFilter.$lte = Number(this.queryStr['price[lte]']);
        }

        if (Object.keys(priceFilter).length > 0) {
            this.filters.price = priceFilter;
        }

        if (this.queryStr.genre) {
            this.filters.genre = this.queryStr.genre;
        }

        if (this.queryStr.album) {
            this.filters.album_title = this.queryStr.album;
        }

        if (this.queryStr.merch_type) {
            this.filters.merch_type = this.queryStr.merch_type;
        }

        if (this.queryStr.artist) {
            this.filters.artist = this.queryStr.artist;
        }

        this.query = this.query.find(this.filters);
        return this;
    }

    pagination(defaultLimit = 10) {
        const requestedLimit = Number(this.queryStr.limit);
        this.resPerPage = requestedLimit > 0 ? requestedLimit : defaultLimit;
        this.page = Number(this.queryStr.page) > 0
            ? Number(this.queryStr.page)
            : 1;

        const skip = this.resPerPage * (this.page - 1);
        this.query = this.query.limit(this.resPerPage).skip(skip);
        return this;
    }

    getFilters() {
        return this.filters;
    }
}

module.exports = APIFeatures;
