const { db } = require('../util/admin');

exports.getProductReviews = (req, res) => {
	const productId = req.params.productId.toString();
	console.log('product id is: ' + productId);

	db.collection('reviews')
		.where('productId', '==', productId)
		.get()
		.then((data) => {
			const productReviews = [];
			// if (!data.empty) {
			data.forEach((doc) => {
				productReviews.push({
					reviewId: doc.id,
					...doc.data(),
				});
			});
			return res.json(productReviews);
			// } else {
			// 	console.log('doc did not exist');
			// 	return res.json(null);
			// }
		})

		.catch((err) => console.error(err));
};

exports.postProductReview = (req, res) => {
	const productId = req.params.productId.toString();

	db.collection('reviews')
		.add({
			content: req.body.content,
			createdAt: new Date().toISOString(),
			productId: productId,
			rating: parseInt(req.body.rating),
			handle: req.body.handle,
			// userId: req.body.userId,
		})
		.then((docRef) => {
			console.log('review doc created with docId: ' + docRef.id);
			return res.json(docRef);
		})
		.catch((err) => {
			console.error('error occured adding document: ' + err);
		});
};

exports.deleteProductReview = async (req, res) => {
	// const userHandle = req.user.handle;
	const reviewId = req.params.reviewId.toString();

	try {
		await db.collection('reviews').doc(reviewId).delete();
		return res.json('success');
		// let doc = await db.collection('reviews').doc(reviewId).get();
		// console.log(doc.data());
		// console.log('doc.id: ' + doc.id);
		// console.log('req reviewId: ' + reviewId);
	} catch (err) {
		console.error(err);
	}
};

exports.deleteReview = (req, res) => {
	// db.collection('')
};
