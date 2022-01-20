const { admin, db } = require('../util/admin');

const generateAutoId = () => {
	const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	let autoId = '';

	for (let i = 0; i < 20; i++) {
		autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return autoId;
};

exports.getProductList = (req, res) => {
	db.collection('products')
		.orderBy(admin.firestore.FieldPath.documentId())
		.get()
		.then((data) => {
			let products = [];
			data.forEach((doc) => {
				products.push({
					productId: doc.id,
					title: doc.data().title,
					category: doc.data().category,
					description: doc.data().description,
					price: doc.data().price,
					imageUrl: doc.data().imageUrl,
				});
			});
			return res.json(products);
		})
		.catch((err) => console.error(err));
};

exports.getProduct = (req, res) => {
	const productId = req.params.id.toString();
	console.log(req.params.id);

	db.collection('products')
		.where(admin.firestore.FieldPath.documentId(), '==', productId)
		.get()
		.then((data) => {
			if (!data.empty) {
				console.log(data.docs[0]);
				const productData = data.docs[0].data();
				return res.json(productData);
			} else {
				console.log('doc did not exist');
				return res.json(null);
			}
		})

		.catch((err) => console.error(err));
};

exports.getFavourites = async (req, res) => {
	console.log(req.favourites);
	const handle = req.user.handle;
	const favouritesData = [];

	const favouritesList = await db
		.collection('users')
		.doc(handle)
		.get()
		.then((doc) => {
			console.log(doc);
			return doc.data().favourites;
		})
		.catch((err) => console.error(err));

	console.log(favouritesList);

	db.collection('products')
		.where(admin.firestore.FieldPath.documentId(), 'in', favouritesList)
		.get()
		.then((data) => {
			if (!data.empty) {
				data.forEach((doc) => {
					favouritesData.push(doc.data());
				});
			}
			return res.json(favouritesData);
		})
		.catch((err) => console.error(err));

	// db.collection('products')
	// 	.where('productId', 'in', favouritesList)
	// 	.get()
	// 	.then((data) => {
	// 		if (!data.empty) {
	// 			let favourites = [];
	// 			data.forEach((doc) => {
	// 				favourites.push(doc);
	// 			});
	// 		}
	// 		return res.json(favourites);
	// 	})
	// 	.catch((err) => console.error(err));
};

exports.getRelated = async (req, res) => {
	try {
		let productsList = [];
		let data = await db.collection('products').get();
		data.forEach((doc) => {
			productsList.push(doc.data());
		});
		// randomly sort array to select random products
		const shuffled = productsList.sort(() => 0.5 - Math.random());
		let selected = shuffled.slice(0, 5);
		return res.json(selected);
	} catch (err) {
		console.log(err);
	}
};

// OLD METHOD - DOES NOT WORK WITH NEW PRODUCTID'S
// exports.getRelated = async (req, res) => {
// 	let relatedProducts = [];
// 	try {
// 		for (let i = 0; relatedProducts.length < 5; i++) {
// 			const data = await retrieveRandomData();
// 			console.log(data);
// 			if (data && !relatedProducts.some((item) => item.productId === data.productId)) {
// 				relatedProducts.push(data);
// 				console.log(relatedProducts.length);
// 			}
// 		}
// 		return res.json(relatedProducts);
// 	} catch (err) {
// 		console.log(err);
// 	}
// };

// const retrieveRandomData = async () => {
// 	const randomId = generateAutoId();
// 	let data = await db
// 		.collection('products')
// 		.where('__name__', '>=', randomId)
// 		.limit(1)
// 		.get()
// 		.then((data) => {
// 			if (!data.empty) {
// 				console.log(data.docs[0].data());
// 				// relatedProducts.push(data.docs[0].data());
// 				return data.docs[0].data();
// 			}
// 		})
// 		.catch((err) => console.error(err));

// 	return data;
// };
