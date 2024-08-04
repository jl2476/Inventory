import axios from 'axios';



export const searchByUPC = async (upc) => {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const apiUrl = 'https://api.upcitemdb.com/prod/trial/lookup';
    try {
        const response = await axios.get(
            `${proxyUrl}${apiUrl}`,
            {
                params: { upc },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                },
                responseType: 'json',
            }
        );

        // Use parseProductData to format the data
        const productDetails = parseProductData(response.data);

        // Check if product details are found
        if (!productDetails) {
            console.log('No product found for this UPC.');
            return null;
        }

        return productDetails;
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
};



const parseProductData = (data) => {

    // Use optional chaining to safely access
    const productDetails = data?.items?.[0] ?? null;


    console.log(productDetails);

    // Return null if no item found
    if (!productDetails) {
        return null;
    }

    // Extracting relevant details
    const details = {
        name: productDetails.title,
        description: productDetails.description,
        brand: productDetails.brand,
        model: productDetails.model,
        category: productDetails.category,
        weight: productDetails.weight,
        images: productDetails.images,
        upc: productDetails.upc
    };

    console.log(details);

    // Return the structured data
    return details;
}


export default searchByUPC;