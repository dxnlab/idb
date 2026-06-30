declare const _default: {
    version: number;
    stores: {
        brands: string;
        products: {
            key: string;
            autoIncrement: boolean;
            index: {
                brand: string;
                category: {
                    key: string;
                    multi: boolean;
                };
                product_code: {
                    key: string[];
                    unique: boolean;
                };
            };
        };
        items: {
            key: string;
            index: {
                product: string[];
            };
        };
    };
};
export default _default;
