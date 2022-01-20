const functions = require('firebase-functions');
const app = require('express')();
const cors = require('cors');

app.use(cors());

const {
	signup,
	login,
	getAuthenticatedUser,
	getUserReviews,
	favouriteProduct,
	unfavouriteProduct,
} = require('./handlers/users');
const { getOrders, getUserOrders, postOrder } = require('./handlers/orders');
const { getProductList, getProduct, getRelated, getFavourites } = require('./handlers/products');
const { getProductReviews, postProductReview, deleteProductReview } = require('./handlers/reviews');
const { fbAuth } = require('./util/fbAuth');

app.get('/user/:productId/favourite', fbAuth, favouriteProduct);
app.get('/user/:productId/unfavourite', fbAuth, unfavouriteProduct);

app.get('/products', getProductList);
app.get('/products/:id', getProduct);
app.get('/products/related', getRelated);
app.get('/products/favourites/', fbAuth, getFavourites);

app.get('/orders', fbAuth, getOrders);
app.post('/orders', postOrder);
app.get('/userorders', fbAuth, getUserOrders);
// app.post('/orders', fbAuth, postOrder);

app.get('/:handle/reviews', getUserReviews);
app.get('/reviews/:productId', getProductReviews);
app.post('/reviews/:productId', fbAuth, postProductReview);
app.delete('/reviews/:reviewId', fbAuth, deleteProductReview);

// users Routes
app.get('/user', fbAuth, getAuthenticatedUser);
app.post('/login', login);
app.post('/signup', signup);
// app.post('/user', fbAuth, addUserDetails);
// app.post('/user/image', fbAuth, uploadImage);

exports.api = functions.https.onRequest(app);
