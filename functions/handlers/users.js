const { db, admin } = require('../util/admin');

const firebase = require('firebase');
require('dotenv').config();

const firebaseConfig = {
	apiKey: process.env.API_KEY,
	authDomain: process.env.AUTH_DOMAIN,
	databaseURL: process.env.DATABASE_URL,
	projectId: process.env.PROJECT_ID,
	storageBucket: process.env.STORAGE_BUCKET,
	messagingSenderId: process.env.MESSAGING_SENDER_ID,
	appId: process.env.APP_ID,
	measurementId: process.env.MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

exports.signup = (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	};

	const { valid, errors } = validateSignupData(newUser);
	if (!valid) return res.status(400).json(errors);

	// TODO: validate data
	let token, userId;

	db.doc(`/users/${newUser.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return res.status(400).json({ handle: 'This username is already taken' });
			} else {
				return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
			}
		})
		.then((data) => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then((idToken) => {
			token = idToken;
			const userCredentials = {
				handle: newUser.handle,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				userId,
			};
			return db.doc(`/users/${newUser.handle}`).set(userCredentials);
		})
		.then((data) => {
			return res.status(201).json({ token });
		})
		.catch((err) => {
			console.error(err);
			if (err.code === 'auth/email-already-in-use') {
				return res.status(400).json({ email: 'Email is already in use' });
			} else {
				return res.status(500).json({ error: err.code });
			}
		});
};

exports.login = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password,
	};

	const { valid, errors } = validateLoginData(user);
	if (!valid) return res.status(400).json(errors);

	if (Object.keys(errors).length > 0) return res.status(400).json(errors);

	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => {
			return data.user.getIdToken();
		})
		.then((token) => {
			return res.json({ token });
		})
		.catch((err) => {
			if (err.code === 'auth/user-not-found') {
				return res.status(403).json({ email: 'User was not found' });
			}
			if (err.code === 'auth/wrong-password')
				return res.status(403).json({ general: 'Wrong credentials. Please try again' });
			return res.status(500).json({ error: err.code });
		});
};

// const getUserData = new Promise((req) => {
// 	let userData = {};
// 	db.doc(`/users/${req.user.handle}`)
// 		.get()
// 		.then((doc) => {
// 			if (doc.exists) {
// 				userData.credentials = doc.data();
// 				console.log('getUserData finished');

// 				return userData;
// 			}
// 		});
// 	// .catch((err) => {
// 	// 	return err;
// 	// });
// });

// ATTEMPT TO REFACTOR USING getUserData(). ATTEMPT FAILED
// exports.getAuthenticatedUser = (req, res) => {
// 	getUserData(req)
// 		.then((userData) => {
// 			return res.json(userData);
// 		})

// 		.catch((err) => {
// 			console.error(err);
// 			return res.status(500).json({ error: err.code });
// 		});
// };

exports.getAuthenticatedUser = (req, res) => {
	let userData = {};
	db.doc(`/users/${req.user.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				userData.credentials = doc.data();
				// return db.collection('likes').where('userHandle', '==', req.user.handle).get();

				// NEW - JUST RETURNS userData
				return res.json(userData);
			}
		})
		// OLD - FAVOUTIES DATA NOW IN AN ARRAY FIELD
		// .then((data) => {
		// 	userData.favourites = [];
		// 	data.forEach((doc) => {
		// 		userData.favourites.push(doc.data());
		// 	});
		// 	return res.json(userData);
		// })
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

// Add user details
exports.addUserDetails = (req, res) => {
	let userDetails = reduceUserDetails(req.body);

	db.doc(`users/${req.user.handle}`)
		.update(userDetails)
		.then(() => {
			return res.json({ message: 'Details added Successfully' });
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

// Upload a profile image for user
exports.uploadImage = (req, res) => {
	const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');

	const busboy = new BusBoy({ headers: req.headers });

	let imagefileName;
	let imageToBeUploaded = {};

	busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
		// a
		if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
			return res.status(400).json({ error: 'Wrong file type submitted' });
		}
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
		const imageFileName = `${Math.round(Math.random() * 100000000)}.${imageExtension}`;
		const filepath = path.join(os.tempdir(), imageFileName);

		imageToBeUploaded = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});
	busboy.on('finish', () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filepath, {
				resumable: false,
				metadata: {
					metadata: { contentType: imageToBeUploaded.mimetype },
				},
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
			})
			.then(() => {
				return res.json({ message: 'Image uploaded' });
			})
			.catch((err) => {
				console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
};

exports.postUserReview = (req, res) => {
	const newReview = {
		userId: req.body.userId,
		createdAt: '',
		productId: req.body.productId,
		rating: req.body.rating,
		content: req.body.content,
	};
	// db.collection('reviews').doc('')
};

exports.getUserReviews = (req, res) => {
	const handle = req.params.handle.toString();
	console.log('handle: ' + handle);
	db.collection('reviews')
		.where('handle', '==', handle)
		// .orderBy('createdAt', 'desc')

		.get()
		.then((data) => {
			let userReviews = [];
			data.forEach((doc) => {
				userReviews.push({
					reviewId: doc.id,
					userId: doc.data().userId,
					productId: doc.data().productId,
					createdAt: doc.data().createdAt,
					rating: doc.data().rating,
					content: doc.data().content,
				});
			});
			console.log('getUserReviews called');
			return res.json(userReviews);
		})
		.catch((err) => console.error(err));
};

exports.favouriteProduct = async (req, res) => {
	// const userId = req.params.userId;
	const userHandle = req.user.handle;
	const productId = req.params.productId;

	const userRef = db.collection('users').doc(userHandle);
	console.log('userRef: ' + userRef);

	try {
		await userRef.update({
			favourites: admin.firestore.FieldValue.arrayUnion(productId),
		});

		let userData = {};
		let doc = await db.doc(`/users/${req.user.handle}`).get();
		userData.credentials = doc.data();

		return res.json(userData);
	} catch (err) {
		console.log(err);
		return res.status(404).json(err);
	}
};

exports.unfavouriteProduct = async (req, res) => {
	// const userId = req.params.userId;
	const userHandle = req.user.handle;
	const productId = req.params.productId;

	const userRef = db.collection('users').doc(userHandle);
	console.log('userRef: ' + userRef);

	try {
		await userRef.update({
			favourites: admin.firestore.FieldValue.arrayRemove(productId),
		});
		let userData = {};
		let doc = await db.doc(`/users/${req.user.handle}`).get();
		userData.credentials = doc.data();

		return res.json(userData);
	} catch (err) {
		console.log(err);
		return res.status(404).json(err);
	}
};
