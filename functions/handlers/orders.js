const { db } = require('../util/admin');

exports.getOrders = (req, res) => {
	db.collection('orders')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let orders = [];
			data.forEach((doc) => {
				orders.push({
					orderId: doc.id,
					products: doc.data().products,
					userId: doc.data().userId,
					createdAt: doc.data().createdAt,
				});
			});
			return res.json(orders);
		})
		.catch((err) => console.error(err));
};

exports.getUserOrders = (req, res) => {
	db.collection('orders')
		.where('handle', '==', req.user.handle)
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let orders = [];
			data.forEach((doc) => {
				orders.push({ orderId: doc.id, ...doc.data() });
			});
			console.log(orders);
			return res.json(orders);
		})
		.catch((err) => console.error(err));
};

exports.postOrder = (req, res) => {
	// console.log('authorized asdadsfads', req.user);
	const newOrder = {
		products: req.body.products,
		handle: req.body.handle,
		createdAt: new Date().toISOString(),
		status: req.body.status,
	};
	db.collection('orders')
		.add(newOrder)
		.then((doc) => {
			res.json({ message: `document ${doc.id} created successfully adsfasdfadsfads` });
		})
		.catch((err) => {
			res.status(500).json({ error: 'something went wrong asdfads' });
			console.error(err);
		});
};
